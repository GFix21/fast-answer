#!/usr/bin/env node
/**
 * The question desk: one creator per generation, then Checker.
 * Jokes stay on easy and hard. Colour questions ask what colour something is.
 */
import assert from "node:assert/strict";
import { GENERATIONS } from "../q-and-a/map.js";
import { CREATORS, creatorQuestions } from "../q-and-a/bots/creators.js";
import { checkQuestion } from "../q-and-a/bots/checker.js";
import { isColourPrompt, PLAY_TIERS } from "../q-and-a/bots/structures.js";
import { COMEDY_STRUCTURES, injectHumor } from "../q-and-a/crackd-kerr.js";
import { SHOW_JOKES, SHOW_RENEGADE_MAX } from "../lib/generation-deal.js";

assert.equal(CREATORS.length, GENERATIONS.length);
assert.deepEqual(CREATORS.map((c) => c.generation), GENERATIONS);
assert.deepEqual(SHOW_JOKES, { easy: 2, hard: 1 });
assert.equal(SHOW_RENEGADE_MAX, 1);
assert.equal(COMEDY_STRUCTURES.dialogue.owner, "Crack'd Kerr");
assert.equal(COMEDY_STRUCTURES.renegade.owner, "Crack'd Kerr");

const straight = {
  id: "sample-when",
  structure: "when",
  tier: "easy",
  generation: "multi-gen",
  correctIndex: 0,
  choices: ["April 15, 1912", "April 15, 1911"],
  prompt: "When did the Titanic sink?",
};
const injected = injectHumor(straight);
assert.equal(injected.correctIndex, 0);
assert.deepEqual(injected.choices, straight.choices);
assert.equal(injected.humorous, true);
assert.equal(injected.injection, "dialogue");
assert.equal(injected.fromStructure, "when");
assert.equal(injected.renegade, false);
assert.match(injected.prompt, /When did the Titanic sink\?/);
assert.match(injected.prompt, /The other answers/);

for (const loc of ["en", "fr", "fr-CA", "de"]) {
  const rows = creatorQuestions(loc);
  assert.ok(rows.length >= 28, loc);
  const jokes = rows.filter((q) => q.funny === true);
  const colours = rows.filter((q) => q.structure === "colour");
  const humorous = rows.filter((q) => q.humorous === true);
  const renegades = rows.filter((q) => q.renegade === true);
  assert.ok(jokes.length >= 1, loc);
  assert.ok(colours.length >= 1, loc);
  assert.ok(humorous.length >= 2, loc);
  assert.equal(renegades.length, 1, loc);
  assert.equal(renegades[0].fromStructure, "when");
  assert.equal(renegades[0].structure, "colour");
  assert.equal(renegades[0].choices[renegades[0].correctIndex] !== "April 15, 1912", true);
  const titanic = rows.find((q) => q.id === "cq-e-multi-titanic");
  assert.equal(titanic.structure, "when");
  assert.equal(titanic.renegade, false);
  assert.match(titanic.choices[titanic.correctIndex], /1912/);
  assert.ok(jokes.some((q) => q.tier === "easy"), loc);
  assert.ok(jokes.some((q) => q.tier === "hard"), loc);
  for (const q of rows) {
    const check = checkQuestion(q);
    assert.equal(check.ok, true, `${loc} ${q.id} ${check.reasons.join(",")}`);
    if (q.funny === true) assert.ok(PLAY_TIERS.has(q.tier), q.id);
    if (q.structure === "colour") assert.equal(isColourPrompt(q.prompt), true, q.prompt);
  }
}

console.log("bots ok", { creators: CREATORS.length });
