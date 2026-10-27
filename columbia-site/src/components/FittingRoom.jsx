import { useEffect, useRef, useState } from "react";
import { COLORS, SIZES, sizeFor, suggestSize } from "../config.js";
import { prefersReducedMotion } from "../hooks.js";

// Где стоят подписи тепловизора на широком экране: сторона и высота в % сцены
const SLOTS = {
  neck: ["left", 12], seam: ["left", 38], wrist: ["left", 58], ankle: ["left", 84],
  chest: ["right", 22], lowback: ["right", 46], knee: ["right", 72],
};
const ORDER = ["neck", "chest", "seam", "lowback", "wrist", "knee", "ankle"];
const RAMP = ["#0b2f3a", "#0e5a66", "#2f8f8a", "#9cc9a0", "#f2d36b", "#f39a3d", "#e2552d"];

export const Arrow = ({ dir }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d={dir === "left" ? "M12.5 4 6.5 10l6 6" : "M7.5 4l6 6-6 6"} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
  </svg>
);
const PlayPause = ({ playing }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    {playing
      ? <path d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor" />
      : <path d="M6 4l10 6-10 6z" fill="currentColor" />}
  </svg>
);

export default function FittingRoom({ t, choice, setChoice }) {
  const f = t.fit;
  const section = useRef(null);
  const stage = useRef(null);
  const canvas = useRef(null);
  const api = useRef(null);
  const dots = useRef({});
  const lines = useRef({});
  const labels = useRef({});
  const info = useRef(null);

  const [status, setStatus] = useState("idle"); // idle | loading | ready | failed
  const [dressed, setDressed] = useState({ top: false, bottom: false });
  const [thermal, setThermal] = useState(false);
  const [active, setActive] = useState("chest");
  const [spinning, setSpinning] = useState(() => !prefersReducedMotion());
  const [body, setBody] = useState({ height: "", weight: "" });

  const color = COLORS.find((c) => c.id === choice.color) || COLORS[0];
  const height = Number(body.height);
  const weight = Number(body.weight);
  const suggestion = suggestSize(choice.gender, height, weight);
  const bothTyped = body.height.length >= 2 && body.weight.length >= 2;

  // three.js грузим, только когда до примерочной осталось меньше экрана
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setStatus("loading");
      import("../three/Mannequin.js")
        .then(({ createFittingRoom }) => {
          api.current = createFittingRoom(canvas.current, {
            color: color.hex,
            gender: choice.gender,
            reducedMotion: prefersReducedMotion(),
          });
          api.current.onInteract(() => setSpinning(false));
          setStatus("ready");
        })
        .catch((err) => {
          console.warn("3D недоступно:", err);
          setStatus("failed");
        });
    }, { rootMargin: "600px 0px" });
    io.observe(section.current);
    return () => { io.disconnect(); api.current?.dispose(); api.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // рендерим, только пока сцена на экране; при первом показе манекен «одевается»
  useEffect(() => {
    if (status !== "ready") return;
    let firstShow = true;
    const timers = [];
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        api.current?.start();
        if (firstShow && e.intersectionRatio > 0.3) {
          firstShow = false;
          timers.push(setTimeout(() => setDressed((d) => ({ ...d, bottom: true })), 350));
          timers.push(setTimeout(() => setDressed({ top: true, bottom: true }), 1300));
        }
      } else api.current?.stop();
    }, { threshold: [0, 0.3] });
    io.observe(stage.current);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, [status]);

  useEffect(() => { api.current?.setDressed(dressed); }, [dressed, status]);
  useEffect(() => { api.current?.setColor(color.hex); }, [color.hex, status]);
  useEffect(() => { api.current?.setGender(choice.gender); }, [choice.gender, status]);
  useEffect(() => { api.current?.setThermal(thermal); }, [thermal, status]);
  useEffect(() => { api.current?.setAutoRotate(spinning); }, [spinning, status]);
  useEffect(() => { if (suggestion) setChoice((c) => ({ ...c, size: suggestion })); }, [suggestion, setChoice]);

  // точки и выноски тепловизора следуют за манекеном каждый кадр;
  // положение подписей меряем только при изменении размеров — в цикле нет чтений раскладки
  useEffect(() => {
    if (status !== "ready" || !thermal) return;
    const wide = window.matchMedia("(min-width: 900px)");
    const targets = {};
    const measure = () => {
      const st = stage.current.getBoundingClientRect();
      for (const id of ORDER) {
        if (wide.matches) {
          const lab = labels.current[id];
          if (!lab) continue;
          const r = lab.getBoundingClientRect();
          targets[id] = [(SLOTS[id][0] === "left" ? r.right + 10 : r.left - 10) - st.left, r.top + 14 - st.top];
        } else if (info.current) {
          targets[id] = [null, info.current.getBoundingClientRect().top - st.top];
        }
      }
      targets.width = st.width;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage.current);
    wide.addEventListener("change", measure);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      for (const a of api.current.anchors()) {
        const dot = dots.current[a.id];
        const line = lines.current[a.id];
        const tgt = targets[a.id];
        if (!dot || !line || !tgt) continue;
        const shown = a.on && a.facing > -0.08;
        const alpha = shown ? Math.min(1, 0.35 + a.facing * 1.6) : 0;
        dot.style.transform = `translate(${a.x}px, ${a.y}px)`;
        dot.style.opacity = alpha;
        dot.tabIndex = shown ? 0 : -1;
        const tx = tgt[0] ?? Math.min(Math.max(a.x, 24), targets.width - 24);
        line.setAttribute("x1", a.x); line.setAttribute("y1", a.y);
        line.setAttribute("x2", tx); line.setAttribute("y2", tgt[1]);
        line.style.opacity = wide.matches || a.id === active ? alpha : 0;
        const lab = labels.current[a.id];
        if (lab && wide.matches) lab.style.opacity = shown ? 1 : 0.55;
      }
    };
    loop();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); wide.removeEventListener("change", measure); };
  }, [status, thermal, active]);

  const set = (k, v) => setChoice((c) => ({ ...c, [k]: v }));
  const allOn = dressed.top && dressed.bottom;
  const nextPoint = () => setActive((a) => ORDER[(ORDER.indexOf(a) + 1) % ORDER.length]);

  return (
    <section id="fit" className={`fit${thermal ? " is-thermal" : ""}`} ref={section} aria-labelledby="fit-title">
      <div className="fit__head">
        <h2 id="fit-title" className="head" data-reveal>{f.title}</h2>
        <p className="fit__lead" data-reveal style={{ "--d": "80ms" }}>{f.lead}</p>
      </div>

      <div className="fit__stage" ref={stage}>
        <canvas ref={canvas} className="fit__canvas" role="img" aria-label={`${f.title}: ${f.genders[choice.gender]}, ${f.colors[color.id]}`} />
        {status !== "ready" && (
          <p className="fit__status">{status === "failed" ? f.noWebgl : f.loading}</p>
        )}

        <svg className="fit__lines" aria-hidden="true">
          {ORDER.map((id) => <line key={id} ref={(el) => (lines.current[id] = el)} />)}
        </svg>
        {thermal && ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`fit__dot${id === active ? " is-active" : ""}`}
            ref={(el) => (dots.current[id] = el)}
            onClick={() => setActive(id)}
            aria-label={f.points[id][0]}
            aria-pressed={id === active}
          />
        ))}
        {thermal && (
          <div className="fit__labels">
            {ORDER.map((id) => (
              <div key={id} ref={(el) => (labels.current[id] = el)} className={`fit__label is-${SLOTS[id][0]}`} style={{ top: `${SLOTS[id][1]}%` }}>
                <strong>{f.points[id][0]}</strong>
                <span>{f.points[id][1]}</span>
              </div>
            ))}
          </div>
        )}

        <div className="fit__rotate">
          <button type="button" className="chip" onClick={() => api.current?.rotateBy(-Math.PI / 4)} aria-label={f.rotateLeft}><Arrow dir="left" /></button>
          <button type="button" className="chip" onClick={() => setSpinning((v) => !v)} aria-label={spinning ? f.pause : f.play} aria-pressed={!spinning}>
            <PlayPause playing={spinning} />
          </button>
          <span className="fit__hint">{f.rotate}</span>
          <button type="button" className="chip" onClick={() => api.current?.rotateBy(Math.PI / 4)} aria-label={f.rotateRight}><Arrow dir="right" /></button>
        </div>
      </div>

      {thermal && (
        <div className="fit__info" ref={info}>
          <p aria-live="polite">
            <strong>{f.points[active][0]}</strong>
            <span>{f.points[active][1]}</span>
          </p>
          <div className="fit__info-row">
            <span>{f.tapHint}</span>
            <button type="button" className="textlink" onClick={nextPoint}>{f.next}</button>
          </div>
        </div>
      )}

      <div className="fit__controls">
        <div className="ctl" role="group" aria-labelledby="ctl-gender">
          <span className="ctl__name" id="ctl-gender">{f.gender}</span>
          <div className="ctl__row">
            {["male", "female"].map((g) => (
              <button key={g} type="button" className="chip" aria-pressed={choice.gender === g} onClick={() => setChoice((c) => ({ ...c, gender: g, size: sizeFor(g, c.size) }))}>
                {f.genders[g]}
              </button>
            ))}
          </div>
        </div>

        <div className="ctl" role="group" aria-labelledby="ctl-dress">
          <span className="ctl__name" id="ctl-dress">{f.dressGroup}</span>
          <div className="ctl__row">
            {["top", "bottom"].map((p) => (
              <button key={p} type="button" className="chip" aria-pressed={dressed[p]} onClick={() => setDressed((d) => ({ ...d, [p]: !d[p] }))}>
                {f.pieces[p]}
              </button>
            ))}
            <button type="button" className="chip chip--plain" onClick={() => setDressed({ top: !allOn, bottom: !allOn })}>
              {allOn ? f.undress : f.dressAll}
            </button>
          </div>
        </div>

        <div className="ctl" role="group" aria-labelledby="ctl-color">
          <span className="ctl__name" id="ctl-color">{f.color}: {f.colors[color.id]}, <span className="ctl__stock">{color.inStock ? f.inStock : f.askStock}</span></span>
          <div className="ctl__row">
            {COLORS.map((c) => (
              <button key={c.id} type="button" className="swatch" aria-pressed={choice.color === c.id} onClick={() => set("color", c.id)}>
                <i style={{ background: c.hex }} aria-hidden="true" />
                <span>{f.colors[c.id]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ctl">
          <button type="button" role="switch" aria-checked={thermal} className="switch" onClick={() => setThermal((v) => !v)}>
            <span className="switch__track" aria-hidden="true"><span /></span>
            {f.thermal}
          </button>
          {thermal && (
            <div className="fit__legend">
              <p className="fit__legend-title">{f.thermalTitle}</p>
              <div className="fit__scale" aria-hidden="true">
                <span>{f.scaleCold}</span>
                <span className="fit__bands">{RAMP.map((c) => <i key={c} style={{ background: c }} />)}</span>
                <span>{f.scaleWarm}</span>
              </div>
              <p className="fit__note">{f.thermalNote}</p>
            </div>
          )}
        </div>

        <div className="ctl" role="group" aria-labelledby="ctl-size">
          <span className="ctl__name" id="ctl-size">{f.size}</span>
          <div className="ctl__row ctl__row--inputs">
            <label className="field">
              <span>{f.height}</span>
              <input inputMode="numeric" pattern="[0-9]*" maxLength={3} value={body.height} onChange={(e) => setBody((b) => ({ ...b, height: e.target.value.replace(/\D/g, "") }))} placeholder="178" aria-describedby="size-note" />
            </label>
            <label className="field">
              <span>{f.weight}</span>
              <input inputMode="numeric" pattern="[0-9]*" maxLength={3} value={body.weight} onChange={(e) => setBody((b) => ({ ...b, weight: e.target.value.replace(/\D/g, "") }))} placeholder="76" aria-describedby="size-note" />
            </label>
          </div>
          <div className="ctl__row">
            {SIZES[choice.gender].map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={choice.size === s} onClick={() => set("size", s)}>{s}</button>
            ))}
          </div>
          <p className="ctl__note" id="size-note" aria-live="polite">
            {suggestion ? <><b>{f.suggest} {suggestion}.</b> {f.sizeNote}</> : bothTyped ? f.sizeRange : f.sizeNote}
          </p>
        </div>

        <a className="btn" href="#order">{f.orderThis}</a>
      </div>
    </section>
  );
}
