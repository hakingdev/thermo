// Vercel Serverless Function: POST /api/boots-lead → DarkLeads CPA (зимові кросівки KRYGA, сторінка /boots).
// Ключ — DARKLEADS_API_KEY (тот же аккаунт) или отдельный BOOTS_DARKLEADS_API_KEY.
// Оффер, поток, цену и CPA ID можно переопределить переменными BOOTS_DARKLEADS_*.

const ENDPOINT = process.env.BOOTS_DARKLEADS_ENDPOINT || process.env.DARKLEADS_ENDPOINT || "https://courier.darkleads.pro/data/exchange/extpartner/addorderapi.php";
const PRODUCT_ID = process.env.BOOTS_DARKLEADS_PRODUCT_ID || "121121";
const PRODUCT_PRICE = process.env.BOOTS_DARKLEADS_PRICE || "2490";
const STREAM_ID = process.env.BOOTS_DARKLEADS_STREAM_ID || "98074";
// CPA ID из карточки Columbia Track в DarkLeads; отличается от ID товара.
const CPA_ID = process.env.BOOTS_DARKLEADS_CPA_ID || "2015";
const SIZES = ["40", "41", "42", "43", "44", "45"];

// Антидубль в пределах одного инстанса функции (best effort)
const recent = new Map();
const DUP_WINDOW_MS = 10 * 60 * 1000;

function reply(res, code, data) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
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

export default async function handler(req, res) {
  if (req.method !== "POST") return reply(res, 405, { ok: false, error: "method" });

  const apiKey = process.env.BOOTS_DARKLEADS_API_KEY || process.env.DARKLEADS_API_KEY;
  if (!apiKey) return reply(res, 500, { ok: false, error: "config" });

  const input = await readBody(req);
  if (!input || typeof input !== "object" || Array.isArray(input)) return reply(res, 422, { ok: false, error: "body" });

  // Honeypot от ботов
  if (input.website) return reply(res, 200, { ok: true });

  const name = clean(input.name, 80);
  const phone = String(input.phone ?? "").replace(/[^\d+]/g, "");
  const digits = phone.replace(/\D/g, "");
  const source = String(input.source || req.headers.referer || "").slice(0, 2000);
  const size = SIZES.includes(String(input.size)) ? String(input.size) : "";

  if (name.length < 2) return reply(res, 422, { ok: false, error: "name" });
  if (digits.length < 10 || digits.length > 12) return reply(res, 422, { ok: false, error: "phone" });

  const last = recent.get(digits);
  if (last && Date.now() - last < DUP_WINDOW_MS) return reply(res, 200, { ok: true, dup: true });

  const comment = [
    "Товар: зимові кросівки KRYGA",
    size ? `Розмір: ${size}` : "Розмір: уточнити",
    input.lang && `Мова: ${clean(input.lang, 4)}`,
  ].filter(Boolean).join("; ");

  const ip = String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim();

  const post = new URLSearchParams({
    api_key: apiKey,
    product_id: PRODUCT_ID,
    stream_id: STREAM_ID,
    phone,
    name,
    price: PRODUCT_PRICE,
    comment,
    low_price: "false",
    source,
    url: source,
    processedByMe: "false",
    "is_cpa[id]": CPA_ID,
    ip,
  });

  let upstreamStatus = null;
  let upstreamOk = false;
  let out = "";
  let err = "";
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: post.toString(),
      signal: AbortSignal.timeout(20000),
    });
    upstreamStatus = r.status ?? null;
    upstreamOk = r.ok;
    out = await r.text();
  } catch (e) {
    err = e?.name === "TimeoutError" ? "timeout" : "network";
  }

  let resp = null;
  try { resp = JSON.parse(out); } catch {}
  if (!upstreamOk || !resp || resp.result !== "ok") {
    const reason = resp?.errors?.code === "no_product_offer" ? "offer_configuration"
      : err || (!resp ? "invalid_response" : "rejected");
    // Keep diagnostics actionable without logging contacts, credentials or raw provider output.
    console.error(JSON.stringify({ event: "darkleads_order_failed", productId: PRODUCT_ID,
      streamId: STREAM_ID, cpaId: CPA_ID, upstreamStatus, reason }));
    return reply(res, 502, { ok: false, error: "darkleads", reason });
  }

  recent.set(digits, Date.now());
  return reply(res, 200, { ok: true });
}
