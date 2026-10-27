export default function Faq({ t }) {
  return (
    <section id="faq" className="faq" aria-labelledby="faq-title">
      <div className="faq__row">
        <h2 id="faq-title" className="faq__q faq__heading" data-reveal>{t.faq.title}</h2>
      </div>
      {t.faq.items.map(([q, a]) => (
        <div className="faq__row" key={q} data-reveal>
          <h3 className="faq__q">{q}</h3>
          <p className="faq__a">{a}</p>
        </div>
      ))}
    </section>
  );
}
