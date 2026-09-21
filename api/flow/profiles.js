import { requireAuth } from "../../lib/flow-auth.js";
import { listProfiles, mailingListCsv } from "../../lib/profile-store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "method" }));
    return;
  }
  if (!requireAuth(req, res)) return;

  const url = new URL(req.url || "/", "http://localhost");
  const download = url.searchParams.get("download") === "1" || url.searchParams.get("format") === "csv";
  if (download) {
    const csv = mailingListCsv();
    res.statusCode = 200;
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.setHeader("content-disposition", "attachment; filename=\"fast-answer-mailing-list.csv\"");
    res.end(csv);
    return;
  }

  const profiles = listProfiles();
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify({
    profiles,
    count: profiles.length,
    emails: profiles.map((p) => p.email),
  }));
}
