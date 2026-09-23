/**
 * One French set for France, one French set for Quebec, and one German set.
 * They keep the same id, the same choice order, and the same correctIndex as English.
 * A humorous question is wrapped by Crack'd Kerr after the straight ask is translated.
 */
import { injectHumor, injectWrongAnswers } from "../crackd-kerr.js";

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
  const flat = {
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
    humorous: q.humorous === true,
    renegade: q.renegade === true,
    injection: q.injection || null,
    technique: q.technique || null,
    structure: q.structure || (q.funny === true ? "joke" : null),
    fromStructure: q.fromStructure || null,
    straight: q.straight || null,
    addedWeek: q.addedWeek || null,
    sources: q.sources || [],
    status: "pending",
  };
  if (q.humorous === true) {
    const injected = injectHumor(flat, {
      locale,
      playedStructure: q.structure,
      renegade: q.renegade === true,
    });
    flat.prompt = injected.prompt;
    flat.humorous = true;
    flat.funny = true;
    flat.injection = injected.injection;
    flat.technique = q.technique || injected.technique;
    flat.fromStructure = q.fromStructure || q.structure;
    flat.structure = injected.structure;
    flat.renegade = injected.renegade;
  }
  if (q.jokeWrongs) {
    const joked = injectWrongAnswers({ ...q, choices: flat.choices }, locale);
    flat.choices = joked.choices;
    flat.jokeWrongIndexes = joked.jokeWrongIndexes;
  }
  return flat;
}
