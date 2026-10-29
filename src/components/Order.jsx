import { useRef, useState } from "react";
import { API_URL, COLORS, PRICE, SIZES } from "../config.js";
import { markLeadPending } from "../pixel.js";
import { Link, pathFor } from "../App.jsx";

// +380 XX XXX XX XX
export function formatPhone(value) {
  let d = value.replace(/\D/g, "");
  if (!d.startsWith("380")) d = "380" + d.replace(/^0+/, "").replace(/^380/, "");
  d = d.slice(0, 12);
  let p = "+" + d.slice(0, 3);
  if (d.length > 3) p += " " + d.slice(3, 5);
  if (d.length > 5) p += " " + d.slice(5, 8);
  if (d.length > 8) p += " " + d.slice(8, 10);
  if (d.length > 10) p += " " + d.slice(10, 12);
  return p;
}

export default function Order({ t, lang, navigate, choice, setChoice }) {
  const o = t.order;
  const f = t.fit;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+380");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState("idle"); // idle | sending | error
  const [errors, setErrors] = useState({}); // { name?, phone?, send? }
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const color = COLORS.find((c) => c.id === choice.color) || COLORS[0];

  async function handleSubmit(e) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    const next = {};
    if (name.trim().length < 2) next.name = o.errors.name;
    if (digits.length !== 12) next.phone = o.errors.phone;
    if (next.name || next.phone) {
      setErrors(next);
      (next.name ? nameRef : phoneRef).current?.focus();
      return;
    }

    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: "+" + digits,
          website,
          // полный URL с UTM/sub-метками — уходит в DarkLeads как source/url
          source: window.location.href,
          // выбор для менеджера — всегда по-украински, независимо от языка сайта
          gender: { male: "чоловічий", female: "жіночий" }[choice.gender],
          color: { black: "чорний", graphite: "графіт", navy: "темно-синій" }[color.id],
          size: choice.size || "",
          lang: lang === "ru" ? "RU" : "UA",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "send");

      // Lead уйдёт на странице «Дякуємо», один раз
      markLeadPending({ name: name.trim(), value: PRICE, ...choice });
      navigate(pathFor(lang, "thanks"));
    } catch {
      setStatus("error");
      setErrors({ send: o.errors.send });
    }
  }

  const set = (k, v) => setChoice((c) => ({ ...c, [k]: v }));

  return (
    <section id="order" className="order" aria-labelledby="order-title">
      <h2 id="order-title" className="order__title" data-reveal>
        {o.title} <span className="order__price">{o.price}</span>
      </h2>
      <div className="order__offer">
        <p className="order__was" data-reveal style={{ "--d": "80ms" }}>
          <s>{o.old}</s> <span>{o.discount}</span>
        </p>
        <p className="order__support" data-reveal style={{ "--d": "140ms" }}>{o.support}</p>
      </div>

      <form onSubmit={handleSubmit} className="order__form" noValidate data-reveal style={{ "--d": "200ms" }}>
        <label className="field field--line" htmlFor="name">
          <span>{o.name}</span>
          <input
            id="name" ref={nameRef} value={name} autoComplete="name" placeholder={o.namePh} maxLength={60}
            onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((er) => ({ ...er, name: undefined })); }}
            aria-required="true" aria-invalid={errors.name ? "true" : undefined} aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && <span className="field__error" id="name-error">{errors.name}</span>}
        </label>
        <label className="field field--line" htmlFor="phone">
          <span>{o.phone}</span>
          <input
            id="phone" ref={phoneRef} type="tel" value={phone} autoComplete="tel" inputMode="tel"
            onChange={(e) => { setPhone(formatPhone(e.target.value)); if (errors.phone) setErrors((er) => ({ ...er, phone: undefined })); }}
            aria-required="true" aria-invalid={errors.phone ? "true" : undefined} aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && <span className="field__error" id="phone-error">{errors.phone}</span>}
        </label>

        {/* honeypot — скрыт от людей */}
        <input
          name="website" value={website} onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only"
        />

        <fieldset className="order__choice">
          <legend>{o.choice}: {f.genders[choice.gender]}, {f.colors[color.id]}, {choice.size || o.sizeLater}</legend>
          <div className="ctl__row">
            {["male", "female"].map((g) => (
              <button key={g} type="button" className="chip" aria-pressed={choice.gender === g} onClick={() => set("gender", g)}>{f.genders[g]}</button>
            ))}
          </div>
          <div className="ctl__row">
            {SIZES.map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={choice.size === s} onClick={() => set("size", choice.size === s ? null : s)}>{s}</button>
            ))}
          </div>
          <a href="#fit" className="textlink">{o.change}</a>
        </fieldset>

        {errors.send && <p className="order__error" role="alert">{errors.send}</p>}

        <button type="submit" className="btn btn--inverse" disabled={status === "sending"}>
          {status === "sending" ? o.sending : o.submit}
        </button>
        <p className="order__consent">
          {o.consentA}
          <Link to={pathFor(lang, "privacy")} navigate={navigate} className="textlink">{o.consentLink}</Link>.
        </p>
      </form>
    </section>
  );
}
