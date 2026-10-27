import { Link, LangSwitch, pathFor } from "../App.jsx";
import { useFitText } from "../hooks.js";

const CREDITS = [
  ["Vadim Art", "Unsplash", "https://unsplash.com/photos/5R4ACGibMgg"],
  ["Oleksandr Zbanduto", "Unsplash", "https://unsplash.com/photos/9o6KR-F9Jl8"],
  ["Kevin Bessat", "Unsplash", "https://unsplash.com/photos/uZgrr_l_umo"],
  ["Nathanaël Desmeules", "Unsplash", "https://unsplash.com/photos/ZSz-3jzswzI"],
  ["Андрій Угрин, «Shpytsi12»", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Shpytsi12.jpg"],
  ["Mykola Swarnyk, «Pinus mugo Chornohora»", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Pinus_mugo_Chornohora_Ukrainian_Carpathians_snow.JPG"],
  ["Mykola Swarnyk, «Climbers on the Mt Hoverla»", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Climbers_on_the_Mt_Hoverla_Jan_24_2009.jpg"],
  ["I.am.wiz, «Sunrise in the winter Carpathians»", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Sunrise_in_the_winter_Carpathians.jpg"],
];

export default function Footer({ t, lang, page, navigate }) {
  const word = useFitText([lang]);
  const fo = t.footer;
  const home = pathFor(lang, "home");
  const onHome = page === "home";
  return (
    <footer className="footer" id="footer">
      <p className="footer__invite" data-reveal>{fo.invite}</p>
      <div className="footer__mark" aria-hidden="true">
        <span className="wordmark" ref={word}>KRYGA</span>
      </div>
      <div className="footer__row">
        <ul className="footer__places">
          <li>{onHome ? <a href="#order">{fo.order}</a> : <Link to={home} hash="order" navigate={navigate}>{fo.order}</Link>}</li>
          <li><span>{fo.delivery}</span></li>
        </ul>
        <div className="footer__links">
          <div>
            <p className="footer__name">{fo.links}</p>
            <ul>
              {[["fit", t.nav.fit], ["fabric", t.nav.fabric], ["faq", t.nav.faq]].map(([id, label]) => (
                <li key={id}>{onHome ? <a href={`#${id}`}>{label}</a> : <Link to={home} hash={id} navigate={navigate}>{label}</Link>}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="footer__name">{fo.language}</p>
            <LangSwitch lang={lang} page={page} navigate={navigate} className="lang--stack" />
          </div>
          <div>
            <p className="footer__name">KRYGA</p>
            <ul>
              <li><Link to={pathFor(lang, "privacy")} navigate={navigate}>{fo.privacy}</Link></li>
              <li><a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{fo.top}</a></li>
            </ul>
          </div>
        </div>
      </div>
      <p className="footer__credits">
        {fo.credits}:{" "}
        {CREDITS.map(([who, lic, href], i) => (
          <span key={href}>
            <a href={href} rel="noopener" target="_blank">{who}</a> ({lic}){i < CREDITS.length - 1 ? "; " : "."}
          </span>
        ))}
      </p>
      <p className="footer__legal">{fo.legal}</p>
    </footer>
  );
}
