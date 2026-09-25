/** Fields that reveal the answer. They stay off any public response. */
const SECRET = ["correctIndex", "banterHint", "answer", "accepted"];

export function stripQuestion(q) {
  if (!q || typeof q !== "object") return q;
  const out = { ...q };
  for (const key of SECRET) delete out[key];
  return out;
}

export function stripBank(data) {
  if (Array.isArray(data)) return data.map(stripQuestion);
  if (data && Array.isArray(data.questions)) {
    return { ...data, questions: data.questions.map(stripQuestion) };
  }
  return data;
}

export function hasAnswerKey(q) {
  return Number.isInteger(q?.correctIndex);
}

/** Shuffle choices and keep the key attached. Server-side only. */
export function shuffleKeyedQuestion(q) {
  if (!q || !Array.isArray(q.choices) || q.choices.length < 2 || !hasAnswerKey(q)) return q;
  const correct = q.choices[q.correctIndex];
  const choices = [...q.choices];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  let correctIndex = choices.indexOf(correct);
  if (correctIndex < 0) correctIndex = 0;
  return { ...q, choices, correctIndex };
}
