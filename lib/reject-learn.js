/** Lessons from Flow rejections, and a local regenerate when Q-and-A is not set up. */

function normPrompt(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function hashId(id) {
  let h = 2166136261;
  const s = String(id || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function compileLessons(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const avoidPrompts = new Set();
  const avoidIds = new Set();
  const reasonCounts = {};
  const topicHits = {};
  const tierHits = {};
  let replaced = 0;
  for (const e of list) {
    const prompt = normPrompt(e?.snapshot?.prompt);
    if (prompt) avoidPrompts.add(prompt);
    if (e?.questionId) avoidIds.add(String(e.questionId));
    if (e?.regeneratedQuestionId) replaced += 1;
    for (const code of e?.reasonCodes || []) {
      const key = String(code || "other");
      reasonCounts[key] = (reasonCounts[key] || 0) + 1;
    }
    const topic = e?.snapshot?.topic;
    if (topic) topicHits[topic] = (topicHits[topic] || 0) + 1;
    const tier = e?.snapshot?.tier;
    if (tier) tierHits[tier] = (tierHits[tier] || 0) + 1;
  }
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([code, n]) => `${code} (${n})`);
  const brief = list.length
    ? `${list.length} rejected question${list.length === 1 ? "" : "s"} in the log. Avoid ${avoidPrompts.size} prompt${avoidPrompts.size === 1 ? "" : "s"}. ${replaced} already ${replaced === 1 ? "has" : "have"} a replacement. Top reasons: ${topReasons.join(", ") || "n/a"}. Flow regenerates from the existing bank using this log when Q-and-A is not connected.`
    : "No rejections yet. Rejected archive questions land here and steer the next regenerate.";
  return {
    count: list.length,
    replaced,
    pendingRegen: list.filter((e) => e && !e.regeneratedQuestionId).length,
    avoidPrompts: [...avoidPrompts],
    avoidIds: [...avoidIds],
    reasonCounts,
    topicHits,
    tierHits,
    brief,
  };
}

export function overlayPackWithLog(pack, entries, filter = {}) {
  const list = Array.isArray(entries) ? entries : [];
  const byId = new Map();
  for (const e of list) {
    if (!e?.questionId) continue;
    if (filter.weekKey && e.weekKey && e.weekKey !== filter.weekKey) continue;
    if (filter.monthKey && e.monthKey && e.monthKey !== filter.monthKey) continue;
    if (filter.bank && e.bank && e.bank !== filter.bank && !(filter.bank === "weekly" && e.bank === "archive")) continue;
    byId.set(String(e.questionId), e);
  }
  return {
    ...pack,
    questions: (pack?.questions || []).map((q) => {
      const e = byId.get(String(q.id));
      if (!e) return q;
      if (e.replacement?.prompt) {
        return { ...e.replacement, status: e.replacement.status || "pending" };
      }
      return {
        ...q,
        status: "rejected",
        regeneratedQuestionId: e.regeneratedQuestionId || null,
      };
    }),
  };
}

function restatePrompt(q) {
  const p = String(q.prompt || "").trim();
  const cat = String(q.categoryTitle || "").trim();
  if (cat && !p.toLowerCase().startsWith(cat.toLowerCase())) return `${cat}: ${p}`;
  if (/^what /i.test(p)) return p.replace(/^What /i, "Which option matches: what ");
  if (/^which /i.test(p)) return p.replace(/^Which /i, "Select the correct answer: which ");
  return `Reworked: ${p}`;
}

function rotateChoices(choices, correct, seed) {
  const list = [...choices];
  const rot = hashId(seed) % Math.max(list.length, 1);
  const rotated = [...list.slice(rot), ...list.slice(0, rot)];
  let correctIndex = rotated.indexOf(correct);
  if (correctIndex < 0) correctIndex = 0;
  return { choices: rotated, correctIndex };
}

function distractorsFromPool(pool, correct, rejectedChoices, need) {
  const seen = new Set([String(correct || "")]);
  const out = [];
  const preferNew = [];
  const rest = [];
  for (const q of pool) {
    for (const c of q.choices || []) {
      const text = String(c || "").trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      if ((rejectedChoices || []).includes(text)) rest.push(text);
      else preferNew.push(text);
    }
  }
  for (const text of [...preferNew, ...rest]) {
    if (out.length >= need) break;
    out.push(text);
  }
  while (out.length < need) out.push(`Not ${correct}`.slice(0, 72) + (out.length ? ` (${out.length})` : ""));
  return out.slice(0, need);
}

/**
 * Draft a pending replacement from the existing bank + rejection lessons.
 * Prefers an unused sibling of the same topic/tier. Falls back to new distractors.
 */
export function draftReplacement(rejectedQ, { pool = [], lessons = {}, suffix } = {}) {
  const src = rejectedQ || {};
  const avoidPrompts = new Set((lessons.avoidPrompts || []).map(normPrompt));
  avoidPrompts.add(normPrompt(src.prompt));
  const avoidIds = new Set((lessons.avoidIds || []).map(String));
  if (src.id) avoidIds.add(String(src.id));

  const candidates = (pool || []).filter((q) => {
    if (!q || !q.id || avoidIds.has(String(q.id))) return false;
    if (q.status === "rejected") return false;
    if (avoidPrompts.has(normPrompt(q.prompt))) return false;
    return true;
  });
  const sameTopicTier = candidates.filter(
    (q) => q.tier === src.tier && (!src.topic || q.topic === src.topic),
  );
  const sameTier = candidates.filter((q) => q.tier === src.tier);
  const sibling = sameTopicTier[0] || sameTier[0] || null;
  const stamp = suffix || Date.now().toString(36).slice(-5);
  const id = `${String(src.id || "q").replace(/-r[a-z0-9]+$/i, "")}-r${stamp}`;

  if (sibling && normPrompt(sibling.prompt) !== normPrompt(src.prompt)) {
    return {
      ...sibling,
      id,
      status: "pending",
      regeneratedFrom: src.id || null,
      generation: sibling.generation || src.generation || "flow-regen",
      banterHint: sibling.banterHint || "Regenerated from the Flow rejection log.",
    };
  }

  const correct = (src.choices || [])[src.correctIndex] || (src.choices || [])[0] || "";
  const extra = distractorsFromPool(candidates.length ? candidates : pool, correct, src.choices || [], 3);
  const { choices, correctIndex } = rotateChoices([correct, ...extra], correct, id);
  return {
    id,
    tier: src.tier || "easy",
    topic: src.topic || "culture",
    generation: "flow-regen",
    categoryTitle: src.categoryTitle || "",
    prompt: restatePrompt(src),
    choices,
    correctIndex,
    status: "pending",
    regeneratedFrom: src.id || null,
    banterHint: "Regenerated from the Flow rejection log (no Q-and-A studio).",
    sources: src.sources || [],
  };
}
