import { useState } from "react";
import { Link, pathFor } from "../App.jsx";
import { consumeLeadOnce } from "../pixel.js";
import { useFitText } from "../hooks.js";
import { BootsBar, useBootsPage } from "./BootsPage.jsx";
import { bootsDict } from "./content.js";
import "./boots.css";

export default function BootsThanks(props) {
  const { lang, navigate } = props;
  const m = bootsDict[lang];
  // Lead — один раз за заявку; перезагрузка и прямой заход на /boots/thanks його не повторюють
  const [lead] = useState(() => consumeLeadOnce());
  const word = useFitText([lang]);
  useBootsPage(lang, `${m.thanks.title} · KRYGA`, m.meta.description);

  return (
    <main className="thanks bp">
      <div className="thanks__bar">
        <Link to={pathFor(lang, "boots")} navigate={navigate} className="textlink">← {m.thanks.back}</Link>
        <BootsBar {...props} />
      </div>
      <div className="thanks__body">
        <h1 className="head">{lead?.name ? m.thanks.titleName(lead.name.slice(0, 30)) : m.thanks.title}</h1>
        <p className="thanks__text">{m.thanks.text}</p>
        <p className="thanks__text">{m.thanks.keep}</p>
        {lead && <p className="thanks__choice">{m.thanks.choice}: {lead.size || m.order.sizeLater}</p>}
      </div>
      <div className="thanks__mark" aria-hidden="true"><span className="wordmark" ref={word}>KRYGA</span></div>
    </main>
  );
}
