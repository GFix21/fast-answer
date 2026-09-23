#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  SET_DAYS,
  READY_DAYS,
  REPEAT_MAX,
  archiveDecision,
  factRepeatIssues,
  folderFor,
  pipelineStatus,
  rollupLevel,
  setWindow,
} from "../lib/set-rotation.js";

const start = "2026-09-23T00:00:00.000Z";
const early = setWindow(start, "2026-09-24T00:00:00.000Z");
assert.equal(early.ready, false);
assert.equal(early.due, false);
assert.equal(early.readyAt, "2026-09-25T00:00:00.000Z");
assert.equal(early.switchAt, "2026-09-27T00:00:00.000Z");
assert.equal(READY_DAYS, 2);
assert.equal(SET_DAYS, 4);

const ready = setWindow(start, "2026-09-25T12:00:00.000Z");
assert.equal(ready.ready, true);
assert.equal(ready.due, false);
const due = setWindow(start, "2026-09-27T00:00:00.000Z");
assert.equal(due.due, true);

const folder = folderFor(start);
assert.equal(folder.year, "2026");
assert.equal(folder.month, "2026-09");
assert.equal(folder.week, "2026-W39");
assert.equal(folder.rel, "banks/sets/2026/2026-09/2026-W39");
assert.equal(rollupLevel(start, "2026-09-27T00:00:00.000Z"), "set");
assert.equal(rollupLevel(start, "2026-09-28T00:00:00.000Z"), "week");
assert.equal(rollupLevel(start, "2026-10-01T00:00:00.000Z"), "month");
assert.equal(rollupLevel(start, "2027-01-04T00:00:00.000Z"), "year");

const marker = { id: "2026-09-23", startedAt: start, questionCount: 1050 };
assert.equal(archiveDecision(marker, "2026-09-24T00:00:00.000Z").action, "keep");
assert.equal(archiveDecision(marker, "2026-09-27T00:00:00.000Z").action, "archive-only");
assert.equal(archiveDecision(marker, "2026-09-27T00:00:00.000Z", { hasReady: true }).action, "switch");
assert.equal(archiveDecision({ ...marker, archivedAt: "2026-09-27T00:00:00.000Z" }, "2026-09-28T00:00:00.000Z").action, "wait");
assert.match(pipelineStatus(marker, "2026-09-26T00:00:00.000Z"), /ready/);

const now = "2026-09-23T00:00:00.000Z";
const history = [
  { factKey: "capital-france", prompt: "What is the capital of France?", usedAt: "2025-01-01T00:00:00.000Z" },
  { factKey: "capital-france", prompt: "Which city is France's capital?", usedAt: "2025-06-01T00:00:00.000Z" },
  { factKey: "old-fact", prompt: "Same words again", usedAt: "2020-01-01T00:00:00.000Z" },
];
assert.equal(factRepeatIssues([
  { id: "n1", factKey: "capital-france", prompt: "France's capital city is which?" },
], history, now).length, 0);
assert.equal(factRepeatIssues([
  { id: "n2", factKey: "capital-france", prompt: "What is the capital of France?" },
], history, now).length, 1);
assert.equal(factRepeatIssues([
  { id: "n3", factKey: "old-fact", prompt: "Same words again" },
], history, now).length, 0);
assert.equal(factRepeatIssues([
  { id: "plain", prompt: "No fact key" },
], history, now).length, 0);

const five = Array.from({ length: REPEAT_MAX }, (_, i) => ({
  factKey: "moon",
  prompt: `Wording ${i} of the moon fact`,
  usedAt: "2026-01-01T00:00:00.000Z",
}));
assert.equal(factRepeatIssues([
  { id: "sixth", factKey: "moon", prompt: "A sixth rewording of the moon fact" },
], five, now).length, 1);
const four = five.slice(0, 4);
assert.equal(factRepeatIssues([
  { id: "fifth", factKey: "moon", prompt: "A fifth rewording of the moon fact" },
], four, now).length, 0);

console.log("set rotation ok");
