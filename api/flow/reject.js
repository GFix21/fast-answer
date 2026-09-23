import { requireAuth, json, readBody } from "../../lib/flow-auth.js";
import { normalizeLocale } from "../../lib/week-store.js";
import { rejectLogSnapshot } from "../../lib/reject-log.js";
import { collectQuestionPool, rejectQuestion, regenerateQuestion } from "../../lib/reject-actions.js";
import { readyBench } from "../../lib/reject-ready.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  const url = new URL(req.url || "/", "http://localhost");
  const locale = normalizeLocale(url.searchParams.get("locale") || "en");

  if (req.method === "GET") {
    const snap = await rejectLogSnapshot({ locale });
    if (url.searchParams.get("download") === "1") {
      return json(res, 200, snap, {
        "content-disposition": 'attachment; filename="rejected-questions.json"',
      });
    }
    return json(res, 200, {
      locale,
      rejections: snap.entries,
      lessons: snap.lessons,
      updatedAt: snap.updatedAt,
      qaConnected: false,
      rejectReady: readyBench(locale, collectQuestionPool(locale), snap.lessons),
    });
  }

  if (req.method !== "POST") return json(res, 405, { error: "method" });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: "Invalid JSON" });
  }

  const loc = normalizeLocale(body.locale || locale);
  const payload = { ...body, locale: loc };
  const action = body.action || (body.replacement || body.regenerate ? "regenerate" : "reject");
  const result = action === "regenerate"
    ? await regenerateQuestion(payload)
    : await rejectQuestion(payload);
  if (result.error) return json(res, result.status || 400, result);
  return json(res, 200, result);
}
