/**
 * Dojo profiles.
 * Password hashes stay on the server. Redis is the durable copy on Vercel.
 * Without Redis, a local file is used for dev and tests only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import seedProfiles from "../data/profiles.json" with { type: "json" };
import { hashPassword, verifyPassword, newToken } from "./password-server.js";
import { getRedis, storeRequired } from "./redis.js";
import { CHILD_MIN_AGE } from "./parental.js";

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

export function normalizeLogin(raw) {
  return String(raw || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
}

export function isLoginName(value) {
  const name = normalizeLogin(value);
  return name.length >= 3 && name.length <= 20;
}

function dojoPhotoOf(raw) {
  const url = String(raw?.dojoPhoto || "");
  return url.startsWith("https://") && url.length <= 400 ? url : "";
}

function codeError(code) {
  const err = new Error(code);
  err.code = code;
  return err;
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
  if (!raw || typeof raw !== "object") return null;
  const role = raw.role === "child" ? "child" : "player";
  const email = String(raw.email || "").trim().toLowerCase();
  const loginName = normalizeLogin(raw.loginName);
  if (role === "child") {
    if (!isLoginName(loginName)) return null;
  } else if (!isEmail(email)) return null;
  const displayName = String(raw.displayName || "").trim().slice(0, 40);
  if (!displayName) return null;
  const activatedAt = String(raw.activatedAt || raw.updatedAt || new Date().toISOString());
  const age = Number(raw.age);
  return {
    id: String(raw.id || email || loginName).slice(0, 64),
    displayName,
    email: isEmail(email) ? email : "",
    loginName: role === "child" ? loginName : "",
    role,
    parentId: String(raw.parentId || "").slice(0, 64),
    consentAt: String(raw.consentAt || ""),
    playLocked: Boolean(raw.playLocked),
    passwordSalt: String(raw.passwordSalt || ""),
    passwordHash: String(raw.passwordHash || ""),
    age: Number.isInteger(age) ? age : "",
    country: String(raw.country || "").slice(0, 8),
    activated: true,
    activatedAt,
    updatedAt: String(raw.updatedAt || activatedAt),
    mailingList: raw.mailingList === false ? false : Boolean(email),
    dojoPhoto: dojoPhotoOf(raw),
  };
}

export function publicProfile(rec) {
  if (!rec) return null;
  return {
    id: rec.id,
    displayName: rec.displayName,
    email: rec.email || "",
    role: rec.role === "child" ? "child" : "player",
    loginName: rec.loginName || "",
    consent: Boolean(rec.consentAt) && !rec.playLocked,
    playLocked: Boolean(rec.playLocked),
    age: rec.age,
    country: rec.country,
    activated: true,
    activatedAt: rec.activatedAt,
    updatedAt: rec.updatedAt,
    mailingList: rec.mailingList !== false && Boolean(rec.email),
    dojoPhoto: dojoPhotoOf(rec),
  };
}

function ensureLoaded() {
  if (g.__faProfiles.loaded) return;
  const merged = new Map();
  const seed = Array.isArray(seedProfiles) ? seedProfiles : [];
  for (const raw of [...seed, ...readJson(FILE), ...readJson(TMP)]) {
    const rec = normalize(raw);
    if (rec) merged.set(rec.role === "child" ? `login:${rec.loginName}` : rec.email, rec);
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

export async function findProfileByLogin(loginName) {
  const key = normalizeLogin(loginName);
  if (!isLoginName(key)) return null;
  const db = await getRedis();
  if (db) return normalize(await db.get(`fa:profile:login:${key}`));
  ensureLoaded();
  return g.__faProfiles.list.find((p) => p.loginName === key) || null;
}

export async function findProfileById(id) {
  const want = String(id || "").trim();
  if (!want) return null;
  const db = await getRedis();
  if (db) {
    const pointer = await db.get(`fa:profile:id:${want}`);
    if (!pointer) return null;
    if (isEmail(pointer)) return findProfileByEmail(pointer);
    return findProfileByLogin(pointer);
  }
  ensureLoaded();
  return g.__faProfiles.list.find((p) => p.id === want) || null;
}

async function saveRecord(rec) {
  const db = await getRedis();
  if (db) {
    if (rec.email) {
      await db.set(`fa:profile:email:${rec.email}`, rec);
      await db.set(`fa:profile:id:${rec.id}`, rec.email);
      await db.sadd(EMAILS_KEY, rec.email);
    }
    if (rec.loginName) {
      await db.set(`fa:profile:login:${rec.loginName}`, rec);
      await db.set(`fa:profile:id:${rec.id}`, rec.loginName);
    }
    if (rec.parentId) await db.sadd(`fa:parent:${rec.parentId}`, rec.id);
    return rec;
  }
  if (storeRequired()) throw storeError();
  ensureLoaded();
  const list = g.__faProfiles.list;
  const idx = list.findIndex((p) => p.id === rec.id
    || (rec.email && p.email === rec.email)
    || (rec.loginName && p.loginName === rec.loginName));
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
    role: "player",
    loginName: "",
    parentId: "",
    consentAt: "",
    playLocked: false,
    mailingList: input?.mailingList === true,
    dojoPhoto: "",
    activated: true,
    activatedAt: existing?.activatedAt || now,
    updatedAt: now,
  };
  await saveRecord(rec);
  return publicProfile(rec);
}

export async function setDojoPhoto(id, url) {
  const photo = dojoPhotoOf({ dojoPhoto: url });
  if (!photo) throw codeError("photo");
  const rec = await findProfileById(id);
  if (!rec) throw codeError("unauthorized");
  rec.dojoPhoto = photo;
  rec.updatedAt = new Date().toISOString();
  await saveRecord(rec);
  return publicProfile(rec);
}

export async function loginChild(loginName, password) {
  const rec = await findProfileByLogin(loginName);
  if (!rec?.passwordHash || !verifyPassword(password, rec.passwordSalt, rec.passwordHash)) {
    throw codeError("password");
  }
  if (rec.role !== "child" || rec.playLocked || !rec.consentAt) throw codeError("revoked");
  return rec;
}

export async function createChildProfile(parent, input) {
  const loginName = normalizeLogin(input?.loginName);
  if (!isLoginName(loginName)) throw codeError("login");
  const displayName = String(input?.displayName || "").trim().slice(0, 40);
  if (!displayName) throw codeError("name");
  const age = Number(input?.age);
  if (!Number.isInteger(age) || age < CHILD_MIN_AGE || age > 120) throw codeError("age");
  const password = String(input?.password || "");
  if (password.length < 4 || password.length > 64) throw codeError("password");
  if (await findProfileByLogin(loginName)) throw codeError("exists");
  const { salt, hash } = hashPassword(password);
  const now = new Date().toISOString();
  const rec = {
    id: `c${newToken().slice(0, 16)}`,
    displayName,
    email: "",
    loginName,
    role: "child",
    parentId: parent.id,
    consentAt: now,
    playLocked: false,
    passwordSalt: salt,
    passwordHash: hash,
    age,
    country: String(input?.country || parent.country || "").slice(0, 8),
    activated: true,
    activatedAt: now,
    updatedAt: now,
  };
  await saveRecord(rec);
  return publicProfile(rec);
}

async function childOwned(parentId, childId) {
  const rec = await findProfileById(childId);
  if (!rec || rec.role !== "child" || rec.parentId !== parentId) throw codeError("child");
  return rec;
}

export async function revokeChild(parentId, childId) {
  const rec = await childOwned(parentId, childId);
  rec.playLocked = true;
  rec.consentAt = "";
  rec.updatedAt = new Date().toISOString();
  await saveRecord(rec);
  return publicProfile(rec);
}

export async function resetChildPassword(parentId, childId, password) {
  const next = String(password || "");
  if (next.length < 4 || next.length > 64) throw codeError("password");
  const rec = await childOwned(parentId, childId);
  if (rec.playLocked || !rec.consentAt) throw codeError("revoked");
  const { salt, hash } = hashPassword(next);
  rec.passwordSalt = salt;
  rec.passwordHash = hash;
  rec.updatedAt = new Date().toISOString();
  await saveRecord(rec);
  return publicProfile(rec);
}

export async function listChildren(parentId) {
  const want = String(parentId || "");
  if (!want) return [];
  const db = await getRedis();
  if (db) {
    const ids = await db.smembers(`fa:parent:${want}`);
    const rows = [];
    for (const id of ids || []) {
      const rec = await findProfileById(id);
      if (rec && rec.parentId === want) rows.push(publicProfile(rec));
    }
    return rows;
  }
  ensureLoaded();
  return g.__faProfiles.list.filter((p) => p.parentId === want).map((p) => publicProfile(p));
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

export async function mailingListRows() {
  const seen = new Set();
  const rows = [];
  for (const p of await listProfilesAsync()) {
    if (!p.email || p.mailingList === false || seen.has(p.email)) continue;
    seen.add(p.email);
    rows.push(p);
  }
  return rows;
}

export async function mailingListCsv() {
  const rows = [["email", "name", "activated"]];
  for (const p of await mailingListRows()) {
    rows.push([p.email, p.displayName, p.activatedAt]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

/** Test helper — drop the in-memory list so the next read reloads disk. */
export function resetProfileStoreForTests() {
  g.__faProfiles.loaded = false;
  g.__faProfiles.list = [];
}
