import { adminAuth, redisAuthStore } from "./admin-auth.mjs";

export const productionAuth = adminAuth({
  store: redisAuthStore(process.env),
  username: process.env.SITE_ADMIN_USERNAME || "admin",
  password: process.env.SITE_ADMIN_PASSWORD,
});
