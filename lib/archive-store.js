/**
 * Monthly question archive IO for Flow.
 * English stays at banks/archive/. France, Quebec, and German each have a folder.
 * Durable writes happen in scripts/publish-week.mjs (git + redeploy).
 * Serverless reads via static requires in archive-manifest.js.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countByTier, mapTier } from "../q-and-a/map.js";
import { byLocale } from "./archive-manifest.js";
import { normalizeFlowLocale } from "./flow-locale.js";
import { WEEK_TARGET } from "./week-roll.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVE_ROOT = path.join(ROOT, "banks/archive");
const TZ = "America/Toronto";

const g = globalThis;
if (!g.__faFlowArchive) g.__faFlowArchive = { byLocale: {} };
if (!g.__faFlowArchive.byLocale) g.__faFlowArchive.byLocale = {};

export function torontoMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date instanceof Date ? date : new Date(date));
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  return `${y}-${m}`;
}

export function studioCountsFromPack(pack) {
  const out = {};
  for (const q of pack?.questions || []) {
    out[q.tier] = (out[q.tier] || 0) + 1;
  }
  return out;
}

export function mappedCountsFromPack(pack) {
  return countByTier(
    (pack?.questions || []).map((q) => ({ tier: mapTier(q.tier) })),
  );
}

function weekSummary(pack, publishedAt, counts) {
  const questionCount = (pack.questions || []).length;
  const weekTarget = pack.weekTarget || WEEK_TARGET;
  const weekComplete = pack.weekComplete === true || questionCount >= weekTarget;
  return {
    weekKey: pack.weekKey,
    publishedAt: publishedAt || pack.generatedAt || new Date().toISOString(),
    counts: counts || mappedCountsFromPack(pack),
    studioCounts: studioCountsFromPack(pack),
    questionCount,
    weekTarget,
    weekComplete,
  };
}

export function archiveRoot(locale = "en") {
  const loc = normalizeFlowLocale(locale);
  return loc === "en" ? ARCHIVE_ROOT : path.join(ARCHIVE_ROOT, loc);
}

function bundled(locale) {
  const loc = normalizeFlowLocale(locale);
  return byLocale[loc] || { registry: { months: [], updatedAt: null }, indexes: {}, weeks: {} };
}

function slot(locale) {
  const loc = normalizeFlowLocale(locale);
  if (!g.__faFlowArchive.byLocale[loc]) {
    g.__faFlowArchive.byLocale[loc] = { registry: null, indexes: {}, weeks: {} };
  }
  return g.__faFlowArchive.byLocale[loc];
}

function getRegistry(locale) {
  return slot(locale).registry || structuredClone(bundled(locale).registry) || { months: [], updatedAt: null };
}

export function listArchiveMonths(locale = "en") {
  const reg = getRegistry(locale);
  const months = [...(reg.months || [])].sort().reverse();
  return months.map((monthKey) => {
    const idx = loadMonthIndex(monthKey, locale);
    return {
      monthKey,
      weekCount: idx?.weeks?.length || 0,
      questionCount: (idx?.weeks || []).reduce((n, w) => n + (w.questionCount || 0), 0),
      updatedAt: idx?.updatedAt || null,
    };
  });
}

export function loadMonthIndex(monthKey, locale = "en") {
  const mem = slot(locale);
  if (mem.indexes[monthKey]) return structuredClone(mem.indexes[monthKey]);
  const bundledIndex = bundled(locale).indexes[monthKey];
  if (bundledIndex) return structuredClone(bundledIndex);
  return null;
}

function swapBucket(locale, monthKey, weekKey) {
  if (!g.__faArchiveSwaps) g.__faArchiveSwaps = {};
  const key = `${normalizeFlowLocale(locale)}/${monthKey}/${weekKey}`;
  if (!g.__faArchiveSwaps[key]) g.__faArchiveSwaps[key] = {};
  return g.__faArchiveSwaps[key];
}

export function loadArchivedWeek(monthKey, weekKey, locale = "en") {
  const key = `${monthKey}/${weekKey}`;
  const mem = slot(locale);
  const fromBundle = bundled(locale).weeks[key];
  const base = mem.weeks[key]
    ? structuredClone(mem.weeks[key])
    : (fromBundle ? structuredClone(fromBundle) : null);
  if (!base) return null;
  const swaps = g.__faArchiveSwaps?.[`${normalizeFlowLocale(locale)}/${key}`];
  if (!swaps) return base;
  base.questions = (base.questions || []).map((q) => {
    let cur = q;
    const seen = new Set();
    while (swaps[cur.id] && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = swaps[cur.id];
    }
    return cur;
  });
  return base;
}

export function archivedWeekMap(locale = "en") {
  return { ...bundled(locale).weeks, ...slot(locale).weeks };
}

/** Replace one archived question in the same slot. Later reads of this week see it. */
export function swapArchivedQuestion(monthKey, weekKey, oldId, nextQ, locale = "en") {
  const swaps = swapBucket(locale, monthKey, weekKey);
  swaps[String(oldId)] = nextQ;
  return loadArchivedWeek(monthKey, weekKey, locale);
}

/**
 * Archive a published week pack into banks/archive[/locale]/YYYY-MM/.
 * Writes disk when possible; always updates in-memory overlay.
 */
export function archivePublishedWeek(pack, opts = {}) {
  if (!pack?.weekKey) throw new Error("pack.weekKey required");
  const locale = normalizeFlowLocale(opts.locale || pack.locale || "en");
  const publishedAt = opts.publishedAt || new Date().toISOString();
  const monthKey = opts.monthKey || torontoMonthKey(opts.date || publishedAt);
  const counts = opts.counts || mappedCountsFromPack(pack);
  const summary = weekSummary(pack, publishedAt, counts);
  const root = archiveRoot(locale);
  const mem = slot(locale);

  const monthDir = path.join(root, monthKey);
  const weekPath = path.join(monthDir, `${pack.weekKey}.json`);
  const indexPath = path.join(monthDir, "index.json");
  const registryPath = path.join(root, "registry.json");

  let wroteToDisk = false;
  let writeError = null;
  let index;

  try {
    fs.mkdirSync(monthDir, { recursive: true });
    fs.writeFileSync(weekPath, `${JSON.stringify(pack, null, 2)}\n`);

    let prev = { monthKey, weeks: [], updatedAt: null };
    if (fs.existsSync(indexPath)) {
      prev = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } else if (bundled(locale).indexes[monthKey] || mem.indexes[monthKey]) {
      prev = structuredClone(mem.indexes[monthKey] || bundled(locale).indexes[monthKey]);
    }
    const weeksList = [...(prev.weeks || [])].filter((w) => w.weekKey !== pack.weekKey);
    weeksList.push(summary);
    weeksList.sort((a, b) => String(b.weekKey).localeCompare(String(a.weekKey)));
    index = { monthKey, weeks: weeksList, updatedAt: publishedAt };
    fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);

    let reg = { months: [], updatedAt: null };
    if (fs.existsSync(registryPath)) {
      reg = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    } else {
      reg = structuredClone(getRegistry(locale));
    }
    const months = [...new Set([...(reg.months || []), monthKey])].sort();
    reg = { months, updatedAt: publishedAt };
    fs.writeFileSync(registryPath, `${JSON.stringify(reg, null, 2)}\n`);

    writeArchiveManifest();
    wroteToDisk = true;
    mem.registry = reg;
  } catch (e) {
    writeError = e.message || String(e);
    const prev = mem.indexes[monthKey]
      || (bundled(locale).indexes[monthKey] ? structuredClone(bundled(locale).indexes[monthKey]) : null)
      || { monthKey, weeks: [], updatedAt: null };
    const weeksList = [...(prev.weeks || [])].filter((w) => w.weekKey !== pack.weekKey);
    weeksList.push(summary);
    weeksList.sort((a, b) => String(b.weekKey).localeCompare(String(a.weekKey)));
    index = { monthKey, weeks: weeksList, updatedAt: publishedAt };
    const reg = structuredClone(getRegistry(locale));
    reg.months = [...new Set([...(reg.months || []), monthKey])].sort();
    reg.updatedAt = publishedAt;
    mem.registry = reg;
  }

  mem.indexes[monthKey] = index;
  mem.weeks[`${monthKey}/${pack.weekKey}`] = pack;

  return {
    monthKey,
    weekKey: pack.weekKey,
    locale,
    summary,
    index,
    wroteToDisk,
    writeError,
  };
}

const ARCHIVE_LOCALES = [
  ["en", ""],
  ["fr", "fr"],
  ["fr-CA", "fr-CA"],
  ["de", "de"],
];

/**
 * Rewrite lib/archive-manifest.js with static requires for every archived week.
 */
export function writeArchiveManifest() {
  const blocks = [];
  for (const [loc, folder] of ARCHIVE_LOCALES) {
    const root = folder ? path.join(ARCHIVE_ROOT, folder) : ARCHIVE_ROOT;
    const registryPath = path.join(root, "registry.json");
    if (!fs.existsSync(registryPath)) continue;
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    const rel = folder ? `banks/archive/${folder}` : "banks/archive";
    const indexEntries = [];
    const weekEntries = [];
    for (const monthKey of [...(registry.months || [])].sort()) {
      const indexPath = path.join(root, monthKey, "index.json");
      if (!fs.existsSync(indexPath)) continue;
      const idx = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      indexEntries.push(
        `    ${JSON.stringify(monthKey)}: require("../${rel}/${monthKey}/index.json"),`,
      );
      for (const w of idx.weeks || []) {
        const weekFile = path.join(root, monthKey, `${w.weekKey}.json`);
        if (!fs.existsSync(weekFile)) continue;
        weekEntries.push(
          `    ${JSON.stringify(`${monthKey}/${w.weekKey}`)}: require("../${rel}/${monthKey}/${w.weekKey}.json"),`,
        );
      }
    }
    blocks.push(`  ${JSON.stringify(loc)}: {
    registry: require("../${rel}/registry.json"),
    indexes: {
${indexEntries.join("\n")}
    },
    weeks: {
${weekEntries.join("\n")}
    },
  }`);
  }

  const body = `/**
 * Static require map for archived week packs (Vercel bundling).
 * Regenerated by scripts/publish-week.mjs via writeArchiveManifest().
 * English, France, Quebec, and German are separate archives.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const byLocale = {
${blocks.join(",\n")}
};

export const registry = byLocale.en.registry;
export const indexes = byLocale.en.indexes;
export const weeks = byLocale.en.weeks;
`;
  fs.writeFileSync(path.join(ROOT, "lib/archive-manifest.js"), body);
  return { locales: blocks.length };
}
