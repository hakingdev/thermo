// The selected storefront controls root routes; explicit /boots links stay stable.
export function parseStorefrontRoute(pathname, defaultPage = 'home') {
  const p = pathname.replace(/\/+$/, '') || '/';
  const ru = p === '/ru' || p.startsWith('/ru/');
  const rest = ru ? p.slice(3) || '/' : p;
  let page = { '/thanks': 'thanks', '/privacy': 'privacy', '/boots': 'boots', '/boots/thanks': 'boots/thanks' }[rest] || 'home';
  if (defaultPage === 'boots') {
    if (page === 'home') page = 'boots';
    if (page === 'thanks') page = 'boots/thanks';
  }
  return {lang: ru ? 'ru' : 'ua', page};
}

// Boots has its own brand selection, independent of the main storefront.
export function resolveStorefront(pathname, preview, state = {}) {
  if (/^\/(?:ru\/)?columbia-track(?:\/|$)/.test(pathname)) return 'track';
  const bootsRoute = /^\/(?:ru\/)?boots(?:\/|$)/.test(pathname);
  const bootsPreview = { 'boots-columbia': 'track', 'boots-kryga': 'boots' }[preview];
  if (bootsPreview) return bootsPreview;
  const site = bootsRoute || preview === 'boots' ? 'boots' : ['columbia', 'kryga'].includes(preview) ? preview : state.site;
  return site === 'boots' ? state.bootsSite === 'columbia' ? 'track' : 'boots' : site;
}
