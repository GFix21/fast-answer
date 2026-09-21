import { requireAuth, json, readBody } from "../../lib/flow-auth.js";
import {
  listPlacementPages,
  loadPlacementPack,
  rejectPlacementQuestion,
  setPlacementStatus,
  listPlacementRejections,
  normalizeLocale,
} from "../../lib/placement-store.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  const url = new URL(req.url || "/", "http://localhost");
  const locale = normalizeLocale(url.searchParams.get("locale") || "en");

  if (req.method === "GET") {
    if (url.searchParams.get("pages") === "1") {
      return json(res, 200, { locale, pages: listPlacementPages(locale) });
    }
    if (url.searchParams.get("rejections") === "1") {
      return json(res, 200, { locale, rejections: listPlacementRejections(locale) });
    }
    const pack = loadPlacementPack(locale);
    const studioCounts = {};
    for (const q of pack.questions || []) {
      studioCounts[q.tier] = (studioCounts[q.tier] || 0) + 1;
    }
    return json(res, 200, {
      kind: "placement",
      locale,
      pages: listPlacementPages(locale),
      pack,
      studioCounts,
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

  if (body.action === "status") {
    if (!body.questionId || !body.status) {
      return json(res, 400, { error: "questionId and status required" });
    }
    setPlacementStatus(body.questionId, body.status, loc);
    return json(res, 200, { ok: true, locale: loc, pack: loadPlacementPack(loc) });
  }

  if (body.action === "reject" || body.questionId) {
    const result = rejectPlacementQuestion(body, loc);
    if (result.error) return json(res, result.status || 400, result);
    return json(res, 200, result);
  }

  return json(res, 400, { error: "unknown action" });
}
