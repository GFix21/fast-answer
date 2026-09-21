/**
 * Placement (Dojo) bank IO for Flow archive / reject-regen.
 * Durable source: banks/placement/*.json (from Q-and-A).
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bundled = require("../banks/placement/generational-first-pass.json");

const g = globalThis;
if (!g.__faPlacement) {
  g.__faPlacement = {
    pack: null,
    statuses: {},
    rejections: [],
    regen: {},
  };
}

export function listPlacementPages() {
  const pack = loadPlacementPack();
  return [
    {
      id: pack.id || "placement",
      title: pack.title || "Placement",
      questionCount: (pack.questions || []).length,
      generations: pack.generations || [],
      kind: "placement",
      updatedAt: pack.updatedAt || null,
    },
  ];
}

export function loadPlacementPack() {
  const base = g.__faPlacement.pack
    ? structuredClone(g.__faPlacement.pack)
    : structuredClone(bundled);
  const regen = g.__faPlacement.regen || {};
  const statuses = g.__faPlacement.statuses || {};
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
  return { ...base, questions, kind: "placement" };
}

export function setPlacementStatus(id, status) {
  g.__faPlacement.statuses[id] = status;
}

export function rejectPlacementQuestion(body) {
  const pack = loadPlacementPack();
  const q = (pack.questions || []).find((x) => x.id === body.questionId);
  if (!q) return { error: "question not found", status: 404 };

  setPlacementStatus(q.id, "rejected");
  const rejection = {
    id: `prej_${Date.now()}`,
    bank: "placement",
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
    g.__faPlacement.regen[regenerated.id] = regenerated;
    g.__faPlacement.statuses[regenerated.id] = "pending";
  }

  g.__faPlacement.rejections.push(rejection);
  // Keep rejected item in pack overlay for Flow browsing
  const next = loadPlacementPack();
  g.__faPlacement.pack = {
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
    pack: loadPlacementPack(),
    learningBrief:
      "Placement rejection logged. Prefer regenerating in Q-and-A placement bank then copying banks/placement/.",
  };
}

export function listPlacementRejections() {
  return g.__faPlacement.rejections || [];
}
