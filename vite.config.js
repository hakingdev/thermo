import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sitePlugin } from "./scripts/site-plugin.mjs";

// В dev-режиме /api/lead отвечает заглушка: реальные заявки в DarkLeads не уходят.
// Чтобы проверить настоящий PHP, запустите `php -S localhost:8000 -t dist` после `npm run build:php`
// и выставьте VITE_DEV_PROXY=http://localhost:8000.
function mockLeadApi() {
  return {
    name: "mock-lead-api",
    configureServer(server) {
      if (process.env.VITE_DEV_PROXY) return;
      const mock = (req, res) => {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          console.log("[mock /api/lead]", body);
          let data = {};
          try { data = JSON.parse(body || "{}"); } catch {}
          const digits = String(data.phone || "").replace(/\D/g, "");
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          setTimeout(() => {
            if (String(data.name || "").trim().length < 2) {
              res.statusCode = 422;
              return res.end(JSON.stringify({ ok: false, error: "name" }));
            }
            if (digits.length !== 12) {
              res.statusCode = 422;
              return res.end(JSON.stringify({ ok: false, error: "phone" }));
            }
            res.end(JSON.stringify({ ok: true, mock: true }));
          }, 500);
        });
      };
      server.middlewares.use("/api/lead", mock);
      server.middlewares.use("/api/columbia-lead", mock);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), sitePlugin(loadEnv(mode, process.cwd(), "")), mockLeadApi()],
  resolve: { dedupe: ["react", "react-dom", "three"] },
  define: { "import.meta.env.VITE_MULTISITE": "true" },
  build: { chunkSizeWarningLimit: 700 },
  server: process.env.VITE_DEV_PROXY
    ? { proxy: { "/api/lead": { target: process.env.VITE_DEV_PROXY, changeOrigin: true } } }
    : {},
}));
