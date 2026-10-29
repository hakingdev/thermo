import { useCallback, useEffect, useState } from "react";
import { parseStorefrontRoute } from "./routes.js";
import { dict } from "./i18n.js";
import { trackPageView } from "./pixel.js";
import Home from "./pages/Home.jsx";
import Thanks from "./pages/Thanks.jsx";
import Privacy from "./pages/Privacy.jsx";
import BootsPage from "./boots/BootsPage.jsx";
import BootsThanks from "./boots/BootsThanks.jsx";

// Маршруты: / (UA), /ru, /thanks, /ru/thanks, /privacy, /ru/privacy,
// /boots и /boots/thanks (+ /ru/…) — отдельная страница зимових кросівок

export function pathFor(lang, page = "home") {
  const base = lang === "ru" ? "/ru" : "";
  const tail = page === "home" ? "" : `/${page}`;
  return base + tail || "/";
}

export default function App({ defaultPage = "home" }) {
  const parse = (pathname) => parseStorefrontRoute(pathname, defaultPage);
  const [route, setRoute] = useState(() => parse(window.location.pathname));
  const [choice, setChoice] = useState({ gender: "male", color: "black", size: null });
  const t = dict[route.lang];

  // UTM и sub-метки едут с пользователем по всем страницам
  const navigate = useCallback((to, { hash } = {}) => {
    window.history.pushState({}, "", to + window.location.search + (hash ? `#${hash}` : ""));
    setRoute(parse(window.location.pathname));
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
    else window.scrollTo(0, 0);
  }, [defaultPage]);

  useEffect(() => {
    const onPop = () => setRoute(parse(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [defaultPage]);

  const ownMeta = route.page.startsWith("boots"); // страница кросівок ставит заголовок и превью сама
  useEffect(() => {
    document.documentElement.lang = route.lang === "ru" ? "ru" : "uk";
    if (ownMeta) return;
    document.title = route.page === "home" ? t.meta.title : `${route.page === "thanks" ? t.thanks.title : t.privacy.title} · KRYGA`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.meta.description);
  }, [route, t]);

  // hreflang и превью — абсолютные адреса текущего домена
  useEffect(() => {
    const head = document.head;
    head.querySelectorAll('link[rel="alternate"][hreflang], link[rel="canonical"]').forEach((l) => l.remove());
    const add = (attrs) => head.appendChild(Object.assign(document.createElement("link"), attrs));
    const origin = window.location.origin;
    add({ rel: "canonical", href: origin + pathFor(route.lang, route.page) });
    add({ rel: "alternate", hreflang: "uk", href: origin + pathFor("ua", route.page) });
    add({ rel: "alternate", hreflang: "ru", href: origin + pathFor("ru", route.page) });
    add({ rel: "alternate", hreflang: "x-default", href: origin + pathFor("ua", route.page) });
    const og = (prop, content) => document.querySelector(`meta[property="${prop}"]`)?.setAttribute("content", content);
    if (ownMeta) return;
    og("og:title", t.meta.title);
    og("og:description", t.meta.description);
    og("og:locale", route.lang === "ru" ? "ru_UA" : "uk_UA");
  }, [route, t]);

  // Переход между страницами: PageView для пикселя (первый шлёт index.html)
  // и фокус на заголовок новой страницы, чтобы экранная читалка объявила её
  const [first, setFirst] = useState(true);
  useEffect(() => {
    if (first) return setFirst(false);
    trackPageView();
    if (window.location.hash) return;
    requestAnimationFrame(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return;
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
    });
  }, [route.page, route.lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const props = { t, lang: route.lang, page: route.page, navigate, choice, setChoice };
  if (route.page === "thanks") return <Thanks {...props} />;
  if (route.page === "privacy") return <Privacy {...props} />;
  if (route.page === "boots") return <BootsPage {...props} />;
  if (route.page === "boots/thanks") return <BootsThanks {...props} />;
  return <Home {...props} />;
}

// Внутренняя ссылка без перезагрузки страницы
export function Link({ to, navigate, hash, children, ...rest }) {
  return (
    <a
      href={to + (hash ? `#${hash}` : "")}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to, { hash });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

export function LangSwitch({ lang, page, navigate, className = "" }) {
  return (
    <nav className={`lang ${className}`} aria-label="Мова / Язык">
      {["ua", "ru"].map((l) => (
        <Link key={l} to={pathFor(l, page)} navigate={navigate} aria-current={l === lang ? "true" : undefined} hrefLang={l === "ua" ? "uk" : "ru"}>
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
