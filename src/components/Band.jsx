const PHOTOS = [
  { src: "/img/trail-runner-1200.webp", w: 1000, h: 667, pos: "50% 60%" },
  { src: "/img/forest-runner-1200.webp", w: 602, h: 900, pos: "55% 50%" },
  { src: "/img/skier-1200.webp", w: 1000, h: 1512, pos: "50% 30%" },
  { src: "/img/shpytsi12-900.webp", w: 900, h: 600, pos: "40% 50%" },
];

export default function Band({ t }) {
  return (
    <section className="band" aria-labelledby="band-title">
      <h2 id="band-title" className="head band__title" data-reveal>{t.band.title}</h2>
      <div className="band__strip" data-reveal style={{ "--d": "80ms" }}>
        {PHOTOS.map((p, i) => (
          <figure key={p.src} className="band__panel">
            <img src={p.src} width={p.w} height={p.h} alt={t.band.alts[i]} loading="lazy" decoding="async" style={{ objectPosition: p.pos }} />
            {i === 0 && <p className="band__label">{t.band.panel}</p>}
          </figure>
        ))}
      </div>
      <p className="band__caption" data-reveal style={{ "--d": "160ms" }}>{t.band.caption}</p>
    </section>
  );
}
