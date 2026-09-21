/**
 * Monthly question archive IO for Flow.
 * Durable writes happen in scripts/publish-week.mjs (git + redeploy).
 * Serverless reads via static requires in archive-manifest.js.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countByTier, mapTier } from "../q-and-a/map.js";
import { indexes, weeks, registry as bundledRegistry } from "./archive-manifest.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVE_ROOT = path.join(ROOT, "banks/archive");
const TZ = "America/Toronto";

const g = globalThis;
if (!g.__faFlowArchive) {
  g.__faFlowArchive = {
    registry: null,
    indexes: {},
    weeks: {},
  };
}

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
  return {
    weekKey: pack.weekKey,
    publishedAt: publishedAt || pack.generatedAt || new Date().toISOString(),
    counts: counts || mappedCountsFromPack(pack),
    studioCounts: studioCountsFromPack(pack),
    questionCount: (pack.questions || []).length,
  };
}

function getRegistry() {
  return (
    g.__faFlowArchive.registry ||
    structuredClone(bundledRegistry) || { months: [], updatedAt: null }
  );
}

export function listArchiveMonths() {
  const reg = getRegistry();
  const months = [...(reg.months || [])].sort().reverse();
  return months.map((monthKey) => {
    const idx = loadMonthIndex(monthKey);
    return {
      monthKey,
      weekCount: idx?.weeks?.length || 0,
      questionCount: (idx?.weeks || []).reduce(
        (n, w) => n + (w.questionCount || 0),
        0,
      ),
      updatedAt: idx?.updatedAt || null,
    };
  });
}

export function loadMonthIndex(monthKey) {
  if (g.__faFlowArchive.indexes[monthKey]) {
    return structuredClone(g.__faFlowArchive.indexes[monthKey]);
  }
  if (indexes[monthKey]) return structuredClone(indexes[monthKey]);
  return null;
}

export function loadArchivedWeek(monthKey, weekKey) {
  const key = `${monthKey}/${weekKey}`;
  if (g.__faFlowArchive.weeks[key]) {
    return structuredClone(g.__faFlowArchive.weeks[key]);
  }
  if (weeks[key]) return structuredClone(weeks[key]);
  return null;
}

/**
 * Archive a published week pack into banks/archive/YYYY-MM/.
 * Writes disk when possible; always updates in-memory overlay.
 */
export function archivePublishedWeek(pack, opts = {}) {
  if (!pack?.weekKey) throw new Error("pack.weekKey required");
  const publishedAt = opts.publishedAt || new Date().toISOString();
  const monthKey =
    opts.monthKey || torontoMonthKey(opts.date || publishedAt);
  const counts = opts.counts || mappedCountsFromPack(pack);
  const summary = weekSummary(pack, publishedAt, counts);

  const monthDir = path.join(ARCHIVE_ROOT, monthKey);
  const weekPath = path.join(monthDir, `${pack.weekKey}.json`);
  const indexPath = path.join(monthDir, "index.json");
  const registryPath = path.join(ARCHIVE_ROOT, "registry.json");

  let wroteToDisk = false;
  let writeError = null;
  let index;

  try {
    fs.mkdirSync(monthDir, { recursive: true });
    fs.writeFileSync(weekPath, `${JSON.stringify(pack, null, 2)}\n`);

    let prev = { monthKey, weeks: [], updatedAt: null };
    if (fs.existsSync(indexPath)) {
      prev = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } else if (indexes[monthKey] || g.__faFlowArchive.indexes[monthKey]) {
      prev = structuredClone(
        g.__faFlowArchive.indexes[monthKey] || indexes[monthKey],
      );
    }
    const weeksList = [...(prev.weeks || [])].filter(
      (w) => w.weekKey !== pack.weekKey,
    );
    weeksList.push(summary);
    weeksList.sort((a, b) => String(b.weekKey).localeCompare(String(a.weekKey)));
    index = {
      monthKey,
      weeks: weeksList,
      updatedAt: publishedAt,
    };
    fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);

    let reg = { months: [], updatedAt: null };
    if (fs.existsSync(registryPath)) {
      reg = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    } else {
      reg = structuredClone(getRegistry());
    }
    const months = [...new Set([...(reg.months || []), monthKey])].sort();
    reg = { months, updatedAt: publishedAt };
    fs.writeFileSync(registryPath, `${JSON.stringify(reg, null, 2)}\n`);

    writeArchiveManifest(reg, { [monthKey]: index });
    wroteToDisk = true;
    g.__faFlowArchive.registry = reg;
  } catch (e) {
    writeError = e.message || String(e);
    // Memory-only fallback (Vercel Hobby read-only FS)
    const prev =
      g.__faFlowArchive.indexes[monthKey] ||
      (indexes[monthKey] ? structuredClone(indexes[monthKey]) : null) || {
        monthKey,
        weeks: [],
        updatedAt: null,
      };
    const weeksList = [...(prev.weeks || [])].filter(
      (w) => w.weekKey !== pack.weekKey,
    );
    weeksList.push(summary);
    weeksList.sort((a, b) => String(b.weekKey).localeCompare(String(a.weekKey)));
    index = { monthKey, weeks: weeksList, updatedAt: publishedAt };
    const reg = structuredClone(getRegistry());
    reg.months = [...new Set([...(reg.months || []), monthKey])].sort();
    reg.updatedAt = publishedAt;
    g.__faFlowArchive.registry = reg;
  }

  g.__faFlowArchive.indexes[monthKey] = index;
  g.__faFlowArchive.weeks[`${monthKey}/${pack.weekKey}`] = pack;

  return {
    monthKey,
    weekKey: pack.weekKey,
    summary,
    index,
    wroteToDisk,
    writeError,
  };
}

/**
 * Rewrite lib/archive-manifest.js with static requires for every archived week.
 * Call from publish script after disk writes.
 */
export function writeArchiveManifest(reg, extraIndexes = {}) {
  const registryPath = path.join(ARCHIVE_ROOT, "registry.json");
  const registry = reg || JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const months = [...(registry.months || [])].sort();

  const indexEntries = [];
  const weekEntries = [];

  for (const monthKey of months) {
    const indexPath = path.join(ARCHIVE_ROOT, monthKey, "index.json");
    const idx =
      extraIndexes[monthKey] ||
      (fs.existsSync(indexPath)
        ? JSON.parse(fs.readFileSync(indexPath, "utf8"))
        : null);
    if (!idx) continue;
    indexEntries.push(
      `  ${JSON.stringify(monthKey)}: require("../banks/archive/${monthKey}/index.json"),`,
    );
    for (const w of idx.weeks || []) {
      const weekFile = path.join(ARCHIVE_ROOT, monthKey, `${w.weekKey}.json`);
      if (!fs.existsSync(weekFile) && !extraIndexes[monthKey]) continue;
      weekEntries.push(
        `  ${JSON.stringify(`${monthKey}/${w.weekKey}`)}: require("../banks/archive/${monthKey}/${w.weekKey}.json"),`,
      );
    }
  }

  const body = `/**
 * Static require map for archived week packs (Vercel bundling).
 * Regenerated by scripts/publish-week.mjs via writeArchiveManifest().
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const registry = require("../banks/archive/registry.json");

export const indexes = {
${indexEntries.join("\n")}
};

export const weeks = {
${weekEntries.join("\n")}
};
`;
  fs.writeFileSync(path.join(ROOT, "lib/archive-manifest.js"), body);
  return { months: months.length, weeks: weekEntries.length };
}
