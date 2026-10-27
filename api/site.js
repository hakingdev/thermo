import { redisStore, siteHandler } from "../server/site-state.mjs";

// Serverless instances share Redis; local files are never used for Vercel persistence.
export default siteHandler({ store: redisStore(process.env), password: process.env.SITE_ADMIN_PASSWORD });
