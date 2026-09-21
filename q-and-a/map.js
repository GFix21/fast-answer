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

export function toFastAnswerQuestion(q) {
  return {
    id: q.id,
    tier: mapTier(q.tier),
    topic: mapTopic(q.topic),
    categoryTitle: q.categoryTitle,
    prompt: q.prompt,
    choices: q.choices,
    correctIndex: q.correctIndex,
    banterHint: q.banterHint ?? null,
  };
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
