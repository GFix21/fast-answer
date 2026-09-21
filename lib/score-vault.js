/**
 * Set-in-stone top scores, one folder per profile.
 * data/profile-vault/<id>/scores.json plus /tmp when the deploy disk is read-only.
 * A write only adds or keeps higher rows. It never drops a saved score for a lower one.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = process.env.FA_SCORE_DIR || path.join(ROOT, "data", "profile-vault");
const TMP = process.env.FA_SCORE_TMP || "/tmp/fa-profile-vault";
const KEEP = 12;

const g = globalThis;
if (!g.__faScoreVault) g.__faScoreVault = new Map();

export function vaultId(raw) {
  const id = String(raw || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return id || "";
}

function fileFor(root, id) {
  return path.join(root, id, "scores.json");
}

function readFile(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.scores)) return data.scores;
  } catch { /* missing */ }
  return [];
}

function normalizeRow(raw) {
  const score = Math.round(Number(raw?.score));
  if (!Number.isFinite(score) || score < 0) return null;
  const at = String(raw?.at || new Date().toISOString()).slice(0, 40);
  return {
    score,
    at,
    displayName: String(raw?.displayName || "").trim().slice(0, 40),
  };
}

export function mergeScores(lists) {
  const rows = [];
  for (const list of lists) {
    for (const raw of list || []) {
      const row = normalizeRow(raw);
      if (row) rows.push(row);
    }
  }
  rows.sort((a, b) => b.score - a.score || String(b.at).localeCompare(String(a.at)));
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = `${row.score}|${row.at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= KEEP) break;
  }
  return out;
}

function load(id) {
  if (g.__faScoreVault.has(id)) return g.__faScoreVault.get(id);
  const scores = mergeScores([
    readFile(fileFor(DIR, id)),
    readFile(fileFor(TMP, id)),
  ]);
  g.__faScoreVault.set(id, scores);
  return scores;
}

function write(id, scores) {
  const body = JSON.stringify({ scores }, null, 2);
  for (const root of [TMP, DIR]) {
    try {
      const file = fileFor(root, id);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, body);
    } catch { /* read-only */ }
  }
}

export function readScores(rawId) {
  const id = vaultId(rawId);
  if (!id) return [];
  return load(id).slice();
}

export function recordScore(rawId, entry) {
  const id = vaultId(rawId);
  if (!id) {
    const err = new Error("id");
    err.code = "id";
    throw err;
  }
  const row = normalizeRow(entry);
  if (!row) {
    const err = new Error("score");
    err.code = "score";
    throw err;
  }
  const next = mergeScores([load(id), [row]]);
  g.__faScoreVault.set(id, next);
  write(id, next);
  return next.slice();
}

export function resetScoreVaultForTests() {
  g.__faScoreVault = new Map();
}
