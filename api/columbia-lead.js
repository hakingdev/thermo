import { createLeadHandler } from "../columbia-site/api/lead.js";

// Columbia never inherits KRYGA's offer or credentials in the combined deployment.
const env = Object.fromEntries(["API_KEY", "ENDPOINT", "PRODUCT_ID", "STREAM_ID", "CPA_ID", "PRICE"].map((key) => [`DARKLEADS_${key}`, process.env[`COLUMBIA_DARKLEADS_${key}`]]));
export default createLeadHandler(env);
