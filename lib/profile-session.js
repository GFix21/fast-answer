/**
 * Profile session. The token is stored in Redis (or the local file store)
 * and echoed as an HttpOnly cookie plus a header the phone can send back.
 */
import { newToken } from "./password-server.js";
import { getRedis } from "./redis.js";

export const PROFILE_COOKIE = "fa_profile";
const MAX_AGE_SEC = 60 * 60 * 24 * 30;
const memory = globalThis.__faProfileSessions || (globalThis.__faProfileSessions = new Map());

function cookieSecure() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function sessionCookie(token) {
  const parts = [
    `${PROFILE_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SEC}`,
  ];
  if (cookieSecure()) parts.push("Secure");
  return parts.join("; ");
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function tokenFromRequest(req) {
  const header = req.headers?.["x-fa-profile"] || req.headers?.["X-Fa-Profile"] || "";
  if (header) return String(header).trim();
  const auth = req.headers?.authorization || req.headers?.Authorization || "";
  if (String(auth).toLowerCase().startsWith("bearer ")) return String(auth).slice(7).trim();
  const cookies = parseCookies(req.headers?.cookie || req.headers?.Cookie);
  return cookies[PROFILE_COOKIE] || "";
}

export async function openSession(profileId) {
  const token = newToken();
  const rec = { id: String(profileId), exp: Date.now() + MAX_AGE_SEC * 1000 };
  const db = await getRedis();
  if (db) await db.set(`fa:session:${token}`, rec, { ex: MAX_AGE_SEC });
  else memory.set(token, rec);
  return token;
}

export async function readSession(token) {
  if (!token) return null;
  const db = await getRedis();
  let rec = null;
  if (db) rec = await db.get(`fa:session:${token}`);
  else rec = memory.get(token) || null;
  if (!rec || typeof rec !== "object") return null;
  if (rec.exp && Date.now() > rec.exp) return null;
  return rec;
}

export async function sessionProfileId(req) {
  const rec = await readSession(tokenFromRequest(req));
  return rec?.id || "";
}

export async function dropSession(token) {
  if (!token) return;
  const db = await getRedis();
  if (db) {
    try { await db.del(`fa:session:${token}`); } catch { /* already gone */ }
  }
  memory.delete(token);
}
