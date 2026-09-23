import { GENERATIONS, normalizeGeneration } from "../q-and-a/map.js";

/** Target size of one generation pack on a device. Stock can be smaller. */
export const PACK_TARGET = 150;
export const LOCKDOWN_REFRESHES = 4;

const HARD_TIERS = new Set(["extreme", "difficult", "hard"]);

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
  let held = 0;
  for (const g of GENERATIONS) {
    const n = Array.isArray(packs?.[g]) ? packs[g].length : 0;
    counts[g] = n;
    held += n;
  }
  return { target: PACK_TARGET, counts, held };
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
    const gen = normalizeGeneration(seat.generation);
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
    out.push({
      ...picked,
      choices: Array.isArray(picked.choices) ? [...picked.choices] : picked.choices,
      fromPlayer: String(seat.name || key),
      fromGeneration: gen,
    });
  }
  return { questions: out, cursors: local };
}

function packsForLockdown(packs, avoid) {
  const next = {};
  for (const g of GENERATIONS) {
    const pack = packs?.[g] || [];
    const hard = pack.filter((q) => HARD_TIERS.has(q.tier) && !avoid.has(String(q.id)));
    const fresh = pack.filter((q) => !avoid.has(String(q.id)));
    if (hard.length) next[g] = hard;
    else if (fresh.length) next[g] = fresh;
    else next[g] = pack;
  }
  return next;
}

/** Five lockdown questions, one seat after another, from the packs already on the device. */
export function lockdownSet(players, packs, avoidIds = [], n = 5) {
  const avoid = new Set((avoidIds || []).map(String));
  const filtered = dealRoundRobin(players, packsForLockdown(packs, avoid), n, {});
  if (filtered.questions.length >= n) return filtered.questions;
  const open = dealRoundRobin(players, packs, n, {});
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
      questions: lockdownSet(players, packs, avoidIds, n),
    };
  }
  const shuffled = shufflePacks(packs, rng);
  return {
    refreshes: LOCKDOWN_REFRESHES,
    packs: shuffled,
    shuffled: true,
    exhausted: true,
    questions: lockdownSet(players, shuffled, [], n),
  };
}
