/** Server password for a Dojo profile. The hash never goes back to the phone. */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(password || "").normalize("NFC"), salt, 32).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  if (!salt || !hash) return false;
  const got = scryptSync(String(password || "").normalize("NFC"), String(salt), 32);
  let want;
  try { want = Buffer.from(String(hash), "hex"); } catch { return false; }
  if (got.length !== want.length) return false;
  return timingSafeEqual(got, want);
}

export function newToken() {
  return randomBytes(32).toString("hex");
}
