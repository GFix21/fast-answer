#!/usr/bin/env node
/**
 * Fast handoff: Q-and-A generation packs → live Fast Answer banks.
 *
 * Checks every generation is present on the weekly and placement packs
 * (EN / FR / DE), then writes questions.json + questions.{fr,de}.json
 * with the generation tag kept.
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
} from "../q-and-a/map.js";

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
    weekly[loc] = { file: weekFile, pack: readJson(weekFile) };
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

if (issues.length) {
  console.error("handoff blocked:");
  for (const line of issues) console.error(" -", line);
  process.exit(1);
}

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

console.log("=== fast handoff ===");
console.log("generations:", GENERATIONS.join(", "));
for (const loc of LOCALES) {
  const live = writeLive(loc, weekly[loc].pack);
  const placeN = placement[loc].pack.questions.length;
  console.log(`${loc}: weekly ${path.relative(ROOT, weekly[loc].file)}`);
  console.log(`    → ${path.relative(ROOT, live.file)} ${live.exported.length} ${JSON.stringify(live.tiers)}`);
  console.log(`    generations ${JSON.stringify(live.generations)}`);
  console.log(`    placement ${path.relative(ROOT, placement[loc].file)} ${placeN} (already tagged, served as-is)`);
}
