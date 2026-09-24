/** When a late player may take a seat, and when Dropout ends the show. */

export function isOpenTier(tier) {
  return tier === "easy" || tier === "hard";
}

/** Players may take a seat during the first four questions (indexes 0–3). */
export function nextQuestionAllowsJoin(_qs, index) {
  return Number(index) < 4;
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
