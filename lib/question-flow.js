/**
 * Question sets are banked four days apart.
 * Creators have 30 hours to finish the next set. It then waits in the bank
 * until its play date. Banked sets stay, so later games still have them.
 *
 * Folder: DD:MM:YYYY-SET00001
 *   {locale}/generations/{generation}/{tier}.json
 *   {locale}/placement/questions.json   (30, separate from the packs)
 */

export const FLOW_LOCALES = ["en", "fr-CA", "de"];
export const FLOW_TIERS = ["easy", "hard", "difficult", "extreme"];
export const SET_GAP_DAYS = 4;
export const QUALITY_HOURS = 30;
export const PLACEMENT_N = 30;
export const SET_TARGET = 1050;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function padSetId(index) {
  return `SET${String(index).padStart(5, "0")}`;
}

export function setFolderName(date, index) {
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const id = padSetId(index);
  return { id, folder: `${day}:${month}:${year}-${id}` };
}

export function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * DAY_MS).toISOString();
}

export function addHours(date, hours) {
  return new Date(new Date(date).getTime() + hours * HOUR_MS).toISOString();
}

export function qualityClosesAt(openedAt) {
  return addHours(openedAt, QUALITY_HOURS);
}

/** quality while the 30 hours are open, banked once they close and the packs exist. */
export function setPhase(row, now = Date.now()) {
  if (!row) return "missing";
  if (row.status === "banked") return "banked";
  const until = new Date(row.qualityUntil || 0).getTime();
  if (Number.isFinite(until) && new Date(now).getTime() < until) return "quality";
  return row.questionCount >= SET_TARGET ? "banked" : "late";
}
