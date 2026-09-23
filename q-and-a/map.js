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

/** Decade the player says they are in. */
export const AGE_BRACKETS = ["10s", "20s", "30s", "40s", "50s", "60s", "70s", "80s", "90s"];

/**
 * Birth-year spans Q&A uses. Ages are figured in AGE_REFERENCE_YEAR so a pack
 * can name the brackets it covers, and a bracket can send one pack.
 */
export const AGE_REFERENCE_YEAR = 2026;
export const GENERATION_BORN = {
  "silent-generation": [1928, 1945],
  "baby-boomer": [1946, 1964],
  "gen-x": [1965, 1980],
  "gen-y": [1981, 1996],
  "gen-z": [1997, 2009],
  "gen-alpha": [2010, 2025],
};

function decadeBounds(bracket) {
  const n = Number(String(bracket || "").replace(/\D/g, ""));
  if (!Number.isFinite(n) || n < 10 || n > 90 || n % 10 !== 0) return null;
  return [n, n + 9];
}

/** Brackets whose ages overlap this generation in the reference year. Multi-gen spans every bracket. */
export function ageBracketsForGeneration(generation, year = AGE_REFERENCE_YEAR) {
  const g = normalizeGeneration(generation);
  if (g === "multi-gen") return [...AGE_BRACKETS];
  const span = GENERATION_BORN[g];
  if (!span) return [];
  const youngest = year - span[1];
  const oldest = year - span[0];
  return AGE_BRACKETS.filter((b) => {
    const bounds = decadeBounds(b);
    if (!bounds) return false;
    return bounds[1] >= youngest && bounds[0] <= oldest;
  });
}

/**
 * The one pack this age sends. Uses the middle year of the decade
 * (15, 25, 35, …) so a split decade follows the generation that holds that year.
 */
export function generationForAge(bracket, year = AGE_REFERENCE_YEAR) {
  const bounds = decadeBounds(bracket);
  if (!bounds) return "";
  const age = Math.round((bounds[0] + bounds[1]) / 2);
  const born = year - age;
  for (const g of Object.keys(GENERATION_BORN)) {
    const [start, end] = GENERATION_BORN[g];
    if (born >= start && born <= end) return g;
  }
  if (born < GENERATION_BORN["silent-generation"][0]) return "silent-generation";
  if (born > GENERATION_BORN["gen-alpha"][1]) return "gen-alpha";
  return "";
}

/** Brackets that actually send this pack. A covered bracket can still send elsewhere. */
export function bracketsSendingTo(generation, year = AGE_REFERENCE_YEAR) {
  const g = normalizeGeneration(generation);
  if (!GENERATIONS.includes(g) || g === "multi-gen") return [];
  return AGE_BRACKETS.filter((b) => generationForAge(b, year) === g);
}

/** Exact age in the reference year. 13–16 are Gen Alpha; 17 is Gen Z. */
export function generationForYears(age, year = AGE_REFERENCE_YEAR) {
  const n = Number(age);
  if (!Number.isFinite(n)) return "";
  const born = year - Math.round(n);
  for (const g of Object.keys(GENERATION_BORN)) {
    const [start, end] = GENERATION_BORN[g];
    if (born >= start && born <= end) return g;
  }
  if (born < GENERATION_BORN["silent-generation"][0]) return "silent-generation";
  if (born > GENERATION_BORN["gen-alpha"][1]) return "gen-alpha";
  return "";
}

/** Decade label for a numeric age. 13 and 19 are both the 10s. */
export function bracketForAge(age) {
  const n = Math.round(Number(age));
  if (!Number.isFinite(n)) return "";
  const decade = Math.max(10, Math.min(90, Math.floor(n / 10) * 10));
  return `${decade}s`;
}

/**
 * Ages that may hold a profile and still fall in this generation.
 * Gen Alpha play starts at 13 and, in 2026, runs through 16.
 */
export function playableAges(generation, year = AGE_REFERENCE_YEAR, floor = 13) {
  const g = normalizeGeneration(generation);
  const span = GENERATION_BORN[g];
  if (!span) return [];
  const youngest = Math.max(floor, year - span[1]);
  const oldest = Math.min(120, year - span[0]);
  const out = [];
  for (let a = youngest; a <= oldest; a += 1) out.push(a);
  return out;
}

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
  const next = { ...q, choices: nextChoices, correctIndex: nextCorrect < 0 ? 0 : nextCorrect };
  if (Array.isArray(q.jokeWrongIndexes)) {
    next.jokeWrongIndexes = q.jokeWrongIndexes
      .map((i) => idxs.indexOf(i))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
  }
  return next;
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
  if (q.slang) base.slang = q.slang;
  if (q.funny === true) base.funny = true;
  if (q.humorous === true) base.humorous = true;
  if (q.renegade === true) base.renegade = true;
  if (q.injection) base.injection = q.injection;
  if (q.structure) base.structure = q.structure;
  if (q.fromStructure) base.fromStructure = q.fromStructure;
  if (q.straight) base.straight = q.straight;
  if (Array.isArray(q.jokeWrongIndexes)) base.jokeWrongIndexes = [...q.jokeWrongIndexes];
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
