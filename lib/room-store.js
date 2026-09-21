/**
 * Open TV rooms in a shared folder (data/rooms/CODE.json) plus this instance.
 * Anyone who can open the game can list and join. Flow can delete.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = process.env.FA_ROOMS_DIR || path.join(ROOT, "data", "rooms");
const TMP = process.env.FA_ROOMS_TMP || "/tmp/fa-rooms";
const TTL_MS = 6 * 60 * 60 * 1000;

const g = globalThis;
if (!g.__faRooms) g.__faRooms = { loaded: false, map: new Map() };

function safeCode(raw) {
  return String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function readDir(dir) {
  const out = [];
  let names = [];
  try { names = fs.readdirSync(dir); } catch { return out; }
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const room = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
      if (room && room.code) out.push(room);
    } catch { /* skip broken file */ }
  }
  return out;
}

function ensureRooms() {
  if (g.__faRooms.loaded) return;
  const map = new Map();
  for (const room of [...readDir(DIR), ...readDir(TMP)]) {
    const code = safeCode(room.code);
    if (!code) continue;
    map.set(code, { ...room, code });
  }
  g.__faRooms.map = map;
  g.__faRooms.loaded = true;
  pruneStale();
}

function writeFile(dir, code, room) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${code}.json`), JSON.stringify(room));
  } catch { /* read-only deploy */ }
}

function persist(code, room) {
  writeFile(TMP, code, room);
  writeFile(DIR, code, room);
}

function pruneStale() {
  const now = Date.now();
  for (const [code, room] of g.__faRooms.map.entries()) {
    const t = room.updatedAt || room.createdAt || 0;
    if (t && now - t > TTL_MS) {
      g.__faRooms.map.delete(code);
      for (const dir of [DIR, TMP]) {
        try { fs.unlinkSync(path.join(dir, `${code}.json`)); } catch { /* ignore */ }
      }
    }
  }
}

export function getRoom(code) {
  ensureRooms();
  return g.__faRooms.map.get(safeCode(code)) || null;
}

export function hasRoom(code) {
  return Boolean(getRoom(code));
}

export function saveRoom(room) {
  ensureRooms();
  const code = safeCode(room?.code);
  if (!code) return null;
  const next = { ...room, code, updatedAt: Date.now() };
  if (!next.createdAt) next.createdAt = next.updatedAt;
  g.__faRooms.map.set(code, next);
  persist(code, next);
  return next;
}

export function deleteRoom(code) {
  ensureRooms();
  const key = safeCode(code);
  if (!key || !g.__faRooms.map.has(key)) return false;
  g.__faRooms.map.delete(key);
  for (const dir of [DIR, TMP]) {
    try { fs.unlinkSync(path.join(dir, `${key}.json`)); } catch { /* ignore */ }
  }
  return true;
}

export function listRooms() {
  ensureRooms();
  pruneStale();
  const out = [];
  for (const room of g.__faRooms.map.values()) {
    if (!room || !room.code) continue;
    const st = room.state || {};
    out.push({
      code: room.code,
      host: room.host || "",
      guests: (room.guests || []).length,
      phase: st.phase || "lobby",
      createdAt: room.createdAt || 0,
      updatedAt: room.updatedAt || room.createdAt || 0,
    });
  }
  out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return out;
}

export function resetRoomsForTests() {
  g.__faRooms.loaded = false;
  g.__faRooms.map = new Map();
}
