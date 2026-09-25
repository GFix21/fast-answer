#!/usr/bin/env node
import assert from "node:assert/strict";
import { contentWindow, editsOpen, dealOpen, questionDealable, manifestForSet } from "../lib/content-freeze.js";

const qualityAt = "2026-09-24T18:00:00.000Z";
const set3 = manifestForSet("SET00003");
assert.ok(set3);
assert.equal(contentWindow(set3, qualityAt), "quality");
assert.equal(editsOpen(set3, qualityAt), true);
assert.equal(dealOpen(set3, qualityAt), false);
assert.equal(questionDealable({ addedSet: "SET00003" }, qualityAt), false);
assert.equal(questionDealable({ id: "w39-e-silent-ike" }, qualityAt), true);

const lateAt = "2026-09-26T00:00:00.000Z";
assert.equal(contentWindow(set3, lateAt), "late");
assert.equal(editsOpen(set3, lateAt), false);
assert.equal(dealOpen(set3, lateAt), false);

const banked = {
  status: "banked",
  startedAt: "2026-10-01T00:00:00.000Z",
  playUntil: "2026-10-05T00:00:00.000Z",
  qualityUntil: "2026-09-25T00:00:00.000Z",
  questionCount: 1050,
};
assert.equal(contentWindow(banked, "2026-09-28T00:00:00.000Z"), "frozen");
assert.equal(editsOpen(banked, "2026-09-28T00:00:00.000Z"), false);
assert.equal(dealOpen(banked, "2026-09-28T00:00:00.000Z"), false);
assert.equal(contentWindow(banked, "2026-10-02T00:00:00.000Z"), "live");
assert.equal(editsOpen(banked, "2026-10-02T00:00:00.000Z"), false);
assert.equal(dealOpen(banked, "2026-10-02T00:00:00.000Z"), true);
assert.equal(contentWindow(banked, "2026-10-05T00:00:00.000Z"), "archived");
assert.equal(dealOpen(banked, "2026-10-05T00:00:00.000Z"), true);
assert.equal(editsOpen(banked, "2026-10-05T00:00:00.000Z"), false);

console.log("content freeze ok");
