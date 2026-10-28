import { redisStore, siteHandler } from "../server/site-state.mjs";
import { productionAuth } from "../server/production-auth.mjs";

// Serverless instances share Redis; local files are never used for Vercel persistence.
export default siteHandler({ store: redisStore(process.env), auth: productionAuth });
