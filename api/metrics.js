import { bumpMetric, FAN_METRICS } from "../lib/fan-mail.js";

const recent = new Map();

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

function clientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"] || "";
  return String(forwarded).split(",")[0].trim() || req.socket?.remoteAddress || "local";
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "{}"); }
    catch { return null; }
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => { raw += c; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve(null); }
    });
    req.on("error", () => resolve(null));
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  const body = await readBody(req);
  const event = String(body?.event || "");
  if (!FAN_METRICS.includes(event) || event === "mailingJoins") return json(res, 400, { error: "event" });
  const key = `${clientIp(req)}:${event}`;
  const now = Date.now();
  if (now - (recent.get(key) || 0) < 1500) return json(res, 200, { ok: true, skipped: true });
  recent.set(key, now);
  try {
    const count = await bumpMetric(event);
    return json(res, 200, { ok: true, event, count });
  } catch (err) {
    return json(res, err?.code === "store" ? 503 : 400, { error: err?.code || "invalid" });
  }
}
