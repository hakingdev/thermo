import { useEffect, useState } from 'react';
import './store-tabs.css';
export default function StoreTabs() {
  const [pathname, setPathname] = useState(location.pathname);
  useEffect(() => {
    const sync = () => setPathname(location.pathname);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
    window.addEventListener('popstate', sync);
    return () => { observer.disconnect(); window.removeEventListener('popstate', sync); };
  }, []);
  const ru = /^\/ru(?:\/|$)/.test(pathname);
  const prefix = ru ? '/ru' : '';
  const query = location.search;
  const params = new URLSearchParams(query); params.delete('preview');
  const productQuery = params.size ? '?' + params.toString() : '';
  const track = /\/columbia-track(?:\/|$)/.test(pathname);
  const boots = ['boots', 'track'].includes(document.documentElement.dataset.site) || /\/boots(?:\/|$)/.test(pathname);
  return <nav className="store-tabs" aria-label={ru ? 'Витрины магазина' : 'Вітрини магазину'}>
    <a href={(prefix || '/') + query} aria-current={!track && !boots ? 'page' : undefined}>{ru ? 'Главная' : 'Головна'}</a>
    <a href={prefix + '/boots' + productQuery} aria-current={boots ? 'page' : undefined}>Boots</a>
  </nav>;
}
