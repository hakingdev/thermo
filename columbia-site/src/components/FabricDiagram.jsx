// Схема полотна Columbia Omni-Heat у розрізі: шкіра → Omni-Wick → срібні точки Omni-Heat → зовнішній трикотаж → мороз.
// Краплі вологи піднімаються від шкіри назовні: один прохід при появі (до 5 с), повтор — при наведенні чи дотику.
import { useState } from "react";

const DROPS = [8, 22, 37, 51, 66, 80, 93];

export default function FabricDiagram({ layers, caption }) {
  const [run, setRun] = useState(0);
  return (
    <figure className="weave" data-reveal style={{ "--d": "120ms" }} onPointerEnter={() => setRun((r) => r + 1)}>
      <div className="weave__rows">
        {layers.map(([name, note], i) => (
          <div key={name} className={`weave__row weave__row--${i}`}>
            <p className="weave__label"><b>{name}</b> {note}</p>
            <div className="weave__art" aria-hidden="true">
              {(i === 1 || i === 3) && (
                <svg viewBox="0 0 240 40" preserveAspectRatio="none">
                  <defs>
                    <pattern id={`loop-${i}`} width={i === 3 ? 16 : 24} height="40" patternUnits="userSpaceOnUse">
                      <path d={i === 3 ? "M0 30 C 3 2, 13 2, 16 30" : "M0 30 C 5 0, 19 0, 24 30"} fill="none" stroke="currentColor" strokeWidth="5" />
                    </pattern>
                  </defs>
                  <rect width="240" height="40" fill={`url(#loop-${i})`} />
                </svg>
              )}
              {i === 2 && (
                <svg viewBox="0 0 240 60" preserveAspectRatio="none">
                  <defs>
                    <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
                      <circle cx="7" cy="7" r="4.2" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="240" height="60" fill="url(#dots)" />
                </svg>
              )}
            </div>
          </div>
        ))}
        <div className="weave__drops" aria-hidden="true" key={run}>
          {DROPS.map((x, i) => (
            <i key={x} style={{ left: `${x}%`, animationDelay: `${(i * 0.37) % 2.2}s` }} />
          ))}
        </div>
      </div>
      <figcaption className="weave__caption">{caption}</figcaption>
    </figure>
  );
}
