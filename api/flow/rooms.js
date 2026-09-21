import { requireAuth, json, readBody } from "../../lib/flow-auth.js";
import { deleteRoom, listRooms } from "../../lib/room-store.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    const rooms = listRooms();
    return json(res, 200, { rooms, count: rooms.length });
  }

  if (req.method !== "POST") return json(res, 405, { error: "method" });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: "Invalid JSON" });
  }
  if (body.action !== "delete") return json(res, 400, { error: "unknown action" });
  const ok = deleteRoom(body.code);
  if (!ok) return json(res, 404, { error: "missing" });
  return json(res, 200, { ok: true, rooms: listRooms() });
}
