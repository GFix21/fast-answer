/**
 * Minimum age for a profile that stores a name and an email.
 * The floor is 13. A country raises it when its rule is higher.
 * The higher of the country the player chooses and the country the device
 * timezone points at is the one that applies, so picking a lower country
 * does not drop the limit for the place they are entering from.
 *
 * USA — 13. COPPA requires parental consent before personal information
 * is collected from a child under 13. This profile has no parent-consent step.
 * England — 13. UK GDPR Article 8, as set by the Data Protection Act 2018.
 * France — 15. France set the GDPR Article 8 digital-consent age at 15.
 * Germany — 16. Germany set the GDPR Article 8 digital-consent age at 16.
 * Canada — 14. Quebec's Law 25 says a minor under 14 cannot consent alone.
 *   That is the numeric rule in force inside Canada, so the country gate is 14.
 * Australia — 16. From 10 December 2025 an age-restricted social account is 16.
 *   Online games are outside that statute. This profile stores a name, email,
 *   and photo and joins a shared room, so the account age applied here is 16.
 * New Zealand — 13. An under-16 bill was introduced in August 2026 and has not
 *   become law, so the floor of 13 applies.
 */
export const PROFILE_FLOOR = 13;

export const COUNTRY_MIN_AGE = {
  US: 13,
  FR: 15,
  DE: 16,
  CA: 14,
  AU: 16,
  NZ: 13,
  GB: 13,
};

export const COUNTRIES = ["US", "FR", "DE", "CA", "AU", "NZ", "GB", "OTHER"];

const CANADA_ZONES = new Set([
  "America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg",
  "America/Halifax", "America/St_Johns", "America/Regina", "America/Whitehorse",
  "America/Yellowknife", "America/Moncton", "America/Goose_Bay", "America/Glace_Bay",
  "America/Iqaluit", "America/Dawson", "America/Dawson_Creek", "America/Cambridge_Bay",
  "America/Inuvik", "America/Creston", "America/Swift_Current", "America/Atikokan",
  "America/Blanc-Sablon", "America/Fort_Nelson", "America/Rankin_Inlet", "America/Resolute",
  "America/Coral_Harbour", "America/Rainy_River",
]);

const US_ZONES = new Set([
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "America/Honolulu", "America/Adak",
  "America/Boise", "America/Detroit", "America/Indiana/Indianapolis",
  "America/Kentucky/Louisville", "America/Juneau", "America/Nome", "America/Sitka",
  "America/Menominee", "America/North_Dakota/Center", "America/Yakutat", "America/Metlakatla",
]);

export function normalizeCountry(raw) {
  const id = String(raw || "").trim().toUpperCase();
  return COUNTRIES.includes(id) ? id : "";
}

export function countryFromTimeZone(tz) {
  const zone = String(tz || "");
  if (zone.startsWith("Australia/")) return "AU";
  if (zone === "Pacific/Auckland" || zone === "Pacific/Chatham") return "NZ";
  if (zone === "Europe/London") return "GB";
  if (zone === "Europe/Paris") return "FR";
  if (zone === "Europe/Berlin" || zone === "Europe/Busingen") return "DE";
  if (CANADA_ZONES.has(zone)) return "CA";
  if (US_ZONES.has(zone)) return "US";
  return "";
}

export function detectCountry() {
  try {
    return countryFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return "";
  }
}

export function minAgeFor(country) {
  const id = normalizeCountry(country);
  if (!id || id === "OTHER") return PROFILE_FLOOR;
  return Math.max(PROFILE_FLOOR, COUNTRY_MIN_AGE[id] || PROFILE_FLOOR);
}

/** The age a new profile must reach for this entry. */
export function requiredAge(country, detected) {
  const seen = minAgeFor(country);
  const fromDevice = detected ? minAgeFor(detected) : 0;
  return Math.max(PROFILE_FLOOR, seen, fromDevice);
}

export function ageIsAllowed(age, country, detected) {
  const n = Number(age);
  if (!Number.isInteger(n) || n > 120) return false;
  return n >= requiredAge(country, detected);
}
