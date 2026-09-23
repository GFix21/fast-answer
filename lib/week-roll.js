/**
 * A week holds 150 questions for each of the 7 generations (1050).
 * A full week stays in that month's folder. New questions open the next week.
 */

export const PACK_TARGET = 150;
export const GENERATION_COUNT = 7;
export const WEEK_TARGET = PACK_TARGET * GENERATION_COUNT;

const TZ = "America/Toronto";

export function parseIsoWeek(weekKey) {
  const match = /^(\d{4})-W(\d{2})$/.exec(String(weekKey || ""));
  if (!match) return null;
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;
  return { year: Number(match[1]), week };
}

export function formatIsoWeek(year, week) {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Monday 00:00 UTC of an ISO week. */
export function mondayOfIsoWeek(weekKey) {
  const parsed = parseIsoWeek(weekKey);
  if (!parsed) return null;
  const jan4 = new Date(Date.UTC(parsed.year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (parsed.week - 1) * 7);
  return monday;
}

export function thursdayOfIsoWeek(weekKey) {
  const monday = mondayOfIsoWeek(weekKey);
  if (!monday) return null;
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  return thursday;
}

export function nextIsoWeek(weekKey) {
  const thursday = thursdayOfIsoWeek(weekKey);
  if (!thursday) return weekKey;
  const nextThursday = new Date(thursday);
  nextThursday.setUTCDate(thursday.getUTCDate() + 7);
  const isoYear = isoWeekYear(nextThursday);
  const week = isoWeekNumber(nextThursday, isoYear);
  return formatIsoWeek(isoYear, week);
}

function isoWeekYear(date) {
  const thursday = new Date(date);
  return thursday.getUTCFullYear();
}

function isoWeekNumber(thursday, isoYear) {
  const start = new Date(Date.UTC(isoYear, 0, 4));
  const startDay = start.getUTCDay() || 7;
  const week1Monday = new Date(start);
  week1Monday.setUTCDate(start.getUTCDate() - (startDay - 1));
  const monday = new Date(thursday);
  monday.setUTCDate(thursday.getUTCDate() - 3);
  const diff = Math.round((monday - week1Monday) / 86400000);
  return Math.floor(diff / 7) + 1;
}

/** Month folder (YYYY-MM) for the Thursday of that ISO week, America/Toronto. */
export function monthKeyForWeek(weekKey) {
  const thursday = thursdayOfIsoWeek(weekKey);
  if (!thursday) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(thursday);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

/** Stay on this week until it holds WEEK_TARGET questions, then open the next. */
export function openWeekKey(weekKey, count) {
  if (Number(count) >= WEEK_TARGET) return nextIsoWeek(weekKey);
  return weekKey;
}

export function weekIsFull(count) {
  return Number(count) >= WEEK_TARGET;
}
