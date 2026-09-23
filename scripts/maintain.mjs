#!/usr/bin/env node
/**
 * App maintenance for Fast Answer and the Q&A module.
 * Function and security always run. Stability runs when APP_ORIGIN is set.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const steps = [
  ["fast-answer", "scripts/age-safe.check.mjs"],
  ["fast-answer", "scripts/generation-packs.check.mjs"],
  ["q-and-a", "scripts/q-and-a.check.mjs"],
  ["q-and-a", "scripts/bots.check.mjs"],
  ["flow", "scripts/flow-archive.check.mjs"],
  ["security", "scripts/security.check.mjs"],
];
if (String(process.env.APP_ORIGIN || "").trim()) {
  steps.push(["stability", "scripts/stability.mjs"]);
}

let failed = 0;
for (const [name, file] of steps) {
  const run = spawnSync(process.execPath, [path.join(ROOT, file)], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (run.status !== 0) {
    failed += 1;
    console.error("maintain fail:", name);
  }
}
if (!String(process.env.APP_ORIGIN || "").trim()) {
  console.log("stability waiting: set APP_ORIGIN to the production domain when the app is delivered");
}
if (failed) process.exit(1);
console.log("maintain ok");
