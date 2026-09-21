/** When a late player may take a seat, and when Dropout ends the show. */

export function isOpenTier(tier) {
  return tier === "easy" || tier === "hard";
}

/** The question they would enter is the one after the answer now on screen. */
export function nextQuestionAllowsJoin(qs, index) {
  const next = (qs || [])[Number(index) + 1];
  return Boolean(next && isOpenTier(next.tier));
}

/**
 * Dropout ends the game only when every logged-on human has pressed it.
 * Bots are not in humanIds. One human ends it. Two humans need both.
 */
export function dropoutEndsGame(humanIds, dropoutIds) {
  const ids = (humanIds || []).filter(Boolean);
  if (!ids.length) return false;
  const marks = dropoutIds || {};
  return ids.every((id) => Boolean(marks[id]));
}
