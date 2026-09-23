/** Twelve questions kept ready for rejected ones. The first is on hand for Regenerate. */
export const READY_COUNT = 12;

const g = globalThis;
if (!g.__faRejectReadyByLocale) g.__faRejectReadyByLocale = {};

function bench(locale) {
  const loc = String(locale || "en").toLowerCase().slice(0, 2);
  if (!g.__faRejectReadyByLocale[loc]) g.__faRejectReadyByLocale[loc] = { used: [] };
  return g.__faRejectReadyByLocale[loc];
}

function normPrompt(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function slim(q) {
  return {
    id: q.id,
    tier: q.tier || "",
    topic: q.topic || "",
    generation: q.generation || "",
    categoryTitle: q.categoryTitle || "",
    prompt: q.prompt || "",
    choices: Array.isArray(q.choices) ? q.choices.slice(0, 4) : [],
    correctIndex: Number(q.correctIndex) || 0,
  };
}

export function readyQuestions(locale, pool, lessons = {}) {
  const used = new Set((bench(locale).used || []).map(String));
  const avoidIds = new Set((lessons.avoidIds || []).map(String));
  const avoidPrompts = new Set((lessons.avoidPrompts || []).map(normPrompt));
  const seen = new Set();
  const out = [];
  const weekly = [];
  const place = [];
  for (const q of pool || []) {
    if (String(q?.id || "").startsWith("place-")) place.push(q);
    else weekly.push(q);
  }
  const source = weekly.length >= READY_COUNT ? weekly : [...weekly, ...place];
  const list = source.sort((a, b) => String(a?.id || "").localeCompare(String(b?.id || "")));
  for (const q of list) {
    if (!q?.id || !q.prompt || !Array.isArray(q.choices) || q.choices.length < 2) continue;
    const id = String(q.id);
    if (used.has(id) || avoidIds.has(id) || seen.has(id)) continue;
    if (q.status === "rejected") continue;
    if (avoidPrompts.has(normPrompt(q.prompt))) continue;
    seen.add(id);
    out.push(q);
    if (out.length >= READY_COUNT) break;
  }
  return out;
}

export function readyBench(locale, pool, lessons) {
  const questions = readyQuestions(locale, pool, lessons).map(slim);
  return {
    target: READY_COUNT,
    count: questions.length,
    onHand: questions[0] || null,
    questions,
  };
}

function asReplacement(src, rejectedId) {
  const stamp = Date.now().toString(36).slice(-4);
  const base = String(src.id || "q").replace(/-h[a-z0-9]+$/i, "");
  return {
    ...slim(src),
    id: `${base}-h${stamp}`,
    status: "pending",
    regeneratedFrom: rejectedId || null,
    generation: src.generation || "",
  };
}

/** Use the question on hand, then keep the bench filled to 12. */
export function takeOnHand(locale, rejectedQ, pool, lessons, onHandId) {
  const ready = readyQuestions(locale, pool, lessons);
  const wanted = String(onHandId || "");
  const src = ready.find((q) => String(q.id) === wanted) || ready[0];
  if (!src) return null;
  bench(locale).used.push(String(src.id));
  const replacement = asReplacement(src, rejectedQ?.id);
  const next = readyBench(locale, pool, lessons);
  return { replacement, ready: next };
}

export function resetRejectReadyForTests() {
  g.__faRejectReadyByLocale = {};
}
