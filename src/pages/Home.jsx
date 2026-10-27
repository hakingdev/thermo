import { useEffect, useRef, useState } from "react";
import { useReveal } from "../hooks.js";
import Hero from "../components/Hero.jsx";
import Hook from "../components/Hook.jsx";
import FittingRoom from "../components/FittingRoom.jsx";
import Fabric from "../components/Fabric.jsx";
import Band from "../components/Band.jsx";
import Steps from "../components/Steps.jsx";
import Order from "../components/Order.jsx";
import Faq from "../components/Faq.jsx";
import Footer from "../components/Footer.jsx";

export default function Home(props) {
  const { t, lang } = props;
  useReveal([lang]);

  // Плашка «Замовити» на телефоне: после первого экрана, прячется у формы и в футере
  const [barOn, setBarOn] = useState(false);
  const watch = useRef({ hero: true, order: false, footer: false });
  useEffect(() => {
    const ids = ["hero", "order", "footer"];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) watch.current[e.target.id] = e.isIntersecting;
      const w = watch.current;
      setBarOn(!w.hero && !w.order && !w.footer);
    }, { threshold: 0.05 });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [lang]);

  return (
    <>
      <a className="skip" href="#order">{t.skip}</a>
      <main>
        <Hero {...props} />
        <Hook {...props} />
        <FittingRoom {...props} />
        <Fabric {...props} />
        <Band {...props} />
        <Steps {...props} />
        <Order {...props} />
        <Faq {...props} />
      </main>
      <Footer {...props} />
      <a className={`orderbar${barOn ? " is-on" : ""}`} href="#order" aria-hidden={!barOn} tabIndex={barOn ? 0 : -1}>
        <span className="orderbar__price"><s>{t.order.old}</s> {t.order.price}</span>
        <span className="orderbar__go">{t.nav.order}</span>
      </a>
    </>
  );
}
