// Vercel Serverless Function: POST /api/lead → DarkLeads (или любая CRM с тем же API).
// Всё берётся из переменных окружения (Vercel → Settings → Environment Variables):
// DARKLEADS_API_KEY, DARKLEADS_PRODUCT_ID, DARKLEADS_STREAM_ID, DARKLEADS_CPA_ID, DARKLEADS_PRICE.
// ЗАПОЛНИТЬ под товар Columbia: id оффера KRYGA (120151) сюда не переносим — заявки ушли бы не туда.

export function createLeadHandler(env = process.env) {
const ENDPOINT = env.DARKLEADS_ENDPOINT || "https://courier.darkleads.pro/data/exchange/extpartner/addorderapi.php";
const PRODUCT_ID = env.DARKLEADS_PRODUCT_ID;
const PRODUCT_PRICE = env.DARKLEADS_PRICE || "1199";
const STREAM_ID = env.DARKLEADS_STREAM_ID;
const CPA_ID = env.DARKLEADS_CPA_ID;

// Антидубль в пределах одного инстанса функции (best effort: на Vercel инстансов может быть несколько)
const recent = new Map();
const DUP_WINDOW_MS = 10 * 60 * 1000;

function reply(res, code, data) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = typeof req.body === "string" ? req.body : "";
  if (!raw) for await (const chunk of req) raw += chunk;
  const type = req.headers["content-type"] || "";
  if (type.includes("application/json")) {
    try { return JSON.parse(raw || "{}"); } catch { return {}; }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

const clean = (v, max = 60) => String(v ?? "").replace(/<[^>]*>/g, "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

return async function handler(req, res) {
  if (req.method !== "POST") return reply(res, 405, { ok: false, error: "method" });

  const apiKey = env.DARKLEADS_API_KEY;
  if (!apiKey || !PRODUCT_ID || !STREAM_ID) return reply(res, 500, { ok: false, error: "config" });

  const input = await readBody(req);

  // Honeypot от ботов
  if (input.website) return reply(res, 200, { ok: true });

  const name = clean(input.name, 80);
  const phone = String(input.phone ?? "").replace(/[^\d+]/g, "");
  const digits = phone.replace(/\D/g, "");
  const source = String(input.source || req.headers.referer || "").slice(0, 2000);

  if (name.length < 2) return reply(res, 422, { ok: false, error: "name" });
  if (digits.length < 10 || digits.length > 12) return reply(res, 422, { ok: false, error: "phone" });

  const last = recent.get(digits);
  if (last && Date.now() - last < DUP_WINDOW_MS) return reply(res, 200, { ok: true, dup: true });

  // Выбор из примерочной → комментарий для менеджера
  const comment = [
    input.gender && `Стать: ${clean(input.gender)}`,
    input.color && `Колір: ${clean(input.color)}`,
    input.size && `Розмір: ${clean(input.size, 8)}`,
    input.lang && `Мова: ${clean(input.lang, 4)}`,
  ].filter(Boolean).join("; ");

  const ip = String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim();

  const post = new URLSearchParams({
    api_key: apiKey,
    product_id: String(PRODUCT_ID),
    stream_id: String(STREAM_ID),
    phone,
    name,
    price: String(PRODUCT_PRICE),
    comment,
    low_price: "false",
    source,
    url: source,
    processedByMe: "false",
    ...(CPA_ID ? { "is_cpa[id]": String(CPA_ID) } : {}),
    ip,
  });

  let out = "";
  let err = "";
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: post.toString(),
      signal: AbortSignal.timeout(20000),
    });
    out = await r.text();
  } catch (e) {
    err = String(e?.message || e);
  }

  // Лог заявок → Vercel Logs
  console.log(JSON.stringify({ at: new Date().toISOString(), name, phone, ip, comment, out: out.slice(0, 500), err }));

  let resp = null;
  try { resp = JSON.parse(out); } catch {}
  if (!resp || resp.result !== "ok") {
    return reply(res, 502, { ok: false, error: "darkleads", detail: String(resp?.result ?? err) });
  }

  recent.set(digits, Date.now());
  return reply(res, 200, { ok: true });
};
}

export default createLeadHandler();
