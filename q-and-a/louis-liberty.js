/**
 * Louis Liberty is the Q&A safeguard for Gen Alpha, ages 13–16.
 * He uses child psychology and human behaviour as a writing guide, not as
 * clinical advice: one clear question, concrete choices, a kind joke, and
 * no fear, shame, or personal ask. He structures questions so they stay
 * fun, happy, and non-threatening.
 */

const BLOCKS = [
  { code: "sexual", re: /\b(sex|sexy|nude|naked|porn|erotic|orgasm)\b/i },
  { code: "self-harm", re: /\b(suicide|kill yourself|self-harm|cut yourself)\b/i },
  { code: "drugs", re: /\b(cocaine|heroin|meth|marijuana|cannabis|vodka|whiskey|whisky|beer|drunk)\b/i },
  { code: "hate", re: /\b(nigger|faggot|retard|kike|spic|chink|tranny)\b/i },
  { code: "gore", re: /\b(gore|dismember|decapitat\w*|bloodbath|torture|guts everywhere)\b/i },
  { code: "gambling", re: /\b(casino|slot machine|sportsbook|place a bet)\b/i },
  { code: "personal", re: /\b(home address|phone number|what school do you|where do you live|send a photo)\b/i },
  { code: "cruel", re: /\b(you('re| are) (stupid|ugly|dumb)|i hate you|kill them|loser)\b/i },
];

/** Player-directed pressure. A silly wrong answer is not this. */
const THREAT = /\b(you will fail|everyone will laugh at you|what'?s wrong with you|are you scared of|you should be ashamed|i('ll| will) hurt you)\b/i;

export const LOUIS_BOT = "Louis Liberty";

/** House inbox. Notes and the welcome letter use this address. */
export const LOUIS_MAIL = "gmgbrandlabel@gmail.com";

function textOf(q) {
  const choices = Array.isArray(q?.choices) ? q.choices.join(" ") : "";
  return [q?.prompt, q?.categoryTitle, q?.banterHint, choices].filter(Boolean).join(" ");
}

/**
 * How Louis would shape the question for 13–16.
 * fun: one playful ask. happy: a warm miss. calm: no fear or shame.
 * clear: a short prompt and real choices.
 */
export function structureForChildren(q, reasons = []) {
  const prompt = String(q?.prompt || "").trim();
  const hint = String(q?.banterHint || "").trim();
  const choices = Array.isArray(q?.choices) ? q.choices : [];
  const text = textOf(q);
  const blocked = reasons.some((code) => code !== "incomplete");
  const shape = {
    fun: (prompt.includes("?") || q?.funny === true) && prompt.length > 0 && prompt.length <= 140,
    happy: hint.length >= 8 && !THREAT.test(hint),
    calm: !blocked && !THREAT.test(text),
    clear: prompt.length > 0 && prompt.length <= 120 && choices.length >= 2 && choices.length <= 4,
  };
  const notes = [];
  if (shape.clear) notes.push("One short question with concrete choices.");
  else notes.push("Keep one short question and two to four concrete choices.");
  if (shape.fun) notes.push("The ask stays playful, which suits 13–16.");
  else notes.push("Make it one playful question, not a lecture.");
  if (shape.happy) notes.push("The extra line is kind, so a miss still feels light.");
  else notes.push("Add a short kind line so a wrong answer stays happy, not mean.");
  if (shape.calm) notes.push("Nothing here threatens, shames, or asks for anything personal.");
  else notes.push("Take out fear, shame, and anything personal. Wrong answers can be silly.");
  return { shape, notes };
}

export function reviewForChildren(q) {
  const text = textOf(q);
  const reasons = [];
  if (!q?.prompt || !Array.isArray(q?.choices) || q.choices.length < 2) {
    reasons.push("incomplete");
  }
  for (const block of BLOCKS) {
    if (block.re.test(text)) reasons.push(block.code);
  }
  if (THREAT.test(text)) reasons.push("threat");
  const { shape, notes } = structureForChildren(q, reasons);
  return {
    bot: LOUIS_BOT,
    ok: reasons.length === 0,
    reasons,
    shape,
    notes,
  };
}
