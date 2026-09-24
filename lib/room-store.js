/**
 * Open TV rooms. Files (data/rooms and /tmp) cover one machine.
 * On Vercel, instances do not share disk, so the same registry is also
 * kept in Runtime Cache — Flow, Join TV, and the TV link all read it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = process.env.FA_ROOMS_DIR || path.join(ROOT, "data", "rooms");
const TMP = process.env.FA_ROOMS_TMP || "/tmp/fa-rooms";
const TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_KEY = "registry";

const g = globalThis;
if (!g.__faRooms) g.__faRooms = { map: new Map() };
/** @type {null | { get: () => Promise<unknown>, set: (value: unknown) => Promise<void> }} */
let testCache = null;

export function setRoomCacheForTests(cache) {
  testCache = cache;
}

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

function writeFile(dir, code, room) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${code}.json`), JSON.stringify(room));
  } catch { /* read-only deploy */ }
}

function unlinkFile(dir, code) {
  try { fs.unlinkSync(path.join(dir, `${code}.json`)); } catch { /* ignore */ }
}

async function cacheHandle() {
  if (testCache) return testCache;
  if (!process.env.VERCEL) return null;
  try {
    const { getCache } = await import("@vercel/functions");
    const cache = getCache({ namespace: "fa-rooms" });
    return {
      get: () => cache.get(CACHE_KEY),
      set: (value) => cache.set(CACHE_KEY, value, { ttl: Math.ceil(TTL_MS / 1000), name: "fa-rooms" }),
    };
  } catch {
    return null;
  }
}

function putRoom(map, room) {
  const code = safeCode(room?.code);
  if (!code) return;
  const prev = map.get(code);
  const t = room.updatedAt || room.createdAt || 0;
  const pt = prev ? (prev.updatedAt || prev.createdAt || 0) : -1;
  if (!prev || t >= pt) map.set(code, { ...room, code });
}

function pruneMap(map) {
  const now = Date.now();
  for (const [code, room] of map.entries()) {
    const t = room.updatedAt || room.createdAt || 0;
    if (t && now - t > TTL_MS) {
      map.delete(code);
      unlinkFile(DIR, code);
      unlinkFile(TMP, code);
    }
  }
}

async function loadMap() {
  let cachedRooms = null;
  try {
    const handle = await cacheHandle();
    const cached = handle ? await handle.get() : null;
    if (cached && Array.isArray(cached.rooms)) cachedRooms = cached.rooms;
  } catch { /* cache miss */ }
  const map = new Map();
  if (cachedRooms) {
    for (const room of cachedRooms) putRoom(map, room);
  } else {
    for (const room of [...readDir(DIR), ...readDir(TMP)]) putRoom(map, room);
    for (const room of g.__faRooms.map.values()) putRoom(map, room);
  }
  pruneMap(map);
  return map;
}

async function commit(map) {
  pruneMap(map);
  g.__faRooms.map = map;
  for (const [code, room] of map.entries()) {
    writeFile(TMP, code, room);
    writeFile(DIR, code, room);
  }
  try {
    const handle = await cacheHandle();
    if (handle) await handle.set({ rooms: [...map.values()] });
  } catch { /* local dev has no runtime cache */ }
}

export async function getRoom(code) {
  const map = await loadMap();
  return map.get(safeCode(code)) || null;
}

export async function hasRoom(code) {
  return Boolean(await getRoom(code));
}

const LIVE_PHASE = new Set(["read", "buzz", "answer", "reveal", "setbreak", "between"]);

function mergeSavedRoom(prev, incoming) {
  if (!prev) return incoming;
  const prevPhase = String(prev.state?.phase || "");
  const nextPhase = String(incoming.state?.phase || "");
  const incomingIsSetup = !nextPhase || nextPhase === "ready" || nextPhase === "lobby";
  if (!LIVE_PHASE.has(prevPhase) || !incomingIsSetup) return incoming;
  return {
    ...prev,
    host: incoming.host || prev.host,
    screen: incoming.screen || prev.screen,
    guests: Array.isArray(incoming.guests) && incoming.guests.length ? incoming.guests : prev.guests,
    dropoutIds: { ...(prev.dropoutIds || {}), ...(incoming.dropoutIds || {}) },
    buzzes: Array.isArray(incoming.buzzes) && incoming.buzzes.length ? incoming.buzzes : prev.buzzes,
    state: {
      ...prev.state,
      readyIds: { ...(prev.state?.readyIds || {}), ...(incoming.state?.readyIds || {}) },
      kickedId: incoming.state?.kickedId || prev.state?.kickedId || "",
      kickedAt: incoming.state?.kickedAt || prev.state?.kickedAt || 0,
    },
  };
}

export async function saveRoom(room) {
  const map = await loadMap();
  const code = safeCode(room?.code);
  if (!code) return null;
  const prev = map.get(code);
  const merged = mergeSavedRoom(prev, { ...room, code });
  const next = { ...merged, code, updatedAt: Date.now() };
  if (!next.createdAt) next.createdAt = prev?.createdAt || next.updatedAt;
  map.set(code, next);
  await commit(map);
  return next;
}

export async function deleteRoom(code) {
  const map = await loadMap();
  const key = safeCode(code);
  if (!key || !map.has(key)) return false;
  map.delete(key);
  g.__faRooms.map.delete(key);
  unlinkFile(DIR, key);
  unlinkFile(TMP, key);
  await commit(map);
  return true;
}

export async function listRooms() {
  const map = await loadMap();
  const out = [];
  for (const room of map.values()) {
    if (!room || !room.code) continue;
    const st = room.state || {};
    out.push({
      code: room.code,
      host: room.host || "",
      guests: (room.guests || []).length,
      phase: st.phase || "lobby",
      screen: room.screen === "tv" ? "tv" : "off",
      createdAt: room.createdAt || 0,
      updatedAt: room.updatedAt || room.createdAt || 0,
    });
  }
  out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return out;
}

export function forgetRoomMemoryForTests() {
  g.__faRooms.map = new Map();
}

export function resetRoomsForTests() {
  g.__faRooms.map = new Map();
  testCache = null;
}
