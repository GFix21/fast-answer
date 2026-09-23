/**
 * Dupe Check. The same prompt cannot enter twice, in any language fold.
 */

export const DUPE_BOT = "Dupe Check";

export function normPrompt(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findDupes(incoming, existing = []) {
  const seen = new Map();
  const dupes = [];
  for (const q of existing || []) {
    const key = normPrompt(q?.prompt);
    if (key) seen.set(key, q.id);
  }
  for (const q of incoming || []) {
    const key = normPrompt(q?.prompt);
    if (!key) continue;
    if (seen.has(key)) dupes.push({ id: q.id, sameAs: seen.get(key) });
    else seen.set(key, q.id);
  }
  return { bot: DUPE_BOT, ok: dupes.length === 0, dupes };
}
