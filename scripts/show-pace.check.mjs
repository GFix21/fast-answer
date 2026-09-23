import assert from "node:assert/strict";
import {
  MAP_USES_PER_ROUND,
  SET_BREAK_S,
  mapUsesLeft,
  orderShowSets,
  setBreakDue,
} from "../lib/show-pace.js";

assert.equal(SET_BREAK_S, 15);
assert.equal(MAP_USES_PER_ROUND, 4);

const mixed = [
  { id: "h1", tier: "hard" },
  { id: "e1", tier: "easy" },
  { id: "x1", tier: "extreme" },
  { id: "e2", tier: "easy" },
  { id: "d1", tier: "difficult" },
  { id: "h2", tier: "hard" },
  { id: "z1", tier: "other" },
];
assert.deepEqual(orderShowSets(mixed).map((q) => q.id), ["e1", "e2", "h1", "h2", "d1", "x1", "z1"]);
assert.deepEqual(orderShowSets([]), []);

assert.equal(setBreakDue("easy", "hard"), true);
assert.equal(setBreakDue("hard", "difficult"), true);
assert.equal(setBreakDue("difficult", "extreme"), true);
assert.equal(setBreakDue("easy", "extreme"), true);
assert.equal(setBreakDue("easy", "easy"), false);
assert.equal(setBreakDue("hard", "easy"), false);
assert.equal(setBreakDue("extreme", "extreme"), false);
assert.equal(setBreakDue("easy", "other"), false);
assert.equal(setBreakDue(undefined, "hard"), false);

assert.equal(mapUsesLeft(0), 4);
assert.equal(mapUsesLeft(undefined), 4);
assert.equal(mapUsesLeft(3), 1);
assert.equal(mapUsesLeft(4), 0);
assert.equal(mapUsesLeft(9), 0);

console.log("show pace ok");
