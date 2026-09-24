import { ageIsAllowed, countryFromIpHeaders, requiredAge } from "../lib/age-gate.js";
import { isEmail, registerProfile, loginProfile, changePassword, publicProfile } from "../lib/profile-store.js";
import { openSession, sessionCookie, sessionProfileId } from "../lib/profile-session.js";
import { readScores, recordScore } from "../lib/score-vault.js";

const SCORE_CAP = 200000;

function json(res, status, body, extra = {}) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  if (extra.cookie) res.setHeader("set-cookie", extra.cookie);
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

async function readBody(req) {
  if (req.body == null) {
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
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "{}"); }
    catch { return null; }
  }
  return req.body;
}

function statusFor(err) {
  if (err?.code === "store") return 503;
  if (err?.code === "exists") return 409;
  if (err?.code === "password") return 401;
  if (err?.code === "age") return 403;
  return 400;
}

export default async function handler(req, res) {
  const query = queryOf(req);
  if (req.method === "GET" && String(query.scores || "") === "1") {
    const id = await sessionProfileId(req);
    if (!id) return json(res, 401, { error: "unauthorized" });
    return json(res, 200, { ok: true, scores: await readScores(id) });
  }
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  const body = await readBody(req);
  if (!body) return json(res, 400, { error: "Invalid JSON" });

  if (body.action === "score") {
    const id = await sessionProfileId(req);
    if (!id) return json(res, 401, { error: "unauthorized" });
    const score = Math.round(Number(body.score));
    if (!Number.isFinite(score) || score < 0 || score > SCORE_CAP) {
      return json(res, 400, { error: "score" });
    }
    try {
      const scores = await recordScore(id, { score, at: body.at });
      return json(res, 200, { ok: true, scores });
    } catch (err) {
      return json(res, statusFor(err), { error: err.code || "invalid" });
    }
  }

  if (body.action === "login") {
    if (!isEmail(body.email)) return json(res, 400, { error: "email" });
    try {
      const rec = await loginProfile(body.email, body.password);
      const token = await openSession(rec.id);
      return json(res, 200, { ok: true, token, profile: publicProfile(rec) }, { cookie: sessionCookie(token) });
    } catch (err) {
      return json(res, statusFor(err), { error: err.code || "invalid" });
    }
  }

  if (body.action === "password") {
    if (!isEmail(body.email)) return json(res, 400, { error: "email" });
    try {
      const profile = await changePassword(body.email, body.current, body.password);
      const token = await openSession(profile.id);
      return json(res, 200, { ok: true, token, profile }, { cookie: sessionCookie(token) });
    } catch (err) {
      return json(res, statusFor(err), { error: err.code || "invalid" });
    }
  }

  if (body.action !== "register") return json(res, 400, { error: "action" });
  if (!isEmail(body.email)) return json(res, 400, { error: "email" });
  const ipCountry = countryFromIpHeaders(req.headers);
  const detected = ipCountry || body.detectedCountry || "";
  if (!ageIsAllowed(body.age, body.country, detected)) {
    return json(res, 403, { error: "age", minimum: requiredAge(body.country, detected) });
  }
  try {
    const profile = await registerProfile({
      id: body.id,
      displayName: body.displayName,
      email: body.email,
      password: body.password,
      age: body.age,
      country: body.country,
    });
    const token = await openSession(profile.id);
    return json(res, 200, { ok: true, token, profile }, { cookie: sessionCookie(token) });
  } catch (err) {
    if (err.code === "exists") {
      try {
        const rec = await loginProfile(body.email, body.password);
        const token = await openSession(rec.id);
        return json(res, 200, { ok: true, token, profile: publicProfile(rec), existing: true }, { cookie: sessionCookie(token) });
      } catch {
        return json(res, 409, { error: "exists" });
      }
    }
    return json(res, statusFor(err), { error: err.code || "invalid" });
  }
}
