// Install Meta's queue before rendering a storefront, including a direct /thanks load.
const initialized = new Set();

export function initMetaPixel(id, { enabled = true } = {}) {
  if (!enabled || !/^\d+$/.test(id || "") || initialized.has(id)) return false;
  if (!window.fbq) {
    const fbq = window.fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  window.fbq("init", id);
  window.fbq("track", "PageView");
  initialized.add(id);
  return true;
}
