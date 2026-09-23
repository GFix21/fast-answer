/**
 * One French set for France, one French set for Quebec, and one German set.
 * They keep the same id, the same choice order, and the same correctIndex as English.
 */

export const FRANCE_BOT = "French (France)";
export const QUEBEC_BOT = "French (Quebec)";
export const GERMAN_BOT = "German";

export const TRANSLATORS = [
  { bot: FRANCE_BOT, locale: "fr" },
  { bot: QUEBEC_BOT, locale: "fr-CA" },
  { bot: GERMAN_BOT, locale: "de" },
];

export function translateQuestion(q, locale) {
  const text = q.text || {};
  const pack = text[locale];
  if (!pack) return null;
  return {
    id: q.id,
    tier: q.tier,
    topic: q.topic,
    generation: q.generation,
    categoryTitle: pack.categoryTitle,
    prompt: pack.prompt,
    choices: pack.choices,
    correctIndex: q.correctIndex,
    banterHint: pack.banterHint || null,
      funny: q.funny === true,
      technique: q.technique || null,
      structure: q.structure || (q.funny === true ? "joke" : null),
    addedWeek: q.addedWeek || null,
    sources: q.sources || [],
    status: "pending",
  };
}
