#!/usr/bin/env node
/**
 * France, Quebec, and German archives stay separate.
 * Archive replace is a button beside the potential replacement.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadArchivedWeek, listArchiveMonths } from "../lib/archive-store.js";
import { normalizeFlowLocale } from "../lib/flow-locale.js";
import { loadCurrentPack } from "../lib/week-store.js";
import { loadPlacementPack } from "../lib/placement-store.js";
import { t } from "../flow/strings.js";

assert.equal(normalizeFlowLocale("fr-CA"), "fr-CA");
assert.equal(normalizeFlowLocale("fr-ca"), "fr-CA");
assert.equal(normalizeFlowLocale("fr"), "fr");
assert.notEqual(normalizeFlowLocale("fr-CA"), normalizeFlowLocale("fr"));

for (const loc of ["fr", "fr-CA", "de"]) {
  const months = listArchiveMonths(loc);
  assert.equal(months[0].questionCount, 161, loc);
  const week = loadArchivedWeek("2026-09", "2026-W39", loc);
  assert.equal(week.questions.length, 161, loc);
  assert.equal(week.locale, loc);
}

const fr = loadArchivedWeek("2026-09", "2026-W39", "fr");
const qc = loadArchivedWeek("2026-09", "2026-W39", "fr-CA");
const de = loadArchivedWeek("2026-09", "2026-W39", "de");
const en = loadArchivedWeek("2026-09", "2026-W39", "en");
const byId = (pack, id) => pack.questions.find((q) => q.id === id);

assert.match(byId(fr, "cq-e-multi-titanic").choices.join(" "), /poisson d'avril/);
assert.match(byId(qc, "cq-e-multi-titanic").prompt, /coulé quand/);
assert.match(byId(de, "cq-e-multi-titanic").choices.join(" "), /Aprilscherz/);
assert.notEqual(byId(fr, "cq-e-multi-titanic").prompt, byId(qc, "cq-e-multi-titanic").prompt);
assert.match(byId(en, "w39-e-silent-ike").prompt, /Eisenhower/);
assert.match(byId(qc, "cq-h-multi-pitch").prompt, /soccer/);
assert.match(byId(fr, "cq-h-multi-pitch").prompt, /football/);
assert.match(byId(qc, "ga-joke-bear").choices.join(" "), /jujube/);
assert.equal(byId(qc, "ga-joke-bear").correctIndex, 2);
assert.doesNotMatch(byId(de, "cq-e-multi-titanic").prompt, /When did/);

assert.equal(t("fr", "replace"), "Remplacer");
assert.equal(t("fr-CA", "replace"), "Remplacer");
assert.equal(t("de", "replace"), "Ersetzen");
assert.equal(t("fr", "potential"), "Remplacement proposé");
assert.equal(t("fr-CA", "potential"), "Remplacement possible");
assert.equal(t("de", "potential"), "Möglicher Ersatz");
assert.equal(t("fr", "email"), "E-mail");
assert.equal(t("fr-CA", "email"), "Courriel");
assert.equal(t("fr", "logout"), "Se déconnecter");
assert.equal(t("fr-CA", "logout"), "Fermer la session");
assert.equal(t("de", "tab_archive"), "Archiv");
assert.equal(t("fr", "tab_archive"), "Archives");

const flow = fs.readFileSync(new URL("../flow/flow.js", import.meta.url), "utf8");
assert.equal(flow.includes("Reject &amp; regenerate"), false);
assert.equal(flow.includes("data-arch-replace"), true);
assert.equal(flow.includes("data-arch-reject"), false);

const qcWeek = loadCurrentPack("fr-CA");
assert.equal(qcWeek.locale, "fr-CA");
assert.match(byId(qcWeek, "cq-e-multi-titanic").prompt, /quand/);
const qcPlace = loadPlacementPack("fr-CA");
assert.equal(qcPlace.locale, "fr-CA");
assert.ok((qcPlace.questions || []).length > 0);

console.log("flow archive ok");
