import { requireAuth, json, readBody } from "../../lib/flow-auth.js";
import {
  loadCurrentPack,
  setQuestionStatus,
  logRejection,
  listRejections,
} from "../../lib/week-store.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    return json(res, 200, { rejections: listRejections() });
  }

  if (req.method !== "POST") return json(res, 405, { error: "method" });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: "Invalid JSON" });
  }

  const pack = loadCurrentPack();
  const q = (pack?.questions || []).find((x) => x.id === body.questionId);
  if (!q) return json(res, 404, { error: "question not found" });

  setQuestionStatus(q.id, "rejected");
  const rejection = {
    id: `rej_${Date.now()}`,
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
    // In-memory only — durable regen goes through Q-and-A studio
    const g = globalThis;
    if (!g.__faFlowReview) g.__faFlowReview = { statuses: {}, topics: [], rejections: [] };
    g.__faFlowReview.regen = g.__faFlowReview.regen || {};
    g.__faFlowReview.regen[regenerated.id] = regenerated;
    g.__faFlowReview.statuses[regenerated.id] = "pending";
  }

  logRejection(rejection);
  return json(res, 200, {
    ok: true,
    rejection,
    regenerated,
    learningBrief:
      "Logged rejection for studio. Prefer regenerating in Q-and-A (rejectAndRegenerate) then re-export the week pack.",
  });
}
