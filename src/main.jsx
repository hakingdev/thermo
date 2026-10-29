import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initMetaPixel } from "./meta-pixel.js";
import { resolveStorefront } from "./routes.js";
import StoreTabs from "./components/StoreTabs.jsx";
const root = createRoot(document.getElementById("root"));
const admin = /^\/admin\/?$/.test(window.location.pathname);
const preview = new URLSearchParams(window.location.search).get("preview");
// Separate loaders preserve each storefront's CSS preload dependencies in the production build.
const storefronts = {
  columbia: () => import("../columbia-site/src/site.js"),
  kryga: () => import("./sites/kryga.js"),
  boots: () => import("./sites/boots.jsx"),
  track: () => import("../columbia-site/src/track/TrackApp.jsx"),
};

async function start() {
  if (admin) {
    const { default: Admin } = await import("./admin/AdminEntry.jsx");
    root.render(<StrictMode><Admin /></StrictMode>);
    return;
  }
  const directTrack = /^\/(?:ru\/)?columbia-track(?:\/|$)/.test(window.location.pathname);
  const explicitPreview = ['columbia', 'kryga', 'boots-columbia', 'boots-kryga'].includes(preview);
  let state = {};
  if (!directTrack && !explicitPreview) {
    const response = await fetch("/api/site", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("site");
    state = await response.json();
  }
  const site = resolveStorefront(window.location.pathname, preview, state);
  if (!Object.hasOwn(storefronts, site)) throw new Error("site");
  const columbia = site === "columbia";
  if (columbia) delete document.documentElement.dataset.theme;
  document.documentElement.classList.add("js");
  document.documentElement.dataset.site = site;
  const { default: App, PIXEL_ID } = await storefronts[site]();
  document.querySelector('meta[property="og:image"]')?.setAttribute("content", columbia ? "/img/columbia/og.jpg" : "/img/hero-runner-900.jpg");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", columbia ? "#f5f7fa" : "#f7f9f8");
  initMetaPixel(PIXEL_ID, { enabled: import.meta.env.PROD && !preview });
  if (preview) {
    const robots = document.createElement("meta");
    robots.name = "robots"; robots.content = "noindex, nofollow"; document.head.appendChild(robots);
  }
  root.render(<StrictMode><StoreTabs /><App {...(site === "track" ? { basePath: directTrack ? "/columbia-track" : "/boots" } : {})} />{preview && <aside style={{ position: "fixed", bottom: 16, left: 16, zIndex: 100, padding: "10px 16px", background: "#fff", color: "#0e2341", border: "1px solid #d8e0e5", fontSize: 14, fontFamily: "system-ui", borderRadius: 8 }}>Предпросмотр · {{ columbia: "Columbia", kryga: "KRYGA", boots: "KRYGA Boots", track: "Columbia Track" }[site]} <a href="/admin" style={{ marginLeft: 16 }}>В админку</a></aside>}</StrictMode>);
}

start().catch(() => {
  root.render(<main style={{ maxWidth: 480, margin: "15vh auto", padding: 24, fontFamily: "system-ui", color: "#0e2341" }}><h1>Не удалось открыть сайт</h1><p>Проверьте соединение и попробуйте ещё раз.</p><button onClick={() => window.location.reload()} style={{ padding: "12px 20px", cursor: "pointer" }}>Обновить страницу</button></main>);
});
