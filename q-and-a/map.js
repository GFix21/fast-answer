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

/** Q-and-A generation targets. Every weekly and placement pack must cover these. */
export const GENERATIONS = [
  "silent-generation",
  "baby-boomer",
  "gen-x",
  "gen-y",
  "gen-z",
  "gen-alpha",
  "multi-gen",
];

const GENERATION_ALIASES = {
  silent: "silent-generation",
  "silent-gen": "silent-generation",
  boomer: "baby-boomer",
  "baby-boom": "baby-boomer",
  genx: "gen-x",
  "generation-x": "gen-x",
  millennial: "gen-y",
  "millennials": "gen-y",
  geny: "gen-y",
  "generation-y": "gen-y",
  genz: "gen-z",
  "generation-z": "gen-z",
  genalpha: "gen-alpha",
  "generation-alpha": "gen-alpha",
  multi: "multi-gen",
  "multi-generation": "multi-gen",
};

export function normalizeGeneration(raw) {
  const v = String(raw || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (!v) return "";
  return GENERATION_ALIASES[v] || v;
}

export function generationIssues(questions, { required = GENERATIONS } = {}) {
  const issues = [];
  const seen = new Set();
  for (const q of questions || []) {
    const id = q?.id || "(no id)";
    const g = normalizeGeneration(q?.generation);
    if (!g) issues.push(`${id}: missing generation`);
    else if (!GENERATIONS.includes(g)) issues.push(`${id}: unknown generation "${q.generation}"`);
    else seen.add(g);
    if (!q?.prompt) issues.push(`${id}: missing prompt`);
    if (!Array.isArray(q?.choices) || q.choices.length < 2) issues.push(`${id}: need at least 2 choices`);
    if (!Number.isInteger(q?.correctIndex) || q.correctIndex < 0 || q.correctIndex >= (q.choices || []).length) {
      issues.push(`${id}: correctIndex out of range`);
    }
  }
  for (const g of required) {
    if (!seen.has(g)) issues.push(`missing generation ${g}`);
  }
  return issues;
}

export function countByGeneration(questions) {
  const out = {};
  for (const q of questions || []) {
    const g = normalizeGeneration(q.generation) || "(none)";
    out[g] = (out[g] || 0) + 1;
  }
  return out;
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
  const generation = normalizeGeneration(q.generation);
  const base = {
    id: q.id,
    tier: mapTier(q.tier),
    topic: mapTopic(q.topic),
    generation: generation || null,
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
