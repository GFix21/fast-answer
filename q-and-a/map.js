/** Thin sync of Q-and-A → Fast Answer topic/tier maps (vendored). */
export const TOPIC_TO_FAST_ANSWER = {
  "grand-tour-top-gear": "grand-tour",
  "gmg-brand": "gmg",
  "cars-motoring": "cars",
  "current-culture": "culture",
};

export function mapTopic(topic) {
  return TOPIC_TO_FAST_ANSWER[topic] ?? topic;
}

export function mapTier(tier) {
  return tier === "finale" ? "extreme" : tier;
}


/** Deterministic permutation from id so EN/FR/DE keep the same correctIndex. */
function hashId(id) {
  let h = 2166136261;
  const s = String(id || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffleChoicesDeterministic(q) {
  if (!q || !Array.isArray(q.choices) || q.choices.length < 2) return q;
  const n = q.choices.length;
  const idxs = Array.from({ length: n }, (_, i) => i);
  let h = hashId(q.id);
  for (let i = n - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    const j = h % (i + 1);
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  const nextChoices = idxs.map((i) => q.choices[i]);
  const nextCorrect = idxs.indexOf(Number(q.correctIndex) || 0);
  return { ...q, choices: nextChoices, correctIndex: nextCorrect < 0 ? 0 : nextCorrect };
}

export function toFastAnswerQuestion(q) {
  const base = {
    id: q.id,
    tier: mapTier(q.tier),
    topic: mapTopic(q.topic),
    categoryTitle: q.categoryTitle,
    prompt: q.prompt,
    choices: Array.isArray(q.choices) ? [...q.choices] : q.choices,
    correctIndex: q.correctIndex,
    banterHint: q.banterHint ?? null,
  };
  return shuffleChoicesDeterministic(base);
}

export function exportPack(pack) {
  const questions = (pack.questions || [])
    .filter((q) => q.status !== "rejected")
    .map(toFastAnswerQuestion);
  return questions;
}

export function countByTier(questions) {
  const out = {};
  for (const q of questions) out[q.tier] = (out[q.tier] || 0) + 1;
  return out;
}
