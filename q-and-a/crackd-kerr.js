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

function frames(en, fr, frCA, de) {
  return { en, fr, "fr-CA": frCA, de };
}

/** How Crack'd sends a creator question back. Each frame keeps the creator's ask inside it. */
export const COMEDY_STRUCTURES = {
  dialogue: {
    owner: "Crack'd Kerr",
    note: "Two people. One asks the creator's question. The other gives the real answer.",
    frame: frames(
      (ask) => `Two friends are walking. One asks the other, "${ask}" The other answers…`,
      (ask) => `Deux amis se promènent. L'un demande à l'autre : « ${ask} » L'autre répond…`,
      (ask) => `Deux amis se promènent. L'un demande à l'autre : « ${ask} » L'autre répond…`,
      (ask) => `Zwei Freunde gehen spazieren. Einer fragt den anderen: „${ask}“ Der andere antwortet…`,
    ),
  },
  "straight-man": {
    owner: "Crack'd Kerr",
    note: "One friend guesses wildly. The other answers the question that was asked.",
    frame: frames(
      (ask) => `One friend guesses wildly. The other answers the question that was asked: "${ask}"`,
      (ask) => `Un ami devine n'importe quoi. L'autre répond à la question posée : « ${ask} »`,
      (ask) => `Un ami devine n'importe quoi. L'autre répond à la question posée : « ${ask} »`,
      (ask) => `Ein Freund rät wild. Der andere beantwortet die gestellte Frage: „${ask}“`,
    ),
  },
  "rule-of-three": {
    owner: "Crack'd Kerr",
    note: "Two wrong beats, then the creator's question.",
    frame: frames(
      (ask) => `First guess, wrong. Second guess, wrong. Then the real question: "${ask}"`,
      (ask) => `Premier essai, faux. Deuxième essai, faux. Puis la vraie question : « ${ask} »`,
      (ask) => `Premier essai, faux. Deuxième essai, faux. Puis la vraie question : « ${ask} »`,
      (ask) => `Erster Tipp, falsch. Zweiter Tipp, falsch. Dann die echte Frage: „${ask}“`,
    ),
  },
  misdirection: {
    owner: "Crack'd Kerr",
    note: "The story points elsewhere. The scored question is still the creator's.",
    frame: frames(
      (ask) => `The story seems to head somewhere else. The question is still, "${ask}"`,
      (ask) => `L'histoire semble partir ailleurs. La question reste : « ${ask} »`,
      (ask) => `L'histoire semble partir ailleurs. La question reste : « ${ask} »`,
      (ask) => `Die Geschichte scheint woanders hinzugehen. Die Frage bleibt: „${ask}“`,
    ),
  },
  wordplay: {
    owner: "Crack'd Kerr",
    note: "A word can mean two things. The scored meaning is the plain fact.",
    frame: frames(
      (ask) => `One word can mean two things. The scored meaning is the plain one: "${ask}"`,
      (ask) => `Un mot peut vouloir dire deux choses. Le sens qui compte est le sens simple : « ${ask} »`,
      (ask) => `Un mot peut vouloir dire deux choses. Le sens qui compte est le sens simple : « ${ask} »`,
      (ask) => `Ein Wort kann zweierlei heißen. Die gewertete Bedeutung ist die schlichte: „${ask}“`,
    ),
  },
  callback: {
    owner: "Crack'd Kerr",
    note: "The same friends return to a question already in the walk.",
    frame: frames(
      (ask) => `Same friends as before. They come back to this: "${ask}"`,
      (ask) => `Les mêmes amis qu'avant. Ils reviennent à ceci : « ${ask} »`,
      (ask) => `Les mêmes amis qu'avant. Ils reviennent à ceci : « ${ask} »`,
      (ask) => `Dieselben Freunde wie zuvor. Sie kommen hierauf zurück: „${ask}“`,
    ),
  },
  escalation: {
    owner: "Crack'd Kerr",
    note: "The story gets bigger. The question stays the same size.",
    frame: frames(
      (ask) => `The story gets bigger. The question stays the same size: "${ask}"`,
      (ask) => `L'histoire grossit. La question garde la même taille : « ${ask} »`,
      (ask) => `L'histoire grossit. La question garde la même taille : « ${ask} »`,
      (ask) => `Die Geschichte wird größer. Die Frage bleibt gleich groß: „${ask}“`,
    ),
  },
  reverse: {
    owner: "Crack'd Kerr",
    note: "The funny line is a wrong choice. The correct choice is the plain fact.",
    frame: frames(
      (ask) => `The funny line is a wrong choice. The question to score is, "${ask}"`,
      (ask) => `La réplique drôle est une mauvaise réponse. La question à jouer est : « ${ask} »`,
      (ask) => `La réplique drôle est une mauvaise réponse. La question à jouer est : « ${ask} »`,
      (ask) => `Der lustige Satz ist eine falsche Antwort. Die Frage, die zählt, ist: „${ask}“`,
    ),
  },
  aside: {
    owner: "Crack'd Kerr",
    note: "A step out of the scene, then back to the creator's question.",
    frame: frames(
      (ask) => `A quick step aside, then back to the question: "${ask}"`,
      (ask) => `Un petit pas de côté, puis retour à la question : « ${ask} »`,
      (ask) => `Un petit pas de côté, puis retour à la question : « ${ask} »`,
      (ask) => `Ein kurzer Schritt zur Seite, dann zurück zur Frage: „${ask}“`,
    ),
  },
  renegade: {
    owner: "Crack'd Kerr",
    note: "He plays a different structure from the one the creator sent. The correct choice is that structure's fact.",
  },
};

export const INJECTION_FRAMES = Object.fromEntries(
  Object.entries(COMEDY_STRUCTURES).filter(([, row]) => row.frame),
);

/**
 * Two wrong answers become punchlines. The correct choice is untouched.
 * One creator wrong answer stays plain, so the joke cannot travel far
 * and the punchlines do not replace the fact.
 */
export function injectWrongAnswers(q, locale = "en") {
  const choices = Array.isArray(q?.choices) ? [...q.choices] : [];
  const correctIndex = q?.correctIndex;
  const map = q?.jokeWrongs || {};
  const jokeWrongIndexes = [];
  for (const [key, pack] of Object.entries(map)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index === correctIndex || index < 0 || index >= choices.length) continue;
    const line = pack?.[locale] || pack?.en;
    if (!line) continue;
    choices[index] = line;
    jokeWrongIndexes.push(index);
  }
  jokeWrongIndexes.sort((a, b) => a - b);
  return { choices, jokeWrongIndexes };
}

/**
 * Joke injection. The choices and correctIndex stay the creator's.
 * `playedStructure` is the structure that produced this outcome.
 * It is renegade when that structure is not the one the creator sent.
 */
export function injectHumor(q, { locale = "en", playedStructure, renegade = false } = {}) {
  const fromStructure = q?.fromStructure || q?.structure || null;
  const structure = playedStructure || fromStructure;
  const style = INJECTION_FRAMES[q?.injection] ? q.injection : "dialogue";
  const set = INJECTION_FRAMES[style].frame;
  const frame = set[locale] || set.en;
  const ask = String(q?.prompt || "").trim();
  const playedOther = Boolean(structure && fromStructure && structure !== fromStructure);
  return {
    ...q,
    prompt: frame(ask),
    humorous: true,
    funny: true,
    injection: style,
    technique: q?.technique || style,
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
  "straight-man": "One friend guesses wildly. The other answers the question that was asked.",
  "rule-of-three": "Two wrong beats, then the creator's question.",
  escalation: "The story gets bigger. The question stays the same size.",
  reverse: "The funny line is a wrong choice. The correct choice is the plain fact.",
  aside: "A step out of the scene, then back to the creator's question.",
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
