import {
  LOCALES,
  loadStoredLocale,
  storeLocale,
  normalizeLocale,
  speechLang,
  questionsUrl,
  placementUrl,
  t,
  languageSwitcherHtml,
} from "./i18n.js";

const STUDIOS = [
  "./studio/studio-01-contestant-pov.jpg",
  "./studio/studio-02-overhead-grid.jpg",
  "./studio/studio-03-side-podiums.jpg",
  "./studio/studio-04-low-hero.jpg",
  "./studio/studio-05-rear-dais.jpg",
];
const POSE = {
  idle: "./jeremy/jeremy-waiting-for-answer.png",
  question: "./jeremy/jeremy-heres-the-question.png",
  next: "./jeremy/jeremy-next-question.png",
  wait: "./jeremy/jeremy-waiting-for-answer.png",
  win: "./jeremy/jeremy-win.png",
  loss: "./jeremy/jeremy-loss.png",
};
const TITLE_3D = "./promo/fast-answer-3d-flying.jpg";
const FLOW_URL = "https://gmgbrand.vercel.app/flow";
const PROFILE_KEY = "fa-profile-v1";
const RECENT_Q_KEY = "fa-recent-qids-v1";
const RECENT_Q_MAX = 240;
const READ_S = 10;
const POINTS = { easy: 100, hard: 500, difficult: 1000, extreme: 5000 };
const DEAL = { easy: 20, hard: 10, difficult: 5, extreme: 2 };
const ROUND = DEAL.easy + DEAL.hard + DEAL.difficult + DEAL.extreme;
const LOCKDOWN_N = 5;
const LOCKDOWN_WIN_AT = 4;
const LOCKDOWN_Q = 500; // legacy fallback; live points decay from LOCKDOWN_PTS
const LOCKDOWN_PTS = 5000;
const LOCKDOWN_ANSWER_S = 180; // 3 minutes per lockdown question
const LOCKDOWN_INTRO_S = 7; // pre-question rules countdown
const LOCKDOWN_WAIT_S = 60; // waiting players countdown during hero play
const WAGER_S = 60;
const WAGER_AMTS = [100, 500, 1000];
const LETTERS = "ABCD";
const PLACE_N = 10;
const PLACE_MS = 90 * 24 * 60 * 60 * 1000;
const TIER_LADDER = ["easy", "hard", "difficult", "extreme"];
const BELT_ORDER = ["white", "yellow", "orange", "green", "blue", "purple", "brown", "black"];
const BELT_META = {
  white: { label: "White", color: "#f5f5f5" },
  yellow: { label: "Yellow", color: "#f5d76e" },
  orange: { label: "Orange", color: "#e67e22" },
  green: { label: "Green", color: "#27ae60" },
  blue: { label: "Blue", color: "#3498db" },
  purple: { label: "Purple", color: "#9b59b6" },
  brown: { label: "Brown", color: "#8b5a2b" },
  black: { label: "Black", color: "#1a1a1a" },
};
const ABILITY_META = {
  bronze: { label: "Bronze", color: "#cd7f32" },
  silver: { label: "Silver", color: "#c0c0c0" },
  gold: { label: "Gold", color: "#f5d76e" },
};

/** Celebrity first-name bots fill empty seats (2–12). Skill + buzz delay like the old dojo AI. */
const CELEB_BOTS = [
  { id: "oprah", name: "Oprah", skill: 0.62, buzzDelayMs: [900, 2400], blurb: "Composed. Reads the room." },
  { id: "elton", name: "Elton", skill: 0.55, buzzDelayMs: [1200, 3000], blurb: "Showy. Fashionably late." },
  { id: "serena", name: "Serena", skill: 0.6, buzzDelayMs: [700, 1800], blurb: "Competitive. First strike." },
  { id: "usain", name: "Usain", skill: 0.48, buzzDelayMs: [500, 1400], blurb: "Fastest buzz. Coin-flip answers." },
  { id: "adele", name: "Adele", skill: 0.58, buzzDelayMs: [1100, 2600], blurb: "Holds the note." },
  { id: "idris", name: "Idris", skill: 0.61, buzzDelayMs: [1000, 2200], blurb: "Cool under lights." },
  { id: "keanu", name: "Keanu", skill: 0.5, buzzDelayMs: [1400, 3200], blurb: "Chill. Occasionally lethal." },
  { id: "zendaya", name: "Zendaya", skill: 0.56, buzzDelayMs: [800, 2100], blurb: "Poised, then pounces." },
  { id: "rihanna", name: "Rihanna", skill: 0.52, buzzDelayMs: [750, 2000], blurb: "Works. Works. Works." },
  { id: "denzel", name: "Denzel", skill: 0.64, buzzDelayMs: [1000, 2400], blurb: "Precision over panic." },
  { id: "meryl", name: "Meryl", skill: 0.66, buzzDelayMs: [1300, 2800], blurb: "Never first. Rarely wrong." },
];

const $ = (s, r = document) => r.querySelector(s);
const params = new URLSearchParams(location.search);
let role = params.get("role") || (params.get("pad") ? "pad" : "host");
const joinCode = (params.get("room") || "").toUpperCase();
const isDirections =
  params.get("page") === "directions" ||
  /(?:^|\/)directions\.html$/i.test(location.pathname);
const ROOM_API = location.pathname.includes("/fast-answer") ? "/api/fa/rooms" : "/api/rooms";

function detectDisplayMode() {
  if (role === "pad") return false;
  const flag = params.get("tv") || params.get("display") || params.get("onscreen") || params.get("silk");
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  const ua = navigator.userAgent || "";
  // Fire TV Silk, smart TVs, Chromecast, Apple TV, etc.
  if (/AFT[A-Z0-9]|FireTV|Silk\/|SmartTV|SMART-TV|BRAVIA|Web0S|WebOS|Tizen|AppleTV|Apple TV|CrKey|GoogleTV|Viera|NetCast|HbbTV|TV Safari/i.test(ua)) {
    return true;
  }
  return false;
}
const forcedDisplay = detectDisplayMode();

const state = {
  phase: "lobby",
  onScreen: forcedDisplay || localStorage.getItem("fa-onscreen") === "1",
  hostH: Number(localStorage.getItem("fa-hosth") || 38),
  studioI: Number(localStorage.getItem("fa-studio") || 0),
  name: localStorage.getItem("fa-name") || "Player",
  room: joinCode || "",
  pose: "idle",
  qs: [],
  i: 0,
  picked: -1,
  buzzed: false,
  buzzBy: "",
  buzzId: "",
  readLeft: READ_S,
  tick: null,
  questions: [],
  listening: false,
  players: [],
  youId: "you",
  maps: {},
  mapLive: false,
  lockdownAt: [],
  lockdown: null,
  rules: false,
  aiBuzzT: null,
  spent: new Set(),
  playerCount: Math.min(12, Math.max(2, Number(localStorage.getItem("fa-seats") || 3))),
  lobbyOpen: "room",
  profile: null,
  profileUnlocked: false,
  dojoMode: "home", // home | create | unlock | setpw
  dojo: null,
  seatBots: [],
  guests: [],
  tally: { correct: 0, wrong: 0 },
  joinInput: "",
  dirOpen: "tv",
  qrOpen: false,
  readyIds: {},
  mpMode: localStorage.getItem("fa-mp") || (role === "pad" ? "join" : "host"),
  statusMsg: "",
  placementQs: [],
  botFill: true,
  locale: loadStoredLocale(),
  activeRooms: [],
  leftPad: false,
  wagerDraft: null,
  lastAnswerAt: 0,
};

const bc = "BroadcastChannel" in window ? new BroadcastChannel("fast-answer") : null;
let poll = null;
let pollN = 0;

function tt(key, ...args) {
  return t(state.locale, key, ...args);
}

async function loadBanksForLocale(locale = state.locale) {
  const loc = normalizeLocale(locale);
  const bank = await fetch(questionsUrl(loc)).then((r) => {
    if (!r.ok) throw new Error("questions " + loc);
    return r.json();
  });
  state.questions = Array.isArray(bank) ? bank : (bank.questions || []);
  try {
    const place = await fetch(placementUrl(loc)).then((r) => (r.ok ? r.json() : null));
    state.placementQs = Array.isArray(place?.questions) ? place.questions : [];
  } catch {
    state.placementQs = [];
  }
  document.documentElement.lang = loc;
}

async function setLocale(next) {
  const loc = storeLocale(next);
  state.locale = loc;
  if (!isDirections) {
    try {
      await loadBanksForLocale(loc);
    } catch (err) {
      state.statusMsg = "Locale pack missing: " + loc;
    }
    if (state.dojo && state.dojo.q && !state.dojo.done) {
      clearDojoTick();
      state.dojo = null;
      if (
        needsPlacement(state.profile)
        && role !== "pad"
        && !isTvDisplay()
        && isProfileUnlocked()
      ) {
        state.lobbyOpen = "dojo";
        ensureDojo();
      }
    }
  }
  paint(true);
}


function me() {
  return state.players.find((p) => p.id === state.youId) || state.players.find((p) => p.you);
}
function playerById(id) {
  return state.players.find((p) => p.id === id);
}
function stakeOf(q) {
  return POINTS[(q && q.tier) || "easy"] || 100;
}
function others() {
  return state.players.filter((p) => p.id !== state.youId);
}
function code() {
  return (state.room || Math.random().toString(36).slice(2, 6)).toUpperCase();
}
function shareUrl() {
  const u = new URL(location.href);
  u.search = `?role=pad&room=${encodeURIComponent(state.room)}`;
  return u.toString();
}
function tvSilkUrl(roomCode = state.room) {
  const path = location.pathname.replace(/\/index\.html$/i, "").replace(/\/$/, "");
  const base = `${location.origin}${path || ""}`;
  const code = String(roomCode || "").toUpperCase();
  return `${base}/?tv=1${code ? `&room=${encodeURIComponent(code)}` : ""}`;
}
function isTvDisplay() {
  return Boolean(state.onScreen && role !== "pad");
}
function isPad() {
  return role === "pad";
}
function hasStoredProfileRecord() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw);
    if (!p || !String(p.displayName || "").trim()) return false;
    // Ready once password is set, or legacy placed/played profiles (migrate to password in Dojo).
    return Boolean(p.passwordHash || p.placementCompletedAt || p.abilityTier || (p.stats && p.stats.gamesPlayed > 0));
  } catch {
    return false;
  }
}
function hasPhoneProfile() {
  const p = state.profile;
  return Boolean(p && hasStoredProfileRecord() && String(p.displayName || "").trim());
}
function needsPasswordSetup() {
  return hasPhoneProfile() && !state.profile?.passwordHash;
}
function isProfileUnlocked() {
  return Boolean(state.profileUnlocked && hasPhoneProfile() && state.profile?.passwordHash);
}
function canPlayScored() {
  return isProfileUnlocked() && isPlaced();
}
async function hashPassword(pw) {
  const raw = String(pw || "");
  const enc = new TextEncoder().encode("fa-dojo-v1:" + raw);
  try {
    if (crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", enc);
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch { /* fall through */ }
  let h = 2166136261;
  for (let i = 0; i < enc.length; i++) {
    h ^= enc[i];
    h = Math.imul(h, 16777619);
  }
  return "fb-" + (h >>> 0).toString(16);
}
async function verifyProfilePassword(pw) {
  const want = state.profile?.passwordHash;
  if (!want) return false;
  const got = await hashPassword(pw);
  return got === want;
}
async function copyText(value) {
  const text = String(value || "");
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
function humanPads() {
  return (state.guests || []).filter((g) => g && g.id);
}
function allPadsReady() {
  const pads = humanPads();
  if (!pads.length) return false;
  return pads.every((g) => state.readyIds[g.id]);
}
function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = String(s || "");
  return d.innerHTML;
}
function currentQ() {
  if (state.lockdown && (state.lockdown.phase === "play" || state.lockdown.phase === "flash")) {
    return state.lockdown.qs[state.lockdown.qi] || null;
  }
  return state.qs[state.i] || null;
}
function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}
/** Shuffle A–D at deal time so banks that store the key on A are not biased. */
function shuffleQuestionChoices(q) {
  if (!q || !Array.isArray(q.choices) || q.choices.length < 2) return q;
  const correct = q.choices[q.correctIndex];
  const choices = shuffle(q.choices);
  let correctIndex = choices.indexOf(correct);
  if (correctIndex < 0) correctIndex = 0;
  return { ...q, choices, correctIndex };
}
function loadRecentQuestionIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_Q_KEY) || "[]");
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}
function rememberDealtIds(ids) {
  const incoming = (ids || []).map(String).filter(Boolean);
  if (!incoming.length) return;
  const prev = loadRecentQuestionIds().filter((id) => !incoming.includes(id));
  const next = [...incoming, ...prev].slice(0, Math.max(RECENT_Q_MAX, state.questions.length || 0));
  try {
    localStorage.setItem(RECENT_Q_KEY, JSON.stringify(next));
  } catch { /* ignore quota */ }
}
/** Prefer unseen bank ids across back-to-back games; fall back to least-recent. */
function sampleByTier(all, tier, need, recentSet) {
  const pool = all.filter((q) => q.tier === tier);
  if (!pool.length || need <= 0) return [];
  const fresh = shuffle(pool.filter((q) => !recentSet.has(q.id)));
  const used = pool.filter((q) => recentSet.has(q.id));
  // recent list is newest-first; prefer higher index (older / less recent)
  const recentOrder = loadRecentQuestionIds();
  const rank = new Map(recentOrder.map((id, i) => [id, i]));
  used.sort((a, b) => (rank.get(b.id) ?? 9999) - (rank.get(a.id) ?? 9999));
  return [...fresh, ...used].slice(0, need).map(shuffleQuestionChoices);
}
function deal(all) {
  const recent = new Set(loadRecentQuestionIds());
  return [
    ...sampleByTier(all, "easy", DEAL.easy, recent),
    ...sampleByTier(all, "hard", DEAL.hard, recent),
    ...sampleByTier(all, "difficult", DEAL.difficult, recent),
    ...sampleByTier(all, "extreme", DEAL.extreme, recent),
  ];
}
function pickLockdownSlots() {
  const lo = 8;
  const hi = ROUND - 5;
  const a = lo + Math.floor(Math.random() * (hi - lo));
  let b = lo + Math.floor(Math.random() * (hi - lo));
  while (Math.abs(b - a) < 6) b = lo + Math.floor(Math.random() * (hi - lo));
  return [a, b].sort((x, y) => x - y);
}
function leftoverQs(preferHard = false) {
  const recent = new Set(loadRecentQuestionIds());
  const pool = state.questions.filter((q) => !state.spent.has(q.id));
  const rankFresh = (list) => {
    const fresh = shuffle(list.filter((q) => !recent.has(q.id)));
    const used = shuffle(list.filter((q) => recent.has(q.id)));
    return [...fresh, ...used].map(shuffleQuestionChoices);
  };
  if (!preferHard) return rankFresh(pool);
  const hard = rankFresh(pool.filter((q) => q.tier === "difficult" || q.tier === "extreme"));
  const rest = rankFresh(pool.filter((q) => q.tier !== "difficult" && q.tier !== "extreme"));
  return [...hard, ...rest];
}
function lockdownPointsNow(ld = state.lockdown) {
  if (!ld) return 0;
  const left = Math.max(0, Number(ld.qLeft) || 0);
  const total = LOCKDOWN_ANSWER_S;
  return Math.max(0, Math.round(LOCKDOWN_PTS * (left / total)));
}
function playSound(kind) {
  try {
    const a = new Audio(`./sounds/${kind}.wav`);
    a.volume = 0.55;
    void a.play();
  } catch { /* ignore */ }
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function uid() {
  return (crypto.randomUUID && crypto.randomUUID()) || `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function emptyStats() {
  return { gamesPlayed: 0, totalPoints: 0, correctAnswers: 0, wrongAnswers: 0, bestScore: 0 };
}
function beltFromPoints(pts) {
  const n = Math.max(0, pts || 0);
  if (n >= 4200) return "black";
  if (n >= 3600) return "brown";
  if (n >= 3000) return "purple";
  if (n >= 2400) return "blue";
  if (n >= 1800) return "green";
  if (n >= 1200) return "orange";
  if (n >= 600) return "yellow";
  return "white";
}
function addMonthsIso(iso, months) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}
function formatDue(iso) {
  try {
    return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 10);
  }
}
function needsPlacement(p) {
  if (!p || !p.placementCompletedAt || !p.nextPlacementDueAt) return true;
  const due = Date.parse(p.nextPlacementDueAt);
  if (!Number.isFinite(due)) return true;
  return Date.now() >= due;
}
function isPlaced() {
  return Boolean(state.profile && !needsPlacement(state.profile));
}
function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return seedProfile();
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return seedProfile();
    p.stats = { ...emptyStats(), ...(p.stats || {}) };
    p.belt = beltFromPoints(p.stats.totalPoints);
    p.displayName = String(p.displayName || state.name || "Player").slice(0, 40);
    p.email = String(p.email || "").slice(0, 120);
    p.passwordHash = String(p.passwordHash || "");
    return p;
  } catch {
    return seedProfile();
  }
}
function seedProfile() {
  return {
    id: uid(),
    displayName: state.name || "Player",
    email: "",
    thumb: "",
    belt: "white",
    abilityTier: null,
    passwordHash: "",
    stats: emptyStats(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
function saveProfile(patch = {}) {
  const prev = state.profile || seedProfile();
  const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  next.stats = { ...emptyStats(), ...(prev.stats || {}), ...(patch.stats || {}) };
  next.belt = beltFromPoints(next.stats.totalPoints);
  next.displayName = String(next.displayName || "Player").trim().slice(0, 40) || "Player";
  next.email = String(next.email || "").trim().slice(0, 120);
  state.profile = next;
  state.name = next.displayName;
  localStorage.setItem("fa-name", state.name);
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  } catch {
    const slim = { ...next, thumb: "" };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(slim));
  }
  return next;
}
function nextPlacementTier(current, correct) {
  const i = TIER_LADDER.indexOf(current);
  if (correct) return TIER_LADDER[Math.min(TIER_LADDER.length - 1, i + 1)];
  return TIER_LADDER[Math.max(0, i - 1)];
}
function pickPlacementQuestion(tier, exclude) {
  const skip = new Set(exclude || []);
  const pool = (state.placementQs && state.placementQs.length)
    ? state.placementQs
    : state.questions;
  const available = shuffle(pool.filter((q) => !skip.has(q.id) && q.tier !== "finale"));
  const order = {
    easy: ["easy", "hard", "difficult", "extreme"],
    hard: ["hard", "easy", "difficult", "extreme"],
    difficult: ["difficult", "hard", "extreme", "easy"],
    extreme: ["extreme", "difficult", "hard", "easy"],
  }[tier] || TIER_LADDER;
  for (const t of order) {
    const hit = available.find((q) => q.tier === t);
    if (hit) return hit;
  }
  return available[0] || null;
}
function abilityFromDojo(answers) {
  const total = answers.length || PLACE_N;
  const correct = answers.filter((a) => a.correct).length;
  const pct = correct / total;
  const hardHits = answers.filter((a) => a.correct && (a.question.tier === "difficult" || a.question.tier === "extreme")).length;
  if (pct >= 0.7 || (pct >= 0.55 && hardHits >= 2)) return "gold";
  if (pct >= 0.4) return "silver";
  return "bronze";
}
function fillSeats() {
  const guests = state.guests || [];
  const empty = Math.max(0, (state.playerCount || 3) - 1 - guests.length);
  const need = state.botFill ? Math.min(11, empty) : 0;
  const have = [...(state.seatBots || [])];
  const used = new Set(have.map((b) => b.id));
  const extra = shuffle(CELEB_BOTS.filter((b) => !used.has(b.id)));
  while (have.length < need && extra.length) have.push(extra.shift());
  state.seatBots = have.slice(0, need);
}
function seatedPreview() {
  const you = { id: "you", name: state.name || "Player", human: true, you: true, score: 0 };
  const guests = state.guests || [];
  const remain = Math.max(0, state.playerCount - 1 - guests.length);
  const bots = (state.seatBots || []).slice(0, remain);
  return [you, ...guests.map((g) => ({ ...g, human: true, you: false, score: 0 })), ...bots.map((b) => ({ ...b, human: false, score: 0 }))].slice(0, 12);
}

async function rooms(method, body) {
  try {
    let qs = "";
    if (method === "GET") {
      if (body && body.list) qs = "?list=1";
      else if (state.room) qs = `?code=${encodeURIComponent(state.room)}`;
      else qs = "?list=1";
    }
    const res = await fetch(ROOM_API + qs, {
      method: method === "GET" ? "GET" : "POST",
      headers: { "content-type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return data || { error: "http", status: res.status };
    return data;
  } catch {
    return null;
  }
}
async function refreshActiveRooms() {
  const data = await rooms("GET", { list: true });
  if (data && Array.isArray(data.rooms)) {
    state.activeRooms = data.rooms.filter((r) => r && r.code);
  }
}
function submitAnswerToRoom(index, lockdown = false) {
  if (!state.room) return;
  const payload = {
    action: "answer",
    code: state.room,
    id: state.youId,
    name: state.name,
    index: Number(index),
    lockdown: Boolean(lockdown),
  };
  if (bc) bc.postMessage({ type: "answer", ...payload });
  void rooms("POST", payload);
}

function snapshot() {
  return {
    phase: state.phase,
    i: state.i,
    pose: state.pose,
    buzzed: state.buzzed,
    buzzBy: state.buzzBy,
    buzzId: state.buzzId,
    picked: state.picked,
    readLeft: state.readLeft,
    studioI: state.studioI,
    hostH: state.hostH,
    room: state.room,
    qs: state.qs,
    q: currentQ(),
    players: state.players,
    maps: state.maps,
    mapLive: state.mapLive,
    lockdownAt: state.lockdownAt,
    lockdown: state.lockdown,
    playerCount: state.playerCount,
    readyIds: state.readyIds,
    guests: state.guests,
  };
}
function publish() {
  const snap = snapshot();
  if (bc) bc.postMessage(snap);
  if (state.onScreen && state.room && role !== "pad") {
    void rooms("POST", { action: "state", code: state.room, state: snap });
  }
}
if (bc) {
  bc.onmessage = (ev) => {
    const d = ev.data || {};
    if (d.type === "ready" && role !== "pad" && state.phase === "ready") {
      state.readyIds = { ...(state.readyIds || {}), [d.id]: true };
      paint(true);
      maybeStartFromReady();
      return;
    }
    if (d.type === "buzz" && role !== "pad" && state.phase === "buzz" && !state.buzzed) {
      takeBuzz(d.id || "", d.name || "Player");
      return;
    }
    if (d.type === "map" && role !== "pad" && state.phase === "read") {
      state.maps[d.id] = d.target;
      paint();
      return;
    }
    if (d.type === "wager" && role !== "pad" && state.lockdown?.phase === "wager") {
      applyWager(d.id, d.side, d.amount, Boolean(d.locked));
      return;
    }
    if (d.type === "answer" && role !== "pad") {
      applyRemoteAnswer(d.id, d.index, Boolean(d.lockdown));
      return;
    }
    if (role === "pad" && !state.leftPad && d.phase) {
      const keepName = state.name;
      const keepId = state.youId;
      Object.assign(state, d);
      state.name = keepName;
      state.youId = keepId;
      paint();
    }
  };
}

function stopTick() {
  if (state.tick) {
    clearInterval(state.tick);
    clearTimeout(state.tick);
  }
  state.tick = null;
}
function clearAiBuzz() {
  if (state.aiBuzzT) clearTimeout(state.aiBuzzT);
  state.aiBuzzT = null;
}

function clockText() {
  const q = currentQ();
  const ld = state.lockdown;
  if (ld?.phase === "wager") return `Lockdown wagers — ${ld.wagerLeft}s`;
  if (ld?.phase === "intro") return `Lockdown rules — ${ld.introLeft}s`;
  if (ld?.phase === "play") {
    const pts = lockdownPointsNow(ld);
    const isHero = state.youId === ld.playerId;
    if (!isHero && role === "pad") return `Waiting — ${ld.waitLeft ?? LOCKDOWN_WAIT_S}s · hero plays`;
    return `Lockdown ${ld.qi + 1}/${LOCKDOWN_N} · ${ld.qLeft}s · $${pts}`;
  }
  if (ld?.phase === "result") return ld.won ? "Lockdown cleared" : "Lockdown broken";
  if (state.phase === "read") {
    const t = playerById(state.maps[state.youId]);
    return t
      ? `MAP ${t.name} · $${stakeOf(q)} · buzz in ${state.readLeft}s`
      : `Read ${state.readLeft}s — tap a rival to MAP, or wait and buzz`;
  }
  if (state.phase === "buzz") {
    return state.maps[state.youId] ? tt("buzzMap") : tt("buzzNow");
  }
  if (state.phase === "answer") return state.buzzBy ? `${state.buzzBy} — answer` : "Your answer";
  if (state.phase === "reveal") {
    if (!q) return "";
    return state.picked === q.correctIndex ? "Correct" : "Wrong";
  }
  if (state.phase === "end") return "That's the show";
  return "";
}

function seatPlayers() {
  state.youId = "you";
  fillSeats();
  const guests = state.guests || [];
  const remain = Math.max(0, state.playerCount - 1 - guests.length);
  const bots = (state.seatBots || []).slice(0, remain);
  state.players = [
    { id: "you", name: state.name || "Player", score: 0, human: true, you: true, thumb: state.profile?.thumb || "" },
    ...guests.map((g) => ({ id: g.id, name: g.name, score: 0, human: true, you: false, thumb: g.thumb || "" })),
    ...bots.map((b) => ({
      id: b.id,
      name: b.name,
      score: 0,
      human: false,
      you: false,
      skill: b.skill,
      buzzDelayMs: b.buzzDelayMs,
      thumb: "",
    })),
  ].slice(0, 12);
}

function startRead() {
  const q = currentQ();
  if (!q) {
    finishShow();
    return;
  }
  state.phase = "read";
  state.pose = "question";
  state.picked = -1;
  state.buzzed = false;
  state.buzzBy = "";
  state.buzzId = "";
  state.mapLive = false;
  state.maps = {};
  state.readLeft = READ_S;
  state.studioI = (state.studioI + 1) % STUDIOS.length;
  paint();
  publish();
  stopTick();
  state.tick = setInterval(() => {
    state.readLeft -= 1;
    if (state.readLeft <= 0) {
      stopTick();
      state.phase = "buzz";
      state.pose = "wait";
      paint();
      publish();
      scheduleAiBuzz();
    } else {
      const clock = $("#clock");
      if (clock) clock.textContent = clockText();
    }
  }, 1000);
}

function scheduleAiBuzz() {
  clearAiBuzz();
  const ais = state.players.filter((p) => !p.human);
  if (!ais.length) return;
  const ranked = ais.map((bot) => {
    const [a, b] = bot.buzzDelayMs || [1800, 3600];
    return { bot, delay: a + Math.random() * (b - a) };
  }).sort((x, y) => x.delay - y.delay);
  const first = ranked[0];
  state.aiBuzzT = setTimeout(() => {
    if (state.phase !== "buzz" || state.buzzed) return;
    takeBuzz(first.bot.id, first.bot.name);
    setTimeout(() => aiPick(first.bot), 500 + Math.random() * 400);
  }, first.delay);
}

function takeBuzz(id, name) {
  if (state.phase !== "buzz" || state.buzzed) return;
  state.buzzed = true;
  state.buzzId = id;
  state.buzzBy = name;
  state.phase = "answer";
  state.pose = "wait";
  state.mapLive = Boolean(state.maps[id]);
  clearAiBuzz();
  playSound("buzz");
  paint();
  publish();
}

function markReady() {
  if (state.phase !== "ready") return;
  const id = state.youId;
  if (!id) return;
  state.readyIds = { ...(state.readyIds || {}), [id]: true };
  paint(true);
  if (bc) bc.postMessage({ type: "ready", id, name: state.name, room: state.room });
  if (state.room) void rooms("POST", { action: "ready", code: state.room, id, name: state.name });
  if (role !== "pad") maybeStartFromReady();
}

function maybeStartFromReady() {
  if (state.phase !== "ready" || role === "pad") return;
  if (!allPadsReady()) return;
  startGame();
}

function enterReady() {
  state.phase = "ready";
  state.pose = "idle";
  state.readyIds = {};
  state.qrOpen = false;
  paint(true);
  publish();
}

function buzz() {
  if (state.lockdown) return;
  if (state.phase === "ready") {
    markReady();
    return;
  }
  if (state.phase !== "buzz" || state.buzzed) return;
  takeBuzz(state.youId, state.name);
  if (bc) bc.postMessage({ type: "buzz", name: state.name, id: state.youId, room: state.room });
  if (state.room) void rooms("POST", { action: "buzz", code: state.room, name: state.name, id: state.youId });
}

function armMap(targetId) {
  const answerPhase = state.phase === "answer";
  const readPhase = state.phase === "read";
  if (!readPhase && !answerPhase) return;
  const owner = answerPhase ? (state.buzzId || state.youId) : state.youId;
  if (answerPhase && role === "pad" && owner !== state.youId) return;
  if (targetId === owner) return;
  if (state.maps[owner] === targetId) delete state.maps[owner];
  else state.maps[owner] = targetId;
  if (answerPhase) state.mapLive = Boolean(state.maps[owner]);
  paint();
  publish();
  if (bc) bc.postMessage({ type: "map", id: owner, target: state.maps[owner], name: state.name });
  if (state.room) void rooms("POST", { action: "map", code: state.room, id: owner, target: state.maps[owner] });
}

function aiCorrectChance(bot, tier) {
  let m = bot.skill || 0.5;
  if (tier === "easy") m += 0.12;
  if (tier === "hard") m -= 0.05;
  if (tier === "difficult") m -= 0.15;
  if (tier === "extreme") m -= 0.28;
  return clamp(m, 0.12, 0.92);
}
function aiPick(bot) {
  const q = currentQ();
  if (!q || state.phase !== "answer") return;
  const i = Math.random() < aiCorrectChance(bot, q.tier)
    ? q.correctIndex
    : [0, 1, 2, 3].filter((n) => n !== q.correctIndex)[Math.floor(Math.random() * 3)];
  pick(i, bot.id);
}

function addScore(id, delta) {
  const p = playerById(id);
  if (!p) return;
  p.score = Math.max(0, p.score + delta);
}

function settleMain(ok, q, answererId) {
  const stake = stakeOf(q);
  const targetId = state.mapLive ? state.maps[answererId] : null;
  if (ok) {
    if (state.mapLive && targetId) {
      addScore(answererId, stake * 2);
      addScore(targetId, -stake);
    } else {
      addScore(answererId, stake);
    }
  } else if (state.mapLive && targetId) {
    addScore(answererId, -stake);
  }
}

function recordCareer() {
  const p = state.profile;
  if (!p) return;
  const score = me()?.score || 0;
  const stats = {
    ...emptyStats(),
    ...(p.stats || {}),
    gamesPlayed: (p.stats?.gamesPlayed || 0) + 1,
    totalPoints: (p.stats?.totalPoints || 0) + Math.max(0, score),
    correctAnswers: (p.stats?.correctAnswers || 0) + (state.tally.correct || 0),
    wrongAnswers: (p.stats?.wrongAnswers || 0) + (state.tally.wrong || 0),
    bestScore: Math.max(p.stats?.bestScore || 0, score),
    lastPlayedAt: new Date().toISOString(),
  };
  saveProfile({ stats });
}

function leaveToLobby() {
  stopTick();
  clearAiBuzz();
  clearDojoTick();
  if (state._ldWait) {
    clearInterval(state._ldWait);
    state._ldWait = null;
  }
  if (state.room && role === "pad" && state.youId) {
    void rooms("POST", { action: "leave", code: state.room, id: state.youId, name: state.name });
  }
  if (poll) {
    clearInterval(poll);
    poll = null;
  }
  state.leftPad = true;
  state.lockdown = null;
  state.phase = "lobby";
  state.readyIds = {};
  state.wagerDraft = null;
  state.statusMsg = "";
  state.maps = {};
  state.mapLive = false;
  if (role === "pad") {
    role = "host";
    state.onScreen = false;
    state.mpMode = "host";
    localStorage.setItem("fa-onscreen", "0");
    localStorage.setItem("fa-mp", "host");
    try {
      const u = new URL(location.href);
      u.searchParams.delete("role");
      u.searchParams.delete("room");
      u.searchParams.delete("pad");
      history.replaceState(null, "", u.pathname + (u.searchParams.toString() ? "?" + u.searchParams.toString() : ""));
    } catch { /* ignore */ }
    state.room = "";
    state.joinInput = "";
  }
  state.lobbyOpen = "room";
  paint(true);
}

function finishShow() {

  state.phase = "end";
  state.pose = (me()?.score || 0) >= 4000 ? "win" : "idle";
  recordCareer();
  paint();
  publish();
}

function continueRound() {
  state.lockdown = null;
  state.i += 1;
  if (state.i >= state.qs.length) finishShow();
  else {
    state.pose = "next";
    paint();
    setTimeout(startRead, 450);
  }
}

function afterReveal(ok) {
  const shouldLock = ok && state.lockdownAt.includes(state.i) && !state.lockdown;
  setTimeout(() => {
    if (shouldLock) startLockdown(state.buzzId);
    else continueRound();
  }, 1400);
}

function applyRemoteAnswer(id, index, lockdown = false) {
  if (role === "pad") return;
  const i = Number(index);
  if (!Number.isFinite(i)) return;
  if (lockdown || state.lockdown?.phase === "play") {
    if (!state.lockdown || state.lockdown.phase !== "play") return;
    if (id && state.lockdown.playerId && id !== state.lockdown.playerId) return;
    lockdownPick(i, true);
    return;
  }
  if (state.phase !== "answer") return;
  if (state.buzzed && id && state.buzzId && id !== state.buzzId) return;
  pick(i, id || state.buzzId || state.youId, true);
}

function pick(i, asId, fromRemote = false) {
  if (state.lockdown?.phase === "wager" || state.lockdown?.phase === "intro") return;
  if (state.lockdown?.phase === "play") {
    // Pad hero sends to room; host applies. Local solo applies directly.
    if (role === "pad" && !fromRemote) {
      if (state.youId !== state.lockdown.playerId) return;
      submitAnswerToRoom(i, true);
      state.picked = i;
      paint();
      return;
    }
    lockdownPick(i, fromRemote);
    return;
  }
  if (state.phase === "reveal" || state.phase === "end" || state.phase === "read" || state.phase === "lobby") return;
  if (role === "pad" && !state.buzzed) return;
  if (!state.onScreen && state.phase === "buzz" && !asId && !fromRemote) {
    takeBuzz(state.youId, state.name);
  }
  if (state.phase !== "answer") return;
  // Pad answers must reach the TV room (voice + tap).
  if (role === "pad" && !fromRemote && state.room) {
    const answerer = state.buzzId || state.youId;
    if (answerer !== state.youId) return;
    submitAnswerToRoom(i, false);
    state.picked = i;
    paint();
    return;
  }
  const q = currentQ();
  if (!q) return;
  const answerer = asId || state.buzzId || state.youId;
  state.picked = i;
  const ok = i === q.correctIndex;
  state.pose = ok ? "win" : "loss";
  playSound(ok ? "correct" : "miss");
  settleMain(ok, q, answerer);
  if (answerer === state.youId) {
    if (ok) state.tally.correct += 1;
    else state.tally.wrong += 1;
  }
  state.phase = "reveal";
  paint();
  publish();
  afterReveal(ok);
}

function startLockdown(playerId) {
  const hero = playerById(playerId) || me();
  if (!hero) {
    continueRound();
    return;
  }
  const qs = leftoverQs(true).slice(0, LOCKDOWN_N);
  if (qs.length < LOCKDOWN_N) {
    continueRound();
    return;
  }
  qs.forEach((q) => state.spent.add(q.id));
  rememberDealtIds(qs.map((q) => q.id));
  state.wagerDraft = null;
  state.lockdown = {
    phase: "wager",
    playerId: hero.id,
    name: hero.name,
    qs,
    qi: 0,
    hits: 0,
    earned: 0,
    picked: -1,
    wagerLeft: WAGER_S,
    introLeft: LOCKDOWN_INTRO_S,
    qLeft: LOCKDOWN_ANSWER_S,
    waitLeft: LOCKDOWN_WAIT_S,
    wagers: {},
    won: false,
  };
  state.phase = "lockdown";
  state.pose = "wait";
  paint();
  publish();
  state.players.filter((p) => !p.human && p.id !== hero.id).forEach((p) => {
    const amt = Math.min(WAGER_AMTS[WAGER_AMTS.length - 1], Math.max(100, p.score || 100));
    const side = Math.random() < 0.55 ? "win" : "lose";
    applyWager(p.id, side, amt, true);
  });
  maybeCloseWagers();
  stopTick();
  state.tick = setInterval(() => {
    if (!state.lockdown || state.lockdown.phase !== "wager") return;
    state.lockdown.wagerLeft -= 1;
    if (state.lockdown.wagerLeft <= 0) closeWagers();
    else {
      const clock = $("#clock");
      if (clock) clock.textContent = clockText();
    }
  }, 1000);
}

function applyWager(id, side, amount, locked = true) {
  const ld = state.lockdown;
  if (!ld || ld.phase !== "wager") return;
  if (id === ld.playerId) return;
  const p = playerById(id);
  const capped = Math.min(Number(amount) || 100, Math.max(100, p?.score || 100));
  const amt = WAGER_AMTS.includes(capped) ? capped : Math.min(WAGER_AMTS[WAGER_AMTS.length - 1], Math.max(WAGER_AMTS[0], capped));
  ld.wagers[id] = { side, amount: amt, locked: Boolean(locked) };
  if (id === state.youId) {
    state.wagerDraft = locked ? null : { side, amount: amt };
  }
  paint();
  publish();
  if (locked) maybeCloseWagers();
}

function setWagerDraft(side, amount) {
  const ld = state.lockdown;
  if (!ld || ld.phase !== "wager") return;
  if (state.youId === ld.playerId) return;
  const prev = state.wagerDraft || ld.wagers[state.youId] || { side: "win", amount: 100 };
  const next = {
    side: side || prev.side || "win",
    amount: amount != null ? Number(amount) : (prev.amount || 100),
    locked: false,
  };
  state.wagerDraft = next;
  ld.wagers[state.youId] = { ...next, locked: false };
  paint(true);
}

function lockInWager() {
  const ld = state.lockdown;
  if (!ld || ld.phase !== "wager") return;
  if (state.youId === ld.playerId) return;
  const draft = state.wagerDraft || ld.wagers[state.youId];
  if (!draft || !draft.side || !draft.amount) return;
  applyWager(state.youId, draft.side, draft.amount, true);
  state.wagerDraft = null;
  if (bc) bc.postMessage({ type: "wager", id: state.youId, side: draft.side, amount: draft.amount, locked: true });
  if (state.room) void rooms("POST", { action: "wager", code: state.room, id: state.youId, side: draft.side, amount: draft.amount, locked: true });
}

function maybeCloseWagers() {
  const ld = state.lockdown;
  if (!ld || ld.phase !== "wager") return;
  const need = state.players.filter((p) => p.id !== ld.playerId);
  if (need.length && need.every((p) => ld.wagers[p.id]?.locked)) closeWagers();
}

function closeWagers() {
  const ld = state.lockdown;
  if (!ld || ld.phase !== "wager") return;
  stopTick();
  // Auto-lock any unfinished human drafts as lose@$100 so play can start.
  state.players.filter((p) => p.id !== ld.playerId).forEach((p) => {
    if (!ld.wagers[p.id]?.locked) {
      const d = ld.wagers[p.id] || { side: "lose", amount: 100 };
      ld.wagers[p.id] = { side: d.side || "lose", amount: d.amount || 100, locked: true };
    }
  });
  ld.phase = "intro";
  ld.introLeft = LOCKDOWN_INTRO_S;
  ld.qi = 0;
  ld.hits = 0;
  ld.earned = 0;
  ld.picked = -1;
  state.picked = -1;
  state.wagerDraft = null;
  paint();
  publish();
  runLockdownIntro();
}

function runLockdownIntro() {
  stopTick();
  const ld = state.lockdown;
  if (!ld || ld.phase !== "intro") return;
  ld.introLeft = LOCKDOWN_INTRO_S;
  paint();
  publish();
  state.tick = setInterval(() => {
    if (!state.lockdown || state.lockdown.phase !== "intro") return;
    state.lockdown.introLeft -= 1;
    if (state.lockdown.introLeft <= 0) {
      stopTick();
      beginLockdownQuestion();
    } else {
      const clock = $("#clock");
      if (clock) clock.textContent = clockText();
      paint();
    }
  }, 1000);
}

function beginLockdownQuestion() {
  const ld = state.lockdown;
  if (!ld) return;
  stopTick();
  ld.phase = "play";
  ld.picked = -1;
  state.picked = -1;
  ld.qLeft = LOCKDOWN_ANSWER_S;
  ld.waitLeft = LOCKDOWN_WAIT_S;
  paint();
  publish();
  runLockdownClock();
}

function runLockdownClock() {
  stopTick();
  const ld = state.lockdown;
  if (!ld || ld.phase !== "play") return;
  ld.qLeft = LOCKDOWN_ANSWER_S;
  ld.waitLeft = LOCKDOWN_WAIT_S;
  const hero = playerById(ld.playerId);
  if (hero && !hero.human) {
    const delay = 4000 + Math.random() * 8000;
    state.tick = setTimeout(() => {
      const q = ld.qs[ld.qi];
      if (!q || state.lockdown?.phase !== "play") return;
      const i = Math.random() < aiCorrectChance(hero, q.tier) * 0.75
        ? q.correctIndex
        : (q.correctIndex + 1 + Math.floor(Math.random() * 3)) % 4;
      lockdownPick(i, true);
    }, delay);
    // Still tick wait/points for UI
    const waitTick = setInterval(() => {
      if (!state.lockdown || state.lockdown.phase !== "play") {
        clearInterval(waitTick);
        return;
      }
      state.lockdown.qLeft = Math.max(0, state.lockdown.qLeft - 1);
      state.lockdown.waitLeft = Math.max(0, (state.lockdown.waitLeft || 0) - 1);
      const clock = $("#clock");
      if (clock) clock.textContent = clockText();
    }, 1000);
    state._ldWait = waitTick;
    return;
  }
  state.tick = setInterval(() => {
    if (!state.lockdown || state.lockdown.phase !== "play") return;
    state.lockdown.qLeft -= 1;
    state.lockdown.waitLeft = Math.max(0, (state.lockdown.waitLeft || 0) - 1);
    if (state.lockdown.qLeft <= 0) {
      stopTick();
      lockdownPick(-1, true);
    } else {
      const clock = $("#clock");
      if (clock) clock.textContent = clockText();
      // Force paint every ~5s so decaying points show on pads
      if (state.lockdown.qLeft % 5 === 0) paint();
    }
  }, 1000);
}

function lockdownPick(i, forced = false) {
  const ld = state.lockdown;
  if (!ld || ld.phase !== "play") return;
  const isHero = state.youId === ld.playerId;
  if (!forced && !isHero && role !== "pad") return;
  if (!forced && role === "pad" && !isHero) return;
  const q = ld.qs[ld.qi];
  if (!q) return;
  stopTick();
  if (state._ldWait) {
    clearInterval(state._ldWait);
    state._ldWait = null;
  }
  const pts = lockdownPointsNow(ld);
  const ok = i === q.correctIndex;
  ld.picked = i;
  state.picked = i;
  if (ok) {
    ld.hits += 1;
    ld.earned = (ld.earned || 0) + pts;
    addScore(ld.playerId, pts);
  }
  playSound(ok ? "correct" : "miss");
  state.pose = ok ? "win" : "loss";
  ld.phase = "flash";
  paint();
  publish();
  setTimeout(() => {
    ld.qi += 1;
    ld.picked = -1;
    state.picked = -1;
    if (ld.qi >= LOCKDOWN_N) finishLockdown();
    else {
      ld.phase = "intro";
      ld.introLeft = LOCKDOWN_INTRO_S;
      paint();
      publish();
      runLockdownIntro();
    }
  }, 1100);
}

function finishLockdown() {
  const ld = state.lockdown;
  if (!ld) return;
  stopTick();
  if (state._ldWait) {
    clearInterval(state._ldWait);
    state._ldWait = null;
  }
  ld.won = ld.hits >= LOCKDOWN_WIN_AT;
  ld.phase = "result";
  // Points already banked per-hit via decaying value; wager settles now.
  Object.entries(ld.wagers).forEach(([id, w]) => {
    if (!w?.locked) return;
    const hit = (w.side === "win" && ld.won) || (w.side === "lose" && !ld.won);
    addScore(id, hit ? w.amount : -w.amount);
  });
  state.pose = ld.won ? "win" : "loss";
  paint();
  publish();
  setTimeout(() => continueRound(), 2000);
}

function listenVoice() {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) {
    const clock = $("#clock");
    if (clock) clock.textContent = tt("voiceOff");
    return;
  }
  const r = new Rec();
  r.lang = speechLang(state.locale);
  r.interimResults = false;
  r.maxAlternatives = 3;
  state.listening = true;
  const mic = $("#mic");
  if (mic) mic.textContent = tt("listening");
  r.onresult = (ev) => {
    const said = String(ev.results[0][0].transcript || "").toLowerCase();
    const q = currentQ();
    if (!q) return;
    const idx = q.choices.findIndex((c) => {
      const t = String(c).toLowerCase();
      return said.includes(t.slice(0, 12)) || t.includes(said);
    });
    if (idx >= 0) pick(idx);
    else {
      const letter = said.match(/\b([abcd])\b/);
      if (letter) pick("abcd".indexOf(letter[1]));
    }
  };
  r.onend = () => {
    state.listening = false;
    const m = $("#mic");
    if (m) m.textContent = tt("speak");
  };
  r.start();
}

function applyHostSize() {
  document.documentElement.style.setProperty("--host-h", state.hostH + "vh");
}

function scoreboard() {
  const cells = state.players.map((p) => {
    const thumb = p.thumb
      ? `<img class="av" src="${p.thumb}" alt=""/>`
      : `<span class="av empty" aria-hidden="true"></span>`;
    return `<span class="score-cell ${p.you ? "you" : ""}">${thumb}<span class="score-name">${escapeHtml(p.name)}</span><b>$${p.score}</b></span>`;
  }).join("");
  return `<div class="scores-row">${cells}</div>`;
}

function rivalsHTML() {
  const q = currentQ();
  const stake = stakeOf(q);
  const armed = state.maps[state.youId];
  const show = state.phase === "read" || (state.phase === "buzz" && !state.buzzed);
  if (!show || state.lockdown) return "";
  return `<div class="rivals">
    <span class="rivals-lab">${tt("mapLab", stake)}</span>
    ${others().map((p) =>
      `<button type="button" class="rival ${armed === p.id ? "on" : ""}" data-map="${p.id}">${escapeHtml(p.name)} <b>$${p.score}</b></button>`
    ).join("")}
  </div>`;
}

function wagerHTML() {
  const ld = state.lockdown;
  if (!ld) return "";
  if (ld.phase === "intro") {
    return `<div class="wager intro">
      <p class="wager-copy"><b>Lockdown</b> — ${escapeHtml(ld.name)} plays ${LOCKDOWN_N}. Need ${LOCKDOWN_WIN_AT}/${LOCKDOWN_N}.</p>
      <p class="wager-copy">Each question: up to <b>3 minutes</b>. Points start at <b>$${LOCKDOWN_PTS}</b> and decay to <b>$0</b>.</p>
      <p class="wager-copy">Opponents already locked WIN/LOSE. Starting in <b>${ld.introLeft}s</b>.</p>
    </div>`;
  }
  if (ld.phase !== "wager") return "";
  const mine = ld.wagers[state.youId] || state.wagerDraft;
  const isHero = state.youId === ld.playerId;
  if (isHero) {
    return `<div class="wager"><p class="wager-copy">${tt("lockdownWagerHero", ld.wagerLeft)}</p></div>`;
  }
  const locked = Boolean(mine?.locked);
  const side = mine?.side || state.wagerDraft?.side || "";
  const amount = mine?.amount || state.wagerDraft?.amount || 0;
  return `<div class="wager">
    <p class="wager-copy">${tt("lockdownWagerOpp", escapeHtml(ld.name))} · ${ld.wagerLeft}s</p>
    <div class="wager-row">
      <button type="button" class="side ${side === "win" ? "on" : ""}" data-side="win" ${locked ? "disabled" : ""}>${tt("win")}</button>
      <button type="button" class="side lose ${side === "lose" ? "on" : ""}" data-side="lose" ${locked ? "disabled" : ""}>${tt("lose")}</button>
    </div>
    <div class="wager-row">
      ${WAGER_AMTS.map((n) =>
        `<button type="button" class="amt ${amount === n ? "on" : ""}" data-amt="${n}" ${locked ? "disabled" : ""}>$${n}</button>`
      ).join("")}
    </div>
    ${locked
      ? `<p class="meta">${tt("lockedSide", mine.side, mine.amount)}</p>`
      : `<button type="button" class="primary" id="lockWager" ${side && amount ? "" : "disabled"}>${tt("lockIn")}</button>
         <p class="meta">${tt("pickThenLock")}</p>`}
  </div>`;
}

function mapStealHTML() {
  const q = currentQ();
  if (!q || state.lockdown) return "";
  if (state.phase !== "answer") return "";
  const answerer = state.buzzId || state.youId;
  // PWHB pad (or local) — steal prompt below answers
  if (role === "pad" && answerer !== state.youId) return "";
  if (role !== "pad" && state.onScreen) return ""; // TV display skips steal chrome
  const stake = stakeOf(q);
  const doubled = stake * 2;
  const armed = state.maps[answerer] || state.maps[state.youId];
  const rivals = state.players.filter((p) => p.id !== answerer);
  if (!rivals.length) return "";
  return `<div class="map-steal">
    <span class="rivals-lab">${tt("mapStealLab", doubled)}</span>
    ${rivals.map((p) =>
      `<button type="button" class="rival ${armed === p.id ? "on" : ""}" data-map="${p.id}">${escapeHtml(p.name)} <b>−$${stake}</b></button>`
    ).join("")}
  </div>`;
}

function rulesHTML() {
  if (!state.rules) return "";
  return `<div class="sheet" id="sheet">
    <h2>${tt("rulesTitle")}</h2>
    <ul>
      <li><b>${tt("rule37")}</b></li>
      <li><b>${tt("ruleRead")}</b></li>
      <li><b>${tt("ruleMap")}</b></li>
      <li><b>${tt("ruleLock")}</b></li>
      <li><b>${tt("ruleDojo")}</b></li>
      <li><b>${tt("ruleRoom")}</b></li>
    </ul>
    <a class="word dir-full" href="./directions.html">${tt("fullDirections")}</a>
    <button class="primary" id="rulesX" type="button">${tt("close")}</button>
  </div>`;
}

function footHTML() {
  const flow = isTvDisplay()
    ? `<span class="copy">© GMG Brand Label</span>`
    : `<a class="flow" href="${FLOW_URL}" target="_blank" rel="noopener noreferrer">Flow</a>
    <span class="copy">© GMG Brand Label</span>`;
  return `<div class="buzzbar foot">${flow}</div>`;
}

function joinQrChip(size = 120) {
  if (!state.room || !isTvDisplay()) return "";
  const open = state.qrOpen;
  const url = encodeURIComponent(shareUrl());
  return `<div class="qr-chip ${open ? "open" : "collapsed"}" id="qrChip">
    <button type="button" class="qr-toggle" id="qrToggle" aria-expanded="${open ? "true" : "false"}" title="${escapeHtml(state.room)}">
      ${open ? tt("hideJoin") : tt("joinChip", escapeHtml(state.room))}
    </button>
    ${open ? `<img class="qr corner" alt="Join" src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${url}"/>
    <p class="qr-code">Room <b>${escapeHtml(state.room)}</b></p>` : ""}
  </div>`;
}

function dirAcc(id, title, extra, body) {
  const open = state.dirOpen === id;
  return `<section class="acc ${open ? "open" : ""}">
    <button type="button" class="acc-h" data-dir="${id}"><span>${title}</span>${extra || ""}</button>
    ${open ? `<div class="acc-body dir-body">${body}</div>` : ""}
  </section>`;
}

function directionsHTML() {
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>${tt("directionsTitle")}</small></div>
      <div class="grow"></div>
      ${languageSwitcherHtml(state.locale, { idPrefix: "dirlang" })}
      <a class="word" href="./index.html">${tt("lobby")}</a>
    </div>
    <div class="lobby">
      <div class="lobby-copy">
        <h1 class="sr-only">${tt("directionsTitle")}</h1>
        <img class="brand" src="${TITLE_3D}" alt="Fast Answer!"/>
        <div class="accord">
          ${dirAcc("lang", tt("dirLangTitle"), "<small>EN · FR · DE</small>", `
            <p class="dir-copy">${tt("dirLangBody")}</p>
          `)}
          ${dirAcc("tv", "TV / AirPlay / Cast", "<small>Web page</small>", `
            <p class="dir-copy">Fast Answer is a <b>web page</b>. The “TV” is whichever screen opens the URL — smart TV browser, Apple TV (Safari or AirPlay mirror), Chromecast “Cast tab”, HDMI from a laptop, Fire TV Silk, a projector, etc. There is no special Fast Answer AirPlay API.</p>
            <p class="dir-copy"><b>Recommended (Silk / Fire TV).</b> Open <code>https://fast-answer-seven.vercel.app</code> (or <code>?tv=1</code>) on the set. The TV <b>creates and owns</b> the room automatically. A small <b>Join</b> chip sits in the corner — expand it for the QR and code. Phones scan and join that room; game state follows the TV.</p>
            <ol class="dir-ol">
              <li><b>Best — TV browser.</b> Open the URL on the set (Samsung, LG, Fire TV Silk, Apple TV Safari if available). Silk / Fire TV and <code>?tv=1</code> turn <b>On Screen</b> on and open a room. That tab owns Jeremy, questions, scores — no buzzer. Flow is hidden on the TV.</li>
              <li><b>Corner QR.</b> On the TV, tap the discreet Join chip to expand the QR. Phones scan or open <code>/?role=pad&amp;room=CODE</code>. Pads are buzzers only.</li>
              <li><b>Ready → start.</b> Once everyone has joined, each phone presses <b>Buzz</b> to ready up. When every pad has buzzed in, the show starts on the TV.</li>
              <li><b>Join only if room exists.</b> <b>Join TV / Join as buzzer</b> is rejected when the room code is not open yet — open the set (or Cast TV Silk link) first, then join.</li>
              <li><b>AirPlay / Cast / HDMI.</b> Mirroring or casting a tab still works, but the set’s own browser is best so the TV tab owns the room. Phones never receive the TV picture.</li>
            </ol>
          `)}
          ${dirAcc("screen", tt("dirScreenTitle"), "<small>TV + pads</small>", `
            <p class="dir-copy"><b>${tt("dirOff")}</b></p>
            <p class="dir-copy"><b>${tt("dirOn")}</b></p>
            <p class="dir-copy">${tt("dirOnFeatures")}</p>
            <p class="dir-copy">${tt("dirDojoExtra")}</p>
          `)}
          ${dirAcc("room", "Multiplayer", "<small>2–12</small>", `
            <p class="dir-copy">Room holds <b>2 to 12</b> seats. The TV creates the room. Empty seats fill with celebrity first names — Oprah, Elton, Serena, Usain, Adele, Idris, Keanu, Zendaya, Rihanna, Denzel, Meryl — each with its own skill and buzz timing.</p>
            <p class="dir-copy"><b>TV owns the room.</b> Open the site on the set (or <code>?tv=1</code>). Expand the corner Join chip for QR/code. Phones open <code>/?role=pad&amp;room=CODE</code> and follow the TV. Pads <b>replace bots</b> as they arrive.</p>
            <p class="dir-copy"><b>All-buzz start.</b> When seats are set, each pad presses Buzz to ready. The show starts when every joined pad has buzzed in. Same-origin tabs also sync over BroadcastChannel; <code>api/rooms.js</code> syncs TV + phones.</p>
            <p class="dir-copy"><b>Lobby modes (phone).</b> <b>Host</b> = local / Off Screen or optional On Screen on this device. <b>Cast TV</b> = make a Silk <code>?tv=1&amp;room=</code> link for the set. <b>Join TV</b> = pad into an existing TV room only.</p>
          `)}
          ${dirAcc("points", "Points & scoring", "<small>37Q deal</small>", `
            <p class="dir-copy">One show deals <b>37 questions</b> from the bank: <b>20 / 10 / 5 / 2</b> Easy · Hard · Difficult · Extreme. Ten seconds to read, then buzz. First buzz answers.</p>
            <div class="points-grid">
              <span>20 Easy</span><b>$100</b>
              <span>10 Hard</span><b>$500</b>
              <span>5 Difficult</span><b>$1,000</b>
              <span>2 Extreme</span><b>$5,000</b>
            </div>
            <p class="dir-copy">A miss on a regular question is <b>$0</b> — you do not lose points. <b>MAP</b> during the read can put stakes at risk. <b>Lockdown</b> hits twice per show (see below).</p>
          `)}
          ${dirAcc("map", "MAP (Make-a-Point)", "<small>Read + answer</small>", `
            <p class="dir-copy"><b>Make-a-Point</b> lets the person who hits the buzzer (PWHB) risk stakes against a rival.</p>
            <p class="dir-copy">During the <b>10-second read</b>, tap a rival to arm MAP. Stake = this question’s point value. After you buzz, your phone also shows a <b>steal prompt below the answer options</b> — opponents’ names as choices, with the displayed amount = question points <b>doubled</b> for you if you hit it (they lose the stake). Miss, and you lose the stake. If someone else buzzes first, your MAP is off.</p>
          `)}
          ${dirAcc("lock", "Lockdown", "<small>Twice a show</small>", `
            <p class="dir-copy">Twice per show, after a correct buzz. That player faces <b>5 hard questions</b>.</p>
            <p class="dir-copy"><b>Wagers:</b> opponents pick WIN or LOSE and $100 / $500 / $1,000, then tap <b>Lock in</b> (60s, or when everyone locks).</p>
            <p class="dir-copy"><b>Rules countdown:</b> about <b>7 seconds</b> before each lockdown question — explains the rules and lets the table settle.</p>
            <p class="dir-copy"><b>Answer window:</b> up to <b>3 minutes</b> per question. Points start at <b>$5,000</b> and <b>decay linearly to $0</b> as time runs out. Need <b>4/5</b> for WIN wagers; otherwise LOSE pays. Waiting players see a <b>60-second</b> wait countdown (glimpse only — they do not see the hero’s response).</p>
          `)}
          ${dirAcc("dojo", "Dojo", "<small>10 placements</small>", `
            <p class="dir-copy">Ten placement questions in the lobby <b>on the phone</b> (not on the TV). Each prompt shows for <b>10 seconds</b>, then the answers appear — tap one. No player name or points on the Dojo card. Places you Bronze, Silver, or Gold for about three months. Play stays gated until placement is current. Karate belts rise with career points, separate from ability.</p>
          `)}
        </div>
        <div class="row">
          <a class="primary" href="./index.html">${tt("lobbyPlay")}</a>
        </div>
      </div>
      <div class="host" style="--host-h:${state.hostH}vh"><img src="${POSE.idle}" alt="Jeremy"/></div>
    </div>
    <div></div>
    ${footHTML()}
  `;
}

function bindDirections() {
  document.querySelectorAll("[data-locale]").forEach((b) => {
    b.onclick = () => { void setLocale(b.dataset.locale); };
  });
  document.querySelectorAll("[data-dir]").forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.dir;
      state.dirOpen = state.dirOpen === id ? "" : id;
      paint(true);
    };
  });
}

let dojoTick = null;
function clearDojoTick() {
  if (dojoTick) clearInterval(dojoTick);
  dojoTick = null;
}

function ensureDojo() {
  if (state.dojo && state.dojo.q) return;
  const used = new Set(state.profile?.placementQuestionIds || []);
  const q = pickPlacementQuestion("hard", used);
  state.dojo = { q, answers: [], used, picked: -1, tier: "hard", showAnswers: false, readLeft: READ_S };
  armDojoRead();
}

function finishDojo() {
  clearDojoTick();
  const d = state.dojo;
  if (!d) return;
  const correct = d.answers.filter((a) => a.correct).length;
  const abilityTier = abilityFromDojo(d.answers);
  const completedAt = new Date().toISOString();
  const ids = d.answers.map((a) => a.question.id);
  saveProfile({
    abilityTier,
    placementScore: correct,
    placementCompletedAt: completedAt,
    nextPlacementDueAt: addMonthsIso(completedAt, 3),
    placementQuestionIds: [...(state.profile?.placementQuestionIds || []), ...ids].slice(-200),
  });
  state.dojo = { ...d, done: true, q: null, picked: -1, showAnswers: false };
  state.lobbyOpen = "dojo";
  state.dojoMode = "home";
  state.statusMsg = tt("placementDone", (ABILITY_META[abilityTier] || ABILITY_META.bronze).label);
  paint(true);
}

function armDojoRead() {
  clearDojoTick();
  const d = state.dojo;
  if (!d || !d.q || d.done) return;
  d.showAnswers = false;
  d.readLeft = READ_S;
  d.picked = -1;
  paint(true);
  dojoTick = setInterval(() => {
    const cur = state.dojo;
    if (!cur || cur.done || !cur.q) {
      clearDojoTick();
      return;
    }
    cur.readLeft = Math.max(0, (cur.readLeft || 0) - 1);
    if (cur.readLeft <= 0) {
      clearDojoTick();
      cur.showAnswers = true;
      paint(true);
    } else {
      const clock = $("#dojoClock");
      if (clock) clock.textContent = tt("dojoRead", cur.readLeft);
    }
  }, 1000);
}

function advanceDojo(ok) {
  const d = state.dojo;
  if (!d) return;
  if (d.answers.length >= PLACE_N) {
    finishDojo();
    return;
  }
  d.tier = nextPlacementTier(d.tier, ok);
  d.q = pickPlacementQuestion(d.tier, d.used);
  d.picked = -1;
  armDojoRead();
}

function dojoPick(i) {
  const d = state.dojo;
  if (!d || !d.q || d.done || !d.showAnswers || d.picked >= 0) return;
  const ok = i === d.q.correctIndex;
  d.picked = i;
  d.answers.push({ question: d.q, correct: ok });
  d.used.add(d.q.id);
  playSound(ok ? "correct" : "miss");
  paint(true);
  setTimeout(() => advanceDojo(ok), 520);
}

function startDojo() {
  clearDojoTick();
  const used = new Set(state.profile?.placementQuestionIds || []);
  const q = pickPlacementQuestion("hard", used);
  state.dojo = { q, answers: [], used, picked: -1, tier: "hard", done: false, showAnswers: false, readLeft: READ_S };
  state.lobbyOpen = "dojo";
  armDojoRead();
}

function acc(id, title, extra, body) {
  const open = state.lobbyOpen === id;
  return `<section class="acc ${open ? "open" : ""}">
    <button type="button" class="acc-h" data-acc="${id}"><span>${title}</span>${extra || ""}</button>
    ${open ? `<div class="acc-body">${body}</div>` : ""}
  </section>`;
}

function beltStripHTML(activeBelt) {
  const cur = activeBelt || "white";
  return `<div class="belt-strip" role="img" aria-label="${escapeHtml(tt("beltAria", (BELT_META[cur] || BELT_META.white).label))}">
    ${BELT_ORDER.map((id) => {
      const m = BELT_META[id];
      const on = id === cur ? " on" : "";
      return `<span class="belt-seg${on}" style="--belt:${m.color}" title="${escapeHtml(m.label)}"></span>`;
    }).join("")}
  </div>
  <p class="belt-lab">${escapeHtml(tt("beltName", (BELT_META[cur] || BELT_META.white).label))}</p>`;
}

function medalHTML(tier) {
  const order = ["bronze", "silver", "gold"];
  return `<div class="medal-row" role="list">
    ${order.map((id) => {
      const m = ABILITY_META[id];
      const on = tier === id ? " on" : "";
      const label = id === "bronze" ? tt("medalBronze") : id === "silver" ? tt("medalSilver") : tt("medalGold");
      return `<span class="medal${on}" role="listitem" style="--medal:${m.color}" title="${escapeHtml(label)}"><i></i><b>${escapeHtml(label)}</b></span>`;
    }).join("")}
  </div>`;
}

function dojoChrome(inner) {
  return `<div class="dojo-stage">${inner}</div>`;
}

function profileBody() {
  // Profile lives inside Dojo; kept for any residual callers.
  return dojoBody();
}

function dojoBody() {
  const p = state.profile || {};
  const placed = isPlaced();
  const d = state.dojo;
  const mode = state.dojoMode || "home";

  if (d && d.q && !d.done) {
    const n = d.answers.length + 1;
    const reveal = d.picked >= 0;
    const showAns = Boolean(d.showAnswers);
    return dojoChrome(`
      <p class="meta" id="dojoClock">${showAns
        ? (reveal ? tt("dojoN", n, PLACE_N) : `${tt("dojoN", n, PLACE_N)} · ${tt("dojoTap")}`)
        : tt("dojoRead", d.readLeft ?? READ_S)}</p>
      <p class="dojo-q">${escapeHtml(d.q.prompt)}</p>
      ${showAns ? `<div class="dojo-ans">
        ${d.q.choices.map((c, i) => {
          let cls = "ans";
          if (reveal) {
            if (i === d.q.correctIndex) cls += " ok";
            else if (i === d.picked) cls += " bad";
          }
          return `<button class="${cls}" type="button" data-dojo="${i}" ${reveal ? "disabled" : ""}><small>${LETTERS[i]}</small>${escapeHtml(c)}</button>`;
        }).join("")}
      </div>` : `<p class="dir-copy">${tt("dojoHold")}</p>`}
    `);
  }

  // Create profile (no stored profile yet)
  if (!hasPhoneProfile() || mode === "create") {
    return dojoChrome(`
      <p class="dir-copy">${tt("createProfileIntro")}</p>
      <label class="field" for="nm">${tt("name")}</label>
      <input id="nm" type="text" value="${escapeHtml(p.displayName && hasPhoneProfile() ? p.displayName : "")}" maxlength="18" autocomplete="nickname" placeholder="${tt("name")}"/>
      <label class="field" for="pwNew">${tt("password")}</label>
      <input id="pwNew" type="password" maxlength="64" autocomplete="new-password" placeholder="${tt("passwordHint")}"/>
      <label class="field" for="pwConfirm">${tt("confirmPassword")}</label>
      <input id="pwConfirm" type="password" maxlength="64" autocomplete="new-password"/>
      <label class="field" for="thDojo">${tt("photoTv")}</label>
      <div class="thumb-row">
        ${p.thumb ? `<img class="thumb" src="${p.thumb}" alt=""/>` : `<span class="thumb empty"></span>`}
        <input id="thDojo" type="file" accept="image/*"/>
      </div>
      <button class="primary" id="createProfile" type="button">${tt("createAndPlace")}</button>
      ${hasPhoneProfile() ? `<button class="ghost" id="dojoCancelMode" type="button">${tt("cancel")}</button>` : ""}
    `);
  }

  // Legacy: profile exists but no password yet
  if (needsPasswordSetup() || mode === "setpw") {
    return dojoChrome(`
      <p class="dir-copy">${tt("setPasswordIntro")}</p>
      <p class="meta">${escapeHtml(p.displayName || "")}</p>
      ${beltStripHTML(p.belt)}
      ${p.abilityTier ? medalHTML(p.abilityTier) : ""}
      <label class="field" for="pwNew">${tt("password")}</label>
      <input id="pwNew" type="password" maxlength="64" autocomplete="new-password" placeholder="${tt("passwordHint")}"/>
      <label class="field" for="pwConfirm">${tt("confirmPassword")}</label>
      <input id="pwConfirm" type="password" maxlength="64" autocomplete="new-password"/>
      <button class="primary" id="setProfilePw" type="button">${tt("savePassword")}</button>
    `);
  }

  // Unlock with password
  if (!state.profileUnlocked || mode === "unlock") {
    return dojoChrome(`
      <p class="dir-copy">${tt("unlockIntro")}</p>
      <p class="meta">${escapeHtml(p.displayName || "")}</p>
      ${beltStripHTML(p.belt)}
      ${p.abilityTier ? medalHTML(p.abilityTier) : `<p class="meta">${tt("medalPending")}</p>`}
      <label class="field" for="pwUnlock">${tt("password")}</label>
      <input id="pwUnlock" type="password" maxlength="64" autocomplete="current-password"/>
      <button class="primary" id="unlockProfile" type="button">${tt("unlockProfile")}</button>
      <button class="ghost" id="dojoCreateAlt" type="button">${tt("createProfile")}</button>
    `);
  }

  // Unlocked home / edit
  const ab = p.abilityTier ? ABILITY_META[p.abilityTier] : null;
  return dojoChrome(`
    <p class="dir-copy">${tt("dojoUnlockedIntro")}</p>
    ${beltStripHTML(p.belt)}
    ${medalHTML(p.abilityTier)}
    <p class="meta">${escapeHtml(tt("beltCareer", (BELT_META[p.belt || "white"] || BELT_META.white).label, ab ? ab.label : "", p.stats?.totalPoints || 0))}</p>
    <label class="field" for="nm">${tt("name")}</label>
    <input id="nm" type="text" value="${escapeHtml(p.displayName || "")}" maxlength="18" autocomplete="nickname"/>
    <label class="field" for="em">${tt("email")}</label>
    <input id="em" type="email" value="${escapeHtml(p.email || "")}" maxlength="120" autocomplete="email" placeholder="${tt("optional")}"/>
    <label class="field" for="thDojo">${tt("photoTv")}</label>
    <div class="thumb-row">
      ${p.thumb ? `<img class="thumb" src="${p.thumb}" alt=""/>` : `<span class="thumb empty"></span>`}
      <input id="thDojo" type="file" accept="image/*"/>
    </div>
    <label class="field" for="pwNew">${tt("changePassword")}</label>
    <input id="pwNew" type="password" maxlength="64" autocomplete="new-password" placeholder="${tt("optional")}"/>
    <label class="field" for="pwConfirm">${tt("confirmPassword")}</label>
    <input id="pwConfirm" type="password" maxlength="64" autocomplete="new-password" placeholder="${tt("optional")}"/>
    <button class="ghost" id="saveProfileEdit" type="button">${tt("saveProfile")}</button>
    ${placed
      ? `<p class="meta">${escapeHtml(tt("abilityRetake", (ab && ab.label) || tt("placed"), formatDue(p.nextPlacementDueAt)))}</p>
         <button class="ghost" id="retake" type="button">${tt("retakeDojo")}</button>`
      : `<p class="meta">${tt("dojoIntro")}</p>
         <button class="primary" id="dojoGo" type="button">${tt("startDojo")}</button>`}
    <button class="ghost" id="lockProfile" type="button">${tt("lockProfile")}</button>
  `);
}


function dojoGateChipsHTML() {
  if (isTvDisplay()) return "";
  const unlocked = Boolean(state.profileUnlocked && hasPhoneProfile());
  const placed = isPlaced();
  const lockChip = !hasPhoneProfile()
    ? `<span class="chip hot">${tt("noProfile")}</span>`
    : needsPasswordSetup()
      ? `<span class="chip hot">${tt("passwordFirst")}</span>`
      : unlocked
        ? `<span class="chip ok">${tt("unlocked")}</span>`
        : `<span class="chip hot">${tt("locked")}</span>`;
  const placeChip = placed
    ? `<span class="chip ok">${tt("placed")}</span>`
    : `<span class="chip hot">${tt("placementNeeded")}</span>`;
  return `<div class="dojo-gate-chips" role="status">${lockChip}${placeChip}</div>`;
}

/** Prominent Dojo / profile entry on Join TV, Host, and Cast panels (phone only). */
function roomDojoEntryHTML() {
  if (isTvDisplay()) return "";
  const gate = lobbyGateReason();
  const unlocked = Boolean(state.profileUnlocked && hasPhoneProfile());
  const placed = isPlaced();
  let actions = "";
  if (!hasPhoneProfile()) {
    actions = `
      <div class="row dojo-gate-actions">
        <button class="primary" type="button" id="roomCreateProfile">${tt("createProfile")}</button>
        <button class="ghost" type="button" id="goToDojo">${tt("goToDojo")}</button>
      </div>`;
  } else if (needsPasswordSetup()) {
    actions = `
      <div class="row dojo-gate-actions">
        <button class="primary" type="button" id="goToDojo">${tt("passwordFirst")}</button>
      </div>`;
  } else if (!unlocked) {
    actions = `
      <div class="dojo-unlock-mini">
        <label class="field" for="pwUnlockRoom">${tt("password")}</label>
        <div class="copy-row">
          <input id="pwUnlockRoom" type="password" maxlength="64" autocomplete="current-password" placeholder="${tt("password")}"/>
          <button class="primary" type="button" id="roomUnlockProfile">${tt("unlockProfile")}</button>
        </div>
      </div>
      <div class="row dojo-gate-actions">
        <button class="ghost" type="button" id="goToDojo">${tt("goToDojo")}</button>
        <button class="ghost" type="button" id="roomCreateProfile">${tt("createProfile")}</button>
      </div>`;
  } else if (!placed) {
    actions = `
      <div class="row dojo-gate-actions">
        <button class="primary" type="button" id="goToDojo">${tt("dojoFirst")}</button>
      </div>
      <p class="meta">${tt("gateDojo")}</p>`;
  } else {
    actions = `
      <div class="row dojo-gate-actions">
        <button class="ghost" type="button" id="goToDojo">${tt("goToDojo")}</button>
      </div>
      <p class="meta">${tt("joinReadyMeta")}</p>`;
  }
  return `
    <div class="dojo-gate-panel">
      ${dojoGateChipsHTML()}
      ${gate ? `<p class="dir-copy"><b>${escapeHtml(gate)}</b></p>` : ""}
      ${actions}
    </div>`;
}

function lobbySetupBannerHTML() {
  if (isTvDisplay()) return "";
  const gate = lobbyGateReason();
  if (!gate) return "";
  const cta = !hasPhoneProfile() ? tt("createProfile")
    : needsPasswordSetup() ? tt("passwordFirst")
    : !state.profileUnlocked ? tt("unlockFirst")
    : tt("dojoFirst");
  return `
    <div class="dojo-setup-banner" role="status">
      <p>${tt("setupDojoBanner")}</p>
      <button type="button" class="primary" id="bannerGoDojo">${cta}</button>
    </div>`;
}

function roomModeButtons() {
  if (isTvDisplay()) return "";
  const modes = [
    ["host", tt("host")],
    ["join", tt("joinTv")],
    ["cast", tt("castTv")],
  ];
  return `<div class="mp-modes" role="tablist">
    ${modes.map(([id, label]) =>
      `<button type="button" class="mp-mode ${state.mpMode === id ? "on" : ""}" data-mp="${id}">${label}</button>`
    ).join("")}
  </div>`;
}

function roomBody() {
  const pad = isPad();
  const seats = seatedPreview();
  const humans = seats.filter((s) => s.human).length;
  const bots = seats.length - humans;
  const silk = state.room ? tvSilkUrl(state.room) : "";
  const mode = pad ? "join" : (state.mpMode || "host");
  const roomsList = (state.activeRooms || [])
    .filter((r) => r.phase !== "end")
    .slice(0, 12);

  if (pad || mode === "join") {
    return `
      ${roomModeButtons()}
      <p class="dir-copy"><b>${tt("joinCopy")}</b></p>
      <label class="field" for="nm">${tt("yourName")}</label>
      <input id="nm" type="text" value="${escapeHtml(state.name)}" maxlength="18" autocomplete="nickname"/>
      <label class="field" for="jc">${tt("tvRoomCode")}</label>
      <input id="jc" type="text" value="${escapeHtml(state.room || state.joinInput)}" maxlength="8" placeholder="XXXX" autocomplete="off" autocapitalize="characters"/>
      <div class="rooms-list">
        <p class="rivals-lab">${tt("activeRooms")}</p>
        ${roomsList.length
          ? roomsList.map((r) =>
              `<button type="button" class="room-pick" data-join-room="${escapeHtml(r.code)}"><b>${escapeHtml(r.code)}</b> · ${escapeHtml(r.host || "TV")} · ${r.guests || 0} pads · ${escapeHtml(r.phase || "lobby")}</button>`
            ).join("")
          : `<p class="meta">${tt("noActiveRooms")}</p>`}
        <button type="button" class="ghost" id="refreshRooms">${tt("refreshRooms")}</button>
      </div>
      ${roomDojoEntryHTML()}
    `;
  }

  if (mode === "cast") {
    return `
      ${roomModeButtons()}
      <p class="dir-copy"><b>${tt("castCopy")}</b></p>
      <label class="field">${tt("players")} <b>${state.playerCount}</b></label>
      <input id="pc" type="range" min="2" max="12" value="${state.playerCount}"/>
      <label class="toggle">
        <input id="botFill" type="checkbox" ${state.botFill ? "checked" : ""}/>
        <span>${tt("fillBots")}</span>
      </label>
      <div class="seats">
        ${seats.map((s) => `<span class="seat ${s.you ? "you" : s.human ? "human" : "bot"}" title="${escapeHtml(s.blurb || s.name)}">${escapeHtml(s.name)}</span>`).join("")}
      </div>
      <p class="room-code">${tt("roomLabel", `<b id="codeCopy">${escapeHtml(state.room || "····")}</b>`)}</p>
      ${state.room ? `
        <label class="field" for="silkUrl">${tt("silkLink")}</label>
        <div class="copy-row">
          <input id="silkUrl" type="text" readonly value="${escapeHtml(silk)}"/>
          <button class="ghost" id="copySilk" type="button">${tt("copy")}</button>
        </div>
        <img class="qr" alt="Open on TV" src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(silk)}"/>
        <p class="meta">${escapeHtml(tt("padJoinMeta", state.room, humans, bots))}</p>
      ` : `<p class="meta">${tt("makeTvLinkMeta")}</p>`}
      ${roomDojoEntryHTML()}
    `;
  }

  return `
    ${roomModeButtons()}
    <label class="field">${tt("players")} <b>${state.playerCount}</b></label>
    <input id="pc" type="range" min="2" max="12" value="${state.playerCount}"/>
    <label class="toggle">
      <input id="botFill" type="checkbox" ${state.botFill ? "checked" : ""}/>
      <span>${tt("fillBots")}</span>
    </label>
    <div class="seats">
      ${seats.map((s) => `<span class="seat ${s.you ? "you" : s.human ? "human" : "bot"}" title="${escapeHtml(s.blurb || s.name)}">${escapeHtml(s.name)}</span>`).join("")}
    </div>
    ${isTvDisplay() ? "" : `
    <div class="screen-modes" role="radiogroup" aria-label="Screen mode">
      <label class="toggle">
        <input id="osOff" type="radio" name="screenMode" ${!state.onScreen ? "checked" : ""} ${forcedDisplay ? "disabled" : ""}/>
        <span>${tt("offScreen")}</span>
      </label>
      <label class="toggle">
        <input id="os" type="radio" name="screenMode" ${state.onScreen ? "checked" : ""} ${forcedDisplay ? "disabled" : ""}/>
        <span>${tt("onScreenShort")}</span>
      </label>
    </div>
    <p class="meta">${state.onScreen ? tt("onScreen") : tt("offScreenHint")}</p>`}
    ${state.onScreen || isTvDisplay() ? `
      <p class="dir-copy">${tt("onScreenOwns")}</p>
      <p class="room-code">${tt("roomLabel", `<b id="codeCopy">${escapeHtml(state.room || "····")}</b>`)}</p>
      ${state.room ? `
        <div class="copy-row">
          <input id="silkUrl" type="text" readonly value="${escapeHtml(silk || tvSilkUrl(state.room))}"/>
          <button class="ghost" id="copySilk" type="button">${tt("copy")}</button>
        </div>
        <img class="qr" alt="Join" src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(shareUrl())}"/>
      ` : ""}
      <p class="meta">${escapeHtml(tt("humansBots", humans, bots))}</p>
      ${isTvDisplay() || state.onScreen ? `
        <div class="tv-players">
          <p class="rivals-lab">${tt("tvPlayers")}</p>
          ${(state.guests || []).map((g) =>
            `<div class="tv-player-row">
              <span class="seat human">${escapeHtml(g.name)}</span>
              <button type="button" class="ghost danger" data-kick="${escapeHtml(g.id)}">${tt("removePlayer")}</button>
            </div>`
          ).join("") || `<p class="meta">${tt("noPadsYet")}</p>`}
        </div>` : ""}
    ` : `<p class="meta">${tt("offScreenHint")}</p>`}
    ${roomDojoEntryHTML()}
  `;
}

function setBody() {
  return `
    <div class="dock in-acc set-dock">
      <label class="slider-lab">${tt("jeremy")} <input id="hs" type="range" min="24" max="62" value="${state.hostH}" step="1"/></label>
      <label class="slider-lab">${tt("studio")} <input id="st" type="range" min="0" max="${STUDIOS.length - 1}" value="${state.studioI}" step="1"/></label>
    </div>
    <p class="meta">${tt("setHint")}</p>
  `;
}

function lobbyGoLabel() {
  const pad = isPad();
  const mode = pad ? "join" : (state.mpMode || "host");
  if (pad || mode === "join") return tt("goJoin");
  if (mode === "cast") return state.room ? tt("goCastCopy") : tt("goCastMake");
  if (isTvDisplay() || state.onScreen) return tt("goOpenTv");
  return tt("goPlay");
}

function lobbyGateReason() {
  if (isTvDisplay()) return "";
  if (!hasPhoneProfile()) return tt("gateProfile");
  if (needsPasswordSetup()) return tt("gateSetPassword");
  if (!state.profileUnlocked) return tt("gatePassword");
  if (!isPlaced()) return tt("gateDojo");
  return "";
}

function lobbyHTML() {
  const pad = isPad();
  const tv = isTvDisplay();
  const p = state.profile || {};
  const placed = isPlaced();
  const belt = BELT_META[p.belt || "white"];
  const ab = p.abilityTier ? ABILITY_META[p.abilityTier] : null;
  const mode = pad ? "join" : (state.mpMode || "host");
  const gate = lobbyGateReason();
  const joining = pad || mode === "join";
  // Phone: keep primary enabled — when gated it is a clear Dojo CTA, not a grey dead button.
  const goGated = Boolean(gate) && !(tv && (mode === "host" || mode === "cast"));
  const goOff = false;
  const goLabel = goGated
    ? (!hasPhoneProfile() ? tt("profileFirst")
      : needsPasswordSetup() ? tt("passwordFirst")
      : !state.profileUnlocked ? tt("unlockFirst")
      : tt("dojoFirst"))
    : lobbyGoLabel();
  const d = state.dojo;
  const dojoLive = Boolean(d && d.q && !d.done);
  const dojoExtra = dojoLive
    ? `<small>${d.answers.length}/${PLACE_N}</small>`
    : (!hasPhoneProfile() ? `<small>${tt("createProfile")}</small>`
      : needsPasswordSetup() ? `<small>${tt("setPassword")}</small>`
      : !state.profileUnlocked ? `<small>${tt("locked")}</small>`
      : (placed ? `<small>${escapeHtml((ab && ab.label) || tt("placed"))}</small>` : `<small>${tt("required")}</small>`));
  const status = state.statusMsg
    || gate
    || (joining && (state.room || joinCode) ? "Joining room " + (state.room || joinCode) : "")
    || (state.onScreen && state.room ? "TV owns room " + state.room : "");
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>${tt("tagline")}</small></div>
      <div class="grow"></div>
      ${languageSwitcherHtml(state.locale)}
      ${state.room ? `<span class="chip">${escapeHtml(state.room)}</span>` : ""}
      <a class="word" href="./directions.html">${tt("directions")}</a>
    </div>
    <div class="lobby">
      <div class="lobby-copy">
        <h1 class="sr-only">Fast Answer!</h1>
        <img class="brand" src="${TITLE_3D}" alt="Fast Answer!"/>
        ${lobbySetupBannerHTML()}
        <div class="accord">
          ${dojoLive && !tv ? "" : acc("room", joining ? tt("joinTv") : (mode === "cast" ? tt("castTv") : tt("room")), `<small>${joining ? (state.room || "code") : state.playerCount + " seats"}</small>`, roomBody())}
          ${tv ? "" : acc("dojo", tt("dojo"), dojoExtra, dojoBody())}
          ${pad || tv || dojoLive ? "" : acc("set", tt("set"), "", setBody())}
        </div>
        <div class="row">
          <button class="primary ${goGated ? "go-dojo-cta" : ""}" id="go" type="button">${goLabel}</button>
        </div>
        <p class="status" id="stt">${escapeHtml(status)}</p>
      </div>
      ${pad ? "" : `<div class="host" style="--host-h:${state.hostH}vh"><img src="${POSE.idle}" alt="Jeremy" style="height:var(--host-h)"/></div>`}
    </div>
    <div></div>
    ${joinQrChip(140)}
    ${footHTML()}
    ${rulesHTML()}
  `;
}

function readyCardHTML() {
  const pads = humanPads();
  const readyN = pads.filter((g) => state.readyIds[g.id]).length;
  const rows = pads.length
    ? pads.map((g) => {
        const on = Boolean(state.readyIds[g.id]);
        const kick = role !== "pad"
          ? `<button type="button" class="ghost danger seat-kick" data-kick="${escapeHtml(g.id)}">${tt("removePlayer")}</button>`
          : "";
        return `<span class="seat-row"><span class="seat ${on ? "human" : "bot"}">${escapeHtml(g.name)}${on ? tt("phoneReady") : ""}</span>${kick}</span>`;
      }).join("")
    : `<span class="seat bot">${tt("waitingPhones")}</span>`;
  const pad = role === "pad";
  const mine = Boolean(state.readyIds[state.youId]);
  return `
    <div class="qwrap">
      <div class="qcard">
        <p class="cat">${tt("tvRoom", escapeHtml(state.room || "····"))}</p>
        <p class="qtext">${pad
          ? (mine ? tt("readyYou") : tt("readyPress"))
          : tt("readyTv")}</p>
        <p class="meta" id="clock">${tt("readyMeta", readyN, Math.max(pads.length, 1))}</p>
        <div class="seats ready-seats">${rows}</div>
        ${role !== "pad" ? `<button class="ghost" id="forceStart" type="button" style="margin-top:10px">${tt("startBots")}</button>` : ""}
      </div>
    </div>
  `;
}

function playHTML() {
  const q = currentQ();
  const tv = isTvDisplay();
  const pad = isPad(); // Off Screen pad = buzzer UI without forcing full TV chrome on phone
  const ld = state.lockdown;
  const readyPhase = state.phase === "ready";
  const endPhase = state.phase === "end";
  const lockdownPlay = ld?.phase === "play" || ld?.phase === "flash";
  const lockdownIntro = ld?.phase === "intro";
  const isHero = ld ? ld.playerId === state.youId : true;
  const waiterPad = pad && ld && lockdownPlay && !isHero;
  const showAns = ld
    ? (lockdownPlay && (isHero || !pad) && !waiterPad)
    : ["buzz", "answer", "reveal"].includes(state.phase);
  const canBuzz = readyPhase
    ? (pad || !state.onScreen) && !state.readyIds[state.youId]
    : (!ld && (pad || !state.onScreen) && state.phase === "buzz" && !state.buzzed);
  const canPick = ld
    ? lockdownPlay && isHero && ld.phase === "play"
    : state.phase === "answer" || (!state.onScreen && !pad && state.phase === "buzz");
  let prompt;
  if (readyPhase) prompt = "";
  else if (endPhase) prompt = tt("showEnd");
  else if (ld?.phase === "wager") prompt = `LOCKDOWN — ${ld.name} · ${tt("lockdownWagers")}`;
  else if (ld?.phase === "intro") prompt = `Lockdown rules · ${ld.introLeft}s`;
  else if (ld?.phase === "result") prompt = ld.won
    ? `${ld.name} cleared Lockdown ${ld.hits}/5 · $${ld.earned || 0}`
    : `${ld.name} broke Lockdown ${ld.hits}/5 · $${ld.earned || 0}`;
  else if (!q) prompt = tt("showEnd");
  else if (waiterPad) prompt = tt("lockdownWait", ld.waitLeft ?? LOCKDOWN_WAIT_S);
  else if (pad && !lockdownPlay && !lockdownIntro) prompt = state.phase === "read" ? tt("padRead") : tt("padBuzz");
  else prompt = escapeHtml(q.prompt);
  const cat = readyPhase
    ? tt("ready")
    : endPhase
      ? "END"
      : (ld
        ? `Lockdown · ${ld.phase === "play" || ld.phase === "flash" ? `${ld.qi + 1}/${LOCKDOWN_N}` : ld.phase}`
        : (q && !pad ? escapeHtml(q.categoryTitle) : (pad ? tt("yourPad") : "")));
  const tier = readyPhase ? "READY" : (endPhase ? "END" : (ld ? "LOCKDOWN" : (q ? q.tier.toUpperCase() : "END")));
  const n = readyPhase || ld || endPhase ? "" : ` · ${state.i + 1}/${state.qs.length || ROUND}`;
  const buzzLabel = readyPhase
    ? (state.readyIds[state.youId] ? tt("ready") : tt("buzzReady"))
    : tt("buzz");
  const showLobbyBtn = true;
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI % STUDIOS.length]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>${tier}${n}</small></div>
      <div class="grow"></div>
      ${readyPhase || endPhase ? "" : scoreboard()}
      <button class="word" id="rulesBtn" type="button">${tt("rules")}</button>
      ${showLobbyBtn ? `<button class="word" id="quit" type="button">${tt("lobby")}</button>` : ""}
    </div>
    <div class="play">
      ${readyPhase ? readyCardHTML() : (endPhase ? `<div class="qwrap"><div class="qcard">
        <p class="cat">END</p>
        <p class="qtext">${tt("showEnd")}</p>
        <p class="meta" id="clock">${scoreboard()}</p>
        <div class="row" style="margin-top:12px">
          <button class="primary" id="quit" type="button">${tt("lobby")}</button>
        </div>
      </div></div>` : `<div class="qwrap">
        <div class="qcard ${ld ? "lock" : ""} ${state.mapLive ? "map-on" : ""}">
          <p class="cat">${cat}</p>
          <p class="qtext">${prompt}</p>
          <p class="meta" id="clock">${clockText()}</p>
          ${rivalsHTML()}
        </div>
      </div>`)}
      ${pad ? "" : `<div class="host"><img src="${POSE[state.pose] || POSE.idle}" alt="Jeremy" style="height:var(--host-h)"/></div>`}
    </div>
    ${readyPhase || endPhase ? `<div></div>` : (ld?.phase === "wager" || ld?.phase === "intro" ? wagerHTML() : (showAns && q ? `<div class="answers">${q.choices.map((c, i) => {
      let cls = "ans";
      const picked = ld ? ld.picked : state.picked;
      const reveal = state.phase === "reveal" || ld?.phase === "flash" || ld?.phase === "result";
      // Waiters must not see hero's response until flash/result
      const hidePick = waiterPad && !reveal;
      if (reveal) {
        if (i === q.correctIndex) cls += " ok";
        else if (i === picked && !hidePick) cls += " bad";
      } else if (i === picked && !hidePick) cls += " on";
      const dis = canPick && !reveal ? "" : "disabled";
      return `<button class="${cls}" data-i="${i}" type="button" ${dis}><small>${LETTERS[i]}</small>${escapeHtml(c)}</button>`;
    }).join("")}${mapStealHTML()}</div>` : (waiterPad ? `<div class="wager"><p class="wager-copy">${tt("lockdownWait", ld.waitLeft ?? LOCKDOWN_WAIT_S)}</p><p class="meta">Glimpse only — hero answers privately.</p></div>` : `<div></div>`)))}
    <div class="buzzbar">
      ${!state.onScreen && !pad && !ld && !readyPhase && !endPhase ? `<div class="dock set-dock">
        <label class="slider-lab">${tt("jeremy")} <input id="hs" type="range" min="24" max="62" value="${state.hostH}" step="1"/></label>
        <label class="slider-lab">${tt("studio")} <input id="st" type="range" min="0" max="${STUDIOS.length - 1}" value="${state.studioI}" step="1"/></label>
      </div>` : ""}
      ${(pad || !tv) && !ld && !endPhase ? `<button class="buzzer ${canBuzz ? "lit" : ""} ${readyPhase && state.readyIds[state.youId] ? "ready-on" : ""}" id="buzz" type="button" ${canBuzz ? "" : "disabled"}>${buzzLabel}</button>` : ""}
      ${ld ? `<div class="lock-flag">${ld.phase === "wager" ? tt("lockdownWagers") : ld.phase === "intro" ? `Rules · ${ld.introLeft}s` : `${escapeHtml(ld.name)} · ${ld.hits} hit · $${ld.earned || 0}`}</div>` : ""}
      ${(pad && (state.phase === "answer" || (ld?.phase === "play" && isHero))) ? `<button class="ghost mic" id="mic" type="button">${tt("speak")}</button>` : ""}
      ${pad || endPhase ? `<button class="ghost" id="quitBar" type="button">${tt("lobby")}</button>` : ""}
    </div>
    ${joinQrChip(140)}
    ${rulesHTML()}
  `;
}

async function openRoom() {
  state.room = state.room || code();
  await rooms("POST", { action: "create", code: state.room, host: state.name });
  startPoll();
}

function bindLobby() {
  document.querySelectorAll("[data-locale]").forEach((b) => {
    b.onclick = () => { void setLocale(b.dataset.locale); };
  });
  document.querySelectorAll("[data-acc]").forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.acc;
      state.lobbyOpen = state.lobbyOpen === id ? "" : id;
      if (id === "dojo" && state.lobbyOpen === "dojo" && !isTvDisplay()) {
        if (!hasPhoneProfile()) state.dojoMode = "create";
        else if (needsPasswordSetup()) state.dojoMode = "setpw";
        else if (!state.profileUnlocked) state.dojoMode = "unlock";
        else if (needsPlacement(state.profile) && !state.dojo) {
          // Unlocked + no placement: start placement when opening Dojo
          startDojo();
          return;
        } else {
          state.dojoMode = "home";
        }
      }
      paint(true);
    };
  });
  document.querySelectorAll("[data-mp]").forEach((b) => {
    b.onclick = () => {
      state.mpMode = b.dataset.mp;
      localStorage.setItem("fa-mp", state.mpMode);
      state.statusMsg = "";
      if (state.mpMode === "join") {
        void refreshActiveRooms().then(() => paint(true));
      } else if (state.mpMode === "cast" && !state.room) {
        // room created on go
      }
      state.lobbyOpen = "room";
      paint(true);
    };
  });
  const nm = $("#nm");
  if (nm) nm.oninput = (e) => {
    state.name = e.target.value;
    localStorage.setItem("fa-name", state.name);
    saveProfile({ displayName: state.name });
  };
  const em = $("#em");
  if (em) em.oninput = (e) => saveProfile({ email: e.target.value });
  const th = $("#th");
  if (th) th.onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 400000) {
      state.statusMsg = tt("photoBig");
      paint(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => saveProfile({ thumb: String(reader.result || "") }) && paint(true);
    reader.readAsDataURL(file);
  };
  const pc = $("#pc");
  if (pc) pc.oninput = (e) => {
    state.playerCount = clamp(Number(e.target.value), 2, 12);
    localStorage.setItem("fa-seats", String(state.playerCount));
    fillSeats();
    paint(true);
  };
  const botFill = $("#botFill");
  if (botFill) botFill.onchange = (e) => {
    state.botFill = Boolean(e.target.checked);
    localStorage.setItem("fa-bots", state.botFill ? "1" : "0");
    fillSeats();
    paint(true);
  };
  const bindScreen = async (on) => {
    state.onScreen = Boolean(on);
    localStorage.setItem("fa-onscreen", state.onScreen ? "1" : "0");
    if (state.onScreen) await openRoom();
    paint(true);
  };
  const os = $("#os");
  if (os) os.onchange = () => { if (os.checked) void bindScreen(true); };
  const osOff = $("#osOff");
  if (osOff) osOff.onchange = () => { if (osOff.checked) void bindScreen(false); };
  const refreshRooms = $("#refreshRooms");
  if (refreshRooms) refreshRooms.onclick = async () => {
    await refreshActiveRooms();
    paint(true);
  };
  document.querySelectorAll("[data-join-room]").forEach((b) => {
    b.onclick = () => {
      const code = String(b.dataset.joinRoom || "").toUpperCase();
      state.joinInput = code;
      state.room = code;
      const jc = $("#jc");
      if (jc) jc.value = code;
      state.statusMsg = "Selected room " + code;
      paint(true);
    };
  });
  document.querySelectorAll("[data-kick]").forEach((b) => {
    b.onclick = async () => {
      const id = b.dataset.kick;
      if (!id || !state.room) return;
      await rooms("POST", { action: "kick", code: state.room, id });
      state.guests = (state.guests || []).filter((g) => g.id !== id);
      paint(true);
      publish();
    };
  });
  const openDojoGate = (mode) => {
    state.lobbyOpen = "dojo";
    state.dojoMode = mode || "home";
    if (mode === "home" && state.profileUnlocked && needsPlacement(state.profile) && !(state.dojo && state.dojo.q)) {
      startDojo();
      return;
    }
    paint(true);
  };
  const routeToDojo = () => {
    if (!hasPhoneProfile()) openDojoGate("create");
    else if (needsPasswordSetup()) openDojoGate("setpw");
    else if (!state.profileUnlocked) openDojoGate("unlock");
    else openDojoGate("home");
  };
  const goToDojoBtn = $("#goToDojo");
  if (goToDojoBtn) goToDojoBtn.onclick = () => routeToDojo();
  const bannerGoDojo = $("#bannerGoDojo");
  if (bannerGoDojo) bannerGoDojo.onclick = () => routeToDojo();
  const roomCreateProfile = $("#roomCreateProfile");
  if (roomCreateProfile) roomCreateProfile.onclick = () => openDojoGate("create");
  const roomUnlockProfile = $("#roomUnlockProfile");
  if (roomUnlockProfile) roomUnlockProfile.onclick = async () => {
    const pw = String(($("#pwUnlockRoom") && $("#pwUnlockRoom").value) || "");
    const ok = await verifyProfilePassword(pw);
    if (!ok) {
      state.statusMsg = tt("wrongPassword");
      paint(true);
      return;
    }
    state.profileUnlocked = true;
    state.dojoMode = "home";
    state.statusMsg = "";
    if (needsPlacement(state.profile)) startDojo();
    else paint(true);
  };
  const createProfile = $("#createProfile");
  if (createProfile) createProfile.onclick = async () => {
    const name = String(($("#nm") && $("#nm").value) || "").trim().slice(0, 18);
    const pw = String(($("#pwNew") && $("#pwNew").value) || "");
    const pw2 = String(($("#pwConfirm") && $("#pwConfirm").value) || "");
    if (!name) {
      state.statusMsg = tt("gateProfile");
      paint(true);
      return;
    }
    if (pw.length < 4) {
      state.statusMsg = tt("passwordHint");
      paint(true);
      return;
    }
    if (pw !== pw2) {
      state.statusMsg = tt("passwordMismatch");
      paint(true);
      return;
    }
    const passwordHash = await hashPassword(pw);
    const base = state.profile || seedProfile();
    state.profile = {
      ...base,
      id: base.passwordHash ? base.id : uid(),
      displayName: name,
      passwordHash,
      createdAt: base.passwordHash ? base.createdAt : new Date().toISOString(),
    };
    saveProfile({ displayName: name, passwordHash });
    state.profileUnlocked = true;
    state.dojoMode = "home";
    state.statusMsg = tt("profileCreated");
    startDojo();
  };
  const setProfilePw = $("#setProfilePw");
  if (setProfilePw) setProfilePw.onclick = async () => {
    const pw = String(($("#pwNew") && $("#pwNew").value) || "");
    const pw2 = String(($("#pwConfirm") && $("#pwConfirm").value) || "");
    if (pw.length < 4) {
      state.statusMsg = tt("passwordHint");
      paint(true);
      return;
    }
    if (pw !== pw2) {
      state.statusMsg = tt("passwordMismatch");
      paint(true);
      return;
    }
    const passwordHash = await hashPassword(pw);
    saveProfile({ passwordHash });
    state.profileUnlocked = true;
    state.dojoMode = "home";
    state.statusMsg = tt("passwordSaved");
    if (needsPlacement(state.profile)) startDojo();
    else paint(true);
  };
  const unlockProfile = $("#unlockProfile");
  if (unlockProfile) unlockProfile.onclick = async () => {
    const pw = String(($("#pwUnlock") && $("#pwUnlock").value) || "");
    const ok = await verifyProfilePassword(pw);
    if (!ok) {
      state.statusMsg = tt("wrongPassword");
      paint(true);
      return;
    }
    state.profileUnlocked = true;
    state.dojoMode = "home";
    state.statusMsg = "";
    if (needsPlacement(state.profile)) startDojo();
    else paint(true);
  };
  const lockProfile = $("#lockProfile");
  if (lockProfile) lockProfile.onclick = () => {
    state.profileUnlocked = false;
    state.dojoMode = "unlock";
    state.statusMsg = tt("profileLocked");
    paint(true);
  };
  const dojoCreateAlt = $("#dojoCreateAlt");
  if (dojoCreateAlt) dojoCreateAlt.onclick = () => openDojoGate("create");
  const dojoCancelMode = $("#dojoCancelMode");
  if (dojoCancelMode) dojoCancelMode.onclick = () => {
    state.dojoMode = needsPasswordSetup() ? "setpw" : (state.profileUnlocked ? "home" : "unlock");
    paint(true);
  };
  const saveProfileEdit = $("#saveProfileEdit");
  if (saveProfileEdit) saveProfileEdit.onclick = async () => {
    if (!state.profileUnlocked) return;
    const name = String(($("#nm") && $("#nm").value) || state.name).trim().slice(0, 18);
    const email = String(($("#em") && $("#em").value) || "").trim().slice(0, 120);
    const pw = String(($("#pwNew") && $("#pwNew").value) || "");
    const pw2 = String(($("#pwConfirm") && $("#pwConfirm").value) || "");
    const patch = { displayName: name || state.name, email };
    if (pw || pw2) {
      if (pw.length < 4) {
        state.statusMsg = tt("passwordHint");
        paint(true);
        return;
      }
      if (pw !== pw2) {
        state.statusMsg = tt("passwordMismatch");
        paint(true);
        return;
      }
      patch.passwordHash = await hashPassword(pw);
    }
    saveProfile(patch);
    state.statusMsg = tt("profileSaved");
    paint(true);
  };
  const bindThumb = (el) => {
    if (!el) return;
    el.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 400000) {
        state.statusMsg = tt("photoBig");
        paint(true);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => saveProfile({ thumb: String(reader.result || "") }) && paint(true);
      reader.readAsDataURL(file);
    };
  };
  bindThumb($("#thDojo"));
  const jc = $("#jc");
  if (jc) jc.oninput = (e) => {
    state.joinInput = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    state.room = state.joinInput;
  };
  const copySilk = $("#copySilk");
  if (copySilk) copySilk.onclick = async () => {
    const url = ($("#silkUrl") && $("#silkUrl").value) || tvSilkUrl(state.room);
    const ok = await copyText(url);
    state.statusMsg = ok ? tt("silkCopied") : tt("copyFail", url);
    paint(true);
  };
  const dojoGo = $("#dojoGo");
  if (dojoGo) dojoGo.onclick = () => startDojo();
  const retake = $("#retake");
  if (retake) retake.onclick = () => startDojo();
  document.querySelectorAll("[data-dojo]").forEach((b) => {
    b.onclick = () => dojoPick(Number(b.dataset.dojo));
  });
  bindSliders();
  bindRules();
  const go = $("#go");
  if (go) go.onclick = () => void onLobbyGo();
  bindQrChip();
}

async function joinAsBuzzer() {
  const code = String(state.room || state.joinInput || joinCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code || code.length < 3) {
    state.statusMsg = tt("enterCode");
    state.lobbyOpen = "room";
    state.mpMode = "join";
    paint(true);
    return false;
  }
  if (!hasPhoneProfile()) {
    state.statusMsg = tt("gateProfile");
    state.lobbyOpen = "dojo";
    state.dojoMode = "create";
    paint(true);
    return false;
  }
  if (needsPasswordSetup()) {
    state.statusMsg = tt("gateSetPassword");
    state.lobbyOpen = "dojo";
    state.dojoMode = "setpw";
    paint(true);
    return false;
  }
  if (!state.profileUnlocked) {
    state.statusMsg = tt("gatePassword");
    state.lobbyOpen = "dojo";
    state.dojoMode = "unlock";
    paint(true);
    return false;
  }
  if (!isPlaced()) {
    state.statusMsg = tt("dojoPhone");
    state.lobbyOpen = "dojo";
    if (!state.dojo || !state.dojo.q) startDojo();
    else paint(true);
    return false;
  }
  saveProfile({ displayName: state.name });
  const prevRole = role;
  role = "pad";
  state.mpMode = "join";
  localStorage.setItem("fa-mp", "join");
  state.room = code;
  state.joinInput = code;
  state.onScreen = true;
  state.youId = "p-" + (state.profile?.id || state.name || "pad").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16);
  if (!state.youId || state.youId === "p-") state.youId = "p-" + uid().slice(0, 8);
  state.leftPad = false;
  const joined = await rooms("POST", { action: "join", code: state.room, name: state.name, id: state.youId, thumb: state.profile?.thumb || "" });
  if (!joined || joined.error) {
    state.statusMsg = (joined && joined.message)
      || tt("roomMissing", code);
    role = prevRole;
    paint(true);
    return false;
  }
  startPoll();
  const live = await rooms("GET");
  if (live?.guests) ingestGuests(live.guests);
  if (live?.state?.phase && live.state.phase !== "lobby") {
    const keep = state.name;
    const keepId = state.youId;
    Object.assign(state, live.state);
    state.name = keep;
    state.youId = keepId;
    state.readyIds = { ...(live.state.readyIds || {}) };
    if (live.guests) ingestGuests(live.guests);
  } else {
    // TV still in lobby — stay as pad waiting; prefer ready UI once TV opens room.
    state.phase = "lobby";
  }
  state.statusMsg = "Joined room " + code + " as buzzer. Waiting for the TV…";
  // Persist pad role in URL so refresh keeps pad mode.
  try {
    const u = new URL(location.href);
    u.searchParams.set("role", "pad");
    u.searchParams.set("room", code);
    history.replaceState(null, "", u.pathname + u.search);
  } catch { /* ignore */ }
  paint(true);
  return true;
}

async function onLobbyGo() {
  const mode = isPad() ? "join" : (state.mpMode || "host");
  state.statusMsg = "";

  if (isPad() || mode === "join") {
    const gate = lobbyGateReason();
    if (gate) {
      state.statusMsg = gate;
      if (!hasPhoneProfile()) { state.lobbyOpen = "dojo"; state.dojoMode = "create"; paint(true); return; }
      if (needsPasswordSetup()) { state.lobbyOpen = "dojo"; state.dojoMode = "setpw"; paint(true); return; }
      if (!state.profileUnlocked) { state.lobbyOpen = "dojo"; state.dojoMode = "unlock"; paint(true); return; }
      if (!isPlaced()) {
        state.lobbyOpen = "dojo";
        if (!state.dojo || !state.dojo.q) startDojo();
        else paint(true);
        return;
      }
    }
    await joinAsBuzzer();
    return;
  }

  if (mode === "cast") {
    if (!isTvDisplay()) {
      const gate = lobbyGateReason();
      // Host phone generating a link for Silk still needs profile/placement for their seat.
      if (gate) {
        state.statusMsg = gate;
        state.lobbyOpen = "dojo";
        if (!hasPhoneProfile()) { state.dojoMode = "create"; paint(true); return; }
        if (needsPasswordSetup()) { state.dojoMode = "setpw"; paint(true); return; }
        if (!state.profileUnlocked) { state.dojoMode = "unlock"; paint(true); return; }
        if (!isPlaced()) {
          if (!state.dojo || !state.dojo.q) startDojo();
          else paint(true);
          return;
        }
      }
    }
    saveProfile({ displayName: state.name });
    state.onScreen = true;
    localStorage.setItem("fa-onscreen", "1");
    await openRoom();
    const url = tvSilkUrl(state.room);
    const ok = await copyText(url);
    state.statusMsg = ok
      ? ("TV room " + state.room + " ready — Silk link copied.")
      : ("TV room " + state.room + " — copy: " + url);
    state.lobbyOpen = "room";
    paint(true);
    return;
  }

  // Host play / Open TV room
  if (!isTvDisplay()) {
    const gate = lobbyGateReason();
    if (gate) {
      state.statusMsg = gate;
      state.lobbyOpen = "dojo";
      if (!hasPhoneProfile()) { state.dojoMode = "create"; paint(true); return; }
      if (needsPasswordSetup()) { state.dojoMode = "setpw"; paint(true); return; }
      if (!state.profileUnlocked) { state.dojoMode = "unlock"; paint(true); return; }
      if (!isPlaced()) {
        if (!state.dojo || !state.dojo.q) startDojo();
        else paint(true);
        return;
      }
    }
  }
  saveProfile({ displayName: state.name });
  if (state.onScreen || isTvDisplay()) {
    await openRoom();
    enterReady();
    return;
  }
  startGame();
}

function bindSliders() {
  const hs = $("#hs");
  if (hs) {
    const applyHs = (e) => {
      state.hostH = Number(e.target.value);
      localStorage.setItem("fa-hosth", String(state.hostH));
      applyHostSize();
      document.querySelectorAll(".host img").forEach((img) => {
        img.style.height = state.hostH + "vh";
      });
    };
    hs.oninput = applyHs;
    hs.onchange = applyHs;
    // Prevent accordion / page from stealing the drag on phones.
    hs.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    hs.addEventListener("pointerdown", (e) => e.stopPropagation());
  }
  const st = $("#st");
  if (st) {
    const applySt = (e) => {
      state.studioI = Number(e.target.value);
      localStorage.setItem("fa-studio", String(state.studioI));
      const bg = $(".bg");
      if (bg) bg.src = STUDIOS[state.studioI % STUDIOS.length];
      publish();
    };
    st.oninput = applySt;
    st.onchange = applySt;
    st.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    st.addEventListener("pointerdown", (e) => e.stopPropagation());
  }
}

function bindQrChip() {
  const t = $("#qrToggle");
  if (!t) return;
  t.onclick = () => {
    state.qrOpen = !state.qrOpen;
    paint(true);
  };
}

function bindRules() {
  const b = $("#rulesBtn");
  if (b) b.onclick = () => { state.rules = !state.rules; paint(true); };
  const x = $("#rulesX");
  if (x) x.onclick = () => { state.rules = false; paint(true); };
}

function bindPlay() {
  document.querySelectorAll(".ans").forEach((b) => {
    b.onclick = () => pick(Number(b.dataset.i));
  });
  document.querySelectorAll("[data-map]").forEach((b) => {
    b.onclick = () => armMap(b.dataset.map);
  });
  document.querySelectorAll("[data-side]").forEach((b) => {
    b.onclick = () => {
      const ld = state.lockdown;
      if (!ld || ld.phase !== "wager") return;
      if (ld.wagers[state.youId]?.locked) return;
      const prev = state.wagerDraft || ld.wagers[state.youId] || { amount: 100 };
      setWagerDraft(b.dataset.side, prev.amount || 100);
    };
  });
  document.querySelectorAll("[data-amt]").forEach((b) => {
    b.onclick = () => {
      const ld = state.lockdown;
      if (!ld || ld.phase !== "wager") return;
      if (ld.wagers[state.youId]?.locked) return;
      const prev = state.wagerDraft || ld.wagers[state.youId] || { side: "win" };
      setWagerDraft(prev.side || "win", Number(b.dataset.amt));
    };
  });
  const lockWager = $("#lockWager");
  if (lockWager) lockWager.onclick = () => lockInWager();
  const bz = $("#buzz");
  if (bz) bz.onclick = () => buzz();
  const mic = $("#mic");
  if (mic) mic.onclick = listenVoice;
  const goLobby = () => leaveToLobby();
  const quit = $("#quit");
  if (quit) quit.onclick = goLobby;
  const quitBar = $("#quitBar");
  if (quitBar) quitBar.onclick = goLobby;
  document.querySelectorAll("#quit").forEach((el) => { el.onclick = goLobby; });
  const force = $("#forceStart");
  if (force) force.onclick = () => {
    if (role === "pad" || state.phase !== "ready") return;
    startGame();
  };
  document.querySelectorAll("[data-kick]").forEach((b) => {
    b.onclick = async () => {
      const id = b.dataset.kick;
      if (!id || !state.room || role === "pad") return;
      await rooms("POST", { action: "kick", code: state.room, id });
      state.guests = (state.guests || []).filter((g) => g.id !== id);
      state.players = state.players.filter((p) => p.id !== id);
      paint(true);
      publish();
    };
  });
  bindSliders();
  bindRules();
  bindQrChip();
}

function ingestGuests(guests) {
  if (!Array.isArray(guests)) return;
  state.guests = guests
    .filter((g) => g && (g.id || g.name) && String(g.id) !== "you")
    .map((g) => ({
      id: g.id || ("p-" + String(g.name || "pad").toLowerCase().replace(/\s+/g, "")),
      name: g.name || "Player",
      thumb: g.thumb || "",
    }))
    .slice(0, 11);
  if (state.phase === "lobby") return;
  state.guests.forEach((g) => {
    if (state.players.some((p) => p.id === g.id || p.name === g.name)) return;
    const bot = state.players.find((p) => !p.human);
    if (bot) {
      bot.id = g.id;
      bot.name = g.name;
      bot.human = true;
      bot.thumb = g.thumb || bot.thumb || "";
      delete bot.skill;
      delete bot.buzzDelayMs;
    } else if (state.players.length < 12) {
      state.players.push({ id: g.id, name: g.name, score: 0, human: true, you: false, thumb: g.thumb || "" });
    } else {
      const existing = state.players.find((p) => p.id === g.id || p.name === g.name);
      if (existing && g.thumb) existing.thumb = g.thumb;
    }
  });
}

function startGame() {
  seatPlayers();
  state.qs = deal(state.questions);
  state.spent = new Set(state.qs.map((q) => q.id));
  rememberDealtIds(state.qs.map((q) => q.id));
  state.i = 0;
  state.lockdownAt = pickLockdownSlots();
  state.lockdown = null;
  state.maps = {};
  state.tally = { correct: 0, wrong: 0 };
  if (state.onScreen && !state.room) state.room = code();
  startPoll();
  startRead();
}

function startPoll() {
  if (poll) return;
  poll = setInterval(async () => {
    if (!state.room || state.leftPad) return;
    const j = await rooms("GET");
    if (!j || j.error) return;
    pollN += 1;
    if (j.guests) {
      const before = (state.guests || []).map((g) => g.id).join(",");
      ingestGuests(j.guests);
      const after = (state.guests || []).map((g) => g.id).join(",");
      if ((state.phase === "lobby" || state.phase === "ready") && before !== after) paint(true);
    }
    if (role !== "pad" && j.state?.readyIds && state.phase === "ready") {
      const incoming = j.state.readyIds || {};
      let changed = false;
      Object.keys(incoming).forEach((id) => {
        if (incoming[id] && !state.readyIds[id]) {
          state.readyIds[id] = true;
          changed = true;
        }
      });
      (j.guests || []).forEach((g) => {
        if (g && g.ready && g.id && !state.readyIds[g.id]) {
          state.readyIds[g.id] = true;
          changed = true;
        }
      });
      if (changed) {
        paint(true);
        maybeStartFromReady();
      }
    }
    if (role === "pad" && j.state && j.state.phase) {
      // Kicked from TV?
      if (j.state.kickedId && j.state.kickedId === state.youId && (j.state.kickedAt || 0) > (state.lastKickAt || 0)) {
        state.lastKickAt = j.state.kickedAt;
        state.statusMsg = "Removed from room by TV.";
        leaveToLobby();
        return;
      }
      const keep = state.name;
      const keepId = state.youId;
      const keepReady = { ...(state.readyIds || {}) };
      const keepProfile = state.profile;
      Object.assign(state, j.state);
      state.name = keep;
      state.youId = keepId;
      state.profile = keepProfile;
      state.readyIds = { ...keepReady, ...(j.state.readyIds || {}) };
      if (Array.isArray(j.state.qs) && j.state.qs.length) state.qs = j.state.qs;
      if (j.guests) ingestGuests(j.guests);
      paint();
    }
    if (role !== "pad" && j.state?.buzzed && !state.buzzed && state.phase === "buzz") {
      takeBuzz(j.state.buzzId || "", j.state.buzzBy || "Player");
    }
    if (role !== "pad" && j.state?.maps) {
      state.maps = { ...state.maps, ...j.state.maps };
    }
    if (role !== "pad" && j.state?.lastWager && state.lockdown?.phase === "wager") {
      const w = j.state.lastWager;
      if (w.id && w.at && w.at !== state.lastWagerAt) {
        state.lastWagerAt = w.at;
        applyWager(w.id, w.side, w.amount, w.locked !== false);
      }
    }
    if (role !== "pad" && j.state?.lastAnswer) {
      const a = j.state.lastAnswer;
      if (a && a.at && a.at !== state.lastAnswerAt) {
        state.lastAnswerAt = a.at;
        applyRemoteAnswer(a.id, a.index, Boolean(a.lockdown));
      }
    }
    // TV re-publishes periodically so pads on other serverless instances catch up.
    if (role !== "pad" && state.onScreen && state.phase !== "lobby" && pollN % 5 === 0) {
      publish();
    }
  }, 400);
}

let lastKey = "";
function paint(force = false) {
  const app = $("#app");
  if (isDirections) {
    app.className = "stage directions";
    applyHostSize();
    app.innerHTML = directionsHTML();
    bindDirections();
    return;
  }
  app.className = "stage"
    + (role === "pad" ? " pad" : "")
    + (state.onScreen && role !== "pad" ? " tv" : "")
    + (state.lockdown ? " lockdown" : "");
  applyHostSize();
  const ld = state.lockdown;
  const frame = state.phase === "lobby" ? "lobby" : "play";
  const key = [
    frame, role, state.onScreen, state.phase, state.i, state.buzzed, state.picked, state.pose,
    state.studioI, state.hostH, state.maps[state.youId], state.mapLive, ld?.phase, ld?.qi, ld?.picked, ld?.introLeft, ld?.waitLeft, ld?.earned,
    state.rules, state.players.map((p) => `${p.score}:${p.thumb ? 1 : 0}`).join(","),
    state.lobbyOpen, state.playerCount, (state.guests || []).length,
    state.dojo?.answers?.length, state.dojo?.picked, state.dojo?.showAnswers, state.dojo?.readLeft,
    state.profile?.abilityTier, state.profile?.belt, state.profile?.thumb ? 1 : 0,
    state.profileUnlocked ? 1 : 0, state.dojoMode, state.profile?.passwordHash ? 1 : 0,
    state.dirOpen, state.qrOpen, state.mpMode, state.statusMsg, state.botFill, state.locale,
    Object.keys(state.readyIds || {}).filter((k) => state.readyIds[k]).join(","),
    state.wagerDraft?.side, state.wagerDraft?.amount, (state.activeRooms || []).map((r) => r.code).join(","),
    ld?.wagers?.[state.youId]?.locked, ld?.wagers?.[state.youId]?.side, ld?.wagers?.[state.youId]?.amount,
  ].join("|");
  if (!force && key === lastKey && frame === "play") {
    const clock = $("#clock");
    if (clock) clock.textContent = clockText();
    return;
  }
  lastKey = key;
  if (state.phase === "lobby") {
    app.innerHTML = lobbyHTML();
    bindLobby();
  } else {
    app.innerHTML = playHTML();
    bindPlay();
  }
}

window.addEventListener("keydown", (e) => {
  if (isDirections) return;
  if (e.target && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
  if (e.code === "Space") { e.preventDefault(); buzz(); }
  const n = e.key && "1234abcd".includes(e.key.toLowerCase()) ? "1234abcd".indexOf(e.key.toLowerCase()) % 4 : -1;
  if (n >= 0) pick(n);
});

if (isDirections) {
  document.documentElement.lang = state.locale;
  paint(true);
  window.__fa = state;
} else {
  await loadBanksForLocale(state.locale);
  state.profile = loadProfile();
  if (state.profile?.displayName) state.name = state.profile.displayName;
  state.botFill = localStorage.getItem("fa-bots") !== "0";
  fillSeats();
  const tv = isTvDisplay() || forcedDisplay;
  state.profileUnlocked = false;
  if (!tv && !hasPhoneProfile()) {
    // No profile: expand Dojo create so entry is obvious (Join TV panel also has CTAs).
    state.lobbyOpen = "dojo";
    state.dojoMode = "create";
  } else if (!tv && needsPasswordSetup()) {
    state.lobbyOpen = "dojo";
    state.dojoMode = "setpw";
  } else {
    state.lobbyOpen = "room";
    state.dojoMode = "unlock";
  }
  if (role === "pad") {
    state.onScreen = true; // pad follows TV room; UI is pad (Off Screen chrome), not full TV
    state.mpMode = "join";
    // Keep Join TV open so room code + Dojo entry share the same card.
    state.lobbyOpen = "room";
    if (!hasPhoneProfile()) state.dojoMode = "create";
    else if (needsPasswordSetup()) state.dojoMode = "setpw";
    else if (!state.profileUnlocked) state.dojoMode = "unlock";
    if (joinCode) state.room = joinCode;
    void refreshActiveRooms();
    startPoll();
  } else if (state.mpMode === "join") {
    void refreshActiveRooms();
  } else if (state.onScreen) {
    if (forcedDisplay) {
      localStorage.setItem("fa-onscreen", "1");
      state.lobbyOpen = "room";
      state.mpMode = "host";
    }
    void openRoom();
  }
  paint(true);
  window.__fa = state;
}
