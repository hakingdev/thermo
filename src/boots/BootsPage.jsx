import { useEffect, useRef, useState } from "react";
import { Link, LangSwitch, pathFor } from "../App.jsx";
import { ThemeToggle } from "../theme.jsx";
import { useFitText, useReveal, prefersReducedMotion } from "../hooks.js";
import { markLeadPending } from "../pixel.js";
import { formatPhone } from "../components/Order.jsx";
import BootDrawing from "./BootDrawing.jsx";
import { bootsDict, BOOT_SIZES, BOOTS_API_URL, BOOTS_PRICE, FOOT_CHART, sizeForFoot } from "./content.js";
import "./boots.css";

const CITY = [
  { src: "/img/boots/lviv-stad-2004-01.webp", w: 1400, h: 976, pos: "50% 60%" },
  { src: "/img/boots/lviv-stad-2004-09.webp", w: 1400, h: 974, pos: "50% 55%" },
  { src: "/img/boots/solomianska-street-kiev-02.webp", w: 1400, h: 933, pos: "50% 60%" },
  { src: "/img/sunrise-1200.webp", w: 1200, h: 794, pos: "50% 50%" },
];

const CREDITS = [
  ["Yehor Parkhomenko", "Unsplash", "https://unsplash.com/photos/JhYCWU3xUJo"],
  ["Shiori Miyashita", "Unsplash", "https://unsplash.com/photos/VdP7rIGWTLs"],
  ["«Lviv stad 2004»", "CC0", "https://commons.wikimedia.org/wiki/File:Lviv_stad_2004_01.jpg"],
  ["«Lviv stad 2004»", "CC0", "https://commons.wikimedia.org/wiki/File:Lviv_stad_2004_09.jpg"],
  ["«Solomianska Street, Kiev»", "CC0", "https://commons.wikimedia.org/wiki/File:Solomianska_Street,_Kiev_02.jpg"],
  ["I.am.wiz, «Sunrise in the winter Carpathians»", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Sunrise_in_the_winter_Carpathians.jpg"],
];

// Палітра сторінки (коричнева, як у шкіри й підошви) вмикається на <html data-page="boots">
export function useBootsPage(lang, title, description) {
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.page = "boots";
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    const og = (prop, content) => document.querySelector(`meta[property="${prop}"]`)?.setAttribute("content", content);
    og("og:title", title);
    og("og:description", description);
    og("og:locale", lang === "ru" ? "ru_UA" : "uk_UA");
    return () => { delete html.dataset.page; };
  }, [lang, title, description]);
}

export function BootsBar({ t, lang, page, navigate, nav }) {
  return (
    <div className="hero__bar">
      {nav ? (
        <nav className="hero__nav" aria-label={nav.materials}>
          <a href="#materials">{nav.materials}</a>
          <a href="#size">{nav.size}</a>
          <a href="#faq">{nav.faq}</a>
        </nav>
      ) : <span />}
      <div className="bar__end">
        <ThemeToggle t={t} />
        <LangSwitch lang={lang} page={page} navigate={navigate} />
      </div>
    </div>
  );
}

function Hero({ m, ...props }) {
  const word = useFitText([props.lang]);
  const stage = useRef(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = stage.current;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
        el.style.setProperty("--settle", (1 - p * 0.07).toFixed(4));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <header className="hero" id="hero">
      <BootsBar {...props} nav={m.nav} />
      <div className="hero__body">
        <div className="hero__copy">
          <p className="hero__lead">{m.hero.lead}</p>
          <p className="hero__price">
            <s>{m.hero.old}</s>
            <span className="hero__now">{m.hero.price}</span>
            <span className="hero__off">{m.hero.off}</span>
          </p>
          <a className="btn" href="#order">{m.hero.cta}</a>
          <p className="hero__place">{m.hero.place}</p>
        </div>
        <figure className="hero__photo bhero__art">
          <BootDrawing title={m.hero.art} />
        </figure>
      </div>
      <div className="hero__mark" ref={stage}>
        <h1 className="hero__title">
          <span className="wordmark" ref={word}>KRYGA</span>
          <span className="sr-only"> — {m.meta.title.split("— ")[1]}</span>
        </h1>
      </div>
    </header>
  );
}

function Hook({ m, lang }) {
  const fig = useFitText([lang]);
  return (
    <section className="hook" aria-labelledby="bhook-title">
      <div className="hook__text">
        <h2 id="bhook-title" className="head" data-reveal>{m.hook.title}</h2>
        {m.hook.paras.map((p, i) => (
          <p key={i} className={i === 0 ? "hook__first" : undefined} data-reveal style={{ "--d": `${(i + 1) * 80}ms` }}>{p}</p>
        ))}
        <p data-reveal style={{ "--d": "240ms" }}><a href="#materials" className="textlink">{m.hook.link}</a></p>
      </div>
      <div className="hook__figure" aria-hidden="true">
        <span className="hook__num" ref={fig}>{m.hook.figure}</span>
      </div>
    </section>
  );
}

function Materials({ m }) {
  const mt = m.materials;
  return (
    <section id="materials" className="bmat" aria-labelledby="bmat-title">
      <h2 id="bmat-title" className="head" data-reveal>{mt.title}</h2>
      <div className="bmat__grid">
        <figure className="bmat__main" data-reveal>
          <img src="/img/boots/leather-black.webp" width="1200" height="800" alt={mt.alts[0]} loading="lazy" decoding="async" />
          <figcaption>
            <h3>{mt.items[0][0]}</h3>
            <p>{mt.items[0][1]}</p>
          </figcaption>
        </figure>
        <figure className="bmat__side" data-reveal style={{ "--d": "90ms" }}>
          <img src="/img/boots/wool.webp" width="1200" height="800" alt={mt.alts[1]} loading="lazy" decoding="async" />
          <figcaption>
            <h3>{mt.items[1][0]}</h3>
            <p>{mt.items[1][1]}</p>
          </figcaption>
        </figure>
        <figure className="bmat__side bmat__side--sole" data-reveal style={{ "--d": "160ms" }}>
          <div className="bmat__sole"><BootDrawing variant="sole" title={mt.alts[2]} /></div>
          <figcaption>
            <h3>{mt.items[2][0]}</h3>
            <p>{mt.items[2][1]}</p>
          </figcaption>
        </figure>
      </div>
      <div className="bmat__specs" data-reveal>
        <h3>{mt.specs}</h3>
        <dl>
          {mt.spec.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// Підбір розміру за довжиною стопи — живий елемент сторінки
function SizeFinder({ m, size, setSize }) {
  const s = m.size;
  const [foot, setFoot] = useState("");
  const cm = parseFloat(foot.replace(",", "."));
  const res = foot ? sizeForFoot(cm) : { kind: "idle" };
  useEffect(() => { if (res.kind === "ok") setSize(res.size); }, [res.kind, res.size, setSize]);

  const min = 24, max = 30.5;
  const marker = Number.isFinite(cm) ? Math.min(Math.max((cm - min) / (max - min), 0), 1) : null;
  const message = { ok: s.result(res.size), small: s.small, large: s.large, invalid: s.invalid, idle: s.idle }[res.kind];

  return (
    <section id="size" className="bsize" aria-labelledby="bsize-title">
      <div className="bsize__text">
        <h2 id="bsize-title" className="head" data-reveal>{s.title}</h2>
        <p data-reveal style={{ "--d": "80ms" }}>{s.lead}</p>
        <label className="field bsize__field" data-reveal style={{ "--d": "140ms" }}>
          <span>{s.label}</span>
          <input inputMode="decimal" maxLength={4} value={foot} placeholder={s.ph} aria-describedby="bsize-msg"
            onChange={(e) => setFoot(e.target.value.replace(/[^\d.,]/g, ""))} />
        </label>
        <div className="ctl" role="group" aria-labelledby="bsize-pick">
          <span className="ctl__name" id="bsize-pick">{s.pick}</span>
          <div className="ctl__row">
            {BOOT_SIZES.map((x) => (
              <button key={x} type="button" className="chip" aria-pressed={size === x} onClick={() => setSize(size === x ? null : x)}>{x}</button>
            ))}
          </div>
        </div>
        <p className="ctl__note">{s.note}</p>
      </div>
      <div className="bsize__result">
        <p className="bsize__msg" id="bsize-msg" aria-live="polite">{message}</p>
        <p className={`bsize__big${res.kind === "ok" || size ? "" : " is-empty"}`} aria-hidden="true">{res.kind === "ok" ? res.size : size || "43"}</p>
        <svg className="bsize__ruler" viewBox="0 0 400 64" aria-hidden="true">
          <rect x="0" y="34" width="400" height="10" fill="currentColor" opacity="0.18" />
          {Array.from({ length: 14 }, (_, i) => {
            const x = (i / 13) * 400;
            return <g key={i}><rect x={x - 1} y={i % 2 ? 26 : 20} width="2" height={i % 2 ? 8 : 14} fill="currentColor" />{i % 2 === 0 && <text x={x} y="62" textAnchor="middle" fontSize="12" fill="currentColor">{min + i * 0.5}</text>}</g>;
          })}
          {FOOT_CHART.map(([sz, lim]) => {
            const x = ((lim - min) / (max - min)) * 400;
            return <text key={sz} x={x - 12} y="12" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">{sz}</text>;
          })}
          {marker !== null && res.kind !== "invalid" && <rect className="bsize__marker" x={marker * 400 - 4} y="16" width="8" height="34" />}
        </svg>
        <a className="btn" href="#order">{s.order}</a>
      </div>
    </section>
  );
}

function City({ m }) {
  return (
    <section className="band" aria-labelledby="bcity-title">
      <h2 id="bcity-title" className="head band__title" data-reveal>{m.city.title}</h2>
      <div className="band__strip" data-reveal style={{ "--d": "80ms" }}>
        {CITY.map((p, i) => (
          <figure key={p.src} className="band__panel">
            <img src={p.src} width={p.w} height={p.h} alt={m.city.alts[i]} loading="lazy" decoding="async" style={{ objectPosition: p.pos }} />
            {i === 0 && <p className="band__label">{m.city.panel}</p>}
          </figure>
        ))}
      </div>
      <p className="band__caption" data-reveal style={{ "--d": "160ms" }}>{m.city.caption}</p>
    </section>
  );
}

function Steps({ m }) {
  return (
    <section className="bsteps" aria-labelledby="bsteps-title">
      <h2 id="bsteps-title" className="head" data-reveal>{m.steps.title}</h2>
      <ol className="bsteps__list">
        {m.steps.items.map(([word, text], i) => (
          <li key={word} data-reveal style={{ "--d": `${i * 80}ms` }}>
            <h3 className="bsteps__word">{word}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function OrderForm({ m, t, lang, navigate, size, setSize }) {
  const o = m.order;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+380");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);
  const phoneRef = useRef(null);

  async function submit(e) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    const next = {};
    if (name.trim().length < 2) next.name = o.errors.name;
    if (digits.length !== 12) next.phone = o.errors.phone;
    if (next.name || next.phone) {
      setErrors(next);
      (next.name ? nameRef : phoneRef).current?.focus();
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch(BOOTS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: "+" + digits, website, source: window.location.href, size: size || "", lang: lang === "ru" ? "RU" : "UA" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "send");
      markLeadPending({ name: name.trim(), value: BOOTS_PRICE, size, product: m.meta.product });
      navigate(pathFor(lang, "boots/thanks"));
    } catch {
      setStatus("error");
      setErrors({ send: o.errors.send });
    }
  }

  return (
    <section id="order" className="order" aria-labelledby="border-title">
      <h2 id="border-title" className="order__title" data-reveal>
        {o.title} <span className="order__price">{m.hero.price}</span>
      </h2>
      <div className="order__offer">
        <p className="order__was" data-reveal style={{ "--d": "80ms" }}><s>{m.hero.old}</s> <span>{m.hero.off}</span></p>
        <p className="order__support" data-reveal style={{ "--d": "140ms" }}>{o.support}</p>
      </div>
      <form onSubmit={submit} className="order__form" noValidate data-reveal style={{ "--d": "200ms" }}>
        <label className="field field--line" htmlFor="bname">
          <span>{o.name}</span>
          <input id="bname" ref={nameRef} value={name} autoComplete="name" placeholder={o.namePh} maxLength={60}
            onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((er) => ({ ...er, name: undefined })); }}
            aria-required="true" aria-invalid={errors.name ? "true" : undefined} aria-describedby={errors.name ? "bname-error" : undefined} />
          {errors.name && <span className="field__error" id="bname-error">{errors.name}</span>}
        </label>
        <label className="field field--line" htmlFor="bphone">
          <span>{o.phone}</span>
          <input id="bphone" ref={phoneRef} type="tel" value={phone} autoComplete="tel" inputMode="tel"
            onChange={(e) => { setPhone(formatPhone(e.target.value)); if (errors.phone) setErrors((er) => ({ ...er, phone: undefined })); }}
            aria-required="true" aria-invalid={errors.phone ? "true" : undefined} aria-describedby={errors.phone ? "bphone-error" : undefined} />
          {errors.phone && <span className="field__error" id="bphone-error">{errors.phone}</span>}
        </label>
        <input name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
        <fieldset className="order__choice">
          <legend>{o.size}: {size || o.sizeLater}</legend>
          <div className="ctl__row">
            {BOOT_SIZES.map((x) => (
              <button key={x} type="button" className="chip" aria-pressed={size === x} onClick={() => setSize(size === x ? null : x)}>{x}</button>
            ))}
          </div>
          <a href="#size" className="textlink">{m.size.title}</a>
        </fieldset>
        {errors.send && <p className="order__error" role="alert">{errors.send}</p>}
        <button type="submit" className="btn btn--inverse" disabled={status === "sending"}>{status === "sending" ? o.sending : o.submit}</button>
        <p className="order__consent">
          {t.order.consentA}
          <Link to={pathFor(lang, "privacy")} navigate={navigate} className="textlink">{t.order.consentLink}</Link>.
        </p>
      </form>
    </section>
  );
}

function Faq({ m }) {
  return (
    <section id="faq" className="faq" aria-labelledby="bfaq-title">
      <div className="faq__row"><h2 id="bfaq-title" className="faq__q faq__heading" data-reveal>{m.faq.title}</h2></div>
      {m.faq.items.map(([q, a]) => (
        <div className="faq__row" key={q} data-reveal>
          <h3 className="faq__q">{q}</h3>
          <p className="faq__a">{a}</p>
        </div>
      ))}
    </section>
  );
}

function Footer({ m, t, lang, page, navigate }) {
  const word = useFitText([lang]);
  return (
    <footer className="footer" id="footer">
      <p className="footer__invite" data-reveal>{m.footer.invite}</p>
      <div className="footer__mark" aria-hidden="true"><span className="wordmark" ref={word}>KRYGA</span></div>
      <div className="footer__row">
        <ul className="footer__places">
          <li><a href="#order">{m.footer.order}</a></li>
          <li><Link to={pathFor(lang, "home")} navigate={navigate}>{m.footer.thermal}</Link></li>
        </ul>
        <div className="footer__links">
          <div>
            <p className="footer__name">{t.footer.links}</p>
            <ul>
              {[["materials", m.nav.materials], ["size", m.nav.size], ["faq", m.nav.faq]].map(([id, label]) => (
                <li key={id}><a href={`#${id}`}>{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="footer__name">{t.footer.language}</p>
            <LangSwitch lang={lang} page={page} navigate={navigate} className="lang--stack" />
          </div>
          <div>
            <p className="footer__name">KRYGA</p>
            <ul>
              <li><Link to={pathFor(lang, "privacy")} navigate={navigate}>{t.footer.privacy}</Link></li>
              <li><a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{t.footer.top}</a></li>
            </ul>
          </div>
        </div>
      </div>
      <p className="footer__credits">
        {t.footer.credits}:{" "}
        {CREDITS.map(([who, lic, href], i) => (
          <span key={href}><a href={href} rel="noopener" target="_blank">{who}</a> ({lic}){i < CREDITS.length - 1 ? "; " : "."}</span>
        ))}
      </p>
      <p className="footer__legal">{t.footer.legal}</p>
    </footer>
  );
}

export default function BootsPage(props) {
  const { t, lang } = props;
  const m = bootsDict[lang];
  const [size, setSize] = useState(null);
  useBootsPage(lang, m.meta.title, m.meta.description);
  useReveal([lang]);

  // Плашка «Замовити» на телефоні: поза першим екраном, формою й футером — і лише коли гортають вгору,
  // щоб під час читання вона не закривала заголовки внизу екрана
  const [barOn, setBarOn] = useState(false);
  const watch = useRef({ hero: true, order: false, footer: false, up: false });
  useEffect(() => {
    const sync = () => { const w = watch.current; setBarOn(!w.hero && !w.order && !w.footer && w.up); };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) watch.current[e.target.id] = e.isIntersecting;
      sync();
    }, { threshold: 0.05 });
    ["hero", "order", "footer"].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return;
      watch.current.up = y < lastY;
      lastY = y;
      sync();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, [lang]);

  const all = { ...props, m };
  return (
    <div className="bp">
      <a className="skip" href="#order">{t.skip}</a>
      <main>
        <Hero {...all} />
        <Hook {...all} />
        <Materials {...all} />
        <SizeFinder {...all} size={size} setSize={setSize} />
        <City {...all} />
        <Steps {...all} />
        <OrderForm {...all} size={size} setSize={setSize} />
        <Faq {...all} />
      </main>
      <Footer {...all} />
      <a className={`orderbar${barOn ? " is-on" : ""}`} href="#order" aria-hidden={!barOn} tabIndex={barOn ? 0 : -1}>
        <span className="orderbar__price"><s>{m.hero.old}</s> {m.hero.price}</span>
        <span className="orderbar__go">{m.hero.cta}</span>
      </a>
    </div>
  );
}
