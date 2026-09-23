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

/** Some jokes belong in easy and hard for a normal show. Lockdown tiers stay factual. */
export const SHOW_JOKES = { easy: 2, hard: 1 };

/** A show may include one renegade joke. It fills a joke slot. It is not required. */
export const SHOW_RENEGADE_MAX = 1;

function takeSpread(pool, need, recent) {
  return spreadByGeneration(pool, need, {
    isRecent: (q) => recent.has(String(q.id)),
    rank: () => 0,
    shuffle: shuffleList,
  });
}

function takeJokes(pool, jokeNeed, recent, renegadesLeft) {
  const renegades = pool.filter((q) => q.renegade === true && q.humorous === true);
  const humorous = pool.filter((q) => q.humorous === true && q.renegade !== true);
  const gags = pool.filter((q) => q.funny === true && q.humorous !== true);
  const jokes = [];
  if (renegadesLeft > 0 && jokeNeed > 0 && renegades.length) {
    jokes.push(...takeSpread(renegades, 1, recent));
  }
  jokes.push(...takeSpread(humorous, jokeNeed - jokes.length, recent));
  jokes.push(...takeSpread(gags, jokeNeed - jokes.length, recent));
  return jokes;
}

/** A fresh 37 from a Q&A bank, spread across generations, skipping recent ids. */
export function dealShow(questions, avoid = []) {
  const recent = new Set((avoid || []).map(String));
  const used = new Set();
  const out = [];
  let renegadesLeft = SHOW_RENEGADE_MAX;
  for (const [tier, need] of Object.entries(SHOW_DEAL)) {
    const pool = (questions || []).filter((q) => q.tier === tier && !used.has(String(q.id)));
    const jokeNeed = Math.min(SHOW_JOKES[tier] || 0, need);
    const jokes = takeJokes(pool, jokeNeed, recent, renegadesLeft);
    renegadesLeft -= jokes.filter((q) => q.renegade === true).length;
    const rest = takeSpread(
      pool.filter((q) => q.funny !== true),
      need - jokes.length,
      recent,
    );
    const picked = [...jokes, ...rest];
    for (const q of picked) used.add(String(q.id));
    out.push(...picked);
  }
  return out;
}
