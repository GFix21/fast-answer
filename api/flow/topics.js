import { createRequire } from "node:module";
import { requireAuth, json, readBody } from "../../lib/flow-auth.js";
import { addTopicRuntime, listRuntimeTopics } from "../../lib/week-store.js";

const require = createRequire(import.meta.url);
const topicsJson = require("../../q-and-a/topics.json");

function baseTopics() {
  return topicsJson;
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    return json(res, 200, {
      topics: [...baseTopics(), ...listRuntimeTopics()],
    });
  }

  if (req.method !== "POST") return json(res, 405, { error: "method" });
  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: "Invalid JSON" });
  }
  if (!body.id || !body.title) return json(res, 400, { error: "id and title required" });
  const all = [...baseTopics(), ...listRuntimeTopics()];
  if (all.some((t) => t.id === body.id)) {
    return json(res, 409, { error: `Topic already exists: ${body.id}` });
  }
  const topics = addTopicRuntime({
    id: body.id,
    title: body.title,
    blurb: body.blurb || "",
    easyOnly: Boolean(body.easyOnly),
    defaultOn: body.defaultOn !== false,
  });
  return json(res, 200, {
    ok: true,
    topics: [...baseTopics(), ...topics],
    note: "Runtime topic added on this instance. Persist via Q-and-A addTopic for durable studio registry.",
  });
}
