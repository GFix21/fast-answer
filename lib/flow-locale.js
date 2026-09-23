/** Flow locales. Quebec is its own archive and must not collapse into France. */

export const FLOW_LOCALES = ["en", "fr", "fr-CA", "de"];

export function normalizeFlowLocale(raw) {
  const text = String(raw || "en").trim().replace(/_/g, "-");
  if (/^fr-ca$/i.test(text)) return "fr-CA";
  const two = text.toLowerCase().slice(0, 2);
  if (two === "fr" || two === "de" || two === "en") return two;
  return "en";
}
