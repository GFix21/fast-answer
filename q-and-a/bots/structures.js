/**
 * Question shapes the creators use. The structure decides the outcome.
 * Crack'd Kerr can wrap that question in a dialogue. A renegade play
 * uses a different structure, so the outcome is that structure's fact.
 */

export const PLAY_TIERS = new Set(["easy", "hard"]);

export const JOKE_STRUCTURE = "joke";

export const STRUCTURES = {
  joke: {
    tiers: ["easy", "hard"],
    note: "A small gag for Gen Alpha. The correct choice is the punchline.",
  },
  when: {
    tiers: ["easy", "hard", "difficult", "extreme"],
    note: "Asks when something happened. The correct choice is the date or year.",
  },
  colour: {
    tiers: ["easy", "hard", "difficult", "extreme"],
    note: "Asks what colour something is. The correct choice is the colour.",
  },
};

/** English, France, Quebec, and German openings for a colour question. */
export const COLOUR_PROMPT = /what colou?r (is|was|were)|de quelle couleur|c'est quoi la couleur|welche farbe/i;

/** English, France, Quebec, and German openings for a when question. */
export const WHEN_PROMPT = /when (did|was)|quand|wann/i;

export function isColourPrompt(prompt) {
  return COLOUR_PROMPT.test(String(prompt || ""));
}

export function isWhenPrompt(prompt) {
  return WHEN_PROMPT.test(String(prompt || ""));
}

export function isRenegadeJoke(q) {
  return q?.renegade === true;
}
