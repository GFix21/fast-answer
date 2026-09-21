import { requireAuth, json, readBody } from "../../lib/flow-auth.js";
import {
  loadCurrentPack,
  setQuestionStatus,
  logRejection,
  listRejections,
  normalizeLocale,
} from "../../lib/week-store.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  const url = new URL(req.url || "/", "http://localhost");
  const locale = normalizeLocale(url.searchParams.get("locale") || "en");

  if (req.method === "GET") {
    return json(res, 200, { locale, rejections: listRejections(locale) });
  }

  if (req.method !== "POST") return json(res, 405, { error: "method" });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: "Invalid JSON" });
  }

  const loc = normalizeLocale(body.locale || locale);
  const pack = loadCurrentPack(loc);
  const q = (pack?.questions || []).find((x) => x.id === body.questionId);
  if (!q) return json(res, 404, { error: "question not found" });

  setQuestionStatus(q.id, "rejected", loc);
  const rejection = {
    id: `rej_${Date.now()}`,
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
    const g = globalThis;
    if (!g.__faFlowReviewByLocale) g.__faFlowReviewByLocale = {};
    if (!g.__faFlowReviewByLocale[loc]) {
      g.__faFlowReviewByLocale[loc] = {
        statuses: {},
        topics: [],
        rejections: [],
        regen: {},
        packOverride: null,
      };
    }
    const bucket = g.__faFlowReviewByLocale[loc];
    bucket.regen = bucket.regen || {};
    bucket.regen[regenerated.id] = regenerated;
    bucket.statuses[regenerated.id] = "pending";
  }

  logRejection(rejection, loc);
  return json(res, 200, {
    ok: true,
    locale: loc,
    rejection,
    regenerated,
    learningBrief:
      "Logged rejection for studio. Prefer regenerating in Q-and-A (rejectAndRegenerate) then re-export the week pack.",
  });
}
