import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ageIsAllowed,
  requiredAge,
  countryFromTimeZone,
  PROFILE_FLOOR,
} from "../lib/age-gate.js";
import { reviewForChildren } from "../lib/safeguard.js";
import { COMEDY_BOT, scoreJoke, weeklyComedyReview, isoWeek } from "../q-and-a/crackd-kerr.js";
import { comedyReview, questionsForComedy } from "../lib/week-store.js";
import { generationForYears } from "../lib/generation-packs.js";

assert.equal(PROFILE_FLOOR, 13);
assert.equal(requiredAge("US"), 13);
assert.equal(requiredAge("GB"), 13);
assert.equal(requiredAge("NZ"), 13);
assert.equal(requiredAge("FR"), 15);
assert.equal(requiredAge("DE"), 16);
assert.equal(requiredAge("CA"), 14);
assert.equal(requiredAge("AU"), 16);
assert.equal(requiredAge("OTHER"), 13);
assert.equal(requiredAge("US", "AU"), 16);
assert.equal(requiredAge("US", "DE"), 16);
assert.equal(requiredAge("GB", "FR"), 15);

assert.equal(ageIsAllowed(12, "US"), false);
assert.equal(ageIsAllowed(13, "US"), true);
assert.equal(ageIsAllowed(13, "US", "AU"), false);
assert.equal(ageIsAllowed(16, "US", "AU"), true);
assert.equal(ageIsAllowed(14, "FR"), false);
assert.equal(ageIsAllowed(15, "FR"), true);
assert.equal(ageIsAllowed(15, "DE"), false);
assert.equal(ageIsAllowed(16, "DE"), true);
assert.equal(ageIsAllowed(13, "CA"), false);
assert.equal(ageIsAllowed(14, "CA"), true);
assert.equal(ageIsAllowed(15, "AU"), false);
assert.equal(ageIsAllowed(13, "NZ"), true);
assert.equal(ageIsAllowed(13, "GB"), true);

assert.equal(countryFromTimeZone("Europe/Paris"), "FR");
assert.equal(countryFromTimeZone("Europe/Berlin"), "DE");
assert.equal(countryFromTimeZone("Europe/London"), "GB");
assert.equal(countryFromTimeZone("Australia/Sydney"), "AU");
assert.equal(countryFromTimeZone("Pacific/Auckland"), "NZ");
assert.equal(countryFromTimeZone("America/Toronto"), "CA");
assert.equal(countryFromTimeZone("America/New_York"), "US");

assert.equal(generationForYears(13), "gen-alpha");
assert.equal(generationForYears(14), "gen-z");

const clock = {
  id: "ga-joke-clock",
  prompt: "What has hands but cannot clap?",
  choices: ["A clock", "A glove"],
  banterHint: "It can still wave hello.",
  funny: true,
  addedWeek: "2026-W39",
  generation: "gen-alpha",
};
assert.equal(reviewForChildren(clock).ok, true);
assert.ok(scoreJoke(clock).rating >= 70);
assert.equal(reviewForChildren({
  prompt: "Where do you live?",
  choices: ["Home address", "School"],
}).ok, false);

const bank = JSON.parse(fs.readFileSync(new URL("../banks/gen-alpha/en.json", import.meta.url), "utf8"));
for (const q of bank.questions) {
  assert.equal(q.generation, "gen-alpha");
  assert.equal(q.funny, true);
  assert.equal(reviewForChildren(q).ok, true, q.id);
  assert.ok(scoreJoke(q).rating >= 70, q.id);
}
const week = isoWeek(new Date("2026-09-23T12:00:00Z"));
assert.equal(week, "2026-W39");
const review = weeklyComedyReview(bank.questions, { week, now: "2026-09-23T12:00:00.000Z" });
assert.equal(COMEDY_BOT, "Crack'd Kerr");
assert.equal(review.bot, COMEDY_BOT);
const qanda = comedyReview("en", { questions: [] }, "2026-09-23T12:00:00.000Z");
assert.equal(qanda.bot, COMEDY_BOT);
assert.ok(questionsForComedy("en", { questions: [] }).some((q) => q.id === "ga-joke-clock"));
assert.ok(qanda.viral.some((q) => q.id === "ga-joke-clock"));
assert.equal(review.blocked.length, 0);
assert.equal(review.weak.length, 0);
assert.ok(review.fresh.length >= 3);
assert.ok(review.viral.length >= 1);
assert.ok(review.highestRated.length >= 1);
assert.ok(review.highestRated[0].rating >= review.highestRated.at(-1).rating);

console.log("age gate and comedy review ok", { week, viral: review.viral.map((q) => q.id) });
