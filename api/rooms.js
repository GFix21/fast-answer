import { getRoom, hasRoom, saveRoom, listRooms, deleteRoom } from "../lib/room-store.js";
import { requireAuth } from "../lib/flow-auth.js";
import { loadCurrentPack } from "../lib/week-store.js";
import { exportPack } from "../q-and-a/map.js";
import { dealShow, SHOW_DEAL } from "../lib/generation-deal.js";

const SHOW_N = Object.values(SHOW_DEAL).reduce((sum, n) => sum + n, 0);

function poolForTopics(questions, topics) {
  const allow = new Set((topics || []).map((t) => String(t).toLowerCase()).filter(Boolean));
  if (!allow.size) return questions || [];
  const preferred = (questions || []).filter((q) => allow.has(String(q.topic || "").toLowerCase()));
  return preferred.length ? preferred : (questions || []);
}

function questionsFromDevice(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const q of raw) {
    if (!q || !q.id || !q.prompt || !Array.isArray(q.choices) || q.choices.length < 2) continue;
    const correctIndex = Number(q.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= q.choices.length) continue;
    out.push({
      id: String(q.id).slice(0, 80),
      tier: String(q.tier || "easy").slice(0, 20),
      topic: String(q.topic || "").slice(0, 40),
      generation: String(q.generation || "").slice(0, 40),
      categoryTitle: String(q.categoryTitle || "").slice(0, 80),
      prompt: String(q.prompt).slice(0, 400),
      choices: q.choices.slice(0, 4).map((c) => String(c).slice(0, 200)),
      correctIndex,
    });
    if (out.length >= SHOW_N) break;
  }
  return out;
}

/** Ask Q&A for a fresh show. Falls back to the handed-off weekly pack when no studio URL is set. */
async function askQanda({ locale, avoid, topics }) {
  const url = process.env.QANDA_REFRESH_URL;
  if (url) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, avoid, topics, deal: SHOW_DEAL }),
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data?.questions) ? data.questions : [];
        const mapped = poolForTopics(exportPack({ questions: raw }), topics);
        if (mapped.length) {
          const questions = mapped.length === SHOW_N ? mapped : dealShow(mapped, avoid);
          if (questions.length) return { questions, source: "q-and-a" };
        }
      }
    } catch { /* weekly pack below */ }
  }
  const mapped = poolForTopics(exportPack(loadCurrentPack(locale)), topics);
  return { questions: dealShow(mapped, avoid), source: "q-and-a-bank" };
}

function touch(cur) {
  return saveRoom(cur);
}

export default async function handler(req, res) {
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    const code = String(req.query.code || "").toUpperCase();
    if (!code || req.query.list === "1") {
      res.status(200).end(JSON.stringify({ rooms: await listRooms() }));
      return;
    }
    const room = await getRoom(code);
    res.status(200).end(JSON.stringify(room || { error: "missing" }));
    return;
  }

  if (req.method !== "POST") {
    res.status(405).end(JSON.stringify({ error: "method" }));
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const code = String(body.code || "").toUpperCase();

  if (body.action === "list") {
    res.status(200).end(JSON.stringify({ rooms: await listRooms() }));
    return;
  }

  if (!code) {
    res.status(400).end(JSON.stringify({ error: "code" }));
    return;
  }

  // Delete stays on this route so Flow does not add a 13th Hobby function.
  if (body.action === "delete") {
    if (!requireAuth(req, res)) return;
    if (!(await deleteRoom(code))) {
      res.status(404).end(JSON.stringify({ error: "missing" }));
      return;
    }
    res.status(200).end(JSON.stringify({ ok: true, rooms: await listRooms() }));
    return;
  }

  if (body.action === "create") {
    const cur = (await getRoom(code)) || { code, host: "", state: {}, buzzes: [], guests: [] };
    await touch({
      ...cur,
      host: body.host || cur.host,
      createdAt: cur.createdAt || Date.now(),
      guests: cur.guests || [],
    });
    res.status(200).end(JSON.stringify(await getRoom(code)));
    return;
  }

  // All other actions require an existing room (TV / Cast create first).
  if (!(await hasRoom(code))) {
    res.status(404).end(JSON.stringify({
      error: "missing",
      message: "Room not found. Open the TV or Cast TV link first, then Join as buzzer.",
    }));
    return;
  }

  const cur = await getRoom(code);

  if (body.action === "join") {
    cur.guests = cur.guests || [];
    const guest = {
      name: body.name || "Player",
      id: body.id || ("p-" + String(body.name || "pad")),
      thumb: body.thumb || "",
      seat: body.seat === "view" ? "view" : "play",
    };
    const existing = cur.guests.find((g) => g.id === guest.id || g.name === guest.name);
    if (existing) {
      existing.name = guest.name;
      existing.seat = guest.seat;
      if (guest.thumb) existing.thumb = guest.thumb;
    } else {
      cur.guests.push(guest);
    }
    await touch(cur);
  } else if (body.action === "leave") {
    const id = body.id || "";
    cur.guests = (cur.guests || []).filter((g) => g.id !== id && g.name !== body.name);
    if (cur.dropoutIds && id) {
      const next = { ...cur.dropoutIds };
      delete next[id];
      cur.dropoutIds = next;
    }
    cur.state = cur.state || {};
    if (cur.state.readyIds && id) {
      const next = { ...cur.state.readyIds };
      delete next[id];
      cur.state.readyIds = next;
    }
    await touch(cur);
  } else if (body.action === "kick") {
    const id = body.id || "";
    cur.guests = (cur.guests || []).filter((g) => g.id !== id && g.name !== body.name);
    cur.state = cur.state || {};
    if (cur.state.readyIds && id) {
      const next = { ...cur.state.readyIds };
      delete next[id];
      cur.state.readyIds = next;
    }
    cur.state.kickedId = id;
    cur.state.kickedAt = Date.now();
    await touch(cur);
  } else if (body.action === "dropout") {
    const id = body.id || "";
    if (!id) {
      res.status(400).end(JSON.stringify({ error: "id" }));
      return;
    }
    cur.dropoutIds = { ...(cur.dropoutIds || {}), [id]: true };
    await touch(cur);
  } else if (body.action === "state") {
    cur.state = body.state || {};
    await touch(cur);
  } else if (body.action === "buzz") {
    cur.buzzes = cur.buzzes || [];
    cur.buzzes.push({ name: body.name, at: Date.now() });
    if (!cur.state.buzzed) {
      cur.state = { ...cur.state, buzzed: true, buzzBy: body.name, buzzId: body.id || "", phase: "answer" };
    }
    await touch(cur);
  } else if (body.action === "answer") {
    // Pad / voice submit — host applies via poll.
    cur.state = cur.state || {};
    cur.state.lastAnswer = {
      id: body.id || "",
      index: Number(body.index),
      at: Date.now(),
      lockdown: Boolean(body.lockdown),
      name: body.name || "",
    };
    await touch(cur);
  } else if (body.action === "map") {
    cur.state = cur.state || {};
    cur.state.maps = { ...(cur.state.maps || {}) };
    if (body.target) cur.state.maps[body.id] = body.target;
    else delete cur.state.maps[body.id];
    await touch(cur);
  } else if (body.action === "wager") {
    cur.state = cur.state || {};
    cur.state.lastWager = {
      id: body.id,
      side: body.side,
      amount: body.amount,
      locked: body.locked !== false,
      at: Date.now(),
    };
    await touch(cur);
  } else if (body.action === "refresh") {
    const by = String(body.by || "Player").trim().slice(0, 40) || "Player";
    const locale = String(body.locale || "en");
    const avoid = Array.isArray(body.avoid) ? body.avoid.map(String).slice(0, 120) : [];
    const topics = Array.isArray(body.topics) ? body.topics.map(String).slice(0, 40) : [];
    const held = questionsFromDevice(body.questions);
    if (held.length) {
      cur.notice = {
        kind: "refresh",
        by,
        phase: "ready",
        at: Date.now(),
        count: held.length,
        source: "device",
      };
      cur.refreshQs = held;
      await touch(cur);
    } else {
    cur.notice = { kind: "refresh", by, phase: "loading", at: Date.now() };
    delete cur.refreshQs;
    await touch(cur);
    const result = await askQanda({ locale, avoid, topics });
    const latest = (await getRoom(code)) || cur;
    latest.notice = {
      kind: "refresh",
      by,
      phase: "ready",
      at: Date.now(),
      count: result.questions.length,
      source: result.source,
    };
    latest.refreshQs = result.questions;
    await touch(latest);
    }
  } else if (body.action === "ready") {
    cur.guests = cur.guests || [];
    const id = body.id || ("p-" + String(body.name || "pad"));
    let guest = cur.guests.find((g) => g.id === id || g.name === body.name);
    if (!guest) {
      guest = { name: body.name || "Player", id, ready: true, thumb: body.thumb || "" };
      cur.guests.push(guest);
    } else {
      guest.ready = true;
      if (body.thumb) guest.thumb = body.thumb;
    }
    cur.state = cur.state || {};
    cur.state.readyIds = { ...(cur.state.readyIds || {}), [id]: true };
    await touch(cur);
  } else {
    res.status(400).end(JSON.stringify({ error: "action" }));
    return;
  }
  res.status(200).end(JSON.stringify(await getRoom(code)));
}
