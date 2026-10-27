import { useRef } from "react";
import { sizeFor } from "../config.js";
import { prefersReducedMotion } from "../hooks.js";
import { Arrow } from "./FittingRoom.jsx";

// Фото товару від Columbia: стрічка з прокруткою. Модель перемикається разом із примірочною і формою замовлення
export default function Look({ t, choice, setChoice }) {
  const l = t.look;
  const f = t.fit;
  const strip = useRef(null);
  const photos = l.photos[choice.gender];

  const scroll = (dir) => {
    const el = strip.current;
    const card = el.firstElementChild?.getBoundingClientRect().width || el.clientWidth;
    el.scrollBy({ left: dir * card, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };
  const setGender = (g) => {
    setChoice((c) => ({ ...c, gender: g, size: sizeFor(g, c.size) }));
    strip.current?.scrollTo({ left: 0 });
  };

  return (
    <section id="look" className="look" aria-labelledby="look-title">
      <div className="look__head">
        <h2 id="look-title" className="head" data-reveal>{l.title}</h2>
        <p className="look__lead" data-reveal style={{ "--d": "80ms" }}>{l.lead}</p>
        <div className="ctl" role="group" aria-labelledby="look-gender" data-reveal style={{ "--d": "140ms" }}>
          <span className="ctl__name" id="look-gender">{f.gender}</span>
          <div className="ctl__row">
            {["male", "female"].map((g) => (
              <button key={g} type="button" className="chip" aria-pressed={choice.gender === g} onClick={() => setGender(g)}>{f.genders[g]}</button>
            ))}
          </div>
          <p className="look__sku"><b>{l.sku}:</b> {l.skus[choice.gender]}. {l.skuNote}</p>
        </div>
      </div>

      <div className="look__wrap" data-reveal style={{ "--d": "200ms" }}>
        <ul className="look__strip" ref={strip} tabIndex={0} aria-label={`${l.title}: ${f.genders[choice.gender]}`}>
          {photos.map(([file, caption]) => (
            <li key={file} className="look__item">
              <figure>
                <img
                  src={`/img/columbia/${file}-640.webp`}
                  srcSet={`/img/columbia/${file}-640.webp 640w, /img/columbia/${file}-1200.webp 1200w`}
                  sizes="(min-width: 900px) 30vw, 78vw"
                  width="1200" height="1200" loading="lazy" decoding="async"
                  alt={`Columbia Omni-Heat Midweight, ${f.genders[choice.gender].toLowerCase()}: ${caption}`}
                />
                <figcaption>{caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <div className="look__nav">
          <button type="button" className="chip" onClick={() => scroll(-1)} aria-label={l.prev}><Arrow dir="left" /></button>
          <button type="button" className="chip" onClick={() => scroll(1)} aria-label={l.next}><Arrow dir="right" /></button>
        </div>
      </div>
    </section>
  );
}
