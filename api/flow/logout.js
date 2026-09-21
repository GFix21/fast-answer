import { clearSessionCookieHeader, json } from "../../lib/flow-auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  return json(res, 200, { ok: true }, { "set-cookie": clearSessionCookieHeader() });
}
