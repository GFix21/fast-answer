/** EU member states. Québec is not in this set. */
export const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

const DAY = 24 * 60 * 60 * 1000;

export function trialEndFrom(iso) {
  const start = new Date(iso || Date.now());
  if (Number.isNaN(start.getTime())) return "";
  return new Date(start.getTime() + 14 * DAY).toISOString();
}

export function withinTrial(rec, now = Date.now()) {
  const end = Date.parse(rec?.trialEndsAt || "");
  return Number.isFinite(end) && now <= end;
}

/** France, Germany, and the rest of the EU. A Québec French page does not qualify. */
export function withdrawalOpen(rec, locale, now = Date.now()) {
  if (!withinTrial(rec, now)) return false;
  const country = String(rec?.country || "").toUpperCase();
  if (EU_COUNTRIES.has(country)) return true;
  const loc = String(locale || "");
  return loc === "fr" || loc === "de";
}

export function trialNoticeDue(rec, now = Date.now()) {
  const end = Date.parse(rec?.trialEndsAt || "");
  if (!Number.isFinite(end) || rec?.trialNoticeAt) return false;
  return now >= end - 10 * DAY && now <= end - 2 * DAY;
}
