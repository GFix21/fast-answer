/**
 * The correct choice must not already be written in the prompt.
 * Short answers (under 3 letters) are left alone so "a" or "in" do not false-alarm.
 */

function fold(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function answerInQuestion(q) {
  const choices = Array.isArray(q?.choices) ? q.choices : [];
  const answer = fold(choices[q?.correctIndex]);
  if (answer.length < 3) return false;
  const prompt = fold(q?.prompt);
  if (!prompt.includes(answer)) return false;
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(prompt);
}
