import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
const root = createRoot(document.getElementById("root"));
const admin = /^\/admin\/?$/.test(window.location.pathname);
const preview = new URLSearchParams(window.location.search).get("preview");
// Separate loaders preserve each storefront's CSS preload dependencies in the production build.
const storefronts = {
  columbia: () => import("../columbia-site/src/site.js"),
  kryga: () => import("./sites/kryga.js"),
};

async function start() {
  if (admin) {
    const { default: Admin } = await import("./admin/Admin.jsx");
    root.render(<StrictMode><Admin /></StrictMode>);
    return;
  }
  let site;
  if (preview === "kryga" || preview === "columbia") site = preview;
  else {
    const response = await fetch("/api/site", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("site");
    ({ site } = await response.json());
    if (site !== "kryga" && site !== "columbia") throw new Error("site");
  }
  const columbia = site === "columbia";
  if (columbia) delete document.documentElement.dataset.theme;
  document.documentElement.classList.add("js");
  document.documentElement.dataset.site = site;
  const { default: App, PIXEL_ID } = await storefronts[site]();
  document.querySelector('meta[property="og:image"]')?.setAttribute("content", columbia ? "/img/columbia/og.jpg" : "/img/hero-runner-900.jpg");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", columbia ? "#f5f7fa" : "#f7f9f8");
  if (!preview && PIXEL_ID) {
    const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod(...arguments) : fbq.queue.push(arguments); };
    fbq.queue = []; fbq.loaded = true; fbq.version = "2.0";
    const script = document.createElement("script");
    script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
    fbq("init", PIXEL_ID); fbq("track", "PageView");
  }
  if (preview) {
    const robots = document.createElement("meta");
    robots.name = "robots"; robots.content = "noindex, nofollow"; document.head.appendChild(robots);
  }
  root.render(<StrictMode><App />{preview && <aside style={{ position: "fixed", bottom: 16, left: 16, zIndex: 100, padding: "10px 16px", background: "#fff", color: "#0e2341", border: "1px solid #d8e0e5", fontSize: 14, fontFamily: "system-ui", borderRadius: 8 }}>Предпросмотр · {columbia ? "Columbia" : "KRYGA"} <a href="/admin" style={{ marginLeft: 16 }}>В админку</a></aside>}</StrictMode>);
}

start().catch(() => {
  root.render(<main style={{ maxWidth: 480, margin: "15vh auto", padding: 24, fontFamily: "system-ui", color: "#0e2341" }}><h1>Не удалось открыть сайт</h1><p>Проверьте соединение и попробуйте ещё раз.</p><button onClick={() => window.location.reload()} style={{ padding: "12px 20px", cursor: "pointer" }}>Обновить страницу</button></main>);
});
