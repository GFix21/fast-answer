#!/usr/bin/env node
import fs from "node:fs";
import assert from "node:assert/strict";
import { GENERATIONS } from "../q-and-a/map.js";
import {
  PACK_TARGET,
  LOCKDOWN_REFRESHES,
  buildGenerationPacks,
  packSummary,
  dealRoundRobin,
  refreshLockdown,
  shufflePacks,
  generationForAge,
  generationForYears,
  generationForSeat,
  playableAges,
  ageBracketsForGeneration,
  bracketsSendingTo,
  AGE_BRACKETS,
} from "../lib/generation-packs.js";
import { buildDeviceCohort, placementIsDue, placementMandatoryAt, addYearsIso } from "../lib/device-cohort.js";

const weekly = JSON.parse(fs.readFileSync(new URL("../questions.json", import.meta.url), "utf8"));
const placement = JSON.parse(fs.readFileSync(new URL("../banks/placement/generational-first-pass.json", import.meta.url), "utf8"));
const packs = buildGenerationPacks(weekly);
const summary = packSummary(packs);
const sourceIds = new Set(weekly.map((q) => q.id));

assert.equal(summary.target, 150);
assert.equal(summary.held, weekly.length);
for (const g of GENERATIONS) {
  assert.ok(summary.counts[g] > 0, g);
  assert.ok(summary.counts[g] <= PACK_TARGET, g);
  for (const q of packs[g]) assert.ok(sourceIds.has(q.id), q.id);
}
assert.deepEqual(summary.counts, {
  "silent-generation": 24,
  "baby-boomer": 24,
  "gen-x": 25,
  "gen-y": 25,
  "gen-z": 25,
  "gen-alpha": 31,
  "multi-gen": 21,
});

const padded = buildGenerationPacks([
  ...weekly,
  ...Array.from({ length: 200 }, (_, i) => ({
    id: `pad-${i}`,
    prompt: "x",
    choices: ["a", "b"],
    correctIndex: 0,
    generation: "gen-x",
    tier: "easy",
  })),
]);
assert.equal(padded["gen-x"].length, PACK_TARGET);
assert.equal(padded["gen-x"].filter((q) => String(q.id).startsWith("pad-")).length, PACK_TARGET - summary.counts["gen-x"]);

const players = [
  { id: "a", name: "Ada", generation: "gen-x" },
  { id: "b", name: "Bea", generation: "gen-z" },
  { id: "c", name: "Cy", generation: "baby-boomer" },
];
const dealt = dealRoundRobin(players, packs, 6);
assert.equal(dealt.questions.length, 6);
assert.deepEqual(dealt.questions.map((q) => q.fromGeneration), [
  "gen-x", "gen-z", "baby-boomer", "gen-x", "gen-z", "baby-boomer",
]);
assert.deepEqual(dealt.questions.map((q) => q.fromPlayer), ["Ada", "Bea", "Cy", "Ada", "Bea", "Cy"]);
assert.equal(new Set(dealt.questions.map((q) => q.id)).size, 6);

const byAge = [
  { id: "teen", name: "Teen", ageBracket: "10s", generation: "baby-boomer" },
  { id: "mid", name: "Mid", ageBracket: "40s", generation: "gen-z" },
  { id: "elder", name: "Elder", ageBracket: "90s", generation: "gen-alpha" },
];
const aged = dealRoundRobin(byAge, packs, 3);
assert.deepEqual(aged.questions.map((q) => q.fromGeneration), ["gen-alpha", "gen-y", "silent-generation"]);
assert.equal(generationForSeat({ ageBracket: "50s", generation: "gen-z" }), "gen-x");
assert.equal(generationForYears(13), "gen-alpha");
assert.equal(generationForYears(14), "gen-alpha");
assert.equal(generationForYears(16), "gen-alpha");
assert.equal(generationForYears(17), "gen-z");
assert.equal(generationForSeat({ age: 13, ageBracket: "10s", generation: "gen-z" }), "gen-alpha");
assert.equal(generationForSeat({ age: 16, ageBracket: "10s", generation: "gen-z" }), "gen-alpha");
assert.deepEqual(playableAges("gen-alpha"), [13, 14, 15, 16]);
const alphaSeat = dealRoundRobin(
  [{ id: "kid", name: "Kid", age: 13, ageBracket: "10s", generation: "gen-z" }],
  packs,
  1,
);
assert.equal(alphaSeat.questions[0].fromGeneration, "gen-alpha");
assert.equal(generationForSeat({ generation: "gen-alpha" }), "gen-alpha");
assert.deepEqual(AGE_BRACKETS.map((b) => generationForAge(b)), [
  "gen-alpha",
  "gen-z",
  "gen-y",
  "gen-y",
  "gen-x",
  "baby-boomer",
  "baby-boomer",
  "silent-generation",
  "silent-generation",
]);
const sent = new Map();
for (const b of AGE_BRACKETS) {
  const g = generationForAge(b);
  assert.ok(ageBracketsForGeneration(g).includes(b), `${b} covered by ${g}`);
  assert.equal(sent.has(b), false);
  sent.set(b, g);
}
assert.equal(sent.size, AGE_BRACKETS.length);
assert.deepEqual(bracketsSendingTo("gen-alpha"), ["10s"]);
assert.deepEqual(bracketsSendingTo("multi-gen"), []);
assert.deepEqual(ageBracketsForGeneration("gen-alpha"), ["10s"]);
assert.deepEqual(ageBracketsForGeneration("gen-x"), ["40s", "50s", "60s"]);
assert.deepEqual(ageBracketsForGeneration("multi-gen").length, AGE_BRACKETS.length);
assert.deepEqual(summary.sendsFor["gen-y"], ["30s", "40s"]);
assert.equal(summary.year, 2026);

const same = [
  { id: "a", name: "Ada", generation: "gen-x" },
  { id: "b", name: "Bea", generation: "gen-x" },
];
const shared = dealRoundRobin(same, packs, 4);
assert.equal(new Set(shared.questions.map((q) => q.id)).size, 4);
assert.ok(shared.questions.every((q) => q.fromGeneration === "gen-x"));

const cohort = buildDeviceCohort(weekly, placement.questions, "en", "2026-09-01T00:00:00.000Z");
assert.equal(cohort.v, 2);
assert.equal(cohort.target, 150);
assert.equal(cohort.held, 175);
const easyJokes = cohort.shows[0].filter((q) => q.tier === "easy" && q.funny === true);
const hardJokes = cohort.shows[0].filter((q) => q.tier === "hard" && q.funny === true);
const renegade = (list) => list.filter((q) => q.renegade === true);
assert.equal(easyJokes.length, 2);
assert.equal(hardJokes.length, 1);
assert.ok(easyJokes.every((q) => q.humorous === true && q.renegade !== true));
assert.equal(hardJokes[0].renegade, true);
assert.equal(hardJokes[0].fromStructure, "when");
assert.equal(hardJokes[0].structure, "colour");
assert.equal(renegade(cohort.shows[0]).length, 1);
assert.equal(renegade(cohort.shows[1]).length, 0);
assert.ok(weekly.some((q) => q.structure === "colour" && /^What colour is/i.test(q.prompt)));
assert.equal(cohort.shows.length, 2);
assert.equal(cohort.placement.length, placement.questions.length);
assert.equal(cohort.lockdownRefreshes, 0);

let refreshes = 0;
let live = packs;
const avoid = [];
for (let i = 0; i < LOCKDOWN_REFRESHES; i++) {
  const step = refreshLockdown({ refreshes, packs: live, players, avoidIds: avoid, n: 5 });
  assert.equal(step.shuffled, false);
  assert.equal(step.exhausted, false);
  assert.equal(step.refreshes, i + 1);
  assert.equal(step.questions.length, 5);
  assert.equal(step.packs, live);
  refreshes = step.refreshes;
  avoid.push(...step.questions.map((q) => q.id));
}
const beforeOrder = Object.fromEntries(GENERATIONS.map((g) => [g, live[g].map((q) => q.id).join("|")]));
const fifth = refreshLockdown({
  refreshes,
  packs: live,
  players,
  avoidIds: avoid,
  n: 5,
  rng: () => 0,
});
assert.equal(fifth.shuffled, true);
assert.equal(fifth.exhausted, true);
assert.equal(fifth.refreshes, LOCKDOWN_REFRESHES);
assert.equal(fifth.questions.length, 5);
for (const g of GENERATIONS) {
  const after = fifth.packs[g].map((q) => q.id);
  assert.deepEqual([...after].sort(), live[g].map((q) => q.id).sort());
  if (live[g].length > 1) assert.notEqual(after.join("|"), beforeOrder[g]);
}
const again = refreshLockdown({ refreshes: fifth.refreshes, packs: fifth.packs, players, n: 5, rng: () => 0 });
assert.equal(again.shuffled, true);
assert.equal(again.refreshes, LOCKDOWN_REFRESHES);

const reversed = shufflePacks(packs, () => 0);
assert.notEqual(
  reversed["multi-gen"].map((q) => q.id).join("|"),
  packs["multi-gen"].map((q) => q.id).join("|"),
);

const done = "2024-09-01T00:00:00.000Z";
const due = placementMandatoryAt(done);
assert.equal(due, addYearsIso(done, 2));
assert.equal(placementIsDue({ placementCompletedAt: done, placementMandatoryAt: due }, Date.parse("2026-08-31T00:00:00.000Z")), false);
assert.equal(placementIsDue({ placementCompletedAt: done, placementMandatoryAt: due }, Date.parse("2026-09-01T00:00:00.000Z")), true);
assert.equal(placementIsDue({ placementCompletedAt: done }, Date.parse("2026-09-01T00:00:00.000Z")), true);
assert.equal(placementIsDue({}, Date.parse("2026-01-01T00:00:00.000Z")), true);
assert.equal(placementIsDue({ placementCompletedAt: done, placementMandatoryAt: "2025-01-01T00:00:00.000Z" }, Date.parse("2025-06-01T00:00:00.000Z")), true);

console.log("generation packs ok", summary.counts);
