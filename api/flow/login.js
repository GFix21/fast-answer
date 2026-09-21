import {
  passwordsMatch,
  createSessionToken,
  sessionCookieHeader,
  json,
  readBody,
  getFlowPassword,
} from "../../lib/flow-auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  if (!getFlowPassword()) {
    return json(res, 503, { error: "FLOW_PASSWORD not configured" });
  }
  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: "Invalid JSON" });
  }
  if (!passwordsMatch(body.password || "")) {
    return json(res, 401, { error: "Invalid password" });
  }
  const token = createSessionToken();
  return json(res, 200, { ok: true }, { "set-cookie": sessionCookieHeader(token) });
}
