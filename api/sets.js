import { replayQuestions } from "../lib/set-archive.js";
import { stripQuestion } from "../lib/strip-answers.js";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  const url = new URL(req.url || "/", "http://localhost");
  const id = url.searchParams.get("id") || url.searchParams.get("replay") || "";
  if (!id) return json(res, 400, { error: "missing set" });
  const packed = replayQuestions(id, url.searchParams.get("locale") || "en");
  if (packed.error) return json(res, packed.status || 404, { error: packed.error });
  return json(res, 200, {
    ...packed,
    questions: (packed.questions || []).map(stripQuestion),
  });
}
