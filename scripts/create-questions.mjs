#!/usr/bin/env node
/**
 * Run the creator line, then merge accepted questions into the weekly banks.
 * Checker, Louis Liberty, Crack'd Kerr, and Dupe Check all have to pass.
 * The same id is not appended twice.
 *
 *   node scripts/create-questions.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { creatorQuestions } from "../q-and-a/bots/creators.js";
import { checkQuestion } from "../q-and-a/bots/checker.js";
import { findDupes } from "../q-and-a/bots/dupe.js";
import { reviewForChildren } from "../q-and-a/louis-liberty.js";
import { scoreJoke } from "../q-and-a/crackd-kerr.js";
import { WEEK_TARGET, nextIsoWeek, monthKeyForWeek } from "../lib/week-roll.js";
import { factRepeatIssues, pipelineStatus } from "../lib/set-rotation.js";
import { archivePublishedWeek } from "../lib/archive-store.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "fr", "de"];
const VIRAL_MIN = 70;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function weeklyFile(locale) {
  return locale === "en"
    ? path.join(ROOT, "banks/weekly/current.json")
    : path.join(ROOT, "banks/weekly", locale, "current.json");
}

function funnyQuestions(locale) {
  const file = path.join(ROOT, "banks/gen-alpha", `${locale}.json`);
  if (!fs.existsSync(file)) return [];
  const pack = readJson(file);
  return Array.isArray(pack.questions) ? pack.questions : [];
}

function kept(questions) {
  return (questions || []).filter((q) => !String(q?.id || "").startsWith("cq-"));
}

try {
  const marker = JSON.parse(fs.readFileSync(path.join(ROOT, "banks/sets/current.json"), "utf8"));
  const hasReady = fs.existsSync(path.join(ROOT, "banks/sets/ready/questions.json"));
  console.log(pipelineStatus(marker, Date.now(), { hasReady }));
} catch {
  console.log("creator pipeline has no live set");
}

let failed = 0;
for (const loc of LOCALES) {
  const created = creatorQuestions(loc);
  const issues = [];
  for (const q of created) {
    const check = checkQuestion(q);
    if (!check.ok) issues.push(`${q.id}: Checker ${check.reasons.join(", ")}`);
    if (q.funny === true || q.generation === "gen-alpha") {
      const safety = reviewForChildren(q);
      if (!safety.ok) issues.push(`${q.id}: Louis Liberty ${safety.reasons.join(", ")}`);
    }
    if (q.funny === true) {
      const score = scoreJoke(q);
      if (score.tierHeld || score.rating < VIRAL_MIN) {
        issues.push(`${q.id}: Crack'd Kerr ${score.rating}`);
      }
    }
  }
  const week = readJson(weeklyFile(loc));
  let base = kept(week.questions);
  if (base.length >= WEEK_TARGET) {
    archivePublishedWeek({
      ...week,
      locale: loc,
      weekTarget: WEEK_TARGET,
      weekComplete: true,
      questions: base.map((q) => ({ ...q, status: q.status === "rejected" ? "rejected" : "active" })),
    }, { locale: loc, monthKey: monthKeyForWeek(week.weekKey) });
    week.weekKey = nextIsoWeek(week.weekKey);
    week.questions = [];
    base = [];
    console.log(`${loc}: week full (${WEEK_TARGET}). Opened ${week.weekKey}.`);
  }
  const existing = [...base, ...funnyQuestions(loc)];
  const dupes = findDupes(created, existing);
  if (!dupes.ok) {
    for (const row of dupes.dupes) issues.push(`${row.id}: Dupe Check same as ${row.sameAs}`);
  }
  for (const row of factRepeatIssues(created, existing)) {
    issues.push(`${row.id}: repeat ${row.factKey} ${row.reworded ? "over 5 in 2 years" : "not reworded"}`);
  }
  if (issues.length) {
    failed += 1;
    console.error(`create blocked (${loc}):`);
    for (const line of issues) console.error(" -", line);
    continue;
  }
  const dir = path.join(ROOT, "banks/created");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${loc}.json`),
    `${JSON.stringify({ locale: loc, questions: created }, null, 2)}\n`,
  );
  week.questions = [...base, ...created];
  week.weekTarget = WEEK_TARGET;
  week.weekComplete = week.questions.length >= WEEK_TARGET;
  fs.writeFileSync(weeklyFile(loc), `${JSON.stringify(week, null, 2)}\n`);
  console.log(`${loc}: merged ${created.length} creator questions`);
}

if (failed) process.exit(1);
console.log("create questions ok");
