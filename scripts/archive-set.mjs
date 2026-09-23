#!/usr/bin/env node
/**
 * One click once the live set is 4 days old.
 * Gzips the four language files into banks/sets/YEAR/MONTH/WEEK.
 * A ready set in banks/sets/ready/ takes the live files.
 * With no ready set, the gzip is written and the live questions stay so the show still plays.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { archiveDecision, pipelineStatus, SET_DAYS } from "../lib/set-rotation.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = path.join(ROOT, "banks/sets/current.json");
const READY = path.join(ROOT, "banks/sets/ready");
const LIVE = [
  ["en", "questions.json"],
  ["fr", "questions.fr.json"],
  ["fr-CA", "questions.fr-CA.json"],
  ["de", "questions.de.json"],
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const marker = fs.existsSync(MARKER) ? readJson(MARKER) : null;
const hasReady = LIVE.every(([, file]) => fs.existsSync(path.join(READY, file)));
const now = Date.now();
const decision = archiveDecision(marker, now, { hasReady });
console.log(pipelineStatus(marker, now, { hasReady }));

if (decision.action === "keep" || decision.action === "wait") {
  console.log(`not due (every ${SET_DAYS} days). next switch ${decision.switchAt}`);
  process.exit(0);
}

const bundle = {
  id: marker.id,
  startedAt: marker.startedAt,
  archivedAt: new Date(now).toISOString(),
  questionCount: marker.questionCount,
  locales: {},
};
for (const [loc, file] of LIVE) {
  bundle.locales[loc] = readJson(path.join(ROOT, file));
}
const dir = path.join(ROOT, decision.folder.rel);
fs.mkdirSync(dir, { recursive: true });
const gzName = `${marker.id}.json.gz`;
fs.writeFileSync(path.join(dir, gzName), zlib.gzipSync(Buffer.from(JSON.stringify(bundle))));
const indexPath = path.join(dir, "index.json");
const index = fs.existsSync(indexPath) ? readJson(indexPath) : { sets: [] };
if (!index.sets.some((row) => row.file === gzName)) {
  index.sets.push({ id: marker.id, file: gzName, archivedAt: bundle.archivedAt, questionCount: marker.questionCount });
}
fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`archived ${gzName} → ${decision.folder.rel}`);

if (decision.action === "archive-only") {
  const next = { ...marker, archivedAt: bundle.archivedAt };
  fs.writeFileSync(MARKER, `${JSON.stringify(next, null, 2)}\n`);
  console.log("no ready set — live questions stay");
  process.exit(0);
}

for (const [, file] of LIVE) {
  fs.copyFileSync(path.join(READY, file), path.join(ROOT, file));
}
const started = new Date(now).toISOString();
const readyAt = new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString();
const switchAt = new Date(now + SET_DAYS * 24 * 60 * 60 * 1000).toISOString();
const fresh = {
  id: started.slice(0, 10),
  startedAt: started,
  questionCount: 1050,
  readyAt,
  switchAt,
  locales: marker.locales || LIVE.map(([loc]) => loc),
};
fs.writeFileSync(MARKER, `${JSON.stringify(fresh, null, 2)}\n`);
console.log(`ready set is now live until ${switchAt}`);
