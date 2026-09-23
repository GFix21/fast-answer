import {
  GENERATIONS,
  normalizeGeneration,
  generationForAge,
  generationForYears,
  bracketForAge,
  playableAges,
  ageBracketsForGeneration,
  bracketsSendingTo,
  GENERATION_BORN,
  AGE_REFERENCE_YEAR,
  AGE_BRACKETS,
} from "../q-and-a/map.js";

export {
  generationForAge,
  generationForYears,
  bracketForAge,
  playableAges,
  ageBracketsForGeneration,
  bracketsSendingTo,
  GENERATION_BORN,
  AGE_REFERENCE_YEAR,
  AGE_BRACKETS,
};

/**
 * A numeric age wins, so 13 sends the Gen Alpha pack even when the decade
 * label is 10s. A decade alone still uses the middle year of that decade.
 */
export function generationForSeat(seat) {
  if (seat && seat.age != null && seat.age !== "" && Number.isFinite(Number(seat.age))) {
    const fromYears = generationForYears(seat.age);
    if (fromYears) return fromYears;
  }
  const fromAge = generationForAge(seat?.ageBracket);
  if (fromAge) return fromAge;
  const g = normalizeGeneration(seat?.generation);
  return GENERATIONS.includes(g) ? g : "";
}

/** Target size of one generation pack on a device. Stock can be smaller. */
export const PACK_TARGET = 150;
export const LOCKDOWN_REFRESHES = 4;

const HARD_TIERS = new Set(["extreme", "difficult", "hard"]);
const LOCKDOWN_LINE = ["silent-generation", "baby-boomer", "gen-x", "gen-y", "gen-z", "gen-alpha"];
const LOCKDOWN_RANK = { difficult: 0, extreme: 1, hard: 2 };

/**
 * Lockdown leaves the seat's own pack. One step ahead, or one step behind.
 * Silent is already the oldest pack, so a step behind stays there and is marked
 * further back instead of wrapping into a younger generation.
 */
export function lockdownJumpGeneration(generation, direction = "ahead") {
  const g = normalizeGeneration(generation);
  if (g === "multi-gen") return direction === "behind" ? "gen-x" : "gen-z";
  const i = LOCKDOWN_LINE.indexOf(g);
  if (i < 0) return g || "multi-gen";
  if (g === "silent-generation" && direction === "behind") return "silent-generation";
  const step = direction === "behind" ? -1 : 1;
  const next = i + step;
  if (next < 0) return LOCKDOWN_LINE[0];
  if (next >= LOCKDOWN_LINE.length) return LOCKDOWN_LINE[LOCKDOWN_LINE.length - 1];
  return LOCKDOWN_LINE[next];
}

function lockdownDirection(refreshes = 0) {
  return (Number(refreshes) || 0) % 2 === 0 ? "ahead" : "behind";
}

export function buildGenerationPacks(questions) {
  const packs = {};
  for (const g of GENERATIONS) packs[g] = [];
  const seen = new Set();
  for (const q of questions || []) {
    if (!q?.id || !q.prompt || !Array.isArray(q.choices)) continue;
    const g = normalizeGeneration(q.generation);
    if (!GENERATIONS.includes(g)) continue;
    const id = String(q.id);
    if (seen.has(id)) continue;
    if (packs[g].length >= PACK_TARGET) continue;
    seen.add(id);
    packs[g].push(q);
  }
  return packs;
}

export function packSummary(packs) {
  const counts = {};
  const ages = {};
  const sendsFor = {};
  const playable = {};
  let held = 0;
  for (const g of GENERATIONS) {
    const n = Array.isArray(packs?.[g]) ? packs[g].length : 0;
    counts[g] = n;
    ages[g] = ageBracketsForGeneration(g);
    sendsFor[g] = bracketsSendingTo(g);
    playable[g] = playableAges(g);
    held += n;
  }
  return { target: PACK_TARGET, counts, ages, sendsFor, playable, year: AGE_REFERENCE_YEAR, held };
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

/** Stable generation when a profile has not chosen one yet. */
export function defaultGeneration(id) {
  return GENERATIONS[hashId(id) % GENERATIONS.length];
}

export function shufflePacks(packs, rng = Math.random) {
  const next = {};
  for (const g of GENERATIONS) {
    const list = [...(packs?.[g] || [])];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    next[g] = list;
  }
  return next;
}

/**
 * Question i comes from seats[i % seats.length]'s generation pack.
 * Each seat keeps its own cursor into that pack. Ids already used in this
 * deal are skipped. Empty packs are skipped. Nothing is invented.
 */
export function dealRoundRobin(players, packs, count, cursors = {}, allow = null) {
  const seats = (players || []).filter((p) => p);
  const out = [];
  const local = { ...cursors };
  const used = new Set();
  if (!seats.length || count <= 0) return { questions: out, cursors: local };
  let seatI = 0;
  let stalls = 0;
  const stepCap = Math.max(seats.length, count) * (seats.length + 2);
  let steps = 0;
  while (out.length < count && stalls < seats.length && steps < stepCap) {
    steps += 1;
    const seat = seats[seatI % seats.length];
    seatI += 1;
    const gen = generationForSeat(seat);
    const pack = gen && Array.isArray(packs?.[gen]) ? packs[gen] : [];
    const key = String(seat.id || seat.name || `seat-${seatI}`);
    if (!pack.length) {
      stalls += 1;
      continue;
    }
    let idx = Number.isFinite(Number(local[key])) ? Number(local[key]) % pack.length : 0;
    if (idx < 0) idx = 0;
    let picked = null;
    let pickedAt = 0;
    for (let k = 0; k < pack.length; k++) {
      const at = (idx + k) % pack.length;
      const q = pack[at];
      if (!q?.id || used.has(String(q.id))) continue;
      if (allow && !allow(q)) continue;
      picked = q;
      pickedAt = at;
      break;
    }
    if (!picked) {
      stalls += 1;
      continue;
    }
    stalls = 0;
    used.add(String(picked.id));
    local[key] = (pickedAt + 1) % pack.length;
    const row = {
      ...picked,
      choices: Array.isArray(picked.choices) ? [...picked.choices] : picked.choices,
      fromPlayer: String(seat.name || key),
      fromGeneration: gen,
    };
    if (seat.lockdownHome) row.lockdownHome = seat.lockdownHome;
    if (seat.lockdownJump) row.lockdownJump = seat.lockdownJump;
    out.push(row);
  }
  return { questions: out, cursors: local };
}

function isLockdownFactual(q) {
  return q && q.funny !== true && q.humorous !== true && q.structure !== "joke";
}

function packsForLockdown(packs, avoid) {
  const next = {};
  for (const g of GENERATIONS) {
    const pack = packs?.[g] || [];
    const fresh = pack.filter((q) => q && !avoid.has(String(q.id)) && isLockdownFactual(q));
    const hard = fresh.filter((q) => HARD_TIERS.has(q.tier));
    const pool = (hard.length ? hard : fresh).slice();
    pool.sort((a, b) => (LOCKDOWN_RANK[a.tier] ?? 9) - (LOCKDOWN_RANK[b.tier] ?? 9));
    next[g] = pool;
  }
  return next;
}

/** Five fresh, difficult questions from the generation ahead or behind each seat. */
export function lockdownSet(players, packs, avoidIds = [], n = 5, opts = {}) {
  const direction = lockdownDirection(opts.refreshes);
  const avoid = new Set((avoidIds || []).map(String));
  const jumped = (players || []).map((p) => {
    const home = generationForSeat(p) || normalizeGeneration(p?.generation) || "multi-gen";
    const dest = lockdownJumpGeneration(home, direction);
    const jump = home === "silent-generation" && direction === "behind" ? "back-more" : direction;
    return {
      ...p,
      age: undefined,
      ageBracket: undefined,
      generation: dest,
      lockdownHome: home,
      lockdownJump: jump,
    };
  });
  const filtered = dealRoundRobin(jumped, packsForLockdown(packs, avoid), n, {});
  if (filtered.questions.length >= n) return filtered.questions;
  const factual = {};
  for (const g of GENERATIONS) factual[g] = (packs?.[g] || []).filter(isLockdownFactual);
  const open = dealRoundRobin(jumped, factual, n, {});
  return open.questions.length >= filtered.questions.length ? open.questions : filtered.questions;
}

/**
 * Four refreshes draw a new lockdown set from the packs.
 * After that, another refresh still works: it shuffles the questions already
 * held into a new order for every generation pack, then deals again.
 */
export function refreshLockdown({ refreshes, packs, players, avoidIds, n = 5, rng } = {}) {
  const used = Number(refreshes) || 0;
  if (used < LOCKDOWN_REFRESHES) {
    return {
      refreshes: used + 1,
      packs,
      shuffled: false,
      exhausted: false,
      questions: lockdownSet(players, packs, avoidIds, n, { refreshes: used + 1 }),
    };
  }
  const shuffled = shufflePacks(packs, rng);
  return {
    refreshes: LOCKDOWN_REFRESHES,
    packs: shuffled,
    shuffled: true,
    exhausted: true,
    questions: lockdownSet(players, shuffled, [], n, { refreshes: LOCKDOWN_REFRESHES }),
  };
}
