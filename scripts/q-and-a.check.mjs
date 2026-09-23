#!/usr/bin/env node
/**
 * Q&A module that ships inside Fast Answer.
 * Topics, generation routing, Louis Liberty, and the live bank.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  GENERATIONS,
  generationForYears,
  generationIssues,
  countByGeneration,
} from "../q-and-a/map.js";
import { LOUIS_BOT, reviewForChildren } from "../q-and-a/louis-liberty.js";
import { COMEDY_BOT, weeklyComedyReview } from "../q-and-a/crackd-kerr.js";

const topics = JSON.parse(fs.readFileSync(new URL("../q-and-a/topics.json", import.meta.url), "utf8"));
assert.ok(Array.isArray(topics) && topics.length >= 1);
const ids = new Set();
for (const topic of topics) {
  assert.equal(typeof topic.id, "string", "topic id");
  assert.equal(typeof topic.title, "string", "topic title");
  assert.equal(ids.has(topic.id), false, topic.id);
  ids.add(topic.id);
}

assert.equal(generationForYears(13), "gen-alpha");
assert.equal(generationForYears(16), "gen-alpha");
assert.equal(generationForYears(17), "gen-z");
assert.equal(LOUIS_BOT, "Louis Liberty");
assert.equal(COMEDY_BOT, "Crack'd Kerr");
assert.equal(reviewForChildren({
  prompt: "What has hands but cannot clap?",
  choices: ["A clock", "A glove"],
  banterHint: "It can still wave hello.",
  funny: true,
}).ok, true);
assert.equal(reviewForChildren({
  prompt: "Where do you live?",
  choices: ["Home address", "School"],
}).ok, false);

const weekly = JSON.parse(fs.readFileSync(new URL("../questions.json", import.meta.url), "utf8"));
const issues = generationIssues(weekly);
assert.deepEqual(issues, [], issues.join("; "));
const counts = countByGeneration(weekly);
for (const g of GENERATIONS) assert.ok(counts[g] > 0, g);

const jokes = JSON.parse(fs.readFileSync(new URL("../banks/gen-alpha/en.json", import.meta.url), "utf8")).questions;
assert.ok(jokes.length >= 1);
assert.ok(jokes.every((q) => q.funny === true && q.generation === "gen-alpha"));
const review = weeklyComedyReview(jokes, { week: jokes[0].addedWeek || "2026-W39" });
assert.equal(review.bot, COMEDY_BOT);
assert.equal(review.blocked.length, 0);

console.log("q&a module ok", { topics: topics.length, generations: counts });
