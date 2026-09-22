/**
 * Shared, short-lived TV rooms stored in Upstash Redis.
 * The Redis-backed record is visible to every Vercel Function instance.
 */
import { Redis } from "@upstash/redis";

const TTL_SECONDS = 6 * 60 * 60;
const ROOM_PREFIX = "fast-answer:room:";
const ROOM_INDEX = "fast-answer:rooms";

let client;

function redis() {
  if (client) return client;
  const url = process.env.FAST_ANSWER_REDIS_KV_REST_API_URL;
  const token = process.env.FAST_ANSWER_REDIS_KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("Fast Answer Redis is not configured");
  }
  client = new Redis({ url, token });
  return client;
}

function safeCode(raw) {
  return String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function key(code) {
  return ROOM_PREFIX + safeCode(code);
}

function normalizeRoom(room) {
  if (!room || typeof room !== "object") return null;
  const code = safeCode(room.code);
  return code ? { ...room, code } : null;
}

export async function getRoom(code) {
  const room = await redis().get(key(code));
  if (typeof room === "string") {
    try { return normalizeRoom(JSON.parse(room)); } catch { return null; }
  }
  return normalizeRoom(room);
}

export async function hasRoom(code) {
  return Boolean(await getRoom(code));
}

export async function saveRoom(room) {
  const current = normalizeRoom(room);
  if (!current) return null;
  const now = Date.now();
  const next = {
    ...current,
    updatedAt: now,
    createdAt: current.createdAt || now,
  };
  const db = redis();
  await db.set(key(next.code), next, { ex: TTL_SECONDS });
  await db.sadd(ROOM_INDEX, next.code);
  return next;
}

export async function deleteRoom(code) {
  const roomCode = safeCode(code);
  if (!roomCode) return false;
  const db = redis();
  const removed = await db.del(key(roomCode));
  await db.srem(ROOM_INDEX, roomCode);
  return Number(removed) > 0;
}

export async function listRooms() {
  const db = redis();
  const codes = await db.smembers(ROOM_INDEX);
  if (!codes.length) return [];
  const rooms = await Promise.all(codes.map((code) => getRoom(code)));
  const missing = codes.filter((_, index) => !rooms[index]);
  if (missing.length) await db.srem(ROOM_INDEX, ...missing);
  return rooms
    .filter(Boolean)
    .map((room) => {
      const state = room.state || {};
      return {
        code: room.code,
        host: room.host || "",
        guests: (room.guests || []).length,
        phase: state.phase || "lobby",
        createdAt: room.createdAt || 0,
        updatedAt: room.updatedAt || room.createdAt || 0,
      };
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
