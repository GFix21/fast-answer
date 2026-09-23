#!/usr/bin/env node
/**
 * Fast handoff: Q-and-A generation packs → live Fast Answer banks.
 *
 * Checks every generation is present on the weekly and placement packs
 * (EN / FR / DE), then writes questions.json + questions.{fr,de}.json
 * with the generation tag kept. Also writes one generation pack file per
 * generation (target 150). A shortfall is recorded; it does not block handoff.
 *
 *   npm run handoff
 *   node scripts/handoff.mjs
 *
 * If ../Q-and-A/banks exists, those files win. Otherwise the packs already
 * in banks/weekly and banks/placement are the source.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GENERATIONS,
  exportPack,
  countByTier,
  countByGeneration,
  generationIssues,
  normalizeGeneration,
  ageBracketsForGeneration,
  bracketsSendingTo,
  playableAges,
  GENERATION_BORN,
  AGE_REFERENCE_YEAR,
} from "../q-and-a/map.js";
import { buildGenerationPacks, packSummary, PACK_TARGET } from "../lib/generation-packs.js";
import { reviewForChildren } from "../lib/safeguard.js";
import { isoWeek, weeklyComedyReview } from "../lib/crackd-kerr.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QANDA = path.resolve(ROOT, "../Q-and-A/banks");
const LOCALES = ["en", "fr", "de"];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function firstExisting(paths) {
  return paths.find((p) => p && fs.existsSync(p)) || null;
}

function weeklyPath(locale) {
  const name = locale === "en" ? "current.json" : path.join(locale, "current.json");
  return firstExisting([
    path.join(QANDA, "weekly", name),
    path.join(ROOT, "banks/weekly", name),
  ]);
}

function placementPath(locale) {
  const name = locale === "en"
    ? "generational-first-pass.json"
    : path.join(locale, "generational-first-pass.json");
  return firstExisting([
    path.join(QANDA, "placement", name),
    path.join(ROOT, "banks/placement", name),
  ]);
}

function funnyPack(locale) {
  const file = path.join(ROOT, "banks/gen-alpha", `${locale}.json`);
  if (!fs.existsSync(file)) return [];
  const pack = readJson(file);
  return Array.isArray(pack.questions) ? pack.questions : [];
}

function localeAlignIssues(enQs, otherQs, label) {
  const issues = [];
  const en = new Map((enQs || []).map((q) => [q.id, normalizeGeneration(q.generation)]));
  const seen = new Set();
  for (const q of otherQs || []) {
    seen.add(q.id);
    if (!en.has(q.id)) {
      issues.push(`${label}: extra id ${q.id}`);
      continue;
    }
    const g = normalizeGeneration(q.generation);
    if (g !== en.get(q.id)) issues.push(`${label}: ${q.id} generation ${g} ≠ EN ${en.get(q.id)}`);
  }
  for (const id of en.keys()) {
    if (!seen.has(id)) issues.push(`${label}: missing EN id ${id}`);
  }
  return issues;
}

const issues = [];
const weekly = {};
const placement = {};

for (const loc of LOCALES) {
  const weekFile = weeklyPath(loc);
  const placeFile = placementPath(loc);
  if (!weekFile) issues.push(`${loc}: weekly pack missing`);
  else {
    const pack = readJson(weekFile);
    pack.questions = [...(pack.questions || []), ...funnyPack(loc)];
    weekly[loc] = { file: weekFile, pack };
    for (const line of generationIssues(weekly[loc].pack.questions)) {
      issues.push(`${loc} weekly: ${line}`);
    }
  }
  if (!placeFile) issues.push(`${loc}: placement pack missing`);
  else {
    placement[loc] = { file: placeFile, pack: readJson(placeFile) };
    const required = placement[loc].pack.generations?.length
      ? placement[loc].pack.generations.map(normalizeGeneration)
      : GENERATIONS;
    for (const line of generationIssues(placement[loc].pack.questions, { required })) {
      issues.push(`${loc} placement: ${line}`);
    }
  }
}

if (weekly.en && weekly.fr) {
  issues.push(...localeAlignIssues(weekly.en.pack.questions, weekly.fr.pack.questions, "fr weekly"));
}
if (weekly.en && weekly.de) {
  issues.push(...localeAlignIssues(weekly.en.pack.questions, weekly.de.pack.questions, "de weekly"));
}
if (placement.en && placement.fr) {
  issues.push(...localeAlignIssues(placement.en.pack.questions, placement.fr.pack.questions, "fr placement"));
}
if (placement.en && placement.de) {
  issues.push(...localeAlignIssues(placement.en.pack.questions, placement.de.pack.questions, "de placement"));
}

const comedyWeek = isoWeek();
const comedyReport = { week: comedyWeek, bot: "Crack'd Kerr", safeguard: "Safeguard", locales: {} };
for (const loc of LOCALES) {
  const questions = weekly[loc]?.pack?.questions || [];
  for (const q of questions) {
    if (normalizeGeneration(q.generation) !== "gen-alpha" && q.funny !== true) continue;
    const safety = reviewForChildren(q);
    if (!safety.ok) issues.push(`${loc} ${q.id}: Safeguard blocked (${safety.reasons.join(", ")})`);
  }
  comedyReport.locales[loc] = weeklyComedyReview(questions, { week: comedyWeek });
  for (const row of comedyReport.locales[loc].blocked) {
    issues.push(`${loc} ${row.id}: Crack'd Kerr skipped a blocked joke`);
  }
  for (const row of comedyReport.locales[loc].weak) {
    issues.push(`${loc} ${row.id}: Crack'd Kerr held a weak joke (${row.rating})`);
  }
}

if (issues.length) {
  console.error("handoff blocked:");
  for (const line of issues) console.error(" -", line);
  process.exit(1);
}

fs.mkdirSync(path.join(ROOT, "banks/comedy"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "banks/comedy", `${comedyWeek}.json`),
  `${JSON.stringify(comedyReport, null, 2)}\n`,
);
console.log(`comedy review banks/comedy/${comedyWeek}.json by Crack'd Kerr`);

function writeLive(locale, pack) {
  const exported = exportPack(pack);
  const file = locale === "en"
    ? path.join(ROOT, "questions.json")
    : path.join(ROOT, `questions.${locale}.json`);
  fs.writeFileSync(file, `${JSON.stringify(exported, null, 2)}\n`);
  const liveIssues = generationIssues(exported);
  if (liveIssues.length) {
    console.error(`live ${locale} still invalid:`);
    for (const line of liveIssues) console.error(" -", line);
    process.exit(1);
  }
  return { file, exported, tiers: countByTier(exported), generations: countByGeneration(exported) };
}

function writeGenerationPacks(locale, questions) {
  const packs = buildGenerationPacks(questions);
  const summary = packSummary(packs);
  const dir = path.join(ROOT, "banks/generation", locale);
  fs.mkdirSync(dir, { recursive: true });
  const shortfall = {};
  for (const g of GENERATIONS) {
    const held = packs[g].length;
    shortfall[g] = PACK_TARGET - held;
    const body = {
      generation: g,
      locale,
      target: PACK_TARGET,
      held,
      shortfall: PACK_TARGET - held,
      ageYear: AGE_REFERENCE_YEAR,
      born: GENERATION_BORN[g] || null,
      ageBrackets: ageBracketsForGeneration(g),
      sendsFor: bracketsSendingTo(g),
      playableAges: playableAges(g),
      questions: packs[g],
    };
    fs.writeFileSync(path.join(dir, `${g}.json`), `${JSON.stringify(body, null, 2)}\n`);
  }
  return { ...summary, shortfall };
}

console.log("=== fast handoff ===");
console.log("generations:", GENERATIONS.join(", "));
const manifest = {
  target: PACK_TARGET,
  ageYear: AGE_REFERENCE_YEAR,
  ages: Object.fromEntries(GENERATIONS.map((g) => [g, ageBracketsForGeneration(g)])),
  sendsFor: Object.fromEntries(GENERATIONS.map((g) => [g, bracketsSendingTo(g)])),
  locales: {},
};
for (const loc of LOCALES) {
  const live = writeLive(loc, weekly[loc].pack);
  const packs = writeGenerationPacks(loc, live.exported);
  manifest.locales[loc] = {
    held: packs.held,
    targetEach: PACK_TARGET,
    counts: packs.counts,
    shortfall: packs.shortfall,
  };
  const placeN = placement[loc].pack.questions.length;
  console.log(`${loc}: weekly ${path.relative(ROOT, weekly[loc].file)}`);
  console.log(`    → ${path.relative(ROOT, live.file)} ${live.exported.length} ${JSON.stringify(live.tiers)}`);
  console.log(`    generations ${JSON.stringify(live.generations)}`);
  console.log(`    generation packs banks/generation/${loc}/ target ${PACK_TARGET} held ${packs.held} shortfall ${JSON.stringify(packs.shortfall)}`);
  console.log(`    placement ${path.relative(ROOT, placement[loc].file)} ${placeN} (already tagged, served as-is)`);
}
fs.mkdirSync(path.join(ROOT, "banks/generation"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "banks/generation/manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`manifest banks/generation/manifest.json target ${PACK_TARGET} per generation (shortfall is expected until Q&A fills the packs)`);
