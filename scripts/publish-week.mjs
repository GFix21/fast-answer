#!/usr/bin/env node
/**
 * Publish a Q-and-A (or local) weekly pack into Fast Answer questions.json
 * (+ questions.fr.json / questions.de.json when locale packs exist)
 * and snapshot EN into banks/archive/YYYY-MM/ (America/Toronto month key).
 *
 * Usage:
 *   node scripts/publish-week.mjs [weekKey|path]
 *   node scripts/publish-week.mjs 2026-W39
 *   node scripts/publish-week.mjs ../Q-and-A/banks/weekly/2026-W39.json
 *
 * Maps finale→extreme and studio topic ids → Fast Answer ids.
 * Locale packs: banks/weekly/{fr,de}/<weekKey>.json → current.json + questions.{fr,de}.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportPack, countByTier } from "../q-and-a/map.js";
import {
  archivePublishedWeek,
  torontoMonthKey,
} from "../lib/archive-store.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BANKS = path.join(ROOT, "banks/weekly");
const QANDA = path.resolve(ROOT, "../Q-and-A/banks/weekly");
const LOCALES = ["fr", "de"];

function resolvePack(arg) {
  if (!arg) {
    const cur = path.join(BANKS, "current.json");
    if (fs.existsSync(cur)) return cur;
    arg = "2026-W39";
  }
  if (arg.endsWith(".json") && fs.existsSync(arg)) return path.resolve(arg);
  const local = path.join(BANKS, `${arg}.json`);
  if (fs.existsSync(local)) return local;
  const studio = path.join(QANDA, `${arg}.json`);
  if (fs.existsSync(studio)) return studio;
  throw new Error(`Week pack not found for ${arg}`);
}

function writeWeekLocale(loc, weekKey, pack) {
  const dir = path.join(BANKS, loc);
  fs.mkdirSync(dir, { recursive: true });
  const current = {
    ...pack,
    questions: (pack.questions || []).map((q) => ({
      ...q,
      status: q.status || "pending",
    })),
  };
  fs.writeFileSync(path.join(dir, "current.json"), `${JSON.stringify(current, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, `${weekKey}.json`), `${JSON.stringify(pack, null, 2)}\n`);
  const exported = exportPack(pack);
  fs.writeFileSync(path.join(ROOT, `questions.${loc}.json`), `${JSON.stringify(exported, null, 2)}\n`);
  return { exported, counts: countByTier(exported) };
}

function resolveLocalePack(weekKey, loc) {
  const local = path.join(BANKS, loc, `${weekKey}.json`);
  if (fs.existsSync(local)) return local;
  const studio = path.join(QANDA, loc, `${weekKey}.json`);
  if (fs.existsSync(studio)) return studio;
  return null;
}

const packPath = resolvePack(process.argv[2]);
const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
const exported = exportPack(pack);
const publishedAt = new Date().toISOString();

fs.mkdirSync(BANKS, { recursive: true });
const current = {
  ...pack,
  questions: (pack.questions || []).map((q) => ({
    ...q,
    status: q.status || "pending",
  })),
};
fs.writeFileSync(path.join(BANKS, "current.json"), `${JSON.stringify(current, null, 2)}\n`);
fs.writeFileSync(path.join(ROOT, "questions.json"), `${JSON.stringify(exported, null, 2)}\n`);
const meta = {
  weekKey: pack.weekKey,
  publishedAt,
  source: packPath,
  counts: countByTier(exported),
  questionCount: exported.length,
  wroteToDisk: true,
  locales: { en: countByTier(exported) },
};
fs.writeFileSync(path.join(BANKS, "publish-meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

const archive = archivePublishedWeek(current, {
  publishedAt,
  counts: meta.counts,
  monthKey: torontoMonthKey(publishedAt),
});

console.log("=== publish-week ===");
console.log("source:", packPath);
console.log("weekKey:", pack.weekKey);
console.log("EN counts:", meta.counts);
console.log(`Wrote ${exported.length} → questions.json + banks/weekly/current.json`);
console.log(
  `Archived → banks/archive/${archive.monthKey}/${pack.weekKey}.json` +
    (archive.wroteToDisk ? "" : ` (memory only: ${archive.writeError})`),
);

for (const loc of LOCALES) {
  const locPath = resolveLocalePack(pack.weekKey, loc);
  if (!locPath) {
    console.log(`skip ${loc}: no pack for ${pack.weekKey}`);
    continue;
  }
  const locPack = JSON.parse(fs.readFileSync(locPath, "utf8"));
  // Prefer copying from Q-and-A into banks/weekly/{loc}/ when publishing from studio
  if (locPath.startsWith(QANDA)) {
    fs.mkdirSync(path.join(BANKS, loc), { recursive: true });
    fs.copyFileSync(locPath, path.join(BANKS, loc, `${pack.weekKey}.json`));
  }
  const result = writeWeekLocale(loc, pack.weekKey, locPack);
  meta.locales[loc] = result.counts;
  console.log(`${loc.toUpperCase()}: ${result.exported.length} → questions.${loc}.json (${JSON.stringify(result.counts)})`);
}
fs.writeFileSync(path.join(BANKS, "publish-meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
