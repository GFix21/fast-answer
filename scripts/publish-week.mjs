#!/usr/bin/env node
/**
 * Publish a Q-and-A (or local) weekly pack into Fast Answer questions.json.
 *
 * Usage:
 *   node scripts/publish-week.mjs [weekKey|path]
 *   node scripts/publish-week.mjs 2026-W39
 *   node scripts/publish-week.mjs ../Q-and-A/banks/weekly/2026-W39.json
 *
 * Maps finale→extreme and studio topic ids → Fast Answer ids.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportPack, countByTier } from "../q-and-a/map.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BANKS = path.join(ROOT, "banks/weekly");
const QANDA = path.resolve(ROOT, "../Q-and-A/banks/weekly");

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

const packPath = resolvePack(process.argv[2]);
const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
const exported = exportPack(pack);

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
  publishedAt: new Date().toISOString(),
  source: packPath,
  counts: countByTier(exported),
  questionCount: exported.length,
  wroteToDisk: true,
};
fs.writeFileSync(path.join(BANKS, "publish-meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

console.log("=== publish-week ===");
console.log("source:", packPath);
console.log("weekKey:", pack.weekKey);
console.log("counts:", meta.counts);
console.log(`Wrote ${exported.length} → questions.json + banks/weekly/current.json`);
