#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  PLACEMENT_N,
  QUALITY_HOURS,
  SET_GAP_DAYS,
  addDays,
  qualityClosesAt,
  setFolderName,
  setPhase,
} from "../lib/question-flow.js";

assert.equal(SET_GAP_DAYS, 4);
assert.equal(QUALITY_HOURS, 30);
assert.equal(PLACEMENT_N, 30);
const named = setFolderName("2026-09-23T00:00:00.000Z", 1);
assert.equal(named.id, "SET00001");
assert.equal(named.folder, "23:09:2026-SET00001");
assert.equal(setFolderName("2026-09-27T00:00:00.000Z", 2).folder, "27:09:2026-SET00002");
assert.equal(addDays("2026-09-23T00:00:00.000Z", 4), "2026-09-27T00:00:00.000Z");
assert.equal(qualityClosesAt("2026-09-23T00:00:00.000Z"), "2026-09-24T06:00:00.000Z");
assert.equal(setPhase({ status: "banked" }), "banked");
assert.equal(setPhase({ status: "quality", qualityUntil: "2099-01-01T00:00:00.000Z", questionCount: 0 }, "2026-09-24T00:00:00.000Z"), "quality");
assert.equal(setPhase({ status: "quality", qualityUntil: "2026-09-24T06:00:00.000Z", questionCount: 100 }, "2026-09-24T12:00:00.000Z"), "late");
console.log("question flow ok");
