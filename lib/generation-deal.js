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
