import { useEffect, useRef } from "react";
import { LangSwitch } from "../App.jsx";
import { ThemeToggle } from "../theme.jsx";
import { useFitText, prefersReducedMotion } from "../hooks.js";

export default function Hero({ t, lang, page, navigate }) {
  const word = useFitText([lang]);
  const stage = useRef(null);

  // Фирменное движение: монумент чуть «оседает», когда первый экран уходит вверх
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
      <div className="hero__bar">
        <nav className="hero__nav" aria-label={t.nav.order}>
          <a href="#fit">{t.nav.fit}</a>
          <a href="#fabric">{t.nav.fabric}</a>
          <a href="#faq">{t.nav.faq}</a>
        </nav>
        <div className="bar__end">
          <ThemeToggle t={t} />
          <LangSwitch lang={lang} page={page} navigate={navigate} />
        </div>
      </div>

      <div className="hero__body">
        <div className="hero__copy">
          <p className="hero__lead">{t.hero.lead}</p>
          <p className="hero__price">
            <s>{t.hero.old}</s>
            <span className="hero__now">{t.hero.price}</span>
            <span className="hero__off">−50%</span>
          </p>
          <a className="btn" href="#order">{t.hero.cta}</a>
          <p className="hero__place">{t.hero.place}</p>
        </div>
        <figure className="hero__photo">
          <picture>
            <source media="(min-width: 900px)" srcSet="/img/hero-runner-1600.webp" />
            <img src="/img/hero-runner-900.webp" width="900" height="1350" alt={t.hero.alt} fetchPriority="high" />
          </picture>
        </figure>
      </div>

      <div className="hero__mark" ref={stage}>
        <h1 className="hero__title">
          <span className="wordmark" ref={word}>KRYGA</span>
          <span className="sr-only"> — {t.meta.title.split("— ")[1]}</span>
        </h1>
      </div>
    </header>
  );
}
