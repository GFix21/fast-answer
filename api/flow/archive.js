import { requireAuth, json } from "../../lib/flow-auth.js";
import {
  listArchiveMonths,
  loadMonthIndex,
  loadArchivedWeek,
} from "../../lib/archive-store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  if (!requireAuth(req, res)) return;

  const url = new URL(req.url || "/", "http://localhost");
  const month = url.searchParams.get("month");
  const week = url.searchParams.get("week");

  if (!month) {
    return json(res, 200, { months: listArchiveMonths() });
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return json(res, 400, { error: "bad month key (YYYY-MM)" });
  }

  if (week) {
    if (!/^\d{4}-W\d{2}$/.test(week)) {
      return json(res, 400, { error: "bad week key (YYYY-Www)" });
    }
    const pack = loadArchivedWeek(month, week);
    if (!pack) return json(res, 404, { error: "week not in archive" });
    const studioCounts = {};
    for (const q of pack.questions || []) {
      studioCounts[q.tier] = (studioCounts[q.tier] || 0) + 1;
    }
    return json(res, 200, {
      monthKey: month,
      weekKey: week,
      pack,
      studioCounts,
    });
  }

  const index = loadMonthIndex(month);
  if (!index) return json(res, 404, { error: "month not in archive" });
  return json(res, 200, { index });
}
