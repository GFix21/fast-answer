/**
 * A set can be edited only during its 30-hour quality window.
 * It is not dealt until the play date, and it stays frozen while it plays.
 * Questions with no set id are the current show and stay dealable.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setPhase } from "./question-flow.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let cache = null;

function questionCountOf(row) {
  if (Number.isInteger(Number(row?.questionCount))) return Number(row.questionCount);
  const en = Number(row?.counts?.en?.questions);
  return Number.isInteger(en) ? en : 0;
}

export function listSetManifests() {
  if (cache) return cache;
  const dir = path.join(ROOT, "banks/flow");
  const rows = [];
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
      const manifestPath = path.join(dir, name, "manifest.json");
      if (!fs.existsSync(manifestPath)) continue;
      try {
        rows.push(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
      } catch { /* skip a broken folder */ }
    }
  }
  cache = rows;
  return rows;
}

export function manifestForSet(setId) {
  const want = String(setId || "");
  if (!want) return null;
  return listSetManifests().find((row) => row.id === want || row.folder === want) || null;
}

/** quality, late, frozen (waiting for the play date), live, or archived. */
export function contentWindow(row, now = Date.now()) {
  if (!row) return "live";
  const phase = setPhase({
    status: row.status,
    qualityUntil: row.qualityUntil,
    questionCount: questionCountOf(row),
  }, now);
  if (phase === "quality") return "quality";
  if (phase === "late") return "late";
  const t = new Date(now).getTime();
  const start = new Date(row.startedAt || 0).getTime();
  const end = new Date(row.playUntil || 0).getTime();
  if (Number.isFinite(start) && start > 0 && t < start) return "frozen";
  if (Number.isFinite(end) && end > 0 && t >= end) return "archived";
  return "live";
}

export function editsOpen(row, now = Date.now()) {
  return contentWindow(row, now) === "quality";
}

export function dealOpen(row, now = Date.now()) {
  const window = contentWindow(row, now);
  return window === "live" || window === "archived";
}

export function setIdOf(q) {
  return String(q?.addedSet || q?.set || "");
}

export function editsOpenForQuestion(q, now = Date.now()) {
  const row = manifestForSet(setIdOf(q));
  if (!row) return true;
  return editsOpen(row, now);
}

export function questionDealable(q, now = Date.now()) {
  const row = manifestForSet(setIdOf(q));
  if (!row) return true;
  return dealOpen(row, now);
}
