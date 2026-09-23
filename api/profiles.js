import { activateProfile, isEmail } from "../lib/profile-store.js";
import { ageIsAllowed, requiredAge } from "../lib/age-gate.js";
import { readScores, recordScore } from "../lib/score-vault.js";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

function queryOf(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    return Object.fromEntries(new URL(req.url || "/", "http://local").searchParams);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  const query = queryOf(req);
  if (req.method === "GET" && String(query.scores || "") === "1") {
    return json(res, 200, { ok: true, scores: readScores(query.id) });
  }
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  let body = req.body;
  if (body == null) {
    body = await new Promise((resolve, reject) => {
      let raw = "";
      req.on("data", (c) => { raw += c; });
      req.on("end", () => {
        try { resolve(raw ? JSON.parse(raw) : {}); }
        catch (e) { reject(e); }
      });
      req.on("error", reject);
    }).catch(() => null);
  } else if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); }
    catch { body = null; }
  }
  if (!body) return json(res, 400, { error: "Invalid JSON" });
  if (body.action === "score") {
    try {
      const scores = recordScore(body.id, {
        score: body.score,
        at: body.at,
        displayName: body.displayName,
      });
      return json(res, 200, { ok: true, scores });
    } catch (err) {
      return json(res, 400, { error: err.code || "invalid" });
    }
  }
  if (!isEmail(body.email)) return json(res, 400, { error: "email" });
  if (body.age != null && body.age !== "" && !ageIsAllowed(body.age, body.country, body.detectedCountry)) {
    const minimum = requiredAge(body.country, body.detectedCountry);
    return json(res, 403, { error: "age", minimum });
  }
  try {
    const profile = activateProfile({
      id: body.id,
      displayName: body.displayName,
      email: body.email,
    });
    return json(res, 200, {
      ok: true,
      profile: {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.email,
        activated: true,
        activatedAt: profile.activatedAt,
      },
    });
  } catch (err) {
    return json(res, 400, { error: err.code || "invalid" });
  }
}
