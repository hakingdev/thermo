import { Link, LangSwitch, pathFor } from "../App.jsx";

export default function Privacy({ t, lang, page, navigate }) {
  const pr = t.privacy;
  return (
    <main className="privacy">
      <div className="thanks__bar">
        <Link to={pathFor(lang, "home")} navigate={navigate} className="textlink">← {pr.back}</Link>
        <LangSwitch lang={lang} page={page} navigate={navigate} />
      </div>
      <h1 className="head">{pr.title}</h1>
      {pr.body.map(([h, p]) => (
        <section key={h} className="privacy__part">
          <h2>{h}</h2>
          <p>{p}</p>
        </section>
      ))}
    </main>
  );
}
