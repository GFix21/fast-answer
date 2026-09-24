#!/usr/bin/env node
/**
 * On Vercel, copy full banks (with the answer key) into api/private-banks
 * and strip the key from the public JSON. Local and CI keep the full files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripBank } from "../lib/strip-answers.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEST = path.join(ROOT, "api/private-banks");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "private-banks" || name === ".git") continue;
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith(".json")) out.push(abs);
  }
  return out;
}

const targets = [
  ...["questions.json", "questions.fr.json", "questions.fr-CA.json", "questions.de.json"].map((file) => path.join(ROOT, file)),
  ...walk(path.join(ROOT, "banks")),
];

if (process.env.VERCEL !== "1") {
  console.log("seal-public-banks: public files left intact (not a Vercel build)");
  process.exit(0);
}

let sealed = 0;
for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.includes('"correctIndex"')) continue;
  const rel = path.relative(ROOT, file);
  const dest = path.join(DEST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
  fs.writeFileSync(file, JSON.stringify(stripBank(JSON.parse(raw))));
  sealed += 1;
}
console.log("seal-public-banks: stripped public answer keys", { sealed });
