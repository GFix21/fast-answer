import { requireAuth, json, readBody } from "../../lib/flow-auth.js";
import { addTopicRuntime, listRuntimeTopics } from "../../lib/week-store.js";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function baseTopics() {
  const p = path.join(ROOT, "q-and-a/topics.json");
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  return [
    { id: "sci-fi", title: "Sci-Fi", blurb: "Space operas & timelines.", defaultOn: true },
    { id: "grand-tour-top-gear", title: "The Grand Tour & Top Gear", blurb: "Clarkson, May, Hammond.", defaultOn: true },
    { id: "gmg-brand", title: "GMG Brand", blurb: "Montréal label lore.", defaultOn: true },
    { id: "dj-gigi", title: "DJ Gigi", blurb: "Easy only.", easyOnly: true, defaultOn: true },
    { id: "geography", title: "Geography", blurb: "Capitals & coasts.", defaultOn: true },
    { id: "film-tv", title: "Film & TV", blurb: "Screens big and small.", defaultOn: true },
    { id: "art", title: "Art", blurb: "Canvases & movements.", defaultOn: false },
    { id: "cars-motoring", title: "Cars & motoring", blurb: "Engines & marques.", defaultOn: true },
    { id: "music", title: "Music", blurb: "Hits & headphones.", defaultOn: true },
    { id: "current-culture", title: "Current culture", blurb: "What’s buzzing.", defaultOn: true },
  ];
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
