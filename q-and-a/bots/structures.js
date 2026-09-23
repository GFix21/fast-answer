/**
 * Question shapes the creators use. Each new question picks one shape.
 * A joke is some of the easy and hard questions in a normal show.
 * A colour question asks "What colour is…".
 */

export const PLAY_TIERS = new Set(["easy", "hard"]);

export const JOKE_STRUCTURE = "joke";
export const RENEGADE_JOKE_STRUCTURE = "renegade-joke";

export const STRUCTURES = {
  joke: {
    owner: "Crack'd Kerr",
    tiers: ["easy", "hard"],
    note: "Setup, then the punchline is the correct choice. Some easy and hard questions in general play.",
  },
  "renegade-joke": {
    owner: "Crack'd Kerr",
    tiers: ["easy", "hard"],
    note: "The prompt uses a straight structure, and the correct choice leaves it. A show may include one. It does not have to.",
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

export function isRenegadeJoke(q) {
  return q?.structure === RENEGADE_JOKE_STRUCTURE;
}
