/**
 * Week pack IO for Flow. Reads banks/weekly/current.json (or weekKey file).
 * Writes are best-effort — durable publish is via scripts/publish-week.mjs + git.
 */
import fs from "node:fs";
import path from "node:path";
import { exportPack, countByTier } from "../q-and-a/map.js";

export const ROOT = process.cwd();
export const BANKS = path.join(ROOT, "banks/weekly");
export const CURRENT = path.join(BANKS, "current.json");
export const QUESTIONS = path.join(ROOT, "questions.json");
export const PUBLISH_META = path.join(BANKS, "publish-meta.json");

const g = globalThis;
if (!g.__faFlowReview) g.__faFlowReview = { statuses: {}, topics: [], rejections: [], regen: {} };

export function loadCurrentPack() {
  const candidates = [CURRENT, path.join(BANKS, "2026-W39.json")];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        const pack = JSON.parse(fs.readFileSync(file, "utf8"));
        const regen = g.__faFlowReview.regen || {};
        const extra = Object.values(regen);
        if (extra.length) {
          const ids = new Set(pack.questions.map((q) => q.id));
          pack.questions = [
            ...pack.questions,
            ...extra.filter((q) => !ids.has(q.id)),
          ];
        }
        return pack;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

export function saveCurrentPack(pack) {
  fs.mkdirSync(BANKS, { recursive: true });
  fs.writeFileSync(CURRENT, `${JSON.stringify(pack, null, 2)}\n`);
}

export function applyReviewOverlay(pack) {
  const statuses = g.__faFlowReview.statuses || {};
  const questions = (pack.questions || []).map((q) => ({
    ...q,
    status: statuses[q.id] || q.status || "pending",
  }));
  return { ...pack, questions };
}

export function setQuestionStatus(id, status) {
  g.__faFlowReview.statuses[id] = status;
}

export function logRejection(entry) {
  g.__faFlowReview.rejections.push(entry);
}

export function listRejections() {
  return g.__faFlowReview.rejections;
}

export function addTopicRuntime(topic) {
  g.__faFlowReview.topics.push({ ...topic, addedAt: new Date().toISOString() });
  return g.__faFlowReview.topics;
}

export function listRuntimeTopics() {
  return g.__faFlowReview.topics;
}

export function publishToQuestions(pack) {
  const approved = {
    ...pack,
    questions: (pack.questions || []).filter((q) => {
      const st = g.__faFlowReview.statuses[q.id] || q.status || "pending";
      return st !== "rejected";
    }),
  };
  const exported = exportPack(approved);
  let wrote = false;
  let writeError = null;
  try {
    fs.writeFileSync(QUESTIONS, `${JSON.stringify(exported, null, 2)}\n`);
    wrote = true;
  } catch (e) {
    writeError = String(e?.message || e);
  }
  const meta = {
    weekKey: pack.weekKey,
    publishedAt: new Date().toISOString(),
    counts: countByTier(exported),
    questionCount: exported.length,
    wroteToDisk: wrote,
    writeError,
  };
  try {
    fs.writeFileSync(PUBLISH_META, `${JSON.stringify(meta, null, 2)}\n`);
  } catch {
    /* ignore */
  }
  g.__faFlowReview.lastPublish = meta;
  g.__faFlowReview.publishedBank = exported;
  return { meta, exported };
}

export function getPublishMeta() {
  if (g.__faFlowReview.lastPublish) return g.__faFlowReview.lastPublish;
  try {
    if (fs.existsSync(PUBLISH_META)) {
      return JSON.parse(fs.readFileSync(PUBLISH_META, "utf8"));
    }
  } catch { /* ignore */ }
  try {
    if (fs.existsSync(QUESTIONS)) {
      const q = JSON.parse(fs.readFileSync(QUESTIONS, "utf8"));
      return {
        weekKey: "questions.json",
        publishedAt: null,
        counts: countByTier(q),
        questionCount: q.length,
        wroteToDisk: true,
      };
    }
  } catch { /* ignore */ }
  return null;
}
