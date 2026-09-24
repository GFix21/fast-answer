/**
 * Dojo profiles.
 * Password hashes stay on the server. Redis is the durable copy on Vercel.
 * Without Redis, a local file is used for dev and tests only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import seedProfiles from "../data/profiles.json" with { type: "json" };
import { hashPassword, verifyPassword } from "./password-server.js";
import { getRedis, storeRequired } from "./redis.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = process.env.FA_PROFILES_PATH || path.join(ROOT, "data", "profiles.json");
const TMP = process.env.FA_PROFILES_TMP || "/tmp/fa-profiles.json";
const EMAILS_KEY = "fa:profile:emails";

const g = globalThis;
if (!g.__faProfiles) g.__faProfiles = { loaded: false, list: [] };

export function isEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readJson(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.profiles)) return data.profiles;
  } catch { /* missing or unreadable */ }
  return [];
}

function normalize(raw) {
  const email = String(raw?.email || "").trim().toLowerCase();
  if (!isEmail(email)) return null;
  const displayName = String(raw?.displayName || "").trim().slice(0, 40);
  if (!displayName) return null;
  const activatedAt = String(raw?.activatedAt || raw?.updatedAt || new Date().toISOString());
  return {
    id: String(raw?.id || email).slice(0, 64),
    displayName,
    email,
    passwordSalt: String(raw?.passwordSalt || ""),
    passwordHash: String(raw?.passwordHash || ""),
    age: Number.isInteger(Number(raw?.age)) ? Number(raw.age) : "",
    country: String(raw?.country || "").slice(0, 8),
    activated: true,
    activatedAt,
    updatedAt: String(raw?.updatedAt || activatedAt),
  };
}

export function publicProfile(rec) {
  if (!rec) return null;
  return {
    id: rec.id,
    displayName: rec.displayName,
    email: rec.email,
    activated: true,
    activatedAt: rec.activatedAt,
    updatedAt: rec.updatedAt,
  };
}

function ensureLoaded() {
  if (g.__faProfiles.loaded) return;
  const merged = new Map();
  const seed = Array.isArray(seedProfiles) ? seedProfiles : [];
  for (const raw of [...seed, ...readJson(FILE), ...readJson(TMP)]) {
    const rec = normalize(raw);
    if (rec) merged.set(rec.email, rec);
  }
  g.__faProfiles.list = [...merged.values()];
  g.__faProfiles.loaded = true;
}

function persist() {
  const body = JSON.stringify(g.__faProfiles.list, null, 2);
  for (const file of [TMP, FILE]) {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, body);
    } catch { /* read-only deploy filesystem */ }
  }
}

function storeError() {
  const err = new Error("store");
  err.code = "store";
  return err;
}

async function redisProfile(email) {
  const db = await getRedis();
  if (!db) return { db: null, rec: null };
  const rec = normalize(await db.get(`fa:profile:email:${email}`));
  return { db, rec };
}

export async function findProfileByEmail(email) {
  const key = String(email || "").trim().toLowerCase();
  if (!isEmail(key)) return null;
  const { db, rec } = await redisProfile(key);
  if (db) return rec;
  ensureLoaded();
  return g.__faProfiles.list.find((p) => p.email === key) || null;
}

export async function findProfileById(id) {
  const want = String(id || "").trim();
  if (!want) return null;
  const db = await getRedis();
  if (db) {
    const email = await db.get(`fa:profile:id:${want}`);
    if (email) return findProfileByEmail(email);
    return null;
  }
  ensureLoaded();
  return g.__faProfiles.list.find((p) => p.id === want) || null;
}

async function saveRecord(rec) {
  const db = await getRedis();
  if (db) {
    await db.set(`fa:profile:email:${rec.email}`, rec);
    await db.set(`fa:profile:id:${rec.id}`, rec.email);
    await db.sadd(EMAILS_KEY, rec.email);
    return rec;
  }
  if (storeRequired()) throw storeError();
  ensureLoaded();
  const list = g.__faProfiles.list;
  const idx = list.findIndex((p) => p.email === rec.email || p.id === rec.id);
  if (idx >= 0) list[idx] = rec;
  else list.push(rec);
  persist();
  return rec;
}

export async function registerProfile(input) {
  const email = String(input?.email || "").trim().toLowerCase();
  if (!isEmail(email)) {
    const err = new Error("email");
    err.code = "email";
    throw err;
  }
  const displayName = String(input?.displayName || "").trim().slice(0, 40);
  if (!displayName) {
    const err = new Error("name");
    err.code = "name";
    throw err;
  }
  const password = String(input?.password || "");
  if (password.length < 4 || password.length > 64) {
    const err = new Error("password");
    err.code = "password";
    throw err;
  }
  const existing = await findProfileByEmail(email);
  if (existing?.passwordHash) {
    const err = new Error("exists");
    err.code = "exists";
    throw err;
  }
  const { salt, hash } = hashPassword(password);
  const now = new Date().toISOString();
  const rec = {
    id: String(input?.id || existing?.id || "").trim().slice(0, 64) || email,
    displayName,
    email,
    passwordSalt: salt,
    passwordHash: hash,
    age: Number.isInteger(Number(input?.age)) ? Number(input.age) : "",
    country: String(input?.country || "").slice(0, 8),
    activated: true,
    activatedAt: existing?.activatedAt || now,
    updatedAt: now,
  };
  await saveRecord(rec);
  return publicProfile(rec);
}

export async function loginProfile(email, password) {
  const rec = await findProfileByEmail(email);
  if (!rec?.passwordHash || !verifyPassword(password, rec.passwordSalt, rec.passwordHash)) {
    const err = new Error("password");
    err.code = "password";
    throw err;
  }
  return rec;
}

export async function changePassword(email, current, next) {
  const rec = await loginProfile(email, current);
  if (String(next || "").length < 4 || String(next || "").length > 64) {
    const err = new Error("password");
    err.code = "password";
    throw err;
  }
  const { salt, hash } = hashPassword(next);
  rec.passwordSalt = salt;
  rec.passwordHash = hash;
  rec.updatedAt = new Date().toISOString();
  await saveRecord(rec);
  return publicProfile(rec);
}

export function listProfiles() {
  ensureLoaded();
  return g.__faProfiles.list
    .map((p) => publicProfile(p))
    .sort((a, b) => String(b.activatedAt).localeCompare(String(a.activatedAt)));
}

export async function listProfilesAsync() {
  const db = await getRedis();
  if (!db) return listProfiles();
  const emails = await db.smembers(EMAILS_KEY);
  const rows = [];
  for (const email of emails || []) {
    const rec = normalize(await db.get(`fa:profile:email:${email}`));
    if (rec) rows.push(publicProfile(rec));
  }
  rows.sort((a, b) => String(b.activatedAt).localeCompare(String(a.activatedAt)));
  return rows;
}

function csvCell(value) {
  let s = String(value ?? "");
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function mailingListCsv() {
  const rows = [["email", "name", "activated"]];
  const seen = new Set();
  for (const p of await listProfilesAsync()) {
    if (!p.email || seen.has(p.email)) continue;
    seen.add(p.email);
    rows.push([p.email, p.displayName, p.activatedAt]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

/** Test helper — drop the in-memory list so the next read reloads disk. */
export function resetProfileStoreForTests() {
  g.__faProfiles.loaded = false;
  g.__faProfiles.list = [];
}
