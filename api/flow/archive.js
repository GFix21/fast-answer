import { requireAuth, json } from "../../lib/flow-auth.js";
import {
  listArchiveMonths,
  loadMonthIndex,
  loadArchivedWeek,
} from "../../lib/archive-store.js";
import { listPlacementPages, loadPlacementPack, normalizeLocale } from "../../lib/placement-store.js";
import { listRejectLog } from "../../lib/reject-log.js";
import { compileLessons, overlayPackWithLog } from "../../lib/reject-learn.js";
import { collectQuestionPool } from "../../lib/reject-actions.js";
import { readyBench } from "../../lib/reject-ready.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  if (!requireAuth(req, res)) return;

  const url = new URL(req.url || "/", "http://localhost");
  const month = url.searchParams.get("month");
  const week = url.searchParams.get("week");
  const locale = normalizeLocale(url.searchParams.get("locale") || "en");

  if (!month) {
    return json(res, 200, {
      locale,
      months: listArchiveMonths(),
      placementPages: listPlacementPages(locale),
    });
  }

  if (month === "placement") {
    const base = loadPlacementPack(locale);
    const log = await listRejectLog({ locale, bank: "placement" });
    const pack = overlayPackWithLog(base, log, { bank: "placement" });
    const rejectReady = readyBench(locale, collectQuestionPool(locale), compileLessons(log));
    const page = url.searchParams.get("page") || pack.id || "placement";
    const studioCounts = {};
    for (const q of pack.questions || []) {
      studioCounts[q.tier] = (studioCounts[q.tier] || 0) + 1;
    }
    return json(res, 200, {
      kind: "placement",
      locale,
      monthKey: "placement",
      pageKey: page,
      pack,
      studioCounts,
      pages: listPlacementPages(locale),
      rejectReady,
    });
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return json(res, 400, { error: "bad month key (YYYY-MM)" });
  }

  if (week) {
    if (!/^\d{4}-W\d{2}$/.test(week)) {
      return json(res, 400, { error: "bad week key (YYYY-Www)" });
    }
    const base = loadArchivedWeek(month, week);
    if (!base) return json(res, 404, { error: "week not in archive" });
    const log = await listRejectLog({ locale });
    const pack = overlayPackWithLog(base, log, { monthKey: month, weekKey: week });
    const rejectReady = readyBench(locale, collectQuestionPool(locale), compileLessons(log));
    const studioCounts = {};
    for (const q of pack.questions || []) {
      studioCounts[q.tier] = (studioCounts[q.tier] || 0) + 1;
    }
    return json(res, 200, {
      monthKey: month,
      weekKey: week,
      pack,
      studioCounts,
      rejectReady,
    });
  }

  const index = loadMonthIndex(month);
  if (!index) return json(res, 404, { error: "month not in archive" });
  return json(res, 200, { index });
}
