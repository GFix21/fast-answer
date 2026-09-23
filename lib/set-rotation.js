/**
 * The live 1050-question set stays up for 4 days.
 * The creator pipeline should have the next set ready after 2 days.
 * One archive click, once the 4 days are up, gzips this set into
 * year / month / week and lets a ready set take its place.
 * A fact may return only when the prompt is reworded, and at most 5 times in 2 years.
 */

import { formatIsoWeek } from "./week-roll.js";
import { normPrompt } from "../q-and-a/bots/dupe.js";

export const SET_DAYS = 4;
export const READY_DAYS = 2;
export const REPEAT_MAX = 5;
export const REPEAT_YEARS = 2;

const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365.25 * DAY_MS;

export function setWindow(startedAt, now = Date.now()) {
  const start = new Date(startedAt).getTime();
  const readyAt = start + READY_DAYS * DAY_MS;
  const switchAt = start + SET_DAYS * DAY_MS;
  const t = new Date(now).getTime();
  return {
    startedAt: new Date(start).toISOString(),
    readyAt: new Date(readyAt).toISOString(),
    switchAt: new Date(switchAt).toISOString(),
    ready: t >= readyAt,
    due: t >= switchAt,
  };
}

export function isoWeekKey(date) {
  const src = new Date(date);
  const d = new Date(Date.UTC(src.getUTCFullYear(), src.getUTCMonth(), src.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((d - yearStart) / DAY_MS) + 1) / 7);
  return formatIsoWeek(year, week);
}

/** Four-day set lives in that calendar week, under its month, under its year. */
export function folderFor(date) {
  const d = new Date(date);
  const year = String(d.getUTCFullYear());
  const month = `${year}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const week = isoWeekKey(d);
  return {
    year,
    month,
    week,
    rel: `banks/sets/${year}/${month}/${week}`,
  };
}

/** Which folder boundary a new set crosses: set, week, month, or year. */
export function rollupLevel(prevDate, nextDate) {
  const prev = folderFor(prevDate);
  const next = folderFor(nextDate);
  if (prev.year !== next.year) return "year";
  if (prev.month !== next.month) return "month";
  if (prev.week !== next.week) return "week";
  return "set";
}

/**
 * keep — 4 days are not up.
 * wait — this set was already archived and no replacement is ready.
 * archive-only — gzip the live questions; leave them in play because nothing is ready.
 * switch — gzip, then the ready set takes the live files.
 */
export function archiveDecision(marker, now = Date.now(), { hasReady = false } = {}) {
  const window = setWindow(marker?.startedAt, now);
  const folder = folderFor(marker?.startedAt || now);
  if (marker?.archivedAt && !hasReady) return { action: "wait", ...window, folder };
  if (!window.due) return { action: "keep", ...window, folder };
  if (!hasReady) return { action: "archive-only", ...window, folder };
  return { action: "switch", ...window, folder };
}

export function pipelineStatus(marker, now = Date.now(), { hasReady = false } = {}) {
  if (!marker?.startedAt) return "creator pipeline has no live set";
  const window = setWindow(marker.startedAt, now);
  const decision = archiveDecision(marker, now, { hasReady });
  if (decision.action === "switch") return `switch is due; a ready set can take the place of ${marker.id || "the live set"}`;
  if (decision.action === "archive-only") return `archive is due for ${marker.id || "the live set"}; no ready set, so the live questions stay`;
  if (decision.action === "wait") return `set ${marker.id || ""} is archived; the creator pipeline still owes the next 1050`;
  if (window.ready && hasReady) return `next set is ready; it takes over on ${window.switchAt}`;
  if (window.ready) return `creator pipeline should have the next 1050 ready since ${window.readyAt}; switch ${window.switchAt}`;
  return `live set ${marker.id || ""} until ${window.switchAt}; next set should be ready ${window.readyAt}`;
}

function useTime(q, now) {
  const raw = q?.usedAt || q?.at || q?.addedAt;
  const t = raw ? new Date(raw).getTime() : now;
  return Number.isFinite(t) ? t : now;
}

/** Reworded repeats of a factKey, at most REPEAT_MAX in REPEAT_YEARS. Identical prompts are never allowed. */
export function factRepeatIssues(incoming, history = [], now = Date.now()) {
  const cutoff = new Date(now).getTime() - REPEAT_YEARS * YEAR_MS;
  const byFact = new Map();
  const consider = (q) => {
    if (!q?.factKey) return;
    const at = useTime(q, now);
    if (at < cutoff) return;
    const list = byFact.get(q.factKey) || [];
    list.push(normPrompt(q.prompt));
    byFact.set(q.factKey, list);
  };
  for (const q of history || []) consider(q);
  const issues = [];
  for (const q of incoming || []) {
    if (!q?.factKey) continue;
    const prompt = normPrompt(q.prompt);
    const list = byFact.get(q.factKey) || [];
    const same = list.some((prior) => prior === prompt);
    if (same || list.length >= REPEAT_MAX) {
      issues.push({ id: q.id, factKey: q.factKey, uses: list.length, reworded: !same });
    } else {
      list.push(prompt);
      byFact.set(q.factKey, list);
    }
  }
  return issues;
}
