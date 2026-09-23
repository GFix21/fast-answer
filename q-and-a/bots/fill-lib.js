/**
 * Shared shape for the week-fill questions.
 * Each fact keeps one correct choice, the same order in every language,
 * and a prompt that is not the slang line.
 */

const WEEK = "2026-W39";

const SOURCES = {
  geography: [{ label: "Encyclopaedia Britannica — gazetteer" }, { label: "CIA World Factbook" }],
  culture: [{ label: "Encyclopaedia Britannica" }, { label: "Library of Congress" }],
  music: [{ label: "Encyclopaedia Britannica — music" }, { label: "AllMusic — artist history" }],
  "film-tv": [{ label: "British Film Institute" }, { label: "Encyclopaedia Britannica — film" }],
  "sci-fi": [{ label: "NASA" }, { label: "Encyclopaedia Britannica — astronomy" }],
  art: [{ label: "Encyclopaedia Britannica — art" }, { label: "The Metropolitan Museum of Art" }],
  cars: [{ label: "Encyclopaedia Britannica — automobile" }, { label: "Manufacturer history" }],
  "grand-tour": [{ label: "BBC — Top Gear" }, { label: "Amazon — The Grand Tour" }],
};

const GEN_CODE = {
  "silent-generation": "si",
  "baby-boomer": "bo",
  "gen-x": "gx",
  "gen-y": "gy",
  "gen-z": "gz",
  "gen-alpha": "al",
  "multi-gen": "mu",
};

const TIER_CODE = { easy: "e", hard: "h", difficult: "d", extreme: "x" };

export const FILL_NEED = {
  "silent-generation": { easy: 58, hard: 40, difficult: 18, extreme: 9 },
  "baby-boomer": { easy: 59, hard: 38, difficult: 18, extreme: 9 },
  "gen-x": { easy: 59, hard: 38, difficult: 17, extreme: 9 },
  "gen-y": { easy: 60, hard: 37, difficult: 17, extreme: 9 },
  "gen-z": { easy: 57, hard: 40, difficult: 17, extreme: 9 },
  "gen-alpha": { easy: 51, hard: 39, difficult: 18, extreme: 9 },
  "multi-gen": { easy: 60, hard: 39, difficult: 18, extreme: 9 },
};

function loc(title, prompt, choices, hint) {
  return { categoryTitle: title, prompt, choices, banterHint: hint };
}

/** Four locales. choices is either one shared list or { en, fr, qc, de }. */
export function q(g, tier, topic, slug, titles, prompts, choices, hints) {
  const shared = Array.isArray(choices);
  const pick = (code) => (shared ? choices : choices[code]);
  return {
    g,
    tier,
    topic,
    slug,
    text: {
      en: loc(titles.en, prompts.en, pick("en"), hints.en),
      fr: loc(titles.fr, prompts.fr, pick("fr"), hints.fr),
      qc: loc(titles.qc, prompts.qc, pick("qc"), hints.qc),
      de: loc(titles.de, prompts.de, pick("de"), hints.de),
    },
  };
}

export function anyCapital(tier, slug, country, city, wrongs) {
  return capital(null, tier, slug, country, city, wrongs);
}

export function capital(g, tier, slug, country, city, wrongs) {
  return q(
    g,
    tier,
    "geography",
    slug,
    { en: "Capital", fr: "Capitale", qc: "Capitale", de: "Hauptstadt" },
    {
      en: `What is the capital of ${country.en}?`,
      fr: `Quelle est la capitale ${country.fr}?`,
      qc: `C'est quoi la capitale ${country.qc}?`,
      de: `Was ist die Hauptstadt von ${country.de}?`,
    },
    {
      en: [city.en, wrongs[0].en, wrongs[1].en, wrongs[2].en],
      fr: [city.fr, wrongs[0].fr, wrongs[1].fr, wrongs[2].fr],
      qc: [city.qc, wrongs[0].qc, wrongs[1].qc, wrongs[2].qc],
      de: [city.de, wrongs[0].de, wrongs[1].de, wrongs[2].de],
    },
    {
      en: "The biggest city is not always the capital.",
      fr: "La plus grande ville n'est pas toujours la capitale.",
      qc: "La plus grande ville n'est pas toujours la capitale.",
      de: "Die größte Stadt ist nicht immer die Hauptstadt.",
    },
  );
}

export function stateCapital(tier, slug, state, city, wrongs) {
  return q(
    "multi-gen",
    tier,
    "geography",
    slug,
    { en: "State capital", fr: "Capitale d'État", qc: "Capitale d'État", de: "Staatshauptstadt" },
    {
      en: `What is the capital of the U.S. state of ${state}?`,
      fr: `Quelle est la capitale de l'État américain de ${state} ?`,
      qc: `C'est quoi la capitale de l'État américain de ${state} ?`,
      de: `Was ist die Hauptstadt des US-Bundesstaats ${state}?`,
    },
    [city, ...wrongs],
    {
      en: "The famous city nearby can be a different place.",
      fr: "La ville célèbre à côté peut être un autre endroit.",
      qc: "La ville connue à côté peut être une autre place.",
      de: "Die berühmte Stadt daneben kann ein anderer Ort sein.",
    },
  );
}

export function symbol(g, tier, slug, element, sym, wrongs) {
  return q(
    g,
    tier,
    "sci-fi",
    slug,
    { en: "Symbol", fr: "Symbole", qc: "Symbole", de: "Symbol" },
    {
      en: `What is the chemical symbol for ${element.en}?`,
      fr: `Quel est le symbole chimique de ${element.fr} ?`,
      qc: `C'est quoi le symbole chimique de ${element.qc} ?`,
      de: `Welches chemische Symbol hat ${element.de}?`,
    },
    [sym, ...wrongs],
    {
      en: "The letters come from the old name or the English one.",
      fr: "Les lettres viennent du nom ancien ou du nom anglais.",
      qc: "Les lettres viennent du vieux nom ou du nom anglais.",
      de: "Die Buchstaben kommen vom alten Namen oder vom englischen.",
    },
  );
}

export function toQuestion(row) {
  const code = GEN_CODE[row.g];
  const tier = TIER_CODE[row.tier];
  if (!code || !tier) throw new Error(`bad slot ${row.g} ${row.tier} ${row.slug}`);
  return {
    id: `cq-w39-${code}-${tier}-${row.slug}`,
    tier: row.tier,
    topic: row.topic,
    generation: row.g,
    structure: row.structure || null,
    correctIndex: 0,
    addedWeek: WEEK,
    sources: SOURCES[row.topic] || SOURCES.culture,
    text: {
      en: row.text.en,
      fr: row.text.fr,
      "fr-CA": row.text.qc,
      de: row.text.de,
    },
  };
}

const GENS = Object.keys(FILL_NEED);

/** Fill each generation's remaining tier slots, round-robin, until the week is full. */
export function place(facts) {
  const left = {};
  for (const [g, tiers] of Object.entries(FILL_NEED)) left[g] = { ...tiers };
  const cursor = { easy: 0, hard: 0, difficult: 0, extreme: 0 };
  const ordered = [...facts.filter((row) => row.g), ...facts.filter((row) => !row.g)];
  return ordered.map((row) => {
    if (row.g) {
      if (!left[row.g] || left[row.g][row.tier] <= 0) {
        throw new Error(`no reserved slot for ${row.g} ${row.tier} ${row.slug}`);
      }
      left[row.g][row.tier] -= 1;
      return row;
    }
    for (let n = 0; n < GENS.length; n += 1) {
      const g = GENS[(cursor[row.tier] + n) % GENS.length];
      if (left[g][row.tier] > 0) {
        left[g][row.tier] -= 1;
        cursor[row.tier] = (GENS.indexOf(g) + 1) % GENS.length;
        return { ...row, g };
      }
    }
    throw new Error(`no open ${row.tier} slot for ${row.slug}`);
  });
}

export function report(facts) {
  const left = {};
  for (const [g, tiers] of Object.entries(FILL_NEED)) left[g] = { ...tiers };
  const slugs = new Set();
  const tierLeft = { easy: 0, hard: 0, difficult: 0, extreme: 0 };
  for (const tiers of Object.values(FILL_NEED)) {
    for (const [tier, n] of Object.entries(tiers)) tierLeft[tier] += n;
  }
  for (const row of facts) {
    if (slugs.has(row.slug)) throw new Error(`duplicate slug ${row.slug}`);
    slugs.add(row.slug);
    tierLeft[row.tier] -= 1;
    if (row.g) {
      if (left[row.g]?.[row.tier] > 0) left[row.g][row.tier] -= 1;
    }
  }
  return { facts: facts.length, tierLeft, reservedStillOpen: left };
}

export function assemble(facts) {
  const buckets = new Map();
  const slugs = new Set();
  for (const row of facts) {
    if (slugs.has(row.slug)) throw new Error(`duplicate slug ${row.slug}`);
    slugs.add(row.slug);
    const key = `${row.g}|${row.tier}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row);
  }
  const out = [];
  for (const [g, tiers] of Object.entries(FILL_NEED)) {
    for (const [tier, need] of Object.entries(tiers)) {
      const rows = buckets.get(`${g}|${tier}`) || [];
      if (rows.length !== need) {
        throw new Error(`${g} ${tier}: have ${rows.length}, need ${need}`);
      }
      for (const row of rows) out.push(toQuestion(row));
    }
  }
  return out;
}
