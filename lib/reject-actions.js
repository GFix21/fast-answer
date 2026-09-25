import { archivedWeekMap, loadArchivedWeek, swapArchivedQuestion } from "./archive-store.js";
import { normalizeFlowLocale } from "./flow-locale.js";
import {
  loadCurrentPack,
  setQuestionStatus,
  saveCurrentPack,
} from "./week-store.js";
import { loadPlacementPack, setPlacementStatus } from "./placement-store.js";
import { compileLessons, draftReplacement } from "./reject-learn.js";
import { appendRejection, listRejectLog, markRegenerated } from "./reject-log.js";
import { takeOnHand, readyBench } from "./reject-ready.js";
import { editsOpenForQuestion } from "./content-freeze.js";

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
  const loc = normalizeFlowLocale(locale);
  const week = loadCurrentPack(loc);
  const place = loadPlacementPack(loc);
  const archived = Object.values(archivedWeekMap(loc)).flatMap((pack) => pack?.questions || []);
  return [
    ...(week?.questions || []),
    ...(place?.questions || []),
    ...archived,
  ];
}

export function findQuestion({ questionId, locale = "en", bank, monthKey, weekKey } = {}) {
  const id = String(questionId || "");
  if (!id) return null;
  const loc = normalizeFlowLocale(locale);

  if (bank === "placement") {
    const pack = loadPlacementPack(loc);
    const q = (pack.questions || []).find((x) => x.id === id);
    return q ? { q, bank: "placement", pack } : null;
  }

  if (monthKey && weekKey) {
    const pack = loadArchivedWeek(monthKey, weekKey, loc);
    const q = (pack?.questions || []).find((x) => x.id === id);
    if (q) return { q, bank: "archive", pack, monthKey, weekKey };
  }

  const week = loadCurrentPack(loc);
  const current = (week.questions || []).find((x) => x.id === id);
  if (current && bank !== "archive") return { q: current, bank: "weekly", pack: week };

  for (const [key, pack] of Object.entries(archivedWeekMap(loc))) {
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

function replaceQuestionInPlace(found, regenerated, locale) {
  const next = { ...regenerated, status: "active" };
  if (found.bank === "archive" && found.monthKey && found.weekKey) {
    swapArchivedQuestion(found.monthKey, found.weekKey, found.q.id, next, locale);
    return next;
  }
  if (found.bank === "placement") {
    const g = globalThis;
    if (!g.__faPlacementByLocale) g.__faPlacementByLocale = {};
    const loc = locale || "en";
    if (!g.__faPlacementByLocale[loc]) {
      g.__faPlacementByLocale[loc] = { pack: null, statuses: {}, rejections: [], regen: {} };
    }
    const b = g.__faPlacementByLocale[loc];
    const pack = found.pack || loadPlacementPack(loc);
    b.pack = {
      ...pack,
      questions: (pack.questions || []).map((q) => (q.id === found.q.id ? next : q)),
      updatedAt: new Date().toISOString(),
    };
    return next;
  }
  const pack = found.pack || loadCurrentPack(locale);
  saveCurrentPack({
    ...pack,
    questions: (pack.questions || []).map((q) => (q.id === found.q.id ? next : q)),
  }, locale);
  return next;
}

export async function rejectQuestion(body = {}) {
  const locale = normalizeFlowLocale(body.locale || "en");
  const found = findQuestion(body);
  if (!found) return { error: "question not found", status: 404 };
  if (!editsOpenForQuestion(found.q)) return { error: "frozen", status: 409 };
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
  const locale = normalizeFlowLocale(body.locale || "en");
  const found = findQuestion(body);
  if (!found) return { error: "question not found", status: 404 };
  if (!editsOpenForQuestion(found.q)) return { error: "frozen", status: 409 };
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
      reasonCodes: body.reasonCodes?.length ? body.reasonCodes : ["archive-replace"],
      note: body.note || "Replaced from the archive",
      snapshot: snapshotOf(q),
      monthKey: found.monthKey || body.monthKey || null,
      weekKey: found.weekKey || body.weekKey || null,
    });
  }

  const lessons = compileLessons(await listRejectLog({ locale }));
  const pool = collectQuestionPool(locale);
  const handed = body.replacement?.prompt
    ? null
    : takeOnHand(locale, q, pool, lessons, body.onHandId);
  const regenerated = body.replacement?.prompt
    ? {
        ...q,
        ...body.replacement,
        id: body.replacement.id || `${q.id}-r${Date.now().toString(36).slice(-4)}`,
        status: "active",
        regeneratedFrom: q.id,
        generation: q.generation || "flow-regen",
      }
    : (handed?.replacement || draftReplacement(q, { pool, lessons }));

  const replaced = replaceQuestionInPlace(found, regenerated, locale);
  await markRegenerated(q.id, replaced.id, locale, replaced);
  const nextLessons = compileLessons(await listRejectLog({ locale }));
  return {
    ok: true,
    locale,
    found,
    regenerated: replaced,
    ready: handed?.ready || readyBench(locale, pool, nextLessons),
    lessons: nextLessons,
    learningBrief: nextLessons.brief,
  };
}
