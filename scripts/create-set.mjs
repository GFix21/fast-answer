#!/usr/bin/env node
/**
 * Initiate the question-creation pipeline for the next 4-day set.
 *
 *   node scripts/create-set.mjs
 *   node scripts/create-set.mjs --wiki "Marie Curie"
 *   node scripts/create-set.mjs --open-next
 *
 * Sets stay named SET00001, SET00002, and so on.
 * This does not reword an older set and it does not delete a banked folder.
 * --open-next runs only when the latest set already has 1050 questions
 * and 30 placement questions in every language that set carries.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLACEMENT_N, SET_GAP_DAYS, SET_TARGET, addDays, qualityClosesAt, setFolderName } from "../lib/question-flow.js";
import { wikiSummary } from "../lib/wiki-source.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FLOW = path.join(ROOT, "banks/flow");
const LEDGER = path.join(FLOW, "ledger.json");
const args = process.argv.slice(2);
const openNext = args.includes("--open-next");
const wikiAt = args.indexOf("--wiki");
const wikiTitle = wikiAt >= 0 ? args[wikiAt + 1] : "";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

const ledger = readJson(LEDGER);
const sets = Array.isArray(ledger.sets) ? ledger.sets : [];
console.log(`sets every ${ledger.gapDays || SET_GAP_DAYS} days · target ${SET_TARGET} · placement ${PLACEMENT_N}`);
console.log("languages on the ledger:", (ledger.locales || []).join(", ") || "en, fr-CA, de");
console.log("France (fr) plays questions.fr.json. A set switch falls back to Quebec French when that folder has no fr.");
console.log("Wikipedia is a lookup (--wiki \"Title\"), not a writer. Do not put the answer in the question.");

let latest = null;
for (const row of sets) {
  const counts = row.counts || {};
  const langs = Object.keys(counts);
  const packShort = langs.filter((loc) => (counts[loc]?.questions || 0) < SET_TARGET);
  const placeShort = langs.filter((loc) => (counts[loc]?.placement || 0) < PLACEMENT_N);
  const line = langs.map((loc) => `${loc} ${counts[loc]?.questions || 0}/${SET_TARGET} place ${counts[loc]?.placement || 0}`).join(" · ");
  console.log(`${row.id} ${row.folder} ${row.status || ""} ${line || "no counts"}`);
  if (row.id === "SET00002") console.log("  SET00002 rewords SET00001. Later sets must change the fact, not just the wording.");
  if (packShort.length || placeShort.length) console.log(`  still short: pack ${packShort.join(", ") || "—"} · placement ${placeShort.join(", ") || "—"}`);
  latest = row;
}

if (wikiTitle) {
  const page = await wikiSummary(wikiTitle, "en");
  console.log(`wiki ${page.title}`);
  console.log(page.extract);
  console.log(page.url);
}

if (!openNext) {
  console.log("to open the next empty quality folder after a full set: node scripts/create-set.mjs --open-next");
  process.exit(0);
}

if (!latest) {
  console.error("no set on the ledger");
  process.exit(1);
}
const counts = latest.counts || {};
const langs = Object.keys(counts);
const full = langs.length > 0
  && langs.every((loc) => (counts[loc]?.questions || 0) >= SET_TARGET && (counts[loc]?.placement || 0) >= PLACEMENT_N);
if (!full) {
  console.error(`${latest.id} is not full. Finish ${SET_TARGET} and ${PLACEMENT_N} placement in each language before opening another set.`);
  process.exit(1);
}
const index = sets.length + 1;
const playAt = addDays(latest.playUntil || latest.startedAt, latest.playUntil ? 0 : SET_GAP_DAYS);
const named = setFolderName(playAt, index);
const dir = path.join(FLOW, named.folder);
if (fs.existsSync(path.join(dir, "manifest.json"))) {
  console.error(`${named.folder} already exists`);
  process.exit(1);
}
const now = new Date();
const manifest = {
  id: named.id,
  folder: named.folder,
  startedAt: playAt,
  playUntil: addDays(playAt, SET_GAP_DAYS),
  qualityHours: ledger.qualityHours || 30,
  qualityOpenedAt: now.toISOString(),
  qualityUntil: qualityClosesAt(now.toISOString()),
  status: "quality",
  locales: ledger.locales || langs,
  target: SET_TARGET,
  placementTarget: PLACEMENT_N,
  counts: Object.fromEntries((ledger.locales || langs).map((loc) => [loc, { questions: 0, placement: 0 }])),
  note: "New facts only. Not a reword. Creators fill 1050 and 30 placement questions in each language before qualityUntil.",
};
writeJson(path.join(dir, "manifest.json"), manifest);
ledger.sets.push({
  id: named.id,
  folder: named.folder,
  startedAt: playAt,
  playUntil: manifest.playUntil,
  qualityUntil: manifest.qualityUntil,
  status: "quality",
  counts: manifest.counts,
});
writeJson(LEDGER, ledger);
console.log(`opened ${named.folder} until ${manifest.qualityUntil}`);
