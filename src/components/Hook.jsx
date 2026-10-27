import { useFitText } from "../hooks.js";

export default function Hook({ t, lang }) {
  const fig = useFitText([lang]);
  return (
    <section className="hook" aria-labelledby="hook-title">
      <div className="hook__text">
        <h2 id="hook-title" className="head" data-reveal>{t.hook.title}</h2>
        {t.hook.paras.map((p, i) => (
          <p key={i} className={i === 0 ? "hook__first" : undefined} data-reveal style={{ "--d": `${(i + 1) * 80}ms` }}>
            {p}
          </p>
        ))}
        <p data-reveal style={{ "--d": "320ms" }}><a href="#fit" className="textlink">{t.hook.link}</a></p>
      </div>
      <div className="hook__figure" aria-hidden="true">
        <span className="hook__num" ref={fig}>{t.hook.figure}</span>
      </div>
    </section>
  );
}
