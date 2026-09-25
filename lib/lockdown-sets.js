/** Fourteen lockdown sets. A show draws one opposite pair at random. */

export const LOCKDOWN_SET_SIZE = 5;

/** Each pair is two generations facing each other. */
export const LOCKDOWN_PAIRS = [
  ["01-silent-generation", "02-gen-alpha"],
  ["03-baby-boomer", "04-gen-z"],
  ["05-gen-x", "06-gen-y"],
  ["07-silent-generation-b", "08-gen-alpha-b"],
  ["09-baby-boomer-b", "10-gen-z-b"],
  ["11-gen-x-b", "12-gen-y-b"],
  ["13-multi-gen", "14-gen-x-c"],
];

export const LOCKDOWN_GENERATION = {
  "01-silent-generation": "silent-generation",
  "02-gen-alpha": "gen-alpha",
  "03-baby-boomer": "baby-boomer",
  "04-gen-z": "gen-z",
  "05-gen-x": "gen-x",
  "06-gen-y": "gen-y",
  "07-silent-generation-b": "silent-generation",
  "08-gen-alpha-b": "gen-alpha",
  "09-baby-boomer-b": "baby-boomer",
  "10-gen-z-b": "gen-z",
  "11-gen-x-b": "gen-x",
  "12-gen-y-b": "gen-y",
  "13-multi-gen": "multi-gen",
  "14-gen-x-c": "gen-x",
};

export function lockdownSetPath(setId, locale = "en") {
  const id = String(setId || "");
  const loc = locale === "fr" || locale === "fr-CA" || locale === "de" ? locale : "en";
  return `banks/lockdown/${loc}/${id}.json`;
}

/** Random opposite pair. The second set is never the same generation as the first. */
export function pickOppositePair(rng = Math.random) {
  const pairs = LOCKDOWN_PAIRS;
  const pair = pairs[Math.floor(rng() * pairs.length)] || pairs[0];
  const flip = rng() < 0.5;
  return flip ? [pair[1], pair[0]] : [pair[0], pair[1]];
}

/**
 * Two indexes where a correct buzz can open lockdown.
 * Never the first two questions, never the last, and not on top of each other.
 */
export function evokeLockdownSlots(length, rng = Math.random) {
  const n = Number(length) || 0;
  if (n < 8) return [];
  const open = [];
  for (let i = 2; i <= n - 2; i += 1) open.push(i);
  for (let i = open.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [open[i], open[j]] = [open[j], open[i]];
  }
  const first = open[0];
  const second = open.find((i) => Math.abs(i - first) >= 4);
  if (!Number.isInteger(first) || !Number.isInteger(second)) return Number.isInteger(first) ? [first] : [];
  return [first, second].sort((a, b) => a - b);
}
