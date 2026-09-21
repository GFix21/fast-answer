import { isAuthenticated, getFlowPassword, json } from "../../lib/flow-auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  const configured = Boolean(getFlowPassword());
  const ok = configured && isAuthenticated(req);
  return json(res, 200, { ok, configured });
}
