import { getRoom, hasRoom, saveRoom, listRooms, deleteRoom } from "../lib/room-store.js";
import { requireAuth } from "../lib/flow-auth.js";

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
