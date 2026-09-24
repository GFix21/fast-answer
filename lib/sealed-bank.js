/**
 * Full banks (with correctIndex) live in api/private-banks after the Vercel
 * build copies them there and strips the public copies.
 * Locally and in CI the public files are still the full banks.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function sealedPath(rel) {
  return path.join(ROOT, "api/private-banks", rel);
}

export function publicPath(rel) {
  return path.join(ROOT, rel);
}

function sealedCandidates(rel) {
  return [
    sealedPath(rel),
    path.join(process.cwd(), "api/private-banks", rel),
  ];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function readSealed(rel) {
  for (const file of [...sealedCandidates(rel), publicPath(rel)]) {
    try {
      if (!fs.existsSync(file)) continue;
      return readJson(file);
    } catch { /* try the next copy */ }
  }
  return null;
}

/** Prefer the unstripped copy. Sealed wins when the build has created it. */
export function readFullBank(rel) {
  for (const file of sealedCandidates(rel)) {
    if (fs.existsSync(file)) return readJson(file);
  }
  return readJson(publicPath(rel));
}
