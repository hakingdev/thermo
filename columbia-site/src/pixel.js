// Meta / TikTok: базовый код загружается до приложения; TikTok — в <head> index.html.
// Lead — главная метрика: шлём один раз и только на странице «Дякуємо» после успешной заявки.

const LEAD_FLAG = "columbia_lead_pending";

export function markLeadPending(data) {
  consumed = undefined;
  try {
    sessionStorage.setItem(LEAD_FLAG, JSON.stringify({ at: Date.now(), ...data }));
  } catch {}
}

// Возвращает данные заявки, если Lead ещё не отправлен; повторный заход или перезагрузка — null.
export function consumeLead() {
  let raw = null;
  try {
    raw = sessionStorage.getItem(LEAD_FLAG);
    sessionStorage.removeItem(LEAD_FLAG);
  } catch {}
  if (!raw) return null;
  let data;
  try { data = JSON.parse(raw); } catch { return null; }
  // Only the confirmation page consumes a fresh, successful form submission.
  if (!/^\/(?:ru\/)?thanks\/?$/.test(window.location.pathname) ||
      !data || !Number.isFinite(data.at) || Date.now() - data.at > 30 * 60 * 1000 ||
      data.at > Date.now() || !Number.isFinite(data.value) || data.value <= 0) return null;
  window.fbq?.("track", "Lead", { value: data.value, currency: "UAH", content_name: "Columbia Omni-Heat Midweight baselayer set" });
  window.ttq?.track("Lead", { value: data.value, currency: "UAH", content_name: "Columbia Omni-Heat Midweight baselayer set" });
  return data;
}

// StrictMode в dev вызывает инициализаторы дважды — кэшируем результат до следующей заявки
let consumed;
export function consumeLeadOnce() {
  if (consumed === undefined) consumed = consumeLead();
  return consumed;
}

export function trackPageView() {
  window.fbq?.("track", "PageView");
}
