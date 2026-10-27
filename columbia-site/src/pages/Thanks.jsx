import { useState } from "react";
import { COLORS } from "../config.js";
import { consumeLeadOnce } from "../pixel.js";
import { Link, LangSwitch, pathFor } from "../App.jsx";
import { useFitText } from "../hooks.js";

export default function Thanks({ t, lang, page, navigate }) {
  // Lead — один раз за заявку; перезагрузка и прямой заход на /thanks его не повторяют
  const [lead] = useState(() => consumeLeadOnce());
  const word = useFitText([lang]);
  const th = t.thanks;
  const f = t.fit;
  const color = lead && COLORS.find((c) => c.id === lead.color);

  return (
    <main className="thanks">
      <div className="thanks__bar">
        <Link to={pathFor(lang, "home")} navigate={navigate} className="textlink">← {th.back}</Link>
        <LangSwitch lang={lang} page={page} navigate={navigate} />
      </div>
      <div className="thanks__body">
        <h1 className="head">{lead?.name ? th.titleName(lead.name.slice(0, 30)) : th.title}</h1>
        <p className="thanks__text">{th.text}</p>
        <p className="thanks__text">{th.keep}</p>
        {lead && (
          <p className="thanks__choice">
            {th.choice}: {f.genders[lead.gender]}, {color ? f.colors[color.id] : ""}, {lead.size || t.order.sizeLater}
          </p>
        )}
      </div>
      <div className="thanks__mark" aria-hidden="true">
        <span className="wordmark" ref={word}>Columbia</span>
      </div>
    </main>
  );
}
