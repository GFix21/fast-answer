#!/usr/bin/env node
/**
 * The question desk: one creator per generation, then Checker.
 * Jokes stay on easy and hard. Colour questions ask what colour something is.
 */
import assert from "node:assert/strict";
import { GENERATIONS } from "../q-and-a/map.js";
import { CREATORS, creatorQuestions } from "../q-and-a/bots/creators.js";
import { checkQuestion } from "../q-and-a/bots/checker.js";
import { answerInQuestion } from "../lib/answer-in-question.js";
import { isColourPrompt, PLAY_TIERS } from "../q-and-a/bots/structures.js";
import { COMEDY_STRUCTURES, injectHumor } from "../q-and-a/crackd-kerr.js";
import { SHOW_JOKES, SHOW_RENEGADE_MAX } from "../lib/generation-deal.js";
import { slangFor } from "../q-and-a/bots/slang.js";

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

const leaked = {
  id: "leak-spotify",
  tier: "easy",
  generation: "gen-z",
  correctIndex: 2,
  choices: ["Netflix", "Skype", "Spotify", "IKEA"],
  prompt: "Which Swedish company is best known for a music streaming app called Spotify?",
};
assert.equal(answerInQuestion(leaked), true);
const leakedCheck = checkQuestion(leaked);
assert.equal(leakedCheck.ok, false);
assert.ok(leakedCheck.reasons.includes("answer-in-question"));
const sealed = {
  ...leaked,
  prompt: "Which Swedish company is best known for a music streaming app?",
};
assert.equal(answerInQuestion(sealed), false);
assert.equal(checkQuestion(sealed).reasons.includes("answer-in-question"), false);
for (const style of ["dialogue", "straight-man", "rule-of-three", "misdirection", "wordplay", "callback", "escalation", "reverse", "aside"]) {
  const wrapped = injectHumor({ ...straight, injection: style });
  assert.equal(wrapped.injection, style, style);
  assert.equal(wrapped.correctIndex, 0, style);
  assert.match(wrapped.prompt, /When did the Titanic sink\?/, style);
}

for (const loc of ["en", "fr", "fr-CA", "de"]) {
  const rows = creatorQuestions(loc);
  assert.ok(rows.length >= 28, loc);
  for (const g of GENERATIONS) {
    const voice = slangFor(g, loc);
    assert.ok(voice, `${loc} ${g}`);
    assert.ok(rows.some((q) => q.generation === g && q.slang === voice), `${loc} ${g}`);
  }
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
  assert.deepEqual(titanic.jokeWrongIndexes, [2, 3]);
  const plainTitanic = titanic.choices.filter((_, i) => i !== titanic.correctIndex && !titanic.jokeWrongIndexes.includes(i));
  assert.equal(plainTitanic.length, 1);
  assert.match(plainTitanic[0], /1911/);
  assert.ok(titanic.jokeWrongIndexes.some((i) => /april fool|poisson d'avril|aprilscherz/i.test(titanic.choices[i])));
  for (const q of humorous) {
    assert.equal(q.jokeWrongIndexes?.length, 2, `${loc} ${q.id}`);
    const wrongs = q.choices.map((_, i) => i).filter((i) => i !== q.correctIndex);
    const plain = wrongs.filter((i) => !q.jokeWrongIndexes.includes(i));
    assert.equal(plain.length, 1, `${loc} ${q.id}`);
    assert.equal(q.jokeWrongIndexes.includes(q.correctIndex), false, `${loc} ${q.id}`);
  }
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
