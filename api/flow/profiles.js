import { requireAuth } from "../../lib/flow-auth.js";
import { listProfilesAsync, mailingListCsv, mailingListRows } from "../../lib/profile-store.js";
import { pushListToGmg } from "../../lib/gmg-list.js";

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
    req.on("data", (c) => { raw += c; if (raw.length > 2_000_000) raw = raw.slice(0, 2_000_000); });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve(null); }
    });
    req.on("error", () => resolve(null));
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    json(res, 405, { error: "method" });
    return;
  }
  if (!requireAuth(req, res)) return;

  if (req.method === "POST") {
    const body = await readBody(req);
    if (body?.action !== "push-list") return json(res, 400, { error: "action" });
    const rows = await mailingListRows();
    const result = await pushListToGmg(rows);
    const status = result.ok ? 200 : result.reason === "secret" ? 503 : 502;
    return json(res, status, { ...result, count: rows.length });
  }

  const url = new URL(req.url || "/", "http://localhost");
  const download = url.searchParams.get("download") === "1" || url.searchParams.get("format") === "csv";
  if (download) {
    const csv = await mailingListCsv();
    res.statusCode = 200;
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.setHeader("content-disposition", "attachment; filename=\"fast-answer-mailing-list.csv\"");
    res.end(csv);
    return;
  }

  const profiles = await listProfilesAsync();
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify({
    profiles,
    count: profiles.length,
    emails: profiles.map((p) => p.email),
  }));
}
