import { requireAuth, json } from "../../lib/flow-auth.js";
import { listFlowSets, zipFlowSet } from "../../lib/set-archive.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  if (!requireAuth(req, res)) return;
  const url = new URL(req.url || "/", "http://localhost");
  const download = url.searchParams.get("download");
  if (!download) return json(res, 200, { sets: listFlowSets() });
  const packed = zipFlowSet(download);
  if (packed.error) return json(res, packed.status || 404, { error: packed.error });
  res.statusCode = 200;
  res.setHeader("content-type", "application/zip");
  res.setHeader("content-disposition", `attachment; filename="${packed.id}.zip"`);
  res.end(packed.zip);
}
