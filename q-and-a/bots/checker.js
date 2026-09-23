/**
 * Checker. A question needs a real shape before it can enter a pack.
 * Jokes stay on easy or hard, which is general play. A colour question
 * asks what colour something is.
 */

import { isColourPrompt, isRenegadeJoke, isWhenPrompt, PLAY_TIERS, STRUCTURES } from "./structures.js";

const TIERS = new Set(["easy", "hard", "difficult", "extreme"]);

export const CHECKER_BOT = "Checker";

export function checkQuestion(q) {
  const reasons = [];
  if (!q?.id) reasons.push("id");
  if (!q?.prompt || String(q.prompt).trim().length < 8) reasons.push("prompt");
  if (!Array.isArray(q?.choices) || q.choices.length < 2) reasons.push("choices");
  else if (q.choices.some((c) => !String(c || "").trim())) reasons.push("blank-choice");
  if (!Number.isInteger(q?.correctIndex) || q.correctIndex < 0 || q.correctIndex >= (q.choices || []).length) {
    reasons.push("correctIndex");
  }
  if (!TIERS.has(q?.tier)) reasons.push("tier");
  if (!q?.generation) reasons.push("generation");
  if (q?.funny === true && !PLAY_TIERS.has(q?.tier)) reasons.push("play-tier");
  if (q?.structure === "joke" && q?.funny !== true) reasons.push("joke-flag");
  if (q?.funny === true && !q?.technique) reasons.push("technique");
  if (q?.structure === "colour" && !isColourPrompt(q?.prompt)) reasons.push("colour-prompt");
  if (q?.structure === "when" && !isWhenPrompt(q?.prompt)) reasons.push("when-prompt");
  if (q?.humorous === true && q?.injection !== "dialogue") reasons.push("injection");
  if (isRenegadeJoke(q)) {
    const from = q?.fromStructure;
    const played = q?.structure;
    if (!from || !played || !STRUCTURES[from] || !STRUCTURES[played] || from === played) {
      reasons.push("renegade-structure");
    }
    if (from === "joke" || played === "joke") reasons.push("renegade-structure");
  }
  return { bot: CHECKER_BOT, ok: reasons.length === 0, reasons };
}
