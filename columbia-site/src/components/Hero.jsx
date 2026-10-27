import { useEffect, useRef } from "react";
import { LangSwitch } from "../App.jsx";
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
          <a href="#look">{t.nav.look}</a>
          <a href="#fit">{t.nav.fit}</a>
          <a href="#fabric">{t.nav.fabric}</a>
          <a href="#video">{t.nav.video}</a>
          <a href="#faq">{t.nav.faq}</a>
        </nav>
        <LangSwitch lang={lang} page={page} navigate={navigate} />
      </div>

      <div className="hero__body">
        <div className="hero__copy">
          <p className="hero__lead">{t.hero.lead}</p>
          <p className="hero__price">
            {t.hero.old && <s>{t.hero.old}</s>}
            <span className="hero__now">{t.hero.price}</span>
            {t.hero.off && <span className="hero__off">{t.hero.off}</span>}
          </p>
          <a className="btn" href="#order">{t.hero.cta}</a>
          <p className="hero__place">{t.hero.place}</p>
        </div>
        {/* Чоловічий і жіночий комплект поруч — студійні фото Columbia */}
        <figure className="hero__photo">
          {["men", "women"].map((who, i) => (
            <img
              key={who}
              src={`/img/columbia/${who}-front-640.webp`}
              srcSet={`/img/columbia/${who}-front-640.webp 640w, /img/columbia/${who}-front-1200.webp 1200w`}
              sizes="(min-width: 900px) 34vw, 50vw"
              width="1200" height="1200" alt={t.hero.alts[i]} fetchPriority="high"
            />
          ))}
        </figure>
      </div>

      <div className="hero__mark" ref={stage}>
        <h1 className="hero__title">
          <span className="wordmark" ref={word}>Columbia</span>
          <span className="sr-only"> — {t.meta.title.split("— ")[1]}</span>
        </h1>
      </div>
    </header>
  );
}
