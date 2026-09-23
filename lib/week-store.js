/**
 * Week pack IO for Flow.
 * Packs are required relative to this module so Vercel bundles banks/weekly[/locale]/current.json.
 * Durable publish: scripts/publish-week.mjs + git push (questions.json + questions.{fr,de}.json).
 */
import { createRequire } from "node:module";
import { exportPack, countByTier, countByGeneration } from "../q-and-a/map.js";

const require = createRequire(import.meta.url);
const PACKS = {
  en: require("../banks/weekly/current.json"),
  fr: require("../banks/weekly/fr/current.json"),
  de: require("../banks/weekly/de/current.json"),
};

const LOCALES = ["en", "fr", "de"];

export function normalizeLocale(raw) {
  const v = String(raw || "en").toLowerCase().slice(0, 2);
  return LOCALES.includes(v) ? v : "en";
}

const g = globalThis;
if (!g.__faFlowReviewByLocale) {
  g.__faFlowReviewByLocale = {};
}

function reviewBucket(locale) {
  const loc = normalizeLocale(locale);
  if (!g.__faFlowReviewByLocale[loc]) {
    g.__faFlowReviewByLocale[loc] = {
      statuses: {},
      topics: [],
      rejections: [],
      regen: {},
      packOverride: null,
    };
  }
  return g.__faFlowReviewByLocale[loc];
}

export function loadCurrentPack(locale = "en") {
  const loc = normalizeLocale(locale);
  const bucket = reviewBucket(loc);
  const bundled = PACKS[loc] || PACKS.en;
  const base = bucket.packOverride
    ? structuredClone(bucket.packOverride)
    : structuredClone(bundled);
  const regen = bucket.regen || {};
  const extra = Object.values(regen);
  if (extra.length) {
    const ids = new Set((base.questions || []).map((q) => q.id));
    base.questions = [
      ...(base.questions || []),
      ...extra.filter((q) => !ids.has(q.id)),
    ];
  }
  return { ...base, locale: loc };
}

export function saveCurrentPack(pack, locale = "en") {
  reviewBucket(locale).packOverride = pack;
}

export function applyReviewOverlay(pack, locale = "en") {
  const statuses = reviewBucket(locale).statuses || {};
  const questions = (pack.questions || []).map((q) => ({
    ...q,
    status: statuses[q.id] || q.status || "pending",
  }));
  return { ...pack, questions };
}

export function setQuestionStatus(id, status, locale = "en") {
  reviewBucket(locale).statuses[id] = status;
}

export function logRejection(entry, locale = "en") {
  reviewBucket(locale).rejections.push(entry);
}

export function listRejections(locale = "en") {
  return reviewBucket(locale).rejections;
}

export function addTopicRuntime(topic) {
  // Topics stay shared (EN studio registry)
  const bucket = reviewBucket("en");
  bucket.topics.push({ ...topic, addedAt: new Date().toISOString() });
  return bucket.topics;
}

export function listRuntimeTopics() {
  return reviewBucket("en").topics;
}

export function publishToQuestions(pack, locale = "en") {
  const loc = normalizeLocale(locale);
  const bucket = reviewBucket(loc);
  const approved = {
    ...pack,
    questions: (pack.questions || []).filter((q) => {
      const st = bucket.statuses[q.id] || q.status || "pending";
      return st !== "rejected";
    }),
  };
  const exported = exportPack(approved);
  const meta = {
    weekKey: pack.weekKey,
    locale: loc,
    publishedAt: new Date().toISOString(),
    counts: countByTier(exported),
    generations: countByGeneration(exported),
    questionCount: exported.length,
    wroteToDisk: false,
    writeError:
      "Vercel Hobby FS is read-only — published bank held in memory this instance. Commit questions.json via scripts/publish-week.mjs for durable live game.",
  };
  bucket.lastPublish = meta;
  bucket.publishedBank = exported;
  return { meta, exported };
}

export function getPublishMeta(locale = "en") {
  const loc = normalizeLocale(locale);
  const bucket = reviewBucket(loc);
  if (bucket.lastPublish) return bucket.lastPublish;
  const bundled = PACKS[loc] || PACKS.en;
  const exported = exportPack(bundled);
  return {
    weekKey: bundled.weekKey,
    locale: loc,
    publishedAt: null,
    counts: countByTier(exported),
    generations: countByGeneration(exported),
    questionCount: exported.length,
    wroteToDisk: true,
    note: "Serving committed questions.json from repo deploy",
  };
}

export function listLocales() {
  return LOCALES.map((id) => ({
    id,
    weekKey: (PACKS[id] || PACKS.en).weekKey,
    questionCount: ((PACKS[id] || PACKS.en).questions || []).length,
  }));
}
