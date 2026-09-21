import { requireAuth, json, readBody } from "../../lib/flow-auth.js";
import {
  listPlacementPages,
  loadPlacementPack,
  rejectPlacementQuestion,
  setPlacementStatus,
  listPlacementRejections,
} from "../../lib/placement-store.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    const url = new URL(req.url || "/", "http://localhost");
    if (url.searchParams.get("pages") === "1") {
      return json(res, 200, { pages: listPlacementPages() });
    }
    if (url.searchParams.get("rejections") === "1") {
      return json(res, 200, { rejections: listPlacementRejections() });
    }
    const pack = loadPlacementPack();
    const studioCounts = {};
    for (const q of pack.questions || []) {
      studioCounts[q.tier] = (studioCounts[q.tier] || 0) + 1;
    }
    return json(res, 200, {
      kind: "placement",
      pages: listPlacementPages(),
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

  if (body.action === "status") {
    if (!body.questionId || !body.status) {
      return json(res, 400, { error: "questionId and status required" });
    }
    setPlacementStatus(body.questionId, body.status);
    return json(res, 200, { ok: true, pack: loadPlacementPack() });
  }

  if (body.action === "reject" || body.questionId) {
    const result = rejectPlacementQuestion(body);
    if (result.error) return json(res, result.status || 400, result);
    return json(res, 200, result);
  }

  return json(res, 400, { error: "unknown action" });
}
