import { useEffect, useRef, useState } from 'react';
import { copy, PRICE, SIZES, photos, imagePath } from './content.js';
import { markTrackOrder, confirmTrackOrder } from './pixel.js';
import './track.css';
export const PIXEL_ID = import.meta.env.VITE_TRACK_FB_PIXEL_ID || import.meta.env.VITE_FB_PIXEL_ID || '';

export default function TrackApp({ basePath = "/columbia-track" }) {
  const [path, setPath] = useState(window.location.pathname);
  const lang = (path === '/ru' || path.startsWith('/ru/')) ? 'ru' : 'ua';
  const t = copy[lang];
  const thanks = /\/thanks\/?$/.test(path);
  const base = (lang === 'ru' ? '/ru' : '') + basePath;
  const [photo, setPhoto] = useState(0);
  const [size, setSize] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState({});
  const [order, setOrder] = useState(null);
  const lock = useRef(false);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  useEffect(() => {
    const pop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === 'ru' ? 'ru' : 'uk';
    document.title = `${thanks ? t.thanks : 'Columbia Track — ' + PRICE + ' грн'} · Columbia`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.intro);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#201c18');
    for (const [prop, value] of Object.entries({ 'og:title': document.title, 'og:description': t.intro, 'og:image': window.location.origin + imagePath('sec-3-img-1'), 'og:url': window.location.origin + path, 'og:locale': lang === 'ru' ? 'ru_UA' : 'uk_UA' })) {
      document.querySelector(`meta[property="${prop}"]`)?.setAttribute('content', value);
    }
    document.head.querySelectorAll('link[rel="alternate"][hreflang], link[rel="canonical"]').forEach(el => el.remove());
    const canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = location.origin + path; document.head.appendChild(canonical);
    for (const [locale, prefix] of [['uk', ''], ['ru', '/ru'], ['x-default', '']]) {
      const link = document.createElement('link'); link.rel = 'alternate'; link.hreflang = locale; link.href = location.origin + prefix + basePath + (thanks ? '/thanks' : ''); document.head.appendChild(link);
    }
    if (thanks) setOrder(confirmTrackOrder());
  }, [path, lang, thanks, t, basePath]);
  async function submit(e) {
    e.preventDefault();
    if (lock.current) return;
    const digits = phone.replace(/\D/g, '');
    const normalized = digits.length === 10 && digits.startsWith('0') ? '38' + digits : digits;
    const errors = {};
    if (name.trim().length < 2) errors.name = t.nameError;
    if (!/^380\d{9}$/.test(normalized)) errors.phone = t.phoneError;
    setError(errors);
    if (Object.keys(errors).length) { (errors.name ? nameRef : phoneRef).current?.focus(); return; }
    lock.current = true; setSending(true);
    try {
      const response = await fetch('/api/track-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), phone: '+' + normalized, size, website, lang: lang.toUpperCase(), source: window.location.href }), signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error('order');
      markTrackOrder({ size, conversion: !result.dup });
      history.pushState({}, '', base + '/thanks' + location.search);
      setPath(location.pathname);
      window.fbq?.('track', 'PageView');
      window.scrollTo(0, 0);
      requestAnimationFrame(() => document.querySelector('.track h1')?.focus());
    } catch { setError({ send: t.sendError }); }
    finally { lock.current = false; setSending(false); }
  }
  useEffect(() => {
    if (thanks || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elements = document.querySelectorAll('.track-details h2, .track-detail-copy > p, .track-detail-copy dl > div, .track-details > img, .track-photo-pair img, .track-order h2, .track-order > div > p, .track-faq h2, .track-faq details');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('track-revealed');
        observer.unobserve(entry.target);
      }
    }, {threshold: .15});
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [thanks, lang]);
  const query = window.location.search;
  const languages = <nav className="track-language" aria-label="Мова / Язык">{['ua', 'ru'].map(l => <a key={l} href={(l === 'ru' ? '/ru' : '') + basePath + (thanks ? '/thanks' : '') + query} aria-current={l === lang ? 'page' : undefined}>{l.toUpperCase()}</a>)}</nav>;
  const form = <form onSubmit={submit} noValidate>
    <fieldset><legend>{t.size}</legend><div className="track-sizes">{SIZES.map(s => <button type="button" key={s} aria-pressed={size === s} onClick={() => setSize(size === s ? '' : s)}>{s}</button>)}</div><p className="track-size-note" aria-live="polite">{size ? `${t.size}: ${size}` : t.later}</p></fieldset>
    <label htmlFor="track-name">{t.name}<input id="track-name" ref={nameRef} name="name" autoComplete="name" maxLength={80} value={name} placeholder={t.namePlaceholder} onChange={e => setName(e.target.value)} required aria-invalid={!!error.name} aria-describedby={error.name ? 'track-name-error' : undefined} /></label>
    {error.name && <p id="track-name-error" className="track-error" role="alert">{error.name}</p>}
    <label htmlFor="track-phone">{t.phone}<input id="track-phone" ref={phoneRef} name="phone" autoComplete="tel" type="tel" inputMode="tel" maxLength={24} value={phone} onChange={e => setPhone(e.target.value)} required aria-invalid={!!error.phone} aria-describedby={error.phone ? 'track-phone-error' : undefined} /></label>
    {error.phone && <p id="track-phone-error" className="track-error" role="alert">{error.phone}</p>}
    <input className="track-trap" name="website" aria-hidden="true" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
    {error.send && <p className="track-error" role="alert">{error.send}</p>}
    <button className="track-button" type="submit" disabled={sending}>{sending ? t.sending : t.submit}</button>
    <p className="track-consent">{t.consent} <a href={(lang === 'ru' ? '/ru' : '') + '/privacy' + query}>{t.privacy}</a>.</p>
  </form>;
  return <div className="track">
    <header className="track-nav"><a href={base + query} className="track-brand">Columbia Track</a><nav aria-label={t.about}>{!thanks && <><a href="#details">{t.about}</a><a href="#order">{t.order}</a></>}</nav>{languages}</header>
    {thanks ? <main className="track-thanks"><div><h1 tabIndex={-1}>{order ? t.thanks : t.directThanks}</h1><p>{order ? t.thanksText : t.directText}</p>{order && <p>{t.size}: {order.size || t.later} · 2490 грн</p>}<a className="track-button" href={base + query}>{t.back}</a></div><img src={imagePath('header-img-1')} alt={t.photo} width="518" height="518" /></main> : <main>
      <section className="track-hero" aria-labelledby="track-title"><div className="track-title-row"><h1 id="track-title">Columbia Track</h1><p>{t.sizes}</p></div>
        <div className="track-mobile-buy"><div><p>{lang === 'ru' ? 'Зимняя обувь' : 'Зимове взуття'}</p><p><strong>2490 грн</strong></p></div><a className="track-button" href="#order">{t.order}</a></div>
        <div className="track-hero-grid"><div className="track-gallery"><img key={photo} className="track-main-photo" src={imagePath(photos[photo])} alt={`${t.photo}, ${t.view.toLowerCase()} ${photo + 1}`} width="520" height="520" fetchPriority="high" /><div className="track-thumbnails">{photos.map((p, i) => <button key={p} aria-label={`${t.view} ${i + 1}`} aria-pressed={photo === i} onClick={() => setPhoto(i)}><img src={imagePath(p)} alt="" width="520" height="520" /></button>)}</div></div>
        <div className="track-hero-copy"><p className="track-intro">{t.intro}</p><p className="track-price">2490 <span>грн</span></p><p className="track-old"><s>4980 грн</s> <span>−50%</span></p><a className="track-button" href="#order">{t.order}</a><p className="track-delivery">{t.delivery}</p></div></div>
      </section>
      <section id="details" className="track-details"><div className="track-detail-copy"><h2>{t.detailTitle}</h2><p>{t.detailIntro}</p><dl>{t.specs.map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl></div><img src={imagePath('header-img-2')} width="518" height="518" alt={t.photo} loading="lazy" /></section>
      <div className="track-photo-pair"><img src={imagePath('header-img-1')} width="518" height="518" alt={t.photo} loading="lazy" /><img src={imagePath('sec-2-img-2')} width="279" height="279" alt={t.photo} loading="lazy" /></div>
      <section id="order" className="track-order"><div><h2>{t.formTitle}</h2><p>{t.formIntro}</p><p className="track-price">2490 <span>грн</span></p><p>{t.delivery}</p></div>{form}</section>
      <section className="track-faq"><h2>{t.faqTitle}</h2><div>{t.questions.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
    </main>}
    <footer className="track-footer"><div><p>{t.footer}</p><a href={(lang === 'ru' ? '/ru' : '/') + query}>{t.home}</a><a href="https://pricebest.site/ctrackua2910/" rel="noreferrer" target="_blank">{t.source}</a></div><p className="track-wordmark" aria-hidden="true">TRACK</p></footer>
  </div>;
}
