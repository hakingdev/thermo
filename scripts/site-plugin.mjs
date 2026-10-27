import { cpSync } from "node:fs";
import { resolve } from "node:path";
import { fileStore, siteHandler } from "../server/site-state.mjs";

export function sitePlugin(env) {
  let root, outDir;
  const install = (server) => {
    const handler = siteHandler({
      store: fileStore(resolve(root, ".local/site-state.json")),
      password: env.SITE_ADMIN_PASSWORD || "", local: true,
    });
    server.middlewares.use((req, res, next) => {
      const path = new URL(req.url, "http://localhost").pathname;
      if (path === "/api/site" || path === "/api/site/") return handler(req, res);
      if (path.startsWith("/img/columbia/")) req.url = "/columbia-site/public" + req.url;
      next();
    });
  };
  return {
    name: "shared-storefront",
    configResolved(config) { root = config.root; outDir = resolve(root, config.build.outDir); },
    configureServer: install,
    configurePreviewServer(server) {
      server.middlewares.use("/api/site", siteHandler({ store: fileStore(resolve(root, ".local/site-state.json")), password: env.SITE_ADMIN_PASSWORD || "", local: true }));
    },
    closeBundle() { cpSync(resolve(root, "columbia-site/public/img/columbia"), resolve(outDir, "img/columbia"), { recursive: true }); },
  };
}
