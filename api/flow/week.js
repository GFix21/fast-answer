import { requireAuth, json, readBody } from "../../lib/flow-auth.js";
import {
  loadCurrentPack,
  applyReviewOverlay,
  setQuestionStatus,
  getPublishMeta,
  normalizeLocale,
  listLocales,
} from "../../lib/week-store.js";
import { countByTier } from "../../q-and-a/map.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  const url = new URL(req.url || "/", "http://localhost");
  const locale = normalizeLocale(url.searchParams.get("locale") || "en");

  if (req.method === "GET") {
    const pack = loadCurrentPack(locale);
    if (!pack) return json(res, 404, { error: "no week pack" });
    const overlaid = applyReviewOverlay(pack, locale);
    const studioCounts = {};
    for (const q of overlaid.questions) {
      studioCounts[q.tier] = (studioCounts[q.tier] || 0) + 1;
    }
    const statusCounts = { pending: 0, approved: 0, rejected: 0 };
    for (const q of overlaid.questions) {
      const s = q.status || "pending";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }
    return json(res, 200, {
      locale,
      locales: listLocales(),
      pack: overlaid,
      studioCounts,
      statusCounts,
      publish: getPublishMeta(locale),
      mappedPreviewCounts: countByTier(
        overlaid.questions
          .filter((q) => q.status !== "rejected")
          .map((q) => ({
            tier: q.tier === "finale" ? "extreme" : q.tier,
          })),
      ),
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
    const loc = normalizeLocale(body.locale || locale);
    if (body.action === "status" && body.id && body.status) {
      if (!["pending", "approved", "rejected"].includes(body.status)) {
        return json(res, 400, { error: "bad status" });
      }
      setQuestionStatus(body.id, body.status, loc);
      return json(res, 200, { ok: true, id: body.id, status: body.status, locale: loc });
    }
    return json(res, 400, { error: "unknown action" });
  }

  return json(res, 405, { error: "method" });
}
