// Separate from KRYGA Boots and the thermal storefronts; never store contact details here.
const KEY = 'columbia_track_order';
let memory = null;
export function markTrackOrder({ size = '', conversion = true } = {}) {
  memory = { at: Date.now(), size, conversion, tracked: false };
  try { sessionStorage.setItem(KEY, JSON.stringify(memory)); } catch {}
}
export function confirmTrackOrder() {
  if (!/^\/(?:ru\/)?(?:columbia-track|boots)\/thanks\/?$/.test(window.location.pathname)) return null;
  let order = memory;
  try { order = JSON.parse(sessionStorage.getItem(KEY)) || order; } catch {}
  if (!order || !Number.isFinite(order.at) || order.at > Date.now() || Date.now() - order.at > 1800000) return null;
  if (!order.tracked) {
    order.tracked = true;
    memory = order;
    try { sessionStorage.setItem(KEY, JSON.stringify(order)); } catch {}
    if (order.conversion) {
      const event = { value: 2490, currency: 'UAH', content_name: 'Columbia Track' };
      window.fbq?.('track', 'Lead', event);
      window.ttq?.track('Lead', event);
    }
  }
  return order;
}
