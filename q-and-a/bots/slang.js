/**
 * A short voice for each generation's questions.
 * It sits beside the ask. It does not change the fact or the correct choice.
 */
export const GEN_SLANG = {
  "silent-generation": {
    en: "Say,",
    fr: "Dites,",
    "fr-CA": "Dites donc,",
    de: "Sagen Sie,",
  },
  "baby-boomer": {
    en: "Right on,",
    fr: "Tout à fait,",
    "fr-CA": "C'est ça,",
    de: "Na klar,",
  },
  "gen-x": {
    en: "Whatever the case,",
    fr: "Bref,",
    "fr-CA": "Enfin,",
    de: "Na ja,",
  },
  "gen-y": {
    en: "Just saying,",
    fr: "Je dis ça,",
    "fr-CA": "Je dis ça de même,",
    de: "Nur so,",
  },
  "gen-z": {
    en: "Low-key,",
    fr: "Sans chichi,",
    "fr-CA": "Sans farce,",
    de: "Ganz ehrlich,",
  },
  "gen-alpha": {
    en: "Real quick,",
    fr: "Vite fait,",
    "fr-CA": "Minute,",
    de: "Kurz mal,",
  },
  "multi-gen": {
    en: "For the room,",
    fr: "Pour tout le monde,",
    "fr-CA": "Pour tout le monde,",
    de: "Für alle,",
  },
};

export function slangFor(generation, locale = "en") {
  const row = GEN_SLANG[generation];
  if (!row) return "";
  return row[locale] || row.en || "";
}
