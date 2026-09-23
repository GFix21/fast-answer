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

/**
 * A show ramp: 20 easy, 10 hard, 5 difficult, 2 extreme.
 * Seated generations fill each tier first. The rest of the bank fills a short tier.
 * Joke slots and one renegade stay inside the easy and hard counts.
 */
export function dealRamp(questions, { seats = [], avoid = [], allow = null } = {}) {
  const recent = new Set((avoid || []).map(String));
  const seatGens = [];
  for (const seat of seats) {
    const gen = typeof seat === "string" ? seat : String(seat?.generation || "");
    if (gen) seatGens.push(gen);
  }
  const all = (questions || []).filter((q) => q && q.id && (!allow || allow(q)));
  const used = new Set();
  const out = [];
  let renegadesLeft = SHOW_RENEGADE_MAX;
  for (const [tier, need] of Object.entries(SHOW_DEAL)) {
    const pool = all.filter((q) => q.tier === tier && !used.has(String(q.id)));
    const jokeNeed = Math.min(SHOW_JOKES[tier] || 0, need);
    const seated = seatGens.length ? pool.filter((q) => seatGens.includes(q.generation)) : pool;
    let jokes = [];
    if (renegadesLeft > 0 && jokeNeed > 0) {
      jokes = takeJokes(pool.filter((q) => q.renegade === true), Math.min(1, jokeNeed), recent, renegadesLeft);
    }
    const fillJokes = (source, slots, left) => {
      if (jokes.length >= jokeNeed || slots <= 0) return;
      const have = new Set(jokes.map((q) => String(q.id)));
      jokes = [
        ...jokes,
        ...takeJokes(source.filter((q) => !have.has(String(q.id))), slots, recent, left),
      ];
    };
    fillJokes(seated, jokeNeed - jokes.length, renegadesLeft - jokes.filter((q) => q.renegade === true).length);
    fillJokes(pool, jokeNeed - jokes.length, 0);
    renegadesLeft -= jokes.filter((q) => q.renegade === true).length;
    const jokeIds = new Set(jokes.map((q) => String(q.id)));
    const facts = pool.filter((q) => q.funny !== true && !jokeIds.has(String(q.id)));
    const first = takeSpread(seatGens.length ? facts.filter((q) => seatGens.includes(q.generation)) : facts, need - jokes.length, recent);
    const haveFacts = new Set(first.map((q) => String(q.id)));
    const rest = first.length >= need - jokes.length
      ? []
      : takeSpread(facts.filter((q) => !haveFacts.has(String(q.id))), need - jokes.length - first.length, recent);
    const picked = [...jokes, ...first, ...rest];
    for (const q of picked) used.add(String(q.id));
    out.push(...picked);
  }
  return out;
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
