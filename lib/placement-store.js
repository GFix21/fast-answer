/**
 * Placement (Dojo) bank IO for Flow archive / reject-regen.
 * Durable source: banks/placement[/{locale}]/*.json (from Q-and-A).
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const BUNDLED = {
  en: require("../banks/placement/generational-first-pass.json"),
  fr: require("../banks/placement/fr/generational-first-pass.json"),
  de: require("../banks/placement/de/generational-first-pass.json"),
};

const LOCALES = ["en", "fr", "de"];

export function normalizeLocale(raw) {
  const v = String(raw || "en").toLowerCase().slice(0, 2);
  return LOCALES.includes(v) ? v : "en";
}

const g = globalThis;
if (!g.__faPlacementByLocale) g.__faPlacementByLocale = {};

function bucket(locale) {
  const loc = normalizeLocale(locale);
  if (!g.__faPlacementByLocale[loc]) {
    g.__faPlacementByLocale[loc] = {
      pack: null,
      statuses: {},
      rejections: [],
      regen: {},
    };
  }
  return g.__faPlacementByLocale[loc];
}

export function listPlacementPages(locale = "en") {
  const pack = loadPlacementPack(locale);
  return [
    {
      id: pack.id || "placement",
      title: pack.title || "Placement",
      questionCount: (pack.questions || []).length,
      generations: pack.generations || [],
      kind: "placement",
      locale: normalizeLocale(locale),
      updatedAt: pack.updatedAt || null,
    },
  ];
}

export function loadPlacementPack(locale = "en") {
  const loc = normalizeLocale(locale);
  const b = bucket(loc);
  const bundled = BUNDLED[loc] || BUNDLED.en;
  const base = b.pack ? structuredClone(b.pack) : structuredClone(bundled);
  const regen = b.regen || {};
  const statuses = b.statuses || {};
  const extra = Object.values(regen);
  const ids = new Set((base.questions || []).map((q) => q.id));
  const questions = [
    ...(base.questions || []).map((q) => ({
      ...q,
      status: statuses[q.id] || q.status || "pending",
    })),
    ...extra
      .filter((q) => !ids.has(q.id))
      .map((q) => ({
        ...q,
        status: statuses[q.id] || q.status || "pending",
      })),
  ];
  return { ...base, questions, kind: "placement", locale: loc };
}

export function setPlacementStatus(id, status, locale = "en") {
  bucket(locale).statuses[id] = status;
}

export function rejectPlacementQuestion(body, locale = "en") {
  const loc = normalizeLocale(locale || body.locale);
  const b = bucket(loc);
  const pack = loadPlacementPack(loc);
  const q = (pack.questions || []).find((x) => x.id === body.questionId);
  if (!q) return { error: "question not found", status: 404 };

  setPlacementStatus(q.id, "rejected", loc);
  const rejection = {
    id: `prej_${Date.now()}`,
    bank: "placement",
    locale: loc,
    questionId: q.id,
    rejectedAt: new Date().toISOString(),
    reasonCodes: body.reasonCodes || ["other"],
    note: body.note || "",
    snapshot: {
      tier: q.tier,
      topic: q.topic,
      categoryTitle: q.categoryTitle,
      prompt: q.prompt,
      choices: q.choices,
      correctIndex: q.correctIndex,
      generation: q.generation,
    },
  };

  let regenerated = null;
  if (body.replacement && body.replacement.prompt) {
    regenerated = {
      ...q,
      ...body.replacement,
      id: body.replacement.id || `${q.id}-regen`,
      status: "pending",
    };
    rejection.regeneratedQuestionId = regenerated.id;
    b.regen[regenerated.id] = regenerated;
    b.statuses[regenerated.id] = "pending";
  }

  b.rejections.push(rejection);
  const next = loadPlacementPack(loc);
  b.pack = {
    ...next,
    questions: (next.questions || []).map((x) =>
      x.id === q.id ? { ...x, status: "rejected" } : x,
    ),
    updatedAt: new Date().toISOString(),
  };

  return {
    ok: true,
    rejection,
    regenerated,
    pack: loadPlacementPack(loc),
    learningBrief:
      "Placement rejection logged. Prefer regenerating in Q-and-A placement bank then copying banks/placement/[locale]/.",
  };
}

export function listPlacementRejections(locale = "en") {
  return bucket(locale).rejections || [];
}
