/**
 * Round-robin a tier pool across Q-and-A generations so a deal cannot
 * drop a generation that still has questions in that tier.
 * Within a generation, unseen ids come first, then least-recent.
 */
export function spreadByGeneration(pool, need, { isRecent, rank, shuffle }) {
  if (!pool?.length || need <= 0) return [];
  const groups = new Map();
  for (const q of pool) {
    const g = String(q?.generation || "").trim() || "_";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(q);
  }
  const queues = shuffle([...groups.values()]).map((list) => {
    const fresh = shuffle(list.filter((q) => !isRecent(q)));
    const used = list.filter((q) => isRecent(q));
    used.sort((a, b) => (rank(b) ?? 0) - (rank(a) ?? 0));
    return [...fresh, ...used];
  });
  const picked = [];
  while (picked.length < need) {
    let moved = false;
    for (const queue of queues) {
      if (picked.length >= need) break;
      const next = queue.shift();
      if (!next) continue;
      picked.push(next);
      moved = true;
    }
    if (!moved) break;
  }
  return picked;
}

function shuffleList(list) {
  const x = [...list];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

export const SHOW_DEAL = { easy: 20, hard: 10, difficult: 5, extreme: 2 };

/** A fresh 37 from a Q&A bank, spread across generations, skipping recent ids. */
export function dealShow(questions, avoid = []) {
  const recent = new Set((avoid || []).map(String));
  const out = [];
  for (const [tier, need] of Object.entries(SHOW_DEAL)) {
    out.push(...spreadByGeneration(
      (questions || []).filter((q) => q.tier === tier),
      need,
      {
        isRecent: (q) => recent.has(String(q.id)),
        rank: () => 0,
        shuffle: shuffleList,
      },
    ));
  }
  return out;
}
