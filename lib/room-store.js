/**
 * Open TV rooms.
 * When Upstash is configured, every instance reads and writes the same room.
 * Local and CI use files. On Vercel, a missing Redis store fails closed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storeRequired } from "./redis.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = process.env.FA_ROOMS_DIR || path.join(ROOT, "data", "rooms");
const TMP = process.env.FA_ROOMS_TMP || "/tmp/fa-rooms";
const TTL_MS = 6 * 60 * 60 * 1000;
const TTL_SECONDS = Math.ceil(TTL_MS / 1000);
const CACHE_KEY = "registry";
const ROOM_PREFIX = "fast-answer:room:";
const ROOM_INDEX = "fast-answer:rooms";

const g = globalThis;
if (!g.__faRooms) g.__faRooms = { map: new Map() };
/** @type {null | { get: () => Promise<unknown>, set: (value: unknown) => Promise<void> }} */
let testCache = null;
let redisClient = null;
let redisOff = false;

function redisConfig() {
  if (redisOff) return null;
  const url = process.env.FAST_ANSWER_REDIS_KV_REST_API_URL
    || process.env.UPSTASH_REDIS_REST_URL
    || process.env.KV_REST_API_URL
    || "";
  const token = process.env.FAST_ANSWER_REDIS_KV_REST_API_TOKEN
    || process.env.UPSTASH_REDIS_REST_TOKEN
    || process.env.KV_REST_API_TOKEN
    || "";
  if (!url || !token) return null;
  return { url, token };
}

async function redis() {
  const cfg = redisConfig();
  if (!cfg) return null;
  if (redisClient) return redisClient;
  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis(cfg);
    return redisClient;
  } catch {
    return null;
  }
}

async function requireStore() {
  const db = await redis();
  if (db) return db;
  if (storeRequired()) {
    const err = new Error("store");
    err.code = "store";
    throw err;
  }
  return null;
}

function roomKey(code) {
  return ROOM_PREFIX + safeCode(code);
}

function parseRoom(raw) {
  if (!raw) return null;
  let room = raw;
  if (typeof room === "string") {
    try { room = JSON.parse(room); } catch { return null; }
  }
  if (!room || typeof room !== "object") return null;
  const code = safeCode(room.code);
  return code ? { ...room, code } : null;
}

function freshRoom(room) {
  const t = room?.updatedAt || room?.createdAt || 0;
  return Boolean(room) && (!t || Date.now() - t <= TTL_MS);
}

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
  const key = safeCode(code);
  if (!key) return null;
  const db = await requireStore();
  if (db) {
    const room = parseRoom(await db.get(roomKey(key)));
    if (!freshRoom(room)) {
      if (room) await deleteRoom(key);
      return null;
    }
    return room;
  }
  const map = await loadMap();
  return map.get(key) || null;
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
  if (!LIVE_PHASE.has(prevPhase) || !incomingIsSetup) {
    return {
      ...incoming,
      tvSeenAt: Math.max(Number(prev.tvSeenAt) || 0, Number(incoming.tvSeenAt) || 0),
      hostGeneration: incoming.hostGeneration || prev.hostGeneration || "",
      hostAge: incoming.hostAge != null && incoming.hostAge !== "" ? incoming.hostAge : (prev.hostAge ?? ""),
      hostAgeBracket: incoming.hostAgeBracket || prev.hostAgeBracket || "",
    };
  }
  return {
    ...prev,
    host: incoming.host || prev.host,
    screen: incoming.screen || prev.screen,
    guests: Array.isArray(incoming.guests) && incoming.guests.length ? incoming.guests : prev.guests,
    dropoutIds: { ...(prev.dropoutIds || {}), ...(incoming.dropoutIds || {}) },
    buzzes: Array.isArray(incoming.buzzes) && incoming.buzzes.length ? incoming.buzzes : prev.buzzes,
    tvSeenAt: Math.max(Number(prev.tvSeenAt) || 0, Number(incoming.tvSeenAt) || 0),
    state: {
      ...prev.state,
      readyIds: { ...(prev.state?.readyIds || {}), ...(incoming.state?.readyIds || {}) },
      kickedId: incoming.state?.kickedId || prev.state?.kickedId || "",
      kickedAt: incoming.state?.kickedAt || prev.state?.kickedAt || 0,
    },
  };
}

export async function saveRoom(room) {
  const code = safeCode(room?.code);
  if (!code) return null;
  const db = await requireStore();
  if (db) {
    const prev = parseRoom(await db.get(roomKey(code)));
    const merged = mergeSavedRoom(freshRoom(prev) ? prev : null, { ...room, code });
    const next = { ...merged, code, updatedAt: Date.now() };
    if (!next.createdAt) next.createdAt = prev?.createdAt || next.updatedAt;
    await db.set(roomKey(code), next, { ex: TTL_SECONDS });
    await db.sadd(ROOM_INDEX, code);
    return next;
  }
  const map = await loadMap();
  const prev = map.get(code);
  const merged = mergeSavedRoom(prev, { ...room, code });
  const next = { ...merged, code, updatedAt: Date.now() };
  if (!next.createdAt) next.createdAt = prev?.createdAt || next.updatedAt;
  map.set(code, next);
  await commit(map);
  return next;
}

export async function deleteRoom(code) {
  const key = safeCode(code);
  if (!key) return false;
  const db = await requireStore();
  if (db) {
    const removed = await db.del(roomKey(key));
    await db.srem(ROOM_INDEX, key);
    return Number(removed) > 0;
  }
  const map = await loadMap();
  if (!map.has(key)) return false;
  map.delete(key);
  g.__faRooms.map.delete(key);
  unlinkFile(DIR, key);
  unlinkFile(TMP, key);
  await commit(map);
  return true;
}

function summarizeRoom(room) {
  const st = room.state || {};
  return {
    code: room.code,
    name: String(room.name || "").slice(0, 32),
    host: room.host || "",
    guests: (room.guests || []).length,
    phase: st.phase || "lobby",
    screen: room.screen === "tv" ? "tv" : "off",
    joinWait: Math.min(45, Math.max(15, Number(room.joinWait) || 45)),
    ageFrom: Number.isFinite(Number(room.ageFrom)) ? Number(room.ageFrom) : 13,
    ageTo: Number.isFinite(Number(room.ageTo)) ? Number(room.ageTo) : 99,
    createdAt: room.createdAt || 0,
    updatedAt: room.updatedAt || room.createdAt || 0,
  };
}

export async function listRooms() {
  const db = await requireStore();
  if (db) {
    const codes = await db.smembers(ROOM_INDEX);
    if (!codes?.length) return [];
    const rooms = await Promise.all(codes.map((code) => getRoom(code)));
    const missing = codes.filter((_, index) => !rooms[index]);
    if (missing.length) await db.srem(ROOM_INDEX, ...missing.map((code) => safeCode(code)));
    return rooms.filter(Boolean).map(summarizeRoom).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
  const map = await loadMap();
  const out = [];
  for (const room of map.values()) {
    if (!room || !room.code) continue;
    out.push(summarizeRoom(room));
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
  redisOff = true;
  redisClient = null;
}
