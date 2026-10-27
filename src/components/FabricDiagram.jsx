// Схема двошарового полотна в розрізі: шкіра → внутрішній шар → повітря → зовнішній шар → мороз.
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
                    <pattern id="air" width="30" height="30" patternUnits="userSpaceOnUse">
                      <circle cx="8" cy="9" r="5" fill="currentColor" opacity="0.28" />
                      <circle cx="23" cy="23" r="4" fill="currentColor" opacity="0.2" />
                    </pattern>
                  </defs>
                  <rect width="240" height="60" fill="url(#air)" />
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
