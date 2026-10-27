import { useEffect, useState } from "react";
import FabricDiagram from "./FabricDiagram.jsx";

// Подробности по наведению есть только там, где есть наведение и место под них;
// на телефоне пункты — обычный текст, а не кнопки без действия
const HOVER_QUERY = "(min-width: 900px) and (hover: hover)";
function useCanHover() {
  const [ok, setOk] = useState(() => window.matchMedia(HOVER_QUERY).matches);
  useEffect(() => {
    const m = window.matchMedia(HOVER_QUERY);
    const on = () => setOk(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return ok;
}

export default function Fabric({ t }) {
  const fb = t.fabric;
  const [hover, setHover] = useState(null);
  const canHover = useCanHover();
  const current = hover ? fb.groups[hover[0]].items[hover[1]] : null;

  return (
    <section id="fabric" className="fabric" aria-labelledby="fabric-title">
      <div className="fabric__intro">
        <h2 id="fabric-title" className="head" data-reveal>{fb.title}</h2>
        <p className="fabric__lead" data-reveal style={{ "--d": "80ms" }}>{fb.lead}</p>
        <FabricDiagram layers={fb.layers} caption={fb.diagram} />
      </div>
      <div className="fabric__cols" onMouseLeave={() => setHover(null)}>
        {fb.groups.map((g, gi) => (
          <div className="fabric__col" key={g.name} data-reveal style={{ "--d": `${gi * 90}ms` }}>
            <h3 className="fabric__group">{g.name}</h3>
            <ul>
              {g.items.map(([name], ii) => (
                <li key={name}>
                  {!canHover ? <span className="fabric__text">{name}</span> : <button
                    type="button"
                    className={`fabric__item${hover && hover[0] === gi && hover[1] === ii ? " is-on" : ""}`}
                    onMouseEnter={() => setHover([gi, ii])}
                    onFocus={() => setHover([gi, ii])}
                    onBlur={() => setHover(null)}
                  >
                    {name}
                  </button>}
                </li>
              ))}
            </ul>
            <p className="fabric__sum">{g.summary}</p>
          </div>
        ))}
        <p className="fabric__desc" aria-live="polite">
          {current ? <><b>{current[0]}.</b> {current[1]}</> : fb.hint}
        </p>
      </div>
    </section>
  );
}
