/**
 * Checker. A question needs a real shape before it can enter a pack.
 * Jokes stay on easy or hard, which is general play. A colour question
 * asks what colour something is. The correct choice must not already
 * be written in the prompt.
 */

import { isColourPrompt, isRenegadeJoke, isWhenPrompt, PLAY_TIERS, STRUCTURES } from "./structures.js";
import { INJECTION_FRAMES } from "../crackd-kerr.js";
import { answerInQuestion } from "../../lib/answer-in-question.js";

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
  if (answerInQuestion(q)) reasons.push("answer-in-question");
  if (!q?.generation) reasons.push("generation");
  if (q?.funny === true && !PLAY_TIERS.has(q?.tier)) reasons.push("play-tier");
  if (q?.structure === "joke" && q?.funny !== true) reasons.push("joke-flag");
  if (q?.funny === true && !q?.technique) reasons.push("technique");
  if (q?.structure === "colour" && !isColourPrompt(q?.prompt)) reasons.push("colour-prompt");
  if (q?.structure === "when" && !isWhenPrompt(q?.prompt)) reasons.push("when-prompt");
  if (q?.humorous === true && !INJECTION_FRAMES[q?.injection]) reasons.push("injection");
  if (Array.isArray(q?.jokeWrongIndexes)) {
    const correct = String(q.choices?.[q.correctIndex] || "").trim().toLowerCase();
    const indexes = q.jokeWrongIndexes;
    const wrongs = (q.choices || []).map((_, i) => i).filter((i) => i !== q.correctIndex);
    const plain = wrongs.filter((i) => !indexes.includes(i));
    if (indexes.length !== 2 || plain.length !== 1 || indexes.includes(q.correctIndex)) {
      reasons.push("joke-wrongs");
    }
    for (const i of indexes) {
      const line = String(q.choices?.[i] || "").trim().toLowerCase();
      if (!line || line === correct || (correct && line.includes(correct))) reasons.push("gives-away");
    }
  }
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
