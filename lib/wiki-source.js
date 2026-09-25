/**
 * Lookup only. Creators are not fed a live wiki dump.
 * A summary can inform a new fact. The answer still must not sit in the prompt.
 */

export async function wikiSummary(title, lang = "en") {
  const host = lang === "de" ? "de.wikipedia.org" : (lang === "fr" || lang === "fr-CA") ? "fr.wikipedia.org" : "en.wikipedia.org";
  const url = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(String(title || "").trim())}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "FastAnswerCreators/1.0 (question research)",
    },
  });
  if (!res.ok) {
    const error = new Error(`wiki ${res.status}`);
    error.status = res.status;
    throw error;
  }
  const data = await res.json();
  return {
    title: data.title || title,
    extract: String(data.extract || "").trim(),
    url: data.content_urls?.desktop?.page || "",
  };
}
