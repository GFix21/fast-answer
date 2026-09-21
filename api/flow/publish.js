import { requireAuth, json } from "../../lib/flow-auth.js";
import {
  loadCurrentPack,
  applyReviewOverlay,
  publishToQuestions,
} from "../../lib/week-store.js";
import { archivePublishedWeek } from "../../lib/archive-store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  if (!requireAuth(req, res)) return;
  const pack = loadCurrentPack();
  if (!pack) return json(res, 404, { error: "no week pack" });
  const overlaid = applyReviewOverlay(pack);
  const { meta, exported } = publishToQuestions(overlaid);
  const archive = archivePublishedWeek(overlaid, {
    publishedAt: meta.publishedAt,
    counts: meta.counts,
  });
  return json(res, 200, {
    ok: true,
    meta,
    archive: {
      monthKey: archive.monthKey,
      weekKey: archive.weekKey,
      wroteToDisk: archive.wroteToDisk,
      writeError: archive.writeError || undefined,
      summary: archive.summary,
    },
    note: meta.wroteToDisk
      ? "Wrote questions.json on this instance. Commit + redeploy for durable Hobby hosting."
      : "Filesystem read-only on this instance — bank cached in memory. Run scripts/publish-week.mjs locally and push for durable publish (includes monthly archive).",
    sampleIds: exported.slice(0, 5).map((q) => q.id),
  });
}
