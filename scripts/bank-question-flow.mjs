#!/usr/bin/env node
/**
 * Bank the live set, then open the next set for a 30-hour quality pass.
 * Run again later: a finished quality set is locked, and the set four days
 * after it is opened. Banked folders are never removed.
 *
 *   node scripts/bank-question-flow.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENERATIONS } from "../q-and-a/map.js";
import {
  FLOW_LOCALES,
  FLOW_TIERS,
  PLACEMENT_N,
  QUALITY_HOURS,
  SET_GAP_DAYS,
  SET_TARGET,
  addDays,
  qualityClosesAt,
  setFolderName,
  setPhase,
} from "../lib/question-flow.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FLOW = path.join(ROOT, "banks/flow");
const LEDGER = path.join(FLOW, "ledger.json");
const LIVE = {
  en: "questions.json",
  "fr-CA": "questions.fr-CA.json",
  de: "questions.de.json",
};
const PLACEMENT = {
  en: "banks/placement/generational-first-pass.json",
  "fr-CA": "banks/placement/fr-CA/generational-first-pass.json",
  de: "banks/placement/de/generational-first-pass.json",
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}
function tierOf(q) {
  const tier = q?.tier === "finale" ? "extreme" : q?.tier;
  return FLOW_TIERS.includes(tier) ? tier : "easy";
}
function generationOf(q) {
  return GENERATIONS.includes(q?.generation) ? q.generation : "multi-gen";
}

function splitPacks(questions) {
  const packs = {};
  for (const g of GENERATIONS) {
    packs[g] = {};
    for (const tier of FLOW_TIERS) packs[g][tier] = [];
  }
  for (const q of questions || []) {
    if (!q?.id || !q.prompt) continue;
    packs[generationOf(q)][tierOf(q)].push(q);
  }
  return packs;
}

function writeLocale(dir, locale, questions, placement) {
  const packs = splitPacks(questions);
  let held = 0;
  for (const g of GENERATIONS) {
    for (const tier of FLOW_TIERS) {
      const rows = packs[g][tier];
      held += rows.length;
      writeJson(path.join(dir, locale, "generations", g, `${tier}.json`), {
        locale,
        generation: g,
        tier,
        held: rows.length,
        questions: rows,
      });
    }
  }
  const test = (placement || []).filter((q) => q?.id && q.prompt).slice(0, PLACEMENT_N);
  writeJson(path.join(dir, locale, "placement", "questions.json"), {
    locale,
    held: test.length,
    target: PLACEMENT_N,
    questions: test,
  });
  return { questions: held, placement: test.length };
}

function bankLiveSet(folder, startedAt) {
  const dir = path.join(FLOW, folder);
  const counts = {};
  for (const locale of FLOW_LOCALES) {
    const questions = readJson(path.join(ROOT, LIVE[locale]));
    const placement = readJson(path.join(ROOT, PLACEMENT[locale]));
    const rows = Array.isArray(placement) ? placement : placement.questions;
    counts[locale] = writeLocale(dir, locale, questions, rows);
  }
  const opened = startedAt;
  writeJson(path.join(dir, "manifest.json"), {
    id: "SET00001",
    folder,
    startedAt,
    playUntil: addDays(startedAt, SET_GAP_DAYS),
    qualityHours: QUALITY_HOURS,
    qualityUntil: qualityClosesAt(opened),
    status: "banked",
    locales: FLOW_LOCALES,
    target: SET_TARGET,
    placementTarget: PLACEMENT_N,
    counts,
  });
  return counts;
}

function openQualitySet(index, playAt, now) {
  const { id, folder } = setFolderName(playAt, index);
  const dir = path.join(FLOW, folder);
  const manifestPath = path.join(dir, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    const existing = readJson(manifestPath);
    return {
      id: existing.id || id,
      folder,
      qualityUntil: existing.qualityUntil,
      status: existing.status || "quality",
    };
  }
  const until = qualityClosesAt(now);
  writeJson(manifestPath, {
    id,
    folder,
    startedAt: playAt,
    playUntil: addDays(playAt, SET_GAP_DAYS),
    qualityHours: QUALITY_HOURS,
    qualityOpenedAt: new Date(now).toISOString(),
    qualityUntil: until,
    status: "quality",
    locales: FLOW_LOCALES,
    target: SET_TARGET,
    placementTarget: PLACEMENT_N,
    note: "Creators fill generations and the 30-question placement folder before qualityUntil. The set stays banked for later games.",
  });
  return { id, folder, qualityUntil: until, status: "quality" };
}

const liveStart = "2026-09-23T00:00:00.000Z";
const first = setFolderName(liveStart, 1);
const counts = bankLiveSet(first.folder, liveStart);
const now = new Date();
const nextPlay = addDays(liveStart, SET_GAP_DAYS);
const next = openQualitySet(2, nextPlay, now);

const ledger = {
  gapDays: SET_GAP_DAYS,
  qualityHours: QUALITY_HOURS,
  locales: FLOW_LOCALES,
  placementTarget: PLACEMENT_N,
  setTarget: SET_TARGET,
  kept: true,
  sets: [
    {
      id: first.id,
      folder: first.folder,
      startedAt: liveStart,
      playUntil: nextPlay,
      status: "banked",
      counts,
    },
    next,
  ],
};
writeJson(LEDGER, ledger);

const phase = setPhase(next, now);
console.log(`banked ${first.folder}`);
for (const locale of FLOW_LOCALES) {
  const row = counts[locale];
  console.log(`  ${locale}: ${row.questions} pack questions, ${row.placement} placement`);
}
console.log(`next ${next.folder} is ${phase} until ${next.qualityUntil}`);
console.log("banked sets stay for future games");
