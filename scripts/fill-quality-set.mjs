#!/usr/bin/env node
/**
 * Creators fill SET00002 during the 30-hour quality window.
 * Each live fact is asked again in a new wording. Answers stay put.
 * The four-day run does not start until playUntil.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENERATIONS } from "../q-and-a/map.js";
import { checkQuestion } from "../q-and-a/bots/checker.js";
import { rewordPrompt } from "../lib/reword-set.js";
import { FLOW_TIERS, PLACEMENT_N, SET_TARGET } from "../lib/question-flow.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SET_DIR = path.join(ROOT, "banks/flow/27:09:2026-SET00002");
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
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function nextQuestion(q, locale) {
  const prompt = rewordPrompt(q.prompt, locale);
  const row = {
    ...q,
    id: `s2-${q.id}`,
    prompt,
    factKey: q.factKey || q.id,
    addedSet: "SET00002",
    status: "pending",
    technique: q.funny === true ? (q.technique || "misdirection") : (q.technique || null),
  };
  const check = checkQuestion(row);
  if (!check.ok) return { row, reasons: check.reasons };
  if (prompt === q.prompt) return { row, reasons: ["same-prompt"] };
  return { row, reasons: [] };
}

const counts = {};
let blocked = 0;
for (const locale of Object.keys(LIVE)) {
  const live = readJson(LIVE[locale]);
  const byId = new Map(live.map((q) => [q.id, q]));
  const source = locale === "en" ? live : live.map((q) => byId.get(q.id));
  const packs = {};
  for (const g of GENERATIONS) {
    packs[g] = {};
    for (const tier of FLOW_TIERS) packs[g][tier] = [];
  }
  let held = 0;
  for (const q of source) {
    const { row, reasons } = nextQuestion(q, locale);
    if (reasons.length) {
      blocked += 1;
      if (blocked <= 12) console.error(`${locale} ${q.id}: ${reasons.join(", ")}`);
      continue;
    }
    const g = GENERATIONS.includes(row.generation) ? row.generation : "multi-gen";
    const tier = FLOW_TIERS.includes(row.tier) ? row.tier : "easy";
    packs[g][tier].push(row);
    held += 1;
  }
  for (const g of GENERATIONS) {
    for (const tier of FLOW_TIERS) {
      const rows = packs[g][tier];
      writeJson(path.join(SET_DIR, locale, "generations", g, `${tier}.json`), {
        locale,
        generation: g,
        tier,
        set: "SET00002",
        held: rows.length,
        questions: rows,
      });
    }
  }
  const placementRaw = readJson(PLACEMENT[locale]);
  const placementRows = (Array.isArray(placementRaw) ? placementRaw : placementRaw.questions || [])
    .filter((q) => q?.id && q.prompt)
    .slice(0, PLACEMENT_N)
    .map((q) => nextQuestion(q, locale))
    .filter((item) => !item.reasons.length)
    .map((item) => item.row);
  writeJson(path.join(SET_DIR, locale, "placement", "questions.json"), {
    locale,
    set: "SET00002",
    held: placementRows.length,
    target: PLACEMENT_N,
    questions: placementRows,
  });
  counts[locale] = { questions: held, placement: placementRows.length };
  console.log(`${locale}: ${held} pack questions, ${placementRows.length} placement`);
}

const manifestPath = path.join(SET_DIR, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.status = "quality";
manifest.filledAt = new Date().toISOString();
manifest.target = SET_TARGET;
manifest.counts = counts;
manifest.note = "Creators filled this set during the 30-hour quality window. It takes effect on startedAt, then runs 4 days.";
writeJson(manifestPath, manifest);

const ledgerPath = path.join(ROOT, "banks/flow/ledger.json");
const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
const row = ledger.sets.find((s) => s.id === "SET00002");
if (row) {
  row.status = "quality";
  row.counts = counts;
  row.filledAt = manifest.filledAt;
}
writeJson(ledgerPath, ledger);
if (blocked) console.error(`held back ${blocked}`);
console.log("SET00002 filled; still in quality until", manifest.qualityUntil);
