import { getRoom, hasRoom, saveRoom, listRooms, deleteRoom } from "../lib/room-store.js";
import { requireAuth } from "../lib/flow-auth.js";
import { loadCurrentPack } from "../lib/week-store.js";
import { exportPack } from "../q-and-a/map.js";
import { generationForSeat } from "../lib/generation-packs.js";
import { countryFromIpHeaders, requiredAge } from "../lib/age-gate.js";
import { canPlay } from "../lib/parental.js";
import { findProfileById } from "../lib/profile-store.js";
import { sessionProfileId } from "../lib/profile-session.js";
import { dealRamp, SHOW_DEAL } from "../lib/generation-deal.js";
import { orderShowSets } from "../lib/show-pace.js";
import { publicRoom, redactState } from "../lib/room-wire.js";
import { randomBytes, timingSafeEqual } from "node:crypto";

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
      fromPlayer: String(q.fromPlayer || "").slice(0, 40),
      fromGeneration: String(q.fromGeneration || q.generation || "").slice(0, 40),
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
          const questions = mapped.length === SHOW_N ? orderShowSets(mapped) : orderShowSets(dealRamp(mapped, { avoid, seats: [] }));
          if (questions.length) return { questions, source: "q-and-a" };
        }
      }
    } catch { /* weekly pack below */ }
  }
  const mapped = poolForTopics(exportPack(loadCurrentPack(locale)), topics);
  return { questions: orderShowSets(dealRamp(mapped, { avoid, seats: [] })), source: "q-and-a-bank" };
}

function touch(cur) {
  return saveRoom(cur);
}

function presentedHostKey(req, body) {
  const header = req.headers?.["x-fa-host"] || req.headers?.["X-Fa-Host"] || "";
  return String(header || body?.hostKey || "").trim().slice(0, 80);
}

function hostMatches(room, key) {
  const a = Buffer.from(String(room?.hostKey || ""));
  const b = Buffer.from(String(key || ""));
  if (a.length < 16 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function presentedGuestKey(req, body) {
  const header = req.headers?.["x-fa-guest"] || req.headers?.["X-Fa-Guest"] || "";
  return String(header || body?.guestKey || "").trim().slice(0, 80);
}

function actingGuest(room, req, body) {
  const key = presentedGuestKey(req, body);
  if (key.length < 16) return null;
  return (room?.guests || []).find((guest) => guest && guest.guestKey === key) || null;
}

function newGuestKey() {
  return randomBytes(16).toString("hex");
}

function corsOrigin(req) {
  const origin = String(req.headers?.origin || req.headers?.Origin || "");
  if (!origin) return "";
  if (origin === "https://fast-answer-seven.vercel.app") return origin;
  if (origin === "https://gmgbrand.vercel.app") return origin;
  if (/^https:\/\/fast-answer-[a-z0-9-]+\.vercel\.app$/i.test(origin)) return origin;
  const extra = process.env.FAST_ANSWER_ORIGIN || "";
  if (extra && origin === extra) return origin;
  return "";
}

function applyCors(req, res) {
  const origin = corsOrigin(req);
  if (origin) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "Origin");
  }
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type, x-fa-host, x-fa-profile, x-fa-guest");
}

function sendRoom(res, room, { host = false, status = 200, guestKey = "" } = {}) {
  res.status(status).end(JSON.stringify(room ? publicRoom(room, { host, guestKey }) : { error: "missing" }));
}

async function handleRoom(req, res) {
  res.setHeader("content-type", "application/json");
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    const code = String(req.query.code || "").toUpperCase();
    if (!code || req.query.list === "1") {
      if (!requireAuth(req, res)) return;
      res.status(200).end(JSON.stringify({ rooms: await listRooms() }));
      return;
    }
    const room = await getRoom(code);
    sendRoom(res, room, { host: hostMatches(room, presentedHostKey(req, {})) });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).end(JSON.stringify({ error: "method" }));
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const code = String(body.code || "").toUpperCase();

  if (body.action === "list") {
    if (!requireAuth(req, res)) return;
    res.status(200).end(JSON.stringify({ rooms: await listRooms() }));
    return;
  }

  if (body.action === "lobby") {
    const rooms = await listRooms();
    res.status(200).end(JSON.stringify({
      rooms: rooms.map((room) => ({
        code: room.code,
        host: room.host || "",
        name: room.name || "",
        guests: room.guests || 0,
        phase: room.phase || "lobby",
        screen: room.screen === "tv" ? "tv" : "off",
        joinWait: room.joinWait || 15,
        ageFrom: room.ageFrom ?? 13,
        ageTo: room.ageTo ?? 99,
      })),
    }));
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
    const key = presentedHostKey(req, body);
    const cur = (await getRoom(code)) || { code, host: "", state: {}, buzzes: [], guests: [] };
    if (cur.hostKey && !hostMatches(cur, key)) {
      res.status(403).end(JSON.stringify({ error: "host" }));
      return;
    }
    if (!cur.hostKey) {
      if (key.length < 16) {
        res.status(400).end(JSON.stringify({ error: "host" }));
        return;
      }
      cur.hostKey = key;
    }
    await touch({
      ...cur,
      host: body.host || cur.host,
      name: body.name != null ? String(body.name).trim().slice(0, 32) : (cur.name || ""),
      joinWait: Math.min(45, Math.max(5, Number(body.joinWait ?? cur.joinWait) || 15)),
      ageFrom: Math.min(99, Math.max(10, Number(body.ageFrom ?? cur.ageFrom) || 13)),
      ageTo: Math.min(99, Math.max(10, Number(body.ageTo ?? cur.ageTo) || 99)),
      playerCount: Math.min(12, Math.max(2, Number(body.playerCount ?? cur.playerCount) || 3)),
      topics: Array.isArray(body.topics) ? body.topics.map(String).slice(0, 40) : (cur.topics || []),
      screen: cur.screen === "tv" || body.screen === "tv" ? "tv" : "off",
      createdAt: cur.createdAt || Date.now(),
      guests: cur.guests || [],
    });
    const saved = await getRoom(code);
    sendRoom(res, saved, { host: hostMatches(saved, key) });
    return;
  }

  if (body.action === "cast") {
    const cur = await getRoom(code);
    if (!cur) {
      res.status(404).end(JSON.stringify({ error: "missing" }));
      return;
    }
    if (!hostMatches(cur, presentedHostKey(req, body))) {
      res.status(403).end(JSON.stringify({ error: "host" }));
      return;
    }
    await touch({ ...cur, screen: "tv" });
    const saved = await getRoom(code);
    sendRoom(res, saved, { host: true });
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

  let issuedGuestKey = "";
  const cur = await getRoom(code);

  if (body.action === "join") {
    const seat = body.seat === "view" ? "view" : "play";
    const name = String(body.name || "").replace(/\s+/g, " ").trim();
    if (!name) {
      res.status(400).end(JSON.stringify({ error: "name", message: "A player needs a name." }));
      return;
    }
    const age = Number(body.age);
    let playAge = Number.isInteger(age) ? age : "";
    let playCountry = String(body.country || "").slice(0, 8);
    let profileId = "";
    if (seat === "play") {
      profileId = await sessionProfileId(req) || "";
      const profile = profileId ? await findProfileById(profileId) : null;
      const ipCountry = countryFromIpHeaders(req.headers);
      if (!profile) {
        res.status(401).end(JSON.stringify({ error: "unauthorized", message: "Sign in before playing." }));
        return;
      }
      if (!canPlay(profile, ipCountry)) {
        res.status(403).end(JSON.stringify({
          error: profile.playLocked || profile.role === "child" ? "revoked" : "age",
          minimum: requiredAge(profile.country, ipCountry),
          message: profile.playLocked ? "A parent turned this profile off." : "This profile cannot play.",
        }));
        return;
      }
      playAge = Number(profile.age);
      playCountry = String(profile.country || "").slice(0, 8);
    }
    const from = Number(cur.ageFrom);
    const to = Number(cur.ageTo);
    if (seat === "play" && Number.isFinite(from) && Number.isFinite(to) && (playAge < from || playAge > to)) {
      res.status(403).end(JSON.stringify({
        error: "age",
        message: `This room is for ages ${from} to ${to}.`,
      }));
      return;
    }
    cur.guests = cur.guests || [];
    const guestKey = newGuestKey();
    const guest = {
      name,
      id: body.id || ("p-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16)),
      thumb: body.thumb || "",
      seat,
      age: playAge === "" ? "" : playAge,
      country: playCountry,
      ageBracket: String(body.ageBracket || "").slice(0, 8),
      generation: generationForSeat({
        age: playAge,
        ageBracket: body.ageBracket,
        generation: body.generation,
      }).slice(0, 40),
      guestKey,
    };
    if (seat === "play" && profileId) guest.profileId = profileId;
    const existing = cur.guests.find((g) => g.id === guest.id || g.name === guest.name);
    if (existing) {
      existing.name = guest.name;
      existing.seat = guest.seat;
      existing.guestKey = guestKey;
      if (guest.thumb) existing.thumb = guest.thumb;
      if (guest.age !== "") existing.age = guest.age;
      if (guest.country) existing.country = guest.country;
      if (guest.ageBracket) existing.ageBracket = guest.ageBracket;
      if (guest.generation) existing.generation = guest.generation;
      if (seat === "play" && profileId) existing.profileId = profileId;
    } else {
      cur.guests.push(guest);
    }
    issuedGuestKey = guestKey;
    await touch(cur);
  } else if (body.action === "leave") {
    const guest = actingGuest(cur, req, body);
    if (!guest) {
      res.status(403).end(JSON.stringify({ error: "guest" }));
      return;
    }
    const id = guest.id || "";
    cur.guests = (cur.guests || []).filter((g) => g !== guest && g.id !== id);
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
    if (!hostMatches(cur, presentedHostKey(req, body))) {
      res.status(403).end(JSON.stringify({ error: "host" }));
      return;
    }
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
    const guest = actingGuest(cur, req, body);
    if (!guest) {
      res.status(403).end(JSON.stringify({ error: "guest" }));
      return;
    }
    const id = guest.id || "";
    if (!id) {
      res.status(400).end(JSON.stringify({ error: "id" }));
      return;
    }
    cur.dropoutIds = { ...(cur.dropoutIds || {}), [id]: true };
    await touch(cur);
  } else if (body.action === "state") {
    if (!hostMatches(cur, presentedHostKey(req, body))) {
      res.status(403).end(JSON.stringify({ error: "host" }));
      return;
    }
    cur.state = redactState(body.state || {});
    await touch(cur);
  } else if (body.action === "buzz") {
    const guest = actingGuest(cur, req, body);
    if (!guest || guest.seat === "view") {
      res.status(403).end(JSON.stringify({ error: "guest" }));
      return;
    }
    cur.state = cur.state || {};
    cur.buzzes = cur.buzzes || [];
    cur.buzzes.push({ name: guest.name, at: Date.now() });
    if (!cur.state.buzzed) {
      cur.state = { ...cur.state, buzzed: true, buzzBy: guest.name, buzzId: guest.id || "", phase: "answer" };
    }
    await touch(cur);
  } else if (body.action === "answer") {
    const guest = actingGuest(cur, req, body);
    if (!guest || guest.seat === "view") {
      res.status(403).end(JSON.stringify({ error: "guest" }));
      return;
    }
    cur.state = cur.state || {};
    cur.state.lastAnswer = {
      id: guest.id || "",
      index: Number(body.index),
      at: Date.now(),
      lockdown: Boolean(body.lockdown),
      name: guest.name || "",
    };
    await touch(cur);
  } else if (body.action === "map") {
    const guest = actingGuest(cur, req, body);
    if (!guest || guest.seat === "view") {
      res.status(403).end(JSON.stringify({ error: "guest" }));
      return;
    }
    cur.state = cur.state || {};
    cur.state.maps = { ...(cur.state.maps || {}) };
    if (body.target) cur.state.maps[guest.id] = body.target;
    else delete cur.state.maps[guest.id];
    await touch(cur);
  } else if (body.action === "wager") {
    const guest = actingGuest(cur, req, body);
    if (!guest || guest.seat === "view") {
      res.status(403).end(JSON.stringify({ error: "guest" }));
      return;
    }
    cur.state = cur.state || {};
    cur.state.lastWager = {
      id: guest.id,
      side: body.side,
      amount: body.amount,
      locked: body.locked !== false,
      at: Date.now(),
    };
    await touch(cur);
  } else if (body.action === "refresh") {
    if (!hostMatches(cur, presentedHostKey(req, body))) {
      res.status(403).end(JSON.stringify({ error: "host" }));
      return;
    }
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
    const name = String(body.name || "").replace(/\s+/g, " ").trim();
    if (!name) {
      const saved = await getRoom(code);
      sendRoom(res, saved, { host: hostMatches(saved, presentedHostKey(req, body)) });
      return;
    }
    cur.guests = cur.guests || [];
    const id = body.id || ("p-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16));
    let guest = cur.guests.find((g) => g.id === id || g.name === name);
    if (!guest) {
      guest = { name, id, ready: true, thumb: body.thumb || "" };
      cur.guests.push(guest);
    } else {
      guest.ready = true;
      guest.name = name;
      if (body.thumb) guest.thumb = body.thumb;
    }
    cur.state = cur.state || {};
    cur.state.readyIds = { ...(cur.state.readyIds || {}), [id]: true };
    await touch(cur);
  } else {
    res.status(400).end(JSON.stringify({ error: "action" }));
    return;
  }
  const saved = await getRoom(code);
  sendRoom(res, saved, { host: hostMatches(saved, presentedHostKey(req, body)), guestKey: issuedGuestKey });
}

export default async function handler(req, res) {
  try {
    await handleRoom(req, res);
  } catch (err) {
    if (err && err.code === "store") {
      res.setHeader("content-type", "application/json");
      res.status(503).end(JSON.stringify({ error: "store" }));
      return;
    }
    throw err;
  }
}
