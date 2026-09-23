import assert from "node:assert/strict";
import {
  MAP_USES_PER_ROUND,
  SET_BREAK_S,
  lockdownSlots,
  mapUsesLeft,
  orderShowSets,
  setBreakDue,
  tierRunLength,
} from "../lib/show-pace.js";
import { dealRamp, SHOW_DEAL } from "../lib/generation-deal.js";

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
assert.equal(setBreakDue("easy", "hard", 1), false);
assert.equal(setBreakDue("hard", "difficult", 5), true);
const ramp = [
  ...Array.from({ length: 20 }, () => ({ tier: "easy" })),
  ...Array.from({ length: 10 }, () => ({ tier: "hard" })),
  ...Array.from({ length: 5 }, () => ({ tier: "difficult" })),
  ...Array.from({ length: 2 }, () => ({ tier: "extreme" })),
];
assert.equal(tierRunLength(ramp, 20), 10);
assert.equal(tierRunLength(ramp, 35), 2);
assert.deepEqual(lockdownSlots(ramp), [28, 36]);
assert.deepEqual(lockdownSlots([{ tier: "easy" }, { tier: "hard" }]), [1]);
assert.deepEqual(lockdownSlots([...Array.from({ length: 12 }, () => ({ tier: "easy" })), { tier: "extreme" }]), [12]);

const bank = [];
for (const [tier, n] of Object.entries({ easy: 24, hard: 12, difficult: 6, extreme: 3 })) {
  for (let i = 0; i < n; i++) {
    bank.push({
      id: `${tier}-${i}`,
      tier,
      generation: ["gen-z", "gen-y", "gen-alpha"][i % 3],
      prompt: `${tier} question ${i}?`,
      choices: ["a", "b", "c", "d"],
      correctIndex: 0,
      funny: false,
    });
  }
}
bank.push({
  id: "renegade-1",
  tier: "hard",
  generation: "multi-gen",
  renegade: true,
  humorous: true,
  funny: true,
  prompt: "What colour was the hull?",
  choices: ["Black", "White", "Gold", "Red"],
  correctIndex: 0,
});
bank[0].funny = true;
bank[1].funny = true;
bank[24].funny = true;
const dealt = dealRamp(bank, { seats: ["gen-z", "gen-y", "gen-alpha"] });
const byTier = {};
for (const q of dealt) byTier[q.tier] = (byTier[q.tier] || 0) + 1;
assert.deepEqual(byTier, SHOW_DEAL);
assert.equal(dealt.filter((q) => q.renegade).length, 1);
assert.equal(dealt.filter((q) => q.tier === "easy" && q.funny).length, 2);
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
