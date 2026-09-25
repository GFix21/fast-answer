#!/usr/bin/env node
/** Write the 14 opposite lockdown sets from each locale's difficult bank. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCKDOWN_GENERATION, LOCKDOWN_PAIRS, lockdownSetPath } from "../lib/lockdown-sets.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "fr", "fr-CA", "de"];
const TAKE = {
  "silent-generation": 10,
  "gen-alpha": 10,
  "baby-boomer": 10,
  "gen-z": 10,
  "gen-y": 10,
  "multi-gen": 5,
  "gen-x": 15,
};

function readDifficult(locale, generation) {
  const file = path.join(ROOT, "banks/generation", locale, "tiers", generation, "difficult.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return (data.questions || []).filter((q) => q && q.prompt && Array.isArray(q.choices) && q.choices.length >= 2
    && q.funny !== true && q.humorous !== true && q.structure !== "joke");
}

function buildLocale(locale) {
  const pools = {};
  for (const generation of Object.keys(TAKE)) {
    const list = readDifficult(locale, generation);
    if (list.length < TAKE[generation]) {
      throw new Error(`${locale} ${generation} has ${list.length}, need ${TAKE[generation]}`);
    }
    pools[generation] = list;
  }
  const used = new Set();
  function take(generation, n) {
    const out = [];
    for (const q of pools[generation]) {
      if (out.length >= n) break;
      if (used.has(q.id)) continue;
      used.add(q.id);
      out.push(q);
    }
    if (out.length < n) throw new Error(`${locale} ${generation} ran out at ${out.length}`);
    return out;
  }
  const order = [
    ["01-silent-generation", "silent-generation"],
    ["02-gen-alpha", "gen-alpha"],
    ["03-baby-boomer", "baby-boomer"],
    ["04-gen-z", "gen-z"],
    ["05-gen-x", "gen-x"],
    ["06-gen-y", "gen-y"],
    ["07-silent-generation-b", "silent-generation"],
    ["08-gen-alpha-b", "gen-alpha"],
    ["09-baby-boomer-b", "baby-boomer"],
    ["10-gen-z-b", "gen-z"],
    ["11-gen-x-b", "gen-x"],
    ["12-gen-y-b", "gen-y"],
    ["13-multi-gen", "multi-gen"],
    ["14-gen-x-c", "gen-x"],
  ];
  const dir = path.join(ROOT, "banks/lockdown", locale);
  fs.mkdirSync(dir, { recursive: true });
  for (const [id, generation] of order) {
    const opposite = LOCKDOWN_PAIRS.flat().includes(id)
      ? LOCKDOWN_PAIRS.find((pair) => pair.includes(id)).find((other) => other !== id)
      : "";
    const body = {
      id,
      generation,
      opposite,
      link: lockdownSetPath(id, locale),
      questions: take(generation, 5),
    };
    fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(body, null, 2) + "\n");
  }
}

for (const locale of LOCALES) buildLocale(locale);
const manifest = {
  size: 5,
  sets: Object.keys(LOCKDOWN_GENERATION).length,
  pairs: LOCKDOWN_PAIRS.map(([a, b]) => ({
    a,
    b,
    generationA: LOCKDOWN_GENERATION[a],
    generationB: LOCKDOWN_GENERATION[b],
    linkA: lockdownSetPath(a, "en"),
    linkB: lockdownSetPath(b, "en"),
  })),
};
fs.writeFileSync(path.join(ROOT, "banks/lockdown/manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("lockdown sets", manifest.sets, "pairs", manifest.pairs.length);
