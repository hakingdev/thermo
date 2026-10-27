import { useState } from "react";

// Легка вставка YouTube: до натискання — своя обкладинка без звернень до YouTube,
// iframe з youtube-nocookie.com з'являється лише після кліку. Грає одне відео за раз.
export default function Video({ t }) {
  const v = t.video;
  const [playing, setPlaying] = useState(null);

  return (
    <section id="video" className="video" aria-labelledby="video-title">
      <div className="video__head">
        <h2 id="video-title" className="head" data-reveal>{v.title}</h2>
        <p className="video__lead" data-reveal style={{ "--d": "80ms" }}>{v.lead}</p>
      </div>
      <ul className="video__list">
        {v.items.map((it, i) => (
          <li key={it.id} className="video__item" data-reveal style={{ "--d": `${120 + i * 80}ms` }}>
            <div className="video__frame">
              {playing === it.id ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${it.id}?autoplay=1&rel=0&playsinline=1`}
                  title={it.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <button type="button" className="video__poster" onClick={() => setPlaying(it.id)} aria-label={`${v.play}: ${it.title}`}>
                  <img src={`/img/columbia/video-${it.id}.webp`} width="1280" height="720" alt="" loading="lazy" decoding="async" />
                  <span className="video__play" aria-hidden="true">
                    <svg viewBox="0 0 20 20"><path d="M6 4l10 6-10 6z" fill="currentColor" /></svg>
                    {v.play} · {it.time}
                  </span>
                </button>
              )}
            </div>
            <p className="video__title">{it.title}</p>
            <p className="video__meta">
              {it.channel} · {it.lang} ·{" "}
              <a href={`https://www.youtube.com/watch?v=${it.id}`} target="_blank" rel="noopener" className="textlink">YouTube</a>
            </p>
          </li>
        ))}
      </ul>
      <p className="video__note">{v.note}</p>
    </section>
  );
}
