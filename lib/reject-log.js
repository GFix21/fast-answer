/**
 * Durable rejected-question log for Flow.
 * Files cover one machine. On Vercel, Runtime Cache is the shared copy
 * so Archives, Reject, and Queue see the same lessons without Q-and-A.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileLessons } from "./reject-learn.js";
import { normalizeFlowLocale } from "./flow-locale.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_KEY = "log";

function logPaths() {
  const dir = process.env.FA_REJECT_DIR || path.join(ROOT, "data", "rejected-questions");
  return {
    file: path.join(dir, "log.json"),
    tmp: process.env.FA_REJECT_TMP || "/tmp/fa-rejected-questions.json",
  };
}

const g = globalThis;
if (!g.__faRejectLog) g.__faRejectLog = { entries: [], updatedAt: null };
/** @type {null | { get: () => Promise<unknown>, set: (value: unknown) => Promise<void> }} */
let testCache = null;

export function setRejectCacheForTests(cache) {
  testCache = cache;
}

export function resetRejectLogForTests() {
  g.__faRejectLog = { entries: [], updatedAt: null };
}

function emptyDoc() {
  return { entries: [], updatedAt: null };
}

function readJson(file) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    if (raw && Array.isArray(raw.entries)) return raw;
  } catch { /* missing or broken */ }
  return null;
}

function writeJson(file, doc) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
  } catch { /* read-only deploy */ }
}

async function cacheHandle() {
  if (testCache) return testCache;
  if (!process.env.VERCEL) return null;
  try {
    const { getCache } = await import("@vercel/functions");
    const cache = getCache({ namespace: "fa-rejects" });
    return {
      get: () => cache.get(CACHE_KEY),
      set: (value) => cache.set(CACHE_KEY, value, { ttl: Math.ceil(TTL_MS / 1000), name: "fa-rejects" }),
    };
  } catch {
    return null;
  }
}

function mergeDocs(...docs) {
  const byId = new Map();
  let updatedAt = null;
  for (const doc of docs) {
    if (!doc || !Array.isArray(doc.entries)) continue;
    if (doc.updatedAt && (!updatedAt || String(doc.updatedAt) > String(updatedAt))) {
      updatedAt = doc.updatedAt;
    }
    for (const entry of doc.entries) {
      if (!entry || !entry.id) continue;
      const prev = byId.get(entry.id);
      if (!prev || String(entry.rejectedAt || "") >= String(prev.rejectedAt || "")) {
        byId.set(entry.id, entry);
      }
    }
  }
  const entries = [...byId.values()].sort((a, b) =>
    String(b.rejectedAt || "").localeCompare(String(a.rejectedAt || "")),
  );
  return { entries, updatedAt };
}

async function loadDoc() {
  let cached = null;
  try {
    const handle = await cacheHandle();
    const hit = handle ? await handle.get() : null;
    if (hit && Array.isArray(hit.entries)) cached = hit;
  } catch { /* cache miss */ }
  if (cached) {
    g.__faRejectLog = { entries: cached.entries, updatedAt: cached.updatedAt || null };
    return g.__faRejectLog;
  }
  const { file, tmp } = logPaths();
  const doc = mergeDocs(
    readJson(file),
    readJson(tmp),
    g.__faRejectLog,
    emptyDoc(),
  );
  g.__faRejectLog = doc;
  return doc;
}

async function commit(doc) {
  const next = {
    entries: Array.isArray(doc.entries) ? doc.entries : [],
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
  g.__faRejectLog = next;
  const { file, tmp } = logPaths();
  writeJson(tmp, next);
  writeJson(file, next);
  try {
    const handle = await cacheHandle();
    if (handle) await handle.set(next);
  } catch { /* local dev has no runtime cache */ }
  return next;
}

export async function listRejectLog(filter = {}) {
  const doc = await loadDoc();
  let entries = doc.entries || [];
  if (filter.locale) {
    const loc = normalizeFlowLocale(filter.locale);
    entries = entries.filter((e) => !e.locale || normalizeFlowLocale(e.locale) === loc);
  }
  if (filter.bank) entries = entries.filter((e) => e.bank === filter.bank);
  return entries;
}

export async function rejectLogSnapshot(filter = {}) {
  const entries = await listRejectLog(filter);
  return {
    entries,
    lessons: compileLessons(entries),
    updatedAt: g.__faRejectLog?.updatedAt || null,
    qaConnected: false,
  };
}

export async function appendRejection(entry) {
  const doc = await loadDoc();
  const next = {
    id: entry.id || `rej_${Date.now()}`,
    bank: entry.bank || "weekly",
    locale: normalizeFlowLocale(entry.locale || "en"),
    questionId: entry.questionId,
    rejectedAt: entry.rejectedAt || new Date().toISOString(),
    reasonCodes: entry.reasonCodes || ["other"],
    note: entry.note || "",
    snapshot: entry.snapshot || {},
    monthKey: entry.monthKey || null,
    weekKey: entry.weekKey || null,
    regeneratedQuestionId: entry.regeneratedQuestionId || null,
  };
  const entries = [next, ...(doc.entries || []).filter((e) => e.id !== next.id)];
  await commit({ entries, updatedAt: next.rejectedAt });
  return next;
}

export async function markRegenerated(questionId, regeneratedQuestionId, locale, replacement) {
  const doc = await loadDoc();
  const loc = locale ? normalizeFlowLocale(locale) : null;
  let hit = null;
  const entries = (doc.entries || []).map((e) => {
    if (e.questionId !== questionId) return e;
    if (loc && e.locale && e.locale !== loc) return e;
    if (e.regeneratedQuestionId) return e;
    if (!hit) {
      hit = {
        ...e,
        regeneratedQuestionId,
        regeneratedAt: new Date().toISOString(),
        replacement: replacement || null,
      };
      return hit;
    }
    return e;
  });
  await commit({ entries, updatedAt: new Date().toISOString() });
  return hit;
}
