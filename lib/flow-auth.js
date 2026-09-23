/**
 * Flow session auth for Fast Answer (Vercel serverless).
 * The studio password comes only from FLOW_PASSWORD. NFC-normalize at compare time.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const FLOW_COOKIE = "fa_flow_session";
const MAX_AGE_SEC = 60 * 30; // 30 minutes soft ceiling

export function getFlowPassword() {
  return process.env.FLOW_PASSWORD?.trim() || "";
}

function useSecureCookies() {
  return (
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production" ||
    process.env.FLOW_COOKIE_SECURE === "1"
  );
}

function timingSafeEqualString(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function passwordsMatch(input) {
  const expected = getFlowPassword();
  if (!expected) return false;
  const a = String(input || "").normalize("NFC");
  const b = expected.normalize("NFC");
  return timingSafeEqualString(a, b);
}

function hmacHex(payload, secret) {
  return createHmac("sha256", `fa-flow:${secret}`).update(payload).digest("hex");
}

export function createSessionToken(now = Date.now()) {
  const secret = getFlowPassword();
  if (!secret) throw new Error("FLOW_PASSWORD not configured");
  const exp = now + MAX_AGE_SEC * 1000;
  const payload = `v1.${exp}`;
  const sig = hmacHex(payload, secret);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token) return false;
  const secret = getFlowPassword();
  if (!secret) return false;
  const parts = String(token).split(".");
  if (parts.length !== 3) return false;
  const [ver, expStr, sig] = parts;
  if (ver !== "v1") return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `${ver}.${expStr}`;
  const expected = hmacHex(payload, secret);
  try {
    return timingSafeEqualString(sig, expected);
  } catch {
    return false;
  }
}

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie || req.headers.Cookie);
  return verifySessionToken(cookies[FLOW_COOKIE]);
}

export function sessionCookieHeader(token) {
  const parts = [
    `${FLOW_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
  ];
  if (useSecureCookies()) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookieHeader() {
  const parts = [
    `${FLOW_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (useSecureCookies()) parts.push("Secure");
  return parts.join("; ");
}

export function json(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body != null) {
      if (typeof req.body === "string") {
        try {
          resolve(JSON.parse(req.body || "{}"));
        } catch (e) {
          reject(e);
        }
        return;
      }
      resolve(req.body);
      return;
    }
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export function requireAuth(req, res) {
  if (!getFlowPassword()) {
    json(res, 503, { error: "FLOW_PASSWORD not configured on server" });
    return false;
  }
  if (!isAuthenticated(req)) {
    json(res, 401, { error: "unauthorized" });
    return false;
  }
  return true;
}
