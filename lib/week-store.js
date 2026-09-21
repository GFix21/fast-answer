/**
 * Week pack IO for Flow.
 * Pack is required relative to this module so Vercel bundles banks/weekly/current.json.
 * Durable publish: scripts/publish-week.mjs + git push (questions.json).
 */
import { createRequire } from "node:module";
import { exportPack, countByTier } from "../q-and-a/map.js";

const require = createRequire(import.meta.url);
const currentPack = require("../banks/weekly/current.json");

const g = globalThis;
if (!g.__faFlowReview) {
  g.__faFlowReview = {
    statuses: {},
    topics: [],
    rejections: [],
    regen: {},
    packOverride: null,
  };
}

export function loadCurrentPack() {
  const base = g.__faFlowReview.packOverride
    ? structuredClone(g.__faFlowReview.packOverride)
    : structuredClone(currentPack);
  const regen = g.__faFlowReview.regen || {};
  const extra = Object.values(regen);
  if (extra.length) {
    const ids = new Set((base.questions || []).map((q) => q.id));
    base.questions = [
      ...(base.questions || []),
      ...extra.filter((q) => !ids.has(q.id)),
    ];
  }
  return base;
}

export function saveCurrentPack(pack) {
  g.__faFlowReview.packOverride = pack;
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
  const meta = {
    weekKey: pack.weekKey,
    publishedAt: new Date().toISOString(),
    counts: countByTier(exported),
    questionCount: exported.length,
    wroteToDisk: false,
    writeError:
      "Vercel Hobby FS is read-only — published bank held in memory this instance. Commit questions.json via scripts/publish-week.mjs for durable live game.",
  };
  g.__faFlowReview.lastPublish = meta;
  g.__faFlowReview.publishedBank = exported;
  return { meta, exported };
}

export function getPublishMeta() {
  if (g.__faFlowReview.lastPublish) return g.__faFlowReview.lastPublish;
  const exported = exportPack(currentPack);
  return {
    weekKey: currentPack.weekKey,
    publishedAt: null,
    counts: countByTier(exported),
    questionCount: exported.length,
    wroteToDisk: true,
    note: "Serving committed questions.json from repo deploy",
  };
}
