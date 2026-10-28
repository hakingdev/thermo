import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { safeMutation } from "./admin-auth.mjs";

export const validSite = (site) => site === "kryga" || site === "columbia";
export const defaultState = () => ({ site: "kryga", updatedAt: null });

function validateState(value) {
  if (!value || !validSite(value.site)) throw new Error("Invalid site state");
  return { site: value.site, updatedAt: value.updatedAt || null };
}

export function fileStore(filename) {
  return {
    async read() {
      try { return validateState(JSON.parse(await readFile(filename, "utf8"))); }
      catch (error) { if (error.code === "ENOENT") return defaultState(); throw error; }
    },
    async write(state) {
      await mkdir(dirname(filename), { recursive: true });
      const temporary = `${filename}.${crypto.randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(state), { mode: 0o600 });
      await rename(temporary, filename);
    },
  };
}

export function redisStore(env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const key = env.SITE_STATE_KEY || "storefront:active-site";
  async function command(args) {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args), signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error("Site storage unavailable");
    return data.result;
  }
  return {
    async read() { const raw = await command(["GET", key]); return raw ? validateState(JSON.parse(raw)) : defaultState(); },
    async write(state) { await command(["SET", key, JSON.stringify(state)]); },
  };
}

export function siteHandler({ store, auth, local = false }) {
  const configured = Boolean(store && auth?.configured);
  return async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const reply = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    const payload = (state) => ({ ...state, configured, requiresLogin: true, local });
    try {
      if (req.method === "GET") return reply(200, payload(store ? await store.read() : defaultState()));
      if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return reply(405, { error: "method" }); }
      if (!configured) return reply(503, { error: "not_configured" });
      if (!safeMutation(req)) return reply(403, { error: "origin" });
      if (!req.headers["content-type"]?.includes("application/json")) return reply(415, { error: "content_type" });
      if (!await auth.authenticated(req)) return reply(401, { error: "unauthorized" });
      let input = req.body;
      if (!input || typeof input === "string") {
        let raw = typeof input === "string" ? input : "";
        if (!raw) for await (const chunk of req) { raw += chunk; if (raw.length > 2048) return reply(413, { error: "body_size" }); }
        try { input = JSON.parse(raw); } catch { return reply(400, { error: "invalid_json" }); }
      }
      if (!validSite(input?.site)) return reply(422, { error: "site" });
      const state = { site: input.site, updatedAt: new Date().toISOString() };
      await store.write(state);
      return reply(200, payload(state));
    } catch { return reply(503, { error: "storage" }); }
  };
}
