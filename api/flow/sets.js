import { requireAuth, json, readBody } from "../../lib/flow-auth.js";
import { listFlowSets, loadSetQuestions, zipFlowSet } from "../../lib/set-archive.js";
import { readMainSetId, writeMainSetId } from "../../lib/set-main.js";
import { normalizeFlowLocale } from "../../lib/flow-locale.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const url = new URL(req.url || "/", "http://localhost");

  if (req.method === "GET") {
    const download = url.searchParams.get("download");
    if (download) {
      const packed = zipFlowSet(download);
      if (packed.error) return json(res, packed.status || 404, { error: packed.error });
      res.statusCode = 200;
      res.setHeader("content-type", "application/zip");
      res.setHeader("content-disposition", `attachment; filename="${packed.id}.zip"`);
      res.end(packed.zip);
      return;
    }
    const review = url.searchParams.get("review");
    const main = await readMainSetId();
    if (review) {
      const locale = normalizeFlowLocale(url.searchParams.get("locale") || "en");
      const packed = loadSetQuestions(review, locale);
      if (packed.error) return json(res, 404, { error: packed.error });
      return json(res, 200, { ...packed, main, isMain: packed.id === main });
    }
    const sets = listFlowSets().map((row) => ({ ...row, main: row.id === main }));
    return json(res, 200, { sets, main });
  }

  if (req.method === "POST") {
    let body = {};
    try { body = await readBody(req); } catch { body = {}; }
    const id = String(body?.id || "").trim();
    if (id && !listFlowSets().some((row) => row.id === id)) {
      return json(res, 404, { error: "Unknown set" });
    }
    const saved = await writeMainSetId(id);
    return json(res, 200, { ok: true, main: saved.id });
  }

  return json(res, 405, { error: "method" });
}
