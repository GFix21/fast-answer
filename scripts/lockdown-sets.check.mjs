#!/usr/bin/env node
import fs from "node:fs";
import assert from "node:assert/strict";
import {
  LOCKDOWN_GENERATION,
  LOCKDOWN_PAIRS,
  LOCKDOWN_SET_SIZE,
  evokeLockdownSlots,
  lockdownSetPath,
  pickOppositePair,
} from "../lib/lockdown-sets.js";

const manifest = JSON.parse(fs.readFileSync(new URL("../banks/lockdown/manifest.json", import.meta.url), "utf8"));
assert.equal(manifest.sets, 14);
assert.equal(manifest.pairs.length, 7);
assert.equal(Object.keys(LOCKDOWN_GENERATION).length, 14);

for (const locale of ["en", "fr", "fr-CA", "de"]) {
  const seen = new Set();
  for (const id of Object.keys(LOCKDOWN_GENERATION)) {
    const file = new URL(`../${lockdownSetPath(id, locale)}`, import.meta.url);
    const set = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.equal(set.generation, LOCKDOWN_GENERATION[id]);
    assert.equal(set.sourceGeneration, LOCKDOWN_GENERATION[set.opposite]);
    assert.notEqual(set.sourceGeneration, set.generation);
    assert.equal(set.questions.length, LOCKDOWN_SET_SIZE);
    assert.ok(set.link.includes(id));
    for (const q of set.questions) {
      assert.equal(q.generation, set.sourceGeneration);
      assert.equal(q.tier, "difficult");
      assert.equal(Number.isInteger(q.correctIndex), true);
      assert.equal(seen.has(q.id), false);
      seen.add(q.id);
    }
  }
}

for (const [a, b] of LOCKDOWN_PAIRS) {
  assert.notEqual(LOCKDOWN_GENERATION[a], LOCKDOWN_GENERATION[b]);
}

const pair = pickOppositePair(() => 0);
assert.equal(LOCKDOWN_GENERATION[pair[0]] === LOCKDOWN_GENERATION[pair[1]], false);
const slots = evokeLockdownSlots(37, () => 0.2);
assert.equal(slots.length, 2);
assert.ok(slots[0] >= 2 && slots[1] <= 35);
assert.ok(slots[1] - slots[0] >= 4);
assert.deepEqual(evokeLockdownSlots(6), []);

console.log("lockdown sets ok", { sets: 14, locales: 4 });
