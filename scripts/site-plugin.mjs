import { cpSync } from "node:fs";
import { resolve } from "node:path";
import { fileStore, siteHandler } from "../server/site-state.mjs";
import { adminAuth, memoryAuthStore } from "../server/admin-auth.mjs";

export function sitePlugin(env) {
  let root, outDir;
  const auth = adminAuth({ store: memoryAuthStore(), username: env.SITE_ADMIN_USERNAME || "admin", password: env.SITE_ADMIN_PASSWORD || "", local: true });
  const install = (server) => {
    const handler = siteHandler({
      store: fileStore(resolve(root, ".local/site-state.json")),
      auth, local: true,
    });
    server.middlewares.use((req, res, next) => {
      const path = new URL(req.url, "http://localhost").pathname;
      if (path === "/api/site" || path === "/api/site/") return handler(req, res);
      if (path === "/api/admin" || path === "/api/admin/") return auth.handler(req, res);
      if (path.startsWith("/img/columbia/")) req.url = "/columbia-site/public" + req.url;
      next();
    });
  };
  return {
    name: "shared-storefront",
    configResolved(config) { root = config.root; outDir = resolve(root, config.build.outDir); },
    configureServer: install,
    configurePreviewServer(server) {
      server.middlewares.use("/api/site", siteHandler({ store: fileStore(resolve(root, ".local/site-state.json")), auth, local: true }));
      server.middlewares.use("/api/admin", auth.handler);
    },
    closeBundle() { cpSync(resolve(root, "columbia-site/public/img/columbia"), resolve(outDir, "img/columbia"), { recursive: true }); },
  };
}
