/** Show pace: tier sets in ramp order, a break when the set steps up, MAP uses per round. */

export const TIER_ORDER = ["easy", "hard", "difficult", "extreme"];
export const SET_BREAK_S = 15;
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

/** True when the next question opens a higher set: easy → hard → difficult → extreme. */
export function setBreakDue(prevTier, nextTier) {
  const prev = tierRank(prevTier);
  const next = tierRank(nextTier);
  if (prev < 0 || next < 0) return false;
  return next > prev;
}

export function mapUsesLeft(used) {
  const n = Number(used);
  const spent = Number.isFinite(n) && n > 0 ? n : 0;
  return Math.max(0, MAP_USES_PER_ROUND - spent);
}
