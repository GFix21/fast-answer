#!/usr/bin/env node
/**
 * Static security pass for the app source.
 * It reports the file, never the secret. Question banks are not scanned.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set([".git", "node_modules", "banks", "jeremy", "studio", "promo", "sounds"]);
const CODE = new Set([".js", ".mjs", ".html", ".css", ".yml", ".yaml", ".json"]);

const failures = [];
const warnings = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      walk(file);
      continue;
    }
    if (!CODE.has(path.extname(name))) continue;
    if (name.startsWith("questions")) continue;
    const text = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file);
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)) {
      failures.push(`${rel}: private key`);
    }
    if (rel === "lib/flow-auth.js" && /FLOW_BOOTSTRAP\s*=\s*["']/.test(text)) {
      failures.push(`${rel}: studio password is still hardcoded. Set FLOW_PASSWORD and remove the fallback.`);
    }
  }
}

walk(ROOT);

for (const line of warnings) console.log("security warning:", line);
if (failures.length) {
  for (const line of failures) console.error("security fail:", line);
  process.exit(1);
}
console.log("security check ok", { warnings: warnings.length, failures: 0 });
