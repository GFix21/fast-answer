/**
 * Activated Dojo profiles for Flow.
 * Memory on this instance, plus data/profiles.json and /tmp when writable.
 * Password hashes stay on the phone — this list is name, email, and activation.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import seedProfiles from "../data/profiles.json" with { type: "json" };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = process.env.FA_PROFILES_PATH || path.join(ROOT, "data", "profiles.json");
const TMP = process.env.FA_PROFILES_TMP || "/tmp/fa-profiles.json";

const g = globalThis;
if (!g.__faProfiles) g.__faProfiles = { loaded: false, list: [] };

export function isEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readJson(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.profiles)) return data.profiles;
  } catch { /* missing or unreadable */ }
  return [];
}

function normalize(raw) {
  const email = String(raw?.email || "").trim().toLowerCase();
  if (!isEmail(email)) return null;
  const displayName = String(raw?.displayName || "").trim().slice(0, 40);
  if (!displayName) return null;
  const activatedAt = String(raw?.activatedAt || raw?.updatedAt || new Date().toISOString());
  return {
    id: String(raw?.id || email).slice(0, 64),
    displayName,
    email,
    activated: true,
    activatedAt,
    updatedAt: String(raw?.updatedAt || activatedAt),
  };
}

function ensureLoaded() {
  if (g.__faProfiles.loaded) return;
  const merged = new Map();
  const seed = Array.isArray(seedProfiles) ? seedProfiles : [];
  for (const raw of [...seed, ...readJson(FILE), ...readJson(TMP)]) {
    const rec = normalize(raw);
    if (rec) merged.set(rec.email, rec);
  }
  g.__faProfiles.list = [...merged.values()];
  g.__faProfiles.loaded = true;
}

function persist() {
  const body = JSON.stringify(g.__faProfiles.list, null, 2);
  for (const file of [TMP, FILE]) {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, body);
    } catch { /* read-only deploy filesystem */ }
  }
}

export function activateProfile(input) {
  ensureLoaded();
  const email = String(input?.email || "").trim().toLowerCase();
  if (!isEmail(email)) {
    const err = new Error("email");
    err.code = "email";
    throw err;
  }
  const displayName = String(input?.displayName || "").trim().slice(0, 40);
  if (!displayName) {
    const err = new Error("name");
    err.code = "name";
    throw err;
  }
  const now = new Date().toISOString();
  const id = String(input?.id || "").trim().slice(0, 64) || email;
  const list = g.__faProfiles.list;
  const idx = list.findIndex((p) => p.email === email || p.id === id);
  const rec = {
    id: idx >= 0 ? list[idx].id : id,
    displayName,
    email,
    activated: true,
    activatedAt: idx >= 0 ? list[idx].activatedAt : now,
    updatedAt: now,
  };
  if (idx >= 0) list[idx] = rec;
  else list.push(rec);
  persist();
  return { ...rec };
}

export function listProfiles() {
  ensureLoaded();
  return g.__faProfiles.list
    .map((p) => ({ ...p, activated: true }))
    .sort((a, b) => String(b.activatedAt).localeCompare(String(a.activatedAt)));
}

function csvCell(value) {
  let s = String(value ?? "");
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function mailingListCsv() {
  const rows = [["email", "name", "activated"]];
  const seen = new Set();
  for (const p of listProfiles()) {
    if (!p.email || seen.has(p.email)) continue;
    seen.add(p.email);
    rows.push([p.email, p.displayName, p.activatedAt]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

/** Test helper — drop the in-memory list so the next read reloads disk. */
export function resetProfileStoreForTests() {
  g.__faProfiles.loaded = false;
  g.__faProfiles.list = [];
}
