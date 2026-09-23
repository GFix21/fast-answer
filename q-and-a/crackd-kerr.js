import { reviewForChildren } from "./louis-liberty.js";
import { PLAY_TIERS, JOKE_STRUCTURE, isRenegadeJoke } from "./bots/structures.js";

/**
 * Crack'd Kerr is the Q&A comedy bot.
 * Creators send a structured question. He injects a dialogue around it.
 * The correct choice stays the outcome of that structure.
 * A renegade injection plays a different structure, so the outcome changes
 * with the structure he played. He does not copy jokes from sites, wikis, or X.
 * A question Louis Liberty rejects is not rated.
 */

export { isRenegadeJoke, JOKE_STRUCTURE };

/** How Crack'd sends a creator question back. */
export const COMEDY_STRUCTURES = {
  dialogue: {
    owner: "Crack'd Kerr",
    note: "Two people. One asks the creator's question. The other gives the real answer.",
  },
  renegade: {
    owner: "Crack'd Kerr",
    note: "He plays a different structure from the one the creator sent. The correct choice is that structure's fact.",
  },
};

const DIALOGUE = {
  en: (ask) => `Two friends are walking. One asks the other, "${ask}" The other answers…`,
  fr: (ask) => `Deux amis se promènent. L'un demande à l'autre : « ${ask} » L'autre répond…`,
  "fr-CA": (ask) => `Deux amis se promènent. L'un demande à l'autre : « ${ask} » L'autre répond…`,
  de: (ask) => `Zwei Freunde gehen spazieren. Einer fragt den anderen: „${ask}“ Der andere antwortet…`,
};

/**
 * Joke injection. The choices and correctIndex stay the creator's.
 * `playedStructure` is the structure that produced this outcome.
 * It is renegade when that structure is not the one the creator sent.
 */
export function injectHumor(q, { locale = "en", playedStructure, renegade = false } = {}) {
  const fromStructure = q?.fromStructure || q?.structure || null;
  const structure = playedStructure || fromStructure;
  const frame = DIALOGUE[locale] || DIALOGUE.en;
  const ask = String(q?.prompt || "").trim();
  const playedOther = Boolean(structure && fromStructure && structure !== fromStructure);
  return {
    ...q,
    prompt: frame(ask),
    humorous: true,
    funny: true,
    injection: "dialogue",
    technique: q?.technique || "dialogue",
    fromStructure,
    structure,
    renegade: renegade === true || playedOther,
  };
}

const MEAN = /\b(stupid|ugly|dumb|loser|hate|shut up|idiot)\b/i;
const VIRAL_MIN = 70;

/** Technique notes Crack'd uses when a creator writes an original joke. */
export const JOKE_TECHNIQUES = {
  wordplay: "One word can mean two things. The punchline is the second meaning, and it stays kind.",
  misdirection: "The setup points one way. The answer steps aside without mocking anyone.",
  callback: "A later line returns to the first picture, so the joke feels finished.",
  dialogue: "Two people. One asks the creator's question. The other gives the real answer.",
};

export const COMEDY_BOT = "Crack'd Kerr";

export function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function scoreJoke(q) {
  const safety = reviewForChildren(q);
  if (!safety.ok) return { rating: 0, safety };
  if (q?.funny === true && q?.tier && !PLAY_TIERS.has(q?.tier)) {
    return { rating: 0, safety, tierHeld: true };
  }
  const prompt = String(q?.prompt || "");
  const hint = String(q?.banterHint || "");
  const choices = Array.isArray(q?.choices) ? q.choices.join(" ") : "";
  let rating = 60;
  if (prompt.includes("?")) rating += 10;
  const lengthCap = q?.humorous === true ? 180 : 90;
  if (prompt.length > 0 && prompt.length <= lengthCap) rating += 10;
  if (hint.length >= 8) rating += 10;
  if (JOKE_TECHNIQUES[q?.technique]) rating += 5;
  if (MEAN.test(`${prompt} ${hint} ${choices}`)) rating -= 50;
  rating = Math.max(0, Math.min(100, rating));
  return { rating, safety };
}

function row(q, week) {
  const { rating, safety } = scoreJoke(q);
  return {
    id: q.id,
    generation: q.generation || "",
    prompt: q.prompt,
    rating,
    safety,
    fresh: q.addedWeek === week,
    funny: q.funny === true,
    structure: q.structure || (q.funny === true ? JOKE_STRUCTURE : ""),
    fromStructure: q.fromStructure || "",
    humorous: q.humorous === true,
    renegade: q.renegade === true,
  };
}

/**
 * Weekly pass: new funny jokes, then the highest-rated jokes.
 * `viral` is the fresh set Crack'd Kerr would put forward.
 */
export function weeklyComedyReview(questions, { week = isoWeek(), now = new Date().toISOString() } = {}) {
  const funny = (questions || []).filter((q) => q && (q.funny === true || q.addedWeek));
  const reviewed = funny.map((q) => row(q, week));
  const fresh = reviewed
    .filter((r) => r.fresh && r.safety.ok && r.rating >= VIRAL_MIN)
    .sort((a, b) => b.rating - a.rating);
  const highestRated = reviewed
    .filter((r) => r.safety.ok && r.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  return {
    bot: COMEDY_BOT,
    week,
    reviewedAt: now,
    fresh,
    highestRated,
    viral: fresh.slice(0, 3),
    blocked: reviewed.filter((r) => !r.safety.ok),
    weak: reviewed.filter((r) => r.funny && r.safety.ok && r.rating < VIRAL_MIN && r.fresh),
  };
}
