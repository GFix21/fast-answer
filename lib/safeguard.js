/**
 * Safeguard reviews a question before it can sit in a children's pack.
 * It looks for sexual content, self-harm, drugs, slurs, gore, gambling,
 * and anything that asks a child for personal details. A miss blocks the question.
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

function textOf(q) {
  const choices = Array.isArray(q?.choices) ? q.choices.join(" ") : "";
  return [q?.prompt, q?.categoryTitle, q?.banterHint, choices].filter(Boolean).join(" ");
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
  return {
    bot: "Safeguard",
    ok: reasons.length === 0,
    reasons,
  };
}
