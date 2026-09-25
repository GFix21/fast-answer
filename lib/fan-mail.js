/**
 * Fan Mail welcome letter, the mailing-list send log, and Flow click counts.
 * Redis holds the durable copy. Without it, a temp file is used for dev and tests.
 */
import fs from "node:fs";
import { getRedis, storeRequired } from "./redis.js";
import { LOUIS_MAIL } from "../q-and-a/louis-liberty.js";

const FILE = process.env.FA_FAN_MAIL_PATH || "/tmp/fa-fan-mail.json";
const LETTER_KEY = "fa:fan-mail:letter";
const SONG_KEY = "fa:fan-mail:song";
const METRICS_KEY = "fa:fan-mail:metrics";
const SENDS_KEY = "fa:fan-mail:sends";
const SONG_MAX = 180_000;
const BODY_MAX = 4000;

export const FAN_METRICS = ["mailingJoins", "musicOn", "openChat", "gameRoom", "games"];

const EMPTY = () => ({
  letter: {
    subject: "Welcome",
    body: "You're on the list. This is the letter Fan Mail sends the next time someone joins.",
    updatedAt: "",
    attachment: null,
  },
  song: null,
  metrics: Object.fromEntries(FAN_METRICS.map((key) => [key, 0])),
  sends: [],
});

const g = globalThis;
if (!g.__faFanMail) g.__faFanMail = { loaded: false, ...EMPTY() };

function blank() {
  return EMPTY();
}

function readFile() {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return data && typeof data === "object" ? data : blank();
  } catch {
    return blank();
  }
}

function writeFile(data) {
  if (storeRequired()) {
    const err = new Error("store");
    err.code = "store";
    throw err;
  }
  fs.mkdirSync("/tmp", { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data));
}

async function load() {
  if (g.__faFanMail.loaded) return g.__faFanMail;
  const db = await getRedis();
  if (db) {
    const letter = await db.get(LETTER_KEY);
    const song = await db.get(SONG_KEY);
    const metrics = await db.get(METRICS_KEY);
    const sends = await db.get(SENDS_KEY);
    const base = blank();
    g.__faFanMail.letter = normalizeLetter(letter) || base.letter;
    g.__faFanMail.song = song && song.data ? song : null;
    g.__faFanMail.metrics = normalizeMetrics(metrics);
    g.__faFanMail.sends = Array.isArray(sends) ? sends.slice(0, 50) : [];
  } else if (!storeRequired()) {
    const file = readFile();
    g.__faFanMail.letter = normalizeLetter(file.letter) || blank().letter;
    g.__faFanMail.song = file.song?.data ? file.song : null;
    g.__faFanMail.metrics = normalizeMetrics(file.metrics);
    g.__faFanMail.sends = Array.isArray(file.sends) ? file.sends.slice(0, 50) : [];
  }
  g.__faFanMail.loaded = true;
  return g.__faFanMail;
}

function normalizeMetrics(raw) {
  const out = blank().metrics;
  for (const key of FAN_METRICS) {
    const n = Number(raw?.[key]);
    out[key] = Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  }
  return out;
}

function normalizeLetter(raw) {
  if (!raw || typeof raw !== "object") return null;
  const subject = String(raw.subject || "").trim().slice(0, 120);
  const body = String(raw.body || "").trim().slice(0, BODY_MAX);
  if (!subject || !body) return null;
  const attachment = raw.attachment && typeof raw.attachment === "object" ? {
    name: String(raw.attachment.name || "song").slice(0, 80),
    kind: raw.attachment.kind === "link" ? "link" : "file",
    href: String(raw.attachment.href || "").slice(0, 400),
    type: String(raw.attachment.type || "").slice(0, 80),
  } : null;
  return { subject, body, updatedAt: String(raw.updatedAt || ""), attachment };
}

function publicLetter(state) {
  const letter = state.letter;
  return {
    from: LOUIS_MAIL,
    subject: letter.subject,
    body: letter.body,
    updatedAt: letter.updatedAt,
    attachment: letter.attachment ? {
      name: letter.attachment.name,
      kind: letter.attachment.kind,
      href: letter.attachment.href,
      type: letter.attachment.type || "",
    } : null,
  };
}

async function persist(state) {
  const db = await getRedis();
  if (db) {
    await db.set(LETTER_KEY, state.letter);
    await db.set(SONG_KEY, state.song);
    await db.set(METRICS_KEY, state.metrics);
    await db.set(SENDS_KEY, state.sends);
    return;
  }
  writeFile({
    letter: state.letter,
    song: state.song,
    metrics: state.metrics,
    sends: state.sends,
  });
}

export function songHref() {
  return "/api/welcome?song=1";
}

export async function readFanMail() {
  const state = await load();
  return {
    letter: publicLetter(state),
    metrics: { ...state.metrics },
    sends: state.sends.map((row) => ({ ...row })),
  };
}

function httpsUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" ? url.toString().slice(0, 400) : "";
  } catch {
    return "";
  }
}

export async function saveLetter(input = {}) {
  const state = await load();
  const subject = String(input.subject || "").trim().slice(0, 120);
  const body = String(input.body || "").trim().slice(0, BODY_MAX);
  if (!subject || !body) {
    const err = new Error("letter");
    err.code = "letter";
    throw err;
  }
  let attachment = state.letter.attachment;
  if (input.clearSong) {
    state.song = null;
    attachment = null;
  }
  const link = httpsUrl(input.attachmentUrl);
  if (link) {
    state.song = null;
    attachment = {
      name: String(input.attachmentName || "song").slice(0, 80),
      kind: "link",
      href: link,
      type: "audio",
    };
  } else if (input.songBase64) {
    const data = String(input.songBase64).replace(/^data:[^,]*,/, "");
    if (data.length > SONG_MAX) {
      const err = new Error("song");
      err.code = "song";
      throw err;
    }
    let buf;
    try { buf = Buffer.from(data, "base64"); }
    catch { buf = null; }
    if (!buf || !buf.length || buf.length > 140_000) {
      const err = new Error("song");
      err.code = "song";
      throw err;
    }
    const type = String(input.songType || "audio/mpeg").slice(0, 80);
    const name = String(input.attachmentName || "song").slice(0, 80);
    state.song = { name, type, data };
    attachment = { name, kind: "file", href: songHref(), type };
  }
  state.letter = {
    subject,
    body,
    updatedAt: new Date().toISOString(),
    attachment,
  };
  await persist(state);
  return publicLetter(state);
}

export async function deployWelcome({ email, name }) {
  const state = await load();
  const letter = publicLetter(state);
  state.metrics.mailingJoins += 1;
  state.sends.unshift({
    email: String(email || "").slice(0, 120),
    name: String(name || "").slice(0, 40),
    at: new Date().toISOString(),
    subject: letter.subject,
  });
  state.sends = state.sends.slice(0, 50);
  await persist(state);
  return letter;
}

export async function bumpMetric(event) {
  if (!FAN_METRICS.includes(event) || event === "mailingJoins") return null;
  const state = await load();
  state.metrics[event] += 1;
  await persist(state);
  return state.metrics[event];
}

export async function readSong() {
  const state = await load();
  const attachment = state.letter.attachment;
  if (!attachment) return null;
  if (attachment.kind === "link") return { redirect: attachment.href };
  if (!state.song?.data) return null;
  return {
    type: state.song.type || "application/octet-stream",
    name: state.song.name || "song",
    body: Buffer.from(state.song.data, "base64"),
  };
}

export function resetFanMailForTests() {
  const next = blank();
  g.__faFanMail.loaded = true;
  g.__faFanMail.letter = next.letter;
  g.__faFanMail.song = null;
  g.__faFanMail.metrics = next.metrics;
  g.__faFanMail.sends = [];
}
