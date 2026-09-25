import { requireAuth } from "../../lib/flow-auth.js";
import { readFanMail, saveLetter } from "../../lib/fan-mail.js";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "{}"); }
    catch { return null; }
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 400_000) raw = raw.slice(0, 400_000); });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve(null); }
    });
    req.on("error", () => resolve(null));
  });
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method === "GET") {
    return json(res, 200, await readFanMail());
  }
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  const body = await readBody(req);
  if (!body) return json(res, 400, { error: "Invalid JSON" });
  try {
    const letter = await saveLetter(body);
    const mail = await readFanMail();
    return json(res, 200, { ok: true, letter, metrics: mail.metrics, sends: mail.sends });
  } catch (err) {
    const status = err?.code === "store" ? 503 : err?.code === "song" ? 413 : 400;
    return json(res, status, { error: err?.code || "invalid" });
  }
}
