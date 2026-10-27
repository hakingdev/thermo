// Путь посылки — четыре слова по очереди, у каждого свой кадр зимних Карпат рядом (не под текстом)
const PHOTOS = [
  { src: "/img/winter-petros-1200.webp", w: 1200, h: 795 },
  { src: "/img/climbers-hoverla-1200.webp", w: 1200, h: 803 },
  { src: "/img/sunrise-1200.webp", w: 1200, h: 794 },
  { src: "/img/yaremche-frost-1200.webp", w: 1200, h: 800 },
];

export default function Steps({ t }) {
  return (
    <section className="steps" aria-labelledby="steps-title">
      <h2 id="steps-title" className="head steps__title" data-reveal>{t.steps.title}</h2>
      <ol className="steps__list">
        {t.steps.items.map(([word, text], i) => (
          <li key={word} className="step">
            <div className="step__copy">
              <h3 className="step__word" data-reveal>{word}</h3>
              <p className="step__text" data-reveal style={{ "--d": "90ms" }}>{text}</p>
            </div>
            <figure className="step__photo" data-reveal style={{ "--d": "160ms" }}>
              <img src={PHOTOS[i].src} width={PHOTOS[i].w} height={PHOTOS[i].h} alt={t.steps.alts[i]} loading="lazy" decoding="async" />
            </figure>
          </li>
        ))}
      </ol>
    </section>
  );
}
