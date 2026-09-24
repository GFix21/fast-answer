#!/usr/bin/env node
/**
 * Open SET00003 with new questions only. Nothing is reworded from an older set.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENERATIONS } from "../q-and-a/map.js";
import { checkQuestion } from "../q-and-a/bots/checker.js";
import { set3Facts } from "../q-and-a/bots/set3-facts.js";
import { moreSet3Facts } from "../q-and-a/bots/set3-more.js";
import { restSet3Facts } from "../q-and-a/bots/set3-rest.js";
import { padSet3Facts } from "../q-and-a/bots/set3-pad.js";
import { FLOW_TIERS, PLACEMENT_N, QUALITY_HOURS, SET_GAP_DAYS, SET_TARGET, addDays, qualityClosesAt, setFolderName } from "../lib/question-flow.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "fr-CA", "de"];
const PLAY = "2026-10-01T00:00:00.000Z";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}
function norm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

const GENERIC = new Set("what which where when who whom whose this that with from have does into about most closely associated called right after comes come directly person people country city state province capital year play wrote written chemical symbol atomic number colour color month group baby national summer winter games olympic olympics hosted host between main language currency formula opposite letter code served airport family instrument includes usually typical standard human body first modern which quelle quelle".split(" "));
function content(s) {
  return norm(s).split(" ").filter((w) => w.length > 3 && !GENERIC.has(w));
}
const bank = [];
for (const file of ["questions.json", "questions.fr-CA.json", "questions.de.json"]) {
  for (const q of readJson(path.join(ROOT, file))) {
    bank.push({
      prompt: norm(q.prompt),
      blob: norm(`${q.prompt} ${q.choices.join(" ")}`),
      answer: norm(q.choices[q.correctIndex]),
    });
  }
}
function sameFact(prompt, answer) {
  const words = content(prompt);
  const ans = norm(typeof answer === "string" ? answer : answer.en);
  if (!words.length) return false;
  return bank.some((ex) => words.every((w) => ex.blob.includes(w)) && (ex.answer === ans || ex.blob.includes(ans)));
}

const seen = new Set();
const fresh = [];
for (const row of [...set3Facts(), ...moreSet3Facts(), ...restSet3Facts(), ...padSet3Facts()]) {
  const prompt = row.text.en.prompt;
  const key = norm(prompt);
  const correct = row.text.en.choices[0];
  if (seen.has(row.slug) || seen.has(key) || bank.some((ex) => ex.prompt === key) || sameFact(prompt, correct)) continue;
  seen.add(row.slug);
  seen.add(key);
  fresh.push(row);
}

function toLocale(row, locale, id) {
  const text = row.text[locale];
  return {
    id,
    tier: row.tier,
    topic: row.topic,
    generation: row.generation,
    categoryTitle: text.categoryTitle,
    prompt: text.prompt,
    choices: text.choices,
    correctIndex: 0,
    banterHint: text.banterHint,
    funny: false,
    structure: row.structure || null,
    addedSet: "SET00003",
    status: "pending",
    sources: [{ label: "Fast Answer creators — SET00003" }],
  };
}

const placement = [];
const packRows = [];
for (const row of fresh) {
  if (placement.length < PLACEMENT_N && (row.tier === "easy" || row.tier === "hard")) placement.push(row);
  else packRows.push(row);
}

const buckets = {};
for (const g of GENERATIONS) {
  buckets[g] = {};
  for (const tier of FLOW_TIERS) buckets[g][tier] = [];
}
const cursor = Object.fromEntries(FLOW_TIERS.map((t) => [t, 0]));
for (const row of packRows) {
  const tier = FLOW_TIERS.includes(row.tier) ? row.tier : "easy";
  const g = GENERATIONS[cursor[tier] % GENERATIONS.length];
  cursor[tier] += 1;
  row.generation = g;
  buckets[g][tier].push(row);
}
placement.forEach((row, i) => {
  row.generation = GENERATIONS[i % GENERATIONS.length];
});

const named = setFolderName(PLAY, 3);
const dir = path.join(ROOT, "banks/flow", named.folder);
let blocked = 0;
const counts = {};
for (const locale of LOCALES) {
  let held = 0;
  for (const g of GENERATIONS) {
    for (const tier of FLOW_TIERS) {
      const questions = [];
      for (const row of buckets[g][tier]) {
        const q = toLocale(row, locale, `s3-${row.slug}`);
        const check = checkQuestion(q);
        if (!check.ok) {
          blocked += 1;
          if (blocked <= 15) console.error(`${locale} ${q.id}: ${check.reasons.join(", ")}`);
          continue;
        }
        questions.push(q);
        held += 1;
      }
      writeJson(path.join(dir, locale, "generations", g, `${tier}.json`), {
        locale, generation: g, tier, set: "SET00003", held: questions.length, questions,
      });
    }
  }
  const tests = [];
  for (const row of placement) {
    const q = toLocale(row, locale, `place-s3-${row.slug}`);
    const check = checkQuestion(q);
    if (!check.ok) continue;
    tests.push(q);
  }
  writeJson(path.join(dir, locale, "placement", "questions.json"), {
    locale, set: "SET00003", held: tests.length, target: PLACEMENT_N, questions: tests,
  });
  counts[locale] = { questions: held, placement: tests.length };
  console.log(`${locale}: ${held} new pack questions, ${tests.length} placement`);
}

const now = new Date();
const manifest = {
  id: named.id,
  folder: named.folder,
  startedAt: PLAY,
  playUntil: addDays(PLAY, SET_GAP_DAYS),
  qualityHours: QUALITY_HOURS,
  qualityOpenedAt: now.toISOString(),
  qualityUntil: qualityClosesAt(now),
  status: "quality",
  locales: LOCALES,
  target: SET_TARGET,
  placementTarget: PLACEMENT_N,
  counts,
  note: "New questions only. Not a reword of an older set. Quality window is open before the four-day run.",
};
writeJson(path.join(dir, "manifest.json"), manifest);

const ledgerPath = path.join(ROOT, "banks/flow/ledger.json");
const ledger = readJson(ledgerPath);
const existing = ledger.sets.find((s) => s.id === "SET00003");
const entry = {
  id: named.id,
  folder: named.folder,
  startedAt: PLAY,
  playUntil: manifest.playUntil,
  qualityUntil: manifest.qualityUntil,
  status: "quality",
  counts,
};
if (existing) Object.assign(existing, entry);
else ledger.sets.push(entry);
writeJson(ledgerPath, ledger);
console.log(`${named.folder} opened in quality until ${manifest.qualityUntil}`);
if (blocked) console.error(`held back ${blocked}`);
console.log(`target ${SET_TARGET}; creators filed ${counts.en.questions} new questions`);
