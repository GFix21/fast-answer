#!/usr/bin/env node
/**
 * Snapshot France, Quebec, and German question banks into their Flow archives.
 * Quebec starts from the France bank, then uses the Quebec creator text.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { creatorQuestions } from "../q-and-a/bots/creators.js";
import { mappedCountsFromPack, studioCountsFromPack, writeArchiveManifest } from "../lib/archive-store.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEEK = "2026-W39";
const MONTH = "2026-09";
const PUBLISHED = "2026-09-23T17:15:00.000Z";

function read(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

function write(file, data) {
  const abs = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`);
}

function quebecPrompt(value) {
  let text = String(value || "");
  text = text.replace(/Comment appelle-t-on/g, "Comment on appelle");
  text = text.replace(/Qu['’]est-ce qui/g, "C'est quoi qui");
  text = text.replace(/\b([A-Za-zÀ-ÿŒœ]+)e-t-(il|elle)\b/g, "$1e");
  text = text.replace(/\b([A-Za-zÀ-ÿŒœ]+)-t-(il|elle)\b/g, "$1");
  text = text.replace(/\best-(il|elle)\b/g, "est");
  text = text.replace(/devenu un hit/g, "devenu un gros succès");
  text = text.replace(/se décrit le mieux comme/g, "est surtout");
  text = text.replace(/largement utiliséé/g, "largement utilisé");
  text = text.replace(/l['’]appli\b/g, "l'application");
  text = text.replace(/l['’]heure du déjeuner/g, "l'heure du dîner");
  text = text.replace(/\bWeek-end Wakanda\b/g, "Fin de semaine à Wakanda");
  text = text.replace(/\bWeek-end\b/g, "Fin de semaine");
  text = text.replace(/\bweek-end\b/g, "fin de semaine");
  text = text.replace(/\bHistoire portable\b/g, "Histoire portative");
  text = text.replace(/\bPortable hybride\b/g, "Portative hybride");
  return text;
}

function withStatus(q) {
  return { ...q, status: q.status || "pending" };
}

function mergeJokes(pack, jokes) {
  const ids = new Set((pack.questions || []).map((q) => q.id));
  return {
    ...pack,
    questions: [
      ...(pack.questions || []).map(withStatus),
      ...jokes.filter((q) => q && !ids.has(q.id)).map(withStatus),
    ],
  };
}

function archivePack(locale, pack) {
  const questions = pack.questions || [];
  const stored = {
    weekKey: pack.weekKey || WEEK,
    generatedAt: pack.generatedAt || PUBLISHED,
    host: pack.host || "Jeremy",
    inspirationSummary: pack.inspirationSummary || "",
    locale,
    schemaVersion: 1,
    questions,
  };
  const summary = {
    weekKey: stored.weekKey,
    publishedAt: PUBLISHED,
    counts: mappedCountsFromPack(stored),
    studioCounts: studioCountsFromPack(stored),
    questionCount: questions.length,
  };
  const folder = path.join("banks/archive", locale);
  write(path.join(folder, "registry.json"), { months: [MONTH], updatedAt: PUBLISHED });
  write(path.join(folder, MONTH, "index.json"), {
    monthKey: MONTH,
    weeks: [summary],
    updatedAt: PUBLISHED,
  });
  write(path.join(folder, MONTH, `${stored.weekKey}.json`), stored);
  return summary;
}

const frWeek = read("banks/weekly/fr/current.json");
const deWeek = read("banks/weekly/de/current.json");
const frJokes = read("banks/gen-alpha/fr.json").questions || [];
const deJokes = read("banks/gen-alpha/de.json").questions || [];
const fr = mergeJokes(frWeek, frJokes);
const de = mergeJokes(deWeek, deJokes);

const qcById = new Map(creatorQuestions("fr-CA").map((q) => [q.id, q]));
const qcQuestions = fr.questions.map((q) => {
  const created = qcById.get(q.id);
  if (created) {
    return withStatus({
      ...q,
      categoryTitle: created.categoryTitle,
      prompt: created.prompt,
      choices: created.choices,
      correctIndex: created.correctIndex,
      banterHint: created.banterHint,
      jokeWrongIndexes: created.jokeWrongIndexes,
    });
  }
  const prompt = q.id === "ga-joke-clock"
    ? "C'est quoi qui a des aiguilles et qui donne l'heure ?"
    : quebecPrompt(q.prompt);
  return withStatus({
    ...q,
    categoryTitle: quebecPrompt(q.categoryTitle),
    prompt,
    banterHint: q.banterHint ? quebecPrompt(q.banterHint) : q.banterHint,
    choices: (q.choices || []).map((c) => (q.id === "ga-joke-bear" && c === "Un nounours" ? "Un toutou" : c === "Un ours en gomme" ? "Un ours en jujube" : quebecPrompt(c))),
  });
});
const qc = {
  ...fr,
  locale: "fr-CA",
  inspirationSummary: "Semaine America/Toronto 2026-W39 — questions en français du Québec.",
  questions: qcQuestions,
};

const frSummary = archivePack("fr", { ...fr, locale: "fr" });
const qcSummary = archivePack("fr-CA", qc);
const deSummary = archivePack("de", { ...de, locale: "de" });

write("banks/weekly/fr-CA/current.json", { ...qc, questions: qc.questions.filter((q) => !String(q.id).startsWith("ga-joke-")) });
write("banks/gen-alpha/fr-CA.json", {
  locale: "fr-CA",
  questions: qc.questions.filter((q) => String(q.id).startsWith("ga-joke-")),
});

const placement = read("banks/placement/fr/generational-first-pass.json");
write("banks/placement/fr-CA/generational-first-pass.json", {
  ...placement,
  title: "Classement générationnel — première passe (Silent / Boomer / Gen X / Y / Z / Alpha + multi-gen)",
  scoringSummary: "Dojo adaptatif de 10 questions : départ en hard ; bonne réponse → difficult ; échec → easy. Score de bonnes réponses / 10 → Bronze (<0,5), Silver (0,5–0,79), Gold (≥0,8). Bande de départ : bronze→easy, silver→hard, gold→difficult. Préférer les questions de classement pas encore vues. Les étiquettes de génération guident l'équilibre — les questions multi-gen servent de repères.",
  questions: (placement.questions || []).map((q) => ({
    ...q,
    categoryTitle: quebecPrompt(q.categoryTitle),
    prompt: quebecPrompt(q.prompt),
    banterHint: q.banterHint ? quebecPrompt(q.banterHint) : q.banterHint,
    scoringNote: q.scoringNote ? quebecPrompt(q.scoringNote) : q.scoringNote,
  })),
});

writeArchiveManifest();
console.log("locale archives", {
  fr: frSummary.questionCount,
  "fr-CA": qcSummary.questionCount,
  de: deSummary.questionCount,
});
