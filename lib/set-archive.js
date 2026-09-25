/**
 * A four-day set stays playable until playUntil.
 * After that, Flow can zip it for download and the game can replay it.
 * The banked folder is not deleted.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipFiles } from "./zip-store.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function flowRoot() {
  const sealed = path.join(ROOT, "api/private-banks/banks/flow");
  return fs.existsSync(sealed) ? sealed : path.join(ROOT, "banks/flow");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function setFinished(manifest, now = Date.now()) {
  if (!manifest || manifest.status === "quality") return false;
  const end = new Date(manifest.playUntil || 0).getTime();
  return Number.isFinite(end) && end > 0 && new Date(now).getTime() >= end;
}

export function listFlowSets(now = Date.now()) {
  if (!fs.existsSync(flowRoot())) return [];
  const rows = [];
  for (const name of fs.readdirSync(flowRoot())) {
    const manifestPath = path.join(flowRoot(), name, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = readJson(manifestPath);
    const finished = setFinished(manifest, now);
    const counts = manifest.counts || {};
    const questions = Object.values(counts).reduce((n, row) => n + (Number(row?.questions) || 0), 0);
    rows.push({
      id: manifest.id || name,
      folder: manifest.folder || name,
      startedAt: manifest.startedAt || "",
      playUntil: manifest.playUntil || "",
      status: finished ? "archived" : (manifest.status || "banked"),
      archived: finished,
      questions,
      locales: manifest.locales || [],
    });
  }
  return rows.sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
}

function setDir(id) {
  const rows = listFlowSets();
  const row = rows.find((r) => r.id === id || r.folder === id);
  if (!row) return null;
  const dir = path.join(flowRoot(), row.folder);
  return fs.existsSync(dir) ? { ...row, dir } : null;
}

function filesIn(dir, base = dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) out.push(...filesIn(abs, base));
    else out.push({ name: path.relative(base, abs).split(path.sep).join("/"), data: fs.readFileSync(abs) });
  }
  return out;
}

export function zipFlowSet(id, now = Date.now()) {
  const row = setDir(id);
  if (!row) return { error: "Unknown set" };
  if (!row.archived && !setFinished(readJson(path.join(row.dir, "manifest.json")), now)) {
    return { error: "This set is still in its 4-day run", status: 409 };
  }
  const cache = globalThis.__faSetZips || (globalThis.__faSetZips = new Map());
  if (!cache.has(row.id)) cache.set(row.id, zipFiles(filesIn(row.dir)));
  return { id: row.id, folder: row.folder, zip: cache.get(row.id) };
}

export function replayQuestions(id, locale = "en", now = Date.now()) {
  const row = setDir(id);
  if (!row) return { error: "Unknown set" };
  if (!setFinished(readJson(path.join(row.dir, "manifest.json")), now)) {
    return { error: "This set is still in its 4-day run", status: 409 };
  }
  const loc = ["en", "fr-CA", "de", "fr"].includes(locale) ? locale : "en";
  const genDir = path.join(row.dir, loc, "generations");
  const questions = [];
  if (fs.existsSync(genDir)) {
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        if (fs.statSync(abs).isDirectory()) walk(abs);
        else if (name.endsWith(".json")) {
          const pack = readJson(abs);
          for (const q of pack.questions || []) questions.push(q);
        }
      }
    };
    walk(genDir);
  }
  return { id: row.id, folder: row.folder, locale: loc, questions };
}
