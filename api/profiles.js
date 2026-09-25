import { ageIsAllowed, countryFromIpHeaders, requiredAge } from "../lib/age-gate.js";
import { CHILD_MIN_AGE, canBeParent, canPlay } from "../lib/parental.js";
import {
  isEmail,
  registerProfile,
  loginProfile,
  loginChild,
  changePassword,
  createChildProfile,
  revokeChild,
  resetChildPassword,
  listChildren,
  findProfileById,
  publicProfile,
  setDojoPhoto,
  setMailConsent,
  markTrialNotice,
  deleteAccount,
} from "../lib/profile-store.js";
import { openSession, sessionCookie, sessionProfileId, tokenFromRequest, dropSession } from "../lib/profile-session.js";
import { readScores, recordScore } from "../lib/score-vault.js";
import { deployWelcome } from "../lib/fan-mail.js";
import { withdrawalOpen, trialNoticeDue } from "../lib/account-rights.js";
import { ensureGmgBooth, pushDojoPhoto, syncMailConsent, wipeGmgAccount, sendTrialNotice } from "../lib/gmg-profile.js";

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
  if (err?.code === "age" || err?.code === "parent" || err?.code === "revoked") return 403;
  if (err?.code === "child") return 404;
  return 400;
}

async function parentFromSession(req) {
  const id = await sessionProfileId(req);
  if (!id) return { error: "unauthorized", status: 401 };
  const parent = await findProfileById(id);
  const ipCountry = countryFromIpHeaders(req.headers);
  if (!parent || !canBeParent(parent, ipCountry)) return { error: "parent", status: 403 };
  return { parent, ipCountry };
}

export default async function handler(req, res) {
  const query = queryOf(req);
  if (req.method === "GET" && String(query.scores || "") === "1") {
    const id = await sessionProfileId(req);
    if (!id) return json(res, 401, { error: "unauthorized" });
    return json(res, 200, { ok: true, scores: await readScores(id) });
  }
  if (req.method === "GET" && String(query.me || "") === "1") {
    const id = await sessionProfileId(req);
    if (!id) return json(res, 401, { error: "unauthorized" });
    const rec = await findProfileById(id);
    if (!rec) return json(res, 401, { error: "unauthorized" });
    if (trialNoticeDue(rec)) {
      const notice = await sendTrialNotice(tokenFromRequest(req), rec);
      if (notice.ok || notice.skipped) await markTrialNotice(rec.id);
    }
    const profile = publicProfile(rec);
    profile.withdrawalOpen = withdrawalOpen(rec, "");
    return json(res, 200, { ok: true, profile });
  }
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  const body = await readBody(req);
  if (!body) return json(res, 400, { error: "Invalid JSON" });

  if (body.action === "score") {
    const id = await sessionProfileId(req);
    if (!id) return json(res, 401, { error: "unauthorized" });
    const profile = await findProfileById(id);
    const ipCountry = countryFromIpHeaders(req.headers);
    if (!profile) return json(res, 401, { error: "unauthorized" });
    if (!canPlay(profile, ipCountry)) {
      return json(res, 403, { error: profile.playLocked || profile.role === "child" ? "revoked" : "age" });
    }
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

  if (body.action === "link-dojo-photo" || body.action === "sync-dojo-photo") {
    const id = await sessionProfileId(req);
    if (!id) return json(res, 401, { error: "unauthorized" });
    try {
      if (body.action === "sync-dojo-photo") {
        const photo = String(body.photo || "");
        if (!photo.startsWith("data:image/") || photo.length > 120000) {
          return json(res, 400, { error: "photo" });
        }
        const pushed = await pushDojoPhoto(tokenFromRequest(req), photo);
        if (!pushed.ok) return json(res, pushed.skipped ? 204 : (pushed.status || 503), { ok: false, skipped: pushed.skipped });
        const url = pushed.data?.dojoPhoto;
        if (typeof url === "string" && url.startsWith("https://")) {
          const profile = await setDojoPhoto(id, url);
          return json(res, 200, { ok: true, profile });
        }
        return json(res, 200, { ok: true, skipped: true });
      }
      const profile = await setDojoPhoto(id, body.url);
      return json(res, 200, { ok: true, profile });
    } catch (err) {
      return json(res, statusFor(err), { error: err.code || "invalid" });
    }
  }

  if (body.action === "mail-consent" || body.action === "delete-account" || body.action === "withdraw") {
    const id = await sessionProfileId(req);
    if (!id) return json(res, 401, { error: "unauthorized" });
    const token = tokenFromRequest(req);
    try {
      if (body.action === "mail-consent") {
        const on = body.mailingList === true;
        const profile = await setMailConsent(id, on);
        void syncMailConsent(token, on);
        return json(res, 200, { ok: true, profile });
      }
      const rec = await findProfileById(id);
      if (!rec) return json(res, 401, { error: "unauthorized" });
      if (body.action === "withdraw" && !withdrawalOpen(rec, body.locale)) {
        return json(res, 403, { error: "withdrawal" });
      }
      await wipeGmgAccount(token);
      const entry = await deleteAccount(id, {
        action: body.action === "withdraw" ? "withdrawal" : "delete",
        locale: body.locale,
      });
      await dropSession(token);
      return json(res, 200, { ok: true, deleted: entry }, {
        cookie: "fa_profile=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
      });
    } catch (err) {
      return json(res, statusFor(err), { error: err.code || "invalid" });
    }
  }

  if (body.action === "login") {
    try {
      const rec = body.loginName
        ? await loginChild(body.loginName, body.password)
        : isEmail(body.email)
          ? await loginProfile(body.email, body.password)
          : null;
      if (!rec) return json(res, 400, { error: body.loginName ? "login" : "email" });
      const token = await openSession(rec.id);
      void ensureGmgBooth(token);
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

  if (body.action === "children" || body.action === "child" || body.action === "revoke" || body.action === "child-password") {
    const gate = await parentFromSession(req);
    if (gate.error) return json(res, gate.status, { error: gate.error });
    try {
      if (body.action === "children") {
        return json(res, 200, { ok: true, children: await listChildren(gate.parent.id) });
      }
      if (body.action === "revoke") {
        const profile = await revokeChild(gate.parent.id, body.childId);
        return json(res, 200, { ok: true, profile });
      }
      if (body.action === "child-password") {
        const profile = await resetChildPassword(gate.parent.id, body.childId, body.password);
        return json(res, 200, { ok: true, profile });
      }
      const profile = await createChildProfile(gate.parent, body);
      return json(res, 200, { ok: true, profile });
    } catch (err) {
      const status = statusFor(err);
      return json(res, status, {
        error: err.code || "invalid",
        minimum: err.code === "age" ? CHILD_MIN_AGE : undefined,
      });
    }
  }

  if (body.action !== "register") return json(res, 400, { error: "action" });
  if (!isEmail(body.email)) return json(res, 400, { error: "email" });
  const ipCountry = countryFromIpHeaders(req.headers);
  const detected = ipCountry || body.detectedCountry || "";
  if (!ageIsAllowed(body.age, body.country, detected)) {
    const minimum = requiredAge(body.country, detected);
    const n = Number(body.age);
    const parent = Number.isInteger(n) && n >= CHILD_MIN_AGE && n < minimum;
    return json(res, 403, { error: "age", minimum, parent });
  }
  try {
    const profile = await registerProfile({
      id: body.id,
      displayName: body.displayName,
      email: body.email,
      password: body.password,
      age: body.age,
      country: body.country,
      mailingList: body.mailingList === true,
    });
    let welcome = null;
    if (body.mailingList === true) {
      try { welcome = await deployWelcome({ email: profile.email, name: profile.displayName, locale: body.locale }); }
      catch { welcome = null; }
    }
    const token = await openSession(profile.id);
    void ensureGmgBooth(token);
    return json(res, 200, { ok: true, token, profile, welcome }, { cookie: sessionCookie(token) });
  } catch (err) {
    if (err.code === "exists") {
      try {
        const rec = await loginProfile(body.email, body.password);
        const token = await openSession(rec.id);
        void ensureGmgBooth(token);
        return json(res, 200, { ok: true, token, profile: publicProfile(rec), existing: true }, { cookie: sessionCookie(token) });
      } catch {
        return json(res, 409, { error: "exists" });
      }
    }
    return json(res, statusFor(err), { error: err.code || "invalid" });
  }
}
