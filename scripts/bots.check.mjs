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
import { COMEDY_STRUCTURES, RENEGADE_JOKE_STRUCTURE, JOKE_STRUCTURE } from "../q-and-a/crackd-kerr.js";
import { SHOW_JOKES, SHOW_RENEGADE_MAX } from "../lib/generation-deal.js";

assert.equal(CREATORS.length, GENERATIONS.length);
assert.deepEqual(CREATORS.map((c) => c.generation), GENERATIONS);
assert.deepEqual(SHOW_JOKES, { easy: 2, hard: 1 });
assert.equal(SHOW_RENEGADE_MAX, 1);
assert.equal(COMEDY_STRUCTURES[JOKE_STRUCTURE].owner, "Crack'd Kerr");
assert.equal(COMEDY_STRUCTURES[RENEGADE_JOKE_STRUCTURE].owner, "Crack'd Kerr");

for (const loc of ["en", "fr", "fr-CA", "de"]) {
  const rows = creatorQuestions(loc);
  assert.ok(rows.length >= 28, loc);
  const jokes = rows.filter((q) => q.funny === true);
  const colours = rows.filter((q) => q.structure === "colour");
  const renegades = rows.filter((q) => q.structure === RENEGADE_JOKE_STRUCTURE);
  assert.ok(jokes.length >= 1, loc);
  assert.ok(colours.length >= 1, loc);
  assert.equal(renegades.length, 1, loc);
  assert.equal(renegades[0].straight, "colour");
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
