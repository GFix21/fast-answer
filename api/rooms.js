const g = globalThis;
if (!g.__faRooms) g.__faRooms = new Map();
const rooms = g.__faRooms;

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
    const room = rooms.get(code) || null;
    res.status(200).end(JSON.stringify(room || { error: "missing" }));
    return;
  }

  if (req.method !== "POST") {
    res.status(405).end(JSON.stringify({ error: "method" }));
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const code = String(body.code || "").toUpperCase();
  if (!code) {
    res.status(400).end(JSON.stringify({ error: "code" }));
    return;
  }
  const cur = rooms.get(code) || { code, host: body.host || "", state: {}, buzzes: [], guests: [] };
  if (body.action === "create") {
    rooms.set(code, { ...cur, host: body.host || cur.host, createdAt: Date.now(), guests: cur.guests || [] });
  } else if (body.action === "join") {
    cur.guests = cur.guests || [];
    const guest = { name: body.name || "Player", id: body.id || ("p-" + String(body.name || "pad")) };
    if (!cur.guests.some((g) => g.id === guest.id || g.name === guest.name)) cur.guests.push(guest);
    rooms.set(code, cur);
  } else if (body.action === "state") {
    cur.state = body.state || {};
    rooms.set(code, cur);
  } else if (body.action === "buzz") {
    cur.buzzes = cur.buzzes || [];
    cur.buzzes.push({ name: body.name, at: Date.now() });
    if (!cur.state.buzzed) {
      cur.state = { ...cur.state, buzzed: true, buzzBy: body.name, buzzId: body.id || "", phase: "answer" };
    }
    rooms.set(code, cur);
  } else if (body.action === "map") {
    cur.state = cur.state || {};
    cur.state.maps = { ...(cur.state.maps || {}) };
    if (body.target) cur.state.maps[body.id] = body.target;
    else delete cur.state.maps[body.id];
    rooms.set(code, cur);
  } else if (body.action === "wager") {
    cur.state = cur.state || {};
    cur.state.lastWager = { id: body.id, side: body.side, amount: body.amount, at: Date.now() };
    rooms.set(code, cur);
  } else if (body.action === "ready") {
    cur.guests = cur.guests || [];
    const id = body.id || ("p-" + String(body.name || "pad"));
    let guest = cur.guests.find((g) => g.id === id || g.name === body.name);
    if (!guest) {
      guest = { name: body.name || "Player", id, ready: true };
      cur.guests.push(guest);
    } else {
      guest.ready = true;
    }
    cur.state = cur.state || {};
    cur.state.readyIds = { ...(cur.state.readyIds || {}), [id]: true };
    rooms.set(code, cur);
  }
  res.status(200).end(JSON.stringify(rooms.get(code)));
}
