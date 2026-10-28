import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_SECONDS = 8 * 60 * 60;
const WINDOW_SECONDS = 15 * 60;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const equal = (a, b) => timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));

// Only for loopback development and tests. Production always uses shared Redis.
export function memoryAuthStore() {
  const values = new Map();
  const read = (key) => {
    const value = values.get(key);
    if (!value || value.until <= Date.now()) { values.delete(key); return null; }
    return value.data;
  };
  return {
    async get(key) { return read(key); },
    async set(key, data, seconds) { values.set(key, { data, until: Date.now() + seconds * 1000 }); },
    async del(key) { values.delete(key); },
    async attempt(key) {
      for (const key of values.keys()) read(key);
      const count = (read(key) || 0) + 1;
      const until = values.get(key)?.until || Date.now() + WINDOW_SECONDS * 1000;
      values.set(key, { data: count, until });
      return count <= 10;
    },
  };
}

export function redisAuthStore(env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const prefix = `${env.SITE_STATE_KEY || "storefront:active-site"}:auth:`;
  async function command(args) {
    const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(args), signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error("Authentication storage unavailable");
    return data.result;
  }
  return {
    get: (key) => command(["GET", prefix + key]),
    set: (key, value, seconds) => command(["SET", prefix + key, value, "EX", seconds]),
    del: (key) => command(["DEL", prefix + key]),
    async attempt(key) {
      const count = await command(["EVAL", "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return n", 1, prefix + key, WINDOW_SECONDS]);
      return Number(count) <= 10;
    },
  };
}

export function safeMutation(req) {
  if (req.headers["sec-fetch-site"] === "cross-site") return false;
  const origin = req.headers.origin;
  if (!origin) return true; // Non-browser clients still need a valid session.
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

export async function readJson(req) {
  let raw = req.body;
  if (raw && typeof raw === "object") raw = JSON.stringify(raw);
  if (raw === undefined) { raw = ""; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 2048) throw Object.assign(new Error(), { status: 413 }); } }
  if (typeof raw !== "string" || Buffer.byteLength(raw) > 2048) throw Object.assign(new Error(), { status: 413 });
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error(), { status: 400 }); }
}

export function adminAuth({ store, username = "admin", password = "", local = false }) {
  const configured = Boolean(store && username && password);
  const cookieName = local ? "storefront_admin" : "__Host-storefront_admin";
  const credentialVersion = hash(JSON.stringify([username, password]));
  function sessionKey(req) {
    const token = String(req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    return token && /^[a-f0-9]{64}$/.test(token) ? `session:${hash(token)}` : null;
  }
  function cookie(res, token, seconds) {
    res.setHeader("Set-Cookie", `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${local ? "" : "; Secure"}`);
  }
  const authenticated = async (req) => {
    const key = sessionKey(req);
    return Boolean(configured && key && await store.get(key) === credentialVersion);
  };
  return {
    configured, authenticated,
    async handler(req, res) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.setHeader("X-Content-Type-Options", "nosniff");
      const reply = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
      try {
        if (!configured) return reply(503, { error: "not_configured" });
        if (req.method === "GET") return await authenticated(req) ? reply(200, { username }) : reply(401, { error: "unauthorized" });
        if (!["POST", "DELETE"].includes(req.method)) { res.setHeader("Allow", "GET, POST, DELETE"); return reply(405, { error: "method" }); }
        if (!safeMutation(req)) return reply(403, { error: "origin" });
        if (!req.headers["content-type"]?.includes("application/json")) return reply(415, { error: "content_type" });
        if (req.method === "DELETE") {
          const key = sessionKey(req);
          if (key) await store.del(key);
          cookie(res, "", 0);
          return reply(200, { ok: true });
        }
        // Vercel sets x-real-ip at the proxy; never trust caller-supplied forwarding lists.
        const ip = local ? req.socket.remoteAddress : req.headers["x-real-ip"] || "unknown";
        if (!await store.attempt(`attempt:${hash(String(ip))}`)) { res.setHeader("Retry-After", String(WINDOW_SECONDS)); return reply(429, { error: "rate_limit" }); }
        const input = await readJson(req);
        const validUser = equal(typeof input?.username === "string" ? input.username : "", username);
        const validPassword = equal(typeof input?.password === "string" ? input.password : "", password);
        if (!validUser || !validPassword) return reply(401, { error: "unauthorized" });
        const previous = sessionKey(req);
        if (previous) await store.del(previous);
        const token = randomBytes(32).toString("hex");
        await store.set(`session:${hash(token)}`, credentialVersion, SESSION_SECONDS);
        cookie(res, token, SESSION_SECONDS);
        return reply(200, { username });
      } catch (error) { return reply(error.status || 503, { error: error.status === 413 ? "body_size" : error.status === 400 ? "invalid_json" : "storage" }); }
    },
  };
}
