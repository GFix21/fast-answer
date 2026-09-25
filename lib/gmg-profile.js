/**
 * A Fast Answer profile is the same account on GMG Brand.
 * This only tells GMG the account exists, and copies the Dojo photo
 * into its own slot. It never writes the five GMG booth frames.
 * Tests leave the origin empty so they do not call the live site.
 */
import { gmgListOrigin } from "./gmg-list.js";

export function gmgProfileOrigin() {
  return gmgListOrigin();
}

async function postGmg(token, body) {
  const origin = gmgProfileOrigin();
  if (!origin || !token) return { ok: false, skipped: true };
  const res = await fetch(`${origin}/api/profile`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-fa-profile": token,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, skipped: false, status: res.status, data };
}

export function ensureGmgBooth(token) {
  return postGmg(token, { action: "ensure" });
}

export function pushDojoPhoto(token, photo) {
  return postGmg(token, { action: "dojo-photo", photo });
}

export function syncMailConsent(token, on) {
  return postGmg(token, { action: "house-consent", mailingList: on === true });
}

export function wipeGmgAccount(token) {
  return postGmg(token, { action: "account-deleted" });
}

export function sendTrialNotice(token, profile) {
  return postGmg(token, {
    action: "trial-notice",
    locale: "",
    trialEndsAt: profile?.trialEndsAt || "",
  });
}
