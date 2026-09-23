/**
 * Question shapes the creators use. Each new question picks one shape.
 * A joke is some of the easy and hard questions in a normal show.
 * A colour question asks "What colour is…".
 */

export const PLAY_TIERS = new Set(["easy", "hard"]);

export const STRUCTURES = {
  joke: {
    tiers: ["easy", "hard"],
    note: "Some easy and hard questions in general play. Not used in lockdown.",
  },
  colour: {
    tiers: ["easy", "hard", "difficult", "extreme"],
    note: "Asks what colour something is. The prompt starts with that question.",
  },
};

/** English, France, Quebec, and German openings for a colour question. */
export const COLOUR_PROMPT = /what colou?r is|de quelle couleur|c'est quoi la couleur|welche farbe/i;

export function isColourPrompt(prompt) {
  return COLOUR_PROMPT.test(String(prompt || ""));
}
