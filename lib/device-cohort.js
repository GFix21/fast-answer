import { dealShow } from "./generation-deal.js";
import { buildGenerationPacks, packSummary, PACK_TARGET } from "./generation-packs.js";

/** Two show deals plus the placement questions kept on the device. */
export const COHORT_SHOW_DECKS = 2;
export const COHORT_PLACE_MAX = 30;
export const PLACEMENT_SITTINGS = 3;
export const PLACEMENT_PER_SITTING = 10;
export const COHORT_RENEW_MONTHS = 3;
export const PLACEMENT_MANDATORY_YEARS = 2;

export function addMonthsIso(iso, months) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export function addYearsIso(iso, years) {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

/** When this placement result stops counting. Stored date wins; otherwise completion plus 2 years. */
export function placementMandatoryAt(completedAt, stored) {
  if (stored) return String(stored);
  if (!completedAt) return "";
  return addYearsIso(completedAt, PLACEMENT_MANDATORY_YEARS);
}

/** True when there is no finished placement, or the 2-year mark has passed. */
export function placementIsDue(profile, now = Date.now()) {
  if (!profile?.placementCompletedAt) return true;
  const due = Date.parse(placementMandatoryAt(profile.placementCompletedAt, profile.placementMandatoryAt));
  if (!Number.isFinite(due)) return true;
  return now >= due;
}

export function bankSignature(weekly, placement) {
  const ids = [...(weekly || []), ...(placement || [])].map((q) => String(q?.id || ""));
  ids.sort();
  let h = 2166136261;
  for (const id of ids) {
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 124;
  }
  return `${ids.length}:${h >>> 0}`;
}

/**
 * Two disjoint 37s (20/10/5/2) from the weekly cohort, then up to 30 placement
 * questions. Everything stays in the language of the banks passed in.
 */
export function buildDeviceCohort(weekly, placement, locale, now = new Date().toISOString()) {
  const source = (weekly || []).filter((q) => q && q.id && q.prompt && Array.isArray(q.choices));
  const packs = buildGenerationPacks(source);
  const summary = packSummary(packs);
  const shows = [];
  let pool = source;
  for (let i = 0; i < COHORT_SHOW_DECKS; i++) {
    const deck = dealShow(pool, []);
    const used = new Set(deck.map((q) => String(q.id)));
    shows.push(deck);
    pool = pool.filter((q) => !used.has(String(q.id)));
  }
  const place = [];
  const seen = new Set();
  for (const q of placement || []) {
    if (!q?.id || !q.prompt || seen.has(String(q.id))) continue;
    seen.add(String(q.id));
    place.push(q);
    if (place.length >= COHORT_PLACE_MAX) break;
  }
  return {
    v: 2,
    locale: locale || "en",
    builtAt: now,
    renewsAt: addMonthsIso(now, COHORT_RENEW_MONTHS),
    signature: bankSignature(weekly, placement),
    shows,
    placement: place,
    packs,
    counts: summary.counts,
    target: PACK_TARGET,
    held: summary.held,
    lockdownRefreshes: 0,
    packCursors: {},
  };
}

/** One placement sitting: 10 questions, wrapping if the device holds fewer than 30. */
export function placementSlice(list, sitting) {
  const all = (list || []).filter((q) => q && q.id);
  if (!all.length) return [];
  const start = (Math.max(0, Number(sitting) || 0) * PLACEMENT_PER_SITTING) % all.length;
  const n = Math.min(PLACEMENT_PER_SITTING, all.length);
  const out = [];
  for (let i = 0; i < n; i++) out.push(all[(start + i) % all.length]);
  return out;
}

export function sittingsRemaining(used, cohortBuiltAt, profileBuiltAt) {
  if (cohortBuiltAt && profileBuiltAt !== cohortBuiltAt) return PLACEMENT_SITTINGS;
  const n = Number(used) || 0;
  return Math.max(0, PLACEMENT_SITTINGS - n);
}
