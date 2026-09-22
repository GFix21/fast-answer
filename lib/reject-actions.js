import { weeks as archivedWeeks } from "./archive-manifest.js";
import { loadArchivedWeek } from "./archive-store.js";
import {
  loadCurrentPack,
  setQuestionStatus,
} from "./week-store.js";
import { loadPlacementPack, setPlacementStatus } from "./placement-store.js";
import { compileLessons, draftReplacement } from "./reject-learn.js";
import { appendRejection, listRejectLog, markRegenerated } from "./reject-log.js";

function snapshotOf(q) {
  return {
    tier: q.tier,
    topic: q.topic,
    categoryTitle: q.categoryTitle,
    prompt: q.prompt,
    choices: q.choices,
    correctIndex: q.correctIndex,
    generation: q.generation || "",
  };
}

export function collectQuestionPool(locale = "en") {
  const week = loadCurrentPack(locale);
  const place = loadPlacementPack(locale);
  const archived = Object.values(archivedWeeks || {}).flatMap((pack) => pack?.questions || []);
  return [
    ...(week?.questions || []),
    ...(place?.questions || []),
    ...archived,
  ];
}

export function findQuestion({ questionId, locale = "en", bank, monthKey, weekKey } = {}) {
  const id = String(questionId || "");
  if (!id) return null;
  const loc = locale;

  if (bank === "placement") {
    const pack = loadPlacementPack(loc);
    const q = (pack.questions || []).find((x) => x.id === id);
    return q ? { q, bank: "placement", pack } : null;
  }

  if (monthKey && weekKey) {
    const pack = loadArchivedWeek(monthKey, weekKey);
    const q = (pack?.questions || []).find((x) => x.id === id);
    if (q) return { q, bank: "archive", pack, monthKey, weekKey };
  }

  const week = loadCurrentPack(loc);
  const current = (week.questions || []).find((x) => x.id === id);
  if (current && bank !== "archive") return { q: current, bank: "weekly", pack: week };

  for (const [key, pack] of Object.entries(archivedWeeks || {})) {
    const q = (pack?.questions || []).find((x) => x.id === id);
    if (!q) continue;
    const [month, weekKeyFound] = String(key).split("/");
    return { q, bank: "archive", pack, monthKey: month, weekKey: weekKeyFound };
  }

  const place = loadPlacementPack(loc);
  const pq = (place.questions || []).find((x) => x.id === id);
  if (pq) return { q: pq, bank: "placement", pack: place };

  if (current) return { q: current, bank: "weekly", pack: week };
  return null;
}

function storeReplacement(found, regenerated, locale) {
  if (found.bank === "placement") {
    const g = globalThis;
    if (!g.__faPlacementByLocale) g.__faPlacementByLocale = {};
    const loc = locale || "en";
    if (!g.__faPlacementByLocale[loc]) {
      g.__faPlacementByLocale[loc] = { pack: null, statuses: {}, rejections: [], regen: {} };
    }
    const b = g.__faPlacementByLocale[loc];
    b.regen = b.regen || {};
    b.regen[regenerated.id] = regenerated;
    b.statuses[regenerated.id] = "pending";
    return;
  }
  const g = globalThis;
  if (!g.__faFlowReviewByLocale) g.__faFlowReviewByLocale = {};
  const loc = locale || "en";
  if (!g.__faFlowReviewByLocale[loc]) {
    g.__faFlowReviewByLocale[loc] = { statuses: {}, topics: [], rejections: [], regen: {}, packOverride: null };
  }
  const bucket = g.__faFlowReviewByLocale[loc];
  bucket.regen = bucket.regen || {};
  bucket.regen[regenerated.id] = regenerated;
  bucket.statuses[regenerated.id] = "pending";
}

export async function rejectQuestion(body = {}) {
  const locale = body.locale || "en";
  const found = findQuestion(body);
  if (!found) return { error: "question not found", status: 404 };
  const q = found.q;
  if (found.bank === "placement") setPlacementStatus(q.id, "rejected", locale);
  else setQuestionStatus(q.id, "rejected", locale);

  const rejection = await appendRejection({
    id: `${found.bank === "placement" ? "prej" : "rej"}_${Date.now()}`,
    bank: found.bank,
    locale,
    questionId: q.id,
    reasonCodes: body.reasonCodes?.length ? body.reasonCodes : ["archive-reject"],
    note: body.note || "",
    snapshot: snapshotOf(q),
    monthKey: found.monthKey || body.monthKey || null,
    weekKey: found.weekKey || body.weekKey || null,
  });

  const lessons = compileLessons(await listRejectLog({ locale }));
  return {
    ok: true,
    locale,
    rejection,
    found,
    lessons,
    learningBrief: lessons.brief,
  };
}

export async function regenerateQuestion(body = {}) {
  const locale = body.locale || "en";
  const found = findQuestion(body);
  if (!found) return { error: "question not found", status: 404 };
  const q = found.q;

  if (found.bank === "placement") setPlacementStatus(q.id, "rejected", locale);
  else setQuestionStatus(q.id, "rejected", locale);

  const log = await listRejectLog({ locale });
  const already = log.find((e) => e.questionId === q.id && (!e.locale || e.locale === locale));
  if (!already) {
    await appendRejection({
      id: `${found.bank === "placement" ? "prej" : "rej"}_${Date.now()}`,
      bank: found.bank,
      locale,
      questionId: q.id,
      reasonCodes: body.reasonCodes?.length ? body.reasonCodes : ["archive-regen"],
      note: body.note || "Regenerated from Archives",
      snapshot: snapshotOf(q),
      monthKey: found.monthKey || body.monthKey || null,
      weekKey: found.weekKey || body.weekKey || null,
    });
  }

  const lessons = compileLessons(await listRejectLog({ locale }));
  const pool = collectQuestionPool(locale);
  const regenerated = body.replacement?.prompt
    ? {
        ...q,
        ...body.replacement,
        id: body.replacement.id || `${q.id}-r${Date.now().toString(36).slice(-4)}`,
        status: "pending",
        regeneratedFrom: q.id,
        generation: "flow-regen",
      }
    : draftReplacement(q, { pool, lessons });

  storeReplacement(found, regenerated, locale);
  await markRegenerated(q.id, regenerated.id, locale);
  const nextLessons = compileLessons(await listRejectLog({ locale }));
  return {
    ok: true,
    locale,
    found,
    regenerated,
    lessons: nextLessons,
    learningBrief: nextLessons.brief,
  };
}
