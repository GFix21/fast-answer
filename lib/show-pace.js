/** Show pace: tier sets in ramp order, a break when the set steps up, MAP uses per round. */

export const TIER_ORDER = ["easy", "hard", "difficult", "extreme"];
export const SET_BREAK_S = 15;
export const SET_MIN_FOR_BREAK = 2;
export const MAP_USES_PER_ROUND = 4;

const RANK = new Map(TIER_ORDER.map((tier, index) => [tier, index]));

export function tierRank(tier) {
  return RANK.has(tier) ? RANK.get(tier) : -1;
}

/** Play easy, then hard, then difficult, then extreme. Order inside a tier stays as dealt. */
export function orderShowSets(questions) {
  return (questions || [])
    .map((q, index) => ({ q, index }))
    .sort((a, b) => {
      const ra = tierRank(a.q?.tier);
      const rb = tierRank(b.q?.tier);
      const aRank = ra < 0 ? TIER_ORDER.length : ra;
      const bRank = rb < 0 ? TIER_ORDER.length : rb;
      return aRank - bRank || a.index - b.index;
    })
    .map((row) => row.q);
}

/** How many questions the set at this index still has, including itself. */
export function tierRunLength(questions, index) {
  const tier = questions?.[index]?.tier;
  if (!tier) return 0;
  let n = 0;
  for (let i = index; i < questions.length; i++) {
    if (questions[i]?.tier !== tier) break;
    n += 1;
  }
  return n;
}

/** A higher set earns a break when it holds at least two questions. */
export function setBreakDue(prevTier, nextTier, nextSetSize = SET_MIN_FOR_BREAK) {
  const prev = tierRank(prevTier);
  const next = tierRank(nextTier);
  if (prev < 0 || next < 0) return false;
  if (next <= prev) return false;
  return Number(nextSetSize) >= SET_MIN_FOR_BREAK;
}

/**
 * One lockdown near the end of hard, with one hard question still after it,
 * and one on the last extreme question so it does not open on the break.
 */
export function lockdownSlots(questions) {
  const qs = questions || [];
  const of = (tier) => qs.map((q, i) => (q?.tier === tier ? i : -1)).filter((i) => i >= 0);
  const hard = of("hard");
  const extreme = of("extreme");
  const slots = [];
  if (hard.length >= 2) slots.push(hard[hard.length - 2]);
  else if (hard.length === 1) slots.push(hard[0]);
  if (extreme.length >= 2) slots.push(extreme[extreme.length - 1]);
  else if (extreme.length === 1) slots.push(extreme[0]);
  return [...new Set(slots)].sort((a, b) => a - b);
}

export function mapUsesLeft(used) {
  const n = Number(used);
  const spent = Number.isFinite(n) && n > 0 ? n : 0;
  return Math.max(0, MAP_USES_PER_ROUND - spent);
}
