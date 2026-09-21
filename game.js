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
const READ_S = 10;
const POINTS = { easy: 100, hard: 500, difficult: 1000, extreme: 5000 };
const DEAL = { easy: 20, hard: 10, difficult: 5, extreme: 2 };
const ROUND = DEAL.easy + DEAL.hard + DEAL.difficult + DEAL.extreme;
const LOCKDOWN_N = 5;
const LOCKDOWN_WIN_AT = 4;
const LOCKDOWN_Q = 500;
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
};

const bc = "BroadcastChannel" in window ? new BroadcastChannel("fast-answer") : null;

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
      if (needsPlacement(state.profile) && role !== "pad" && !isTvDisplay()) {
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
function hasPhoneProfile() {
  const p = state.profile;
  return Boolean(p && String(p.displayName || "").trim());
}
function canPlayScored() {
  return hasPhoneProfile() && isPlaced();
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
function deal(all) {
  const by = (t) => shuffle(all.filter((q) => q.tier === t));
  return [
    ...by("easy").slice(0, DEAL.easy),
    ...by("hard").slice(0, DEAL.hard),
    ...by("difficult").slice(0, DEAL.difficult),
    ...by("extreme").slice(0, DEAL.extreme),
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
function leftoverQs() {
  return shuffle(state.questions.filter((q) => !state.spent.has(q.id)));
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
    const qs = method === "GET" && state.room ? `?code=${encodeURIComponent(state.room)}` : "";
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
      applyWager(d.id, d.side, d.amount);
      return;
    }
    if (role === "pad" && d.phase) {
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
  if (ld?.phase === "play") return `Lockdown ${ld.qi + 1}/${LOCKDOWN_N} · ${ld.qLeft}s`;
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
    { id: "you", name: state.name || "Player", score: 0, human: true, you: true },
    ...guests.map((g) => ({ id: g.id, name: g.name, score: 0, human: true, you: false })),
    ...bots.map((b) => ({
      id: b.id,
      name: b.name,
      score: 0,
      human: false,
      you: false,
      skill: b.skill,
      buzzDelayMs: b.buzzDelayMs,
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
  if (state.phase !== "read") return;
  if (targetId === state.youId) return;
  if (state.maps[state.youId] === targetId) delete state.maps[state.youId];
  else state.maps[state.youId] = targetId;
  paint();
  publish();
  if (bc) bc.postMessage({ type: "map", id: state.youId, target: state.maps[state.youId], name: state.name });
  if (state.room) void rooms("POST", { action: "map", code: state.room, id: state.youId, target: state.maps[state.youId] });
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

function pick(i, asId) {
  if (state.lockdown?.phase === "wager") return;
  if (state.lockdown?.phase === "play") {
    lockdownPick(i);
    return;
  }
  if (state.phase === "reveal" || state.phase === "end" || state.phase === "read" || state.phase === "lobby") return;
  if (state.onScreen && role === "pad" && !state.buzzed) return;
  if (!state.onScreen && state.phase === "buzz" && !asId) {
    takeBuzz(state.youId, state.name);
  }
  if (state.phase !== "answer") return;
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
  const qs = leftoverQs().slice(0, LOCKDOWN_N);
  if (qs.length < LOCKDOWN_N) {
    continueRound();
    return;
  }
  qs.forEach((q) => state.spent.add(q.id));
  state.lockdown = {
    phase: "wager",
    playerId: hero.id,
    name: hero.name,
    qs,
    qi: 0,
    hits: 0,
    picked: -1,
    wagerLeft: WAGER_S,
    qLeft: 8,
    wagers: {},
    won: false,
  };
  state.phase = "lockdown";
  state.pose = "wait";
  paint();
  publish();
  state.players.filter((p) => !p.human && p.id !== hero.id).forEach((p) => {
    const amt = Math.min(100, Math.max(100, p.score || 100));
    const side = Math.random() < 0.55 ? "win" : "lose";
    applyWager(p.id, side, amt);
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

function applyWager(id, side, amount) {
  const ld = state.lockdown;
  if (!ld || ld.phase !== "wager") return;
  if (id === ld.playerId) return;
  const p = playerById(id);
  const amt = Math.min(amount, Math.max(100, p?.score || 100));
  ld.wagers[id] = { side, amount: amt, locked: true };
  paint();
  publish();
  maybeCloseWagers();
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
  ld.phase = "play";
  ld.qi = 0;
  ld.hits = 0;
  ld.picked = -1;
  ld.qLeft = 8;
  state.picked = -1;
  paint();
  publish();
  runLockdownClock();
}

function runLockdownClock() {
  stopTick();
  const ld = state.lockdown;
  if (!ld || ld.phase !== "play") return;
  ld.qLeft = 8;
  const hero = playerById(ld.playerId);
  if (hero && !hero.human) {
    state.tick = setTimeout(() => {
      const q = ld.qs[ld.qi];
      if (!q || state.lockdown?.phase !== "play") return;
      const i = Math.random() < aiCorrectChance(hero, q.tier) ? q.correctIndex : (q.correctIndex + 1 + Math.floor(Math.random() * 3)) % 4;
      lockdownPick(i, true);
    }, 1600);
    return;
  }
  state.tick = setInterval(() => {
    if (!state.lockdown || state.lockdown.phase !== "play") return;
    state.lockdown.qLeft -= 1;
    if (state.lockdown.qLeft <= 0) {
      stopTick();
      lockdownPick(-1, true);
    } else {
      const clock = $("#clock");
      if (clock) clock.textContent = clockText();
    }
  }, 1000);
}

function lockdownPick(i, forced = false) {
  const ld = state.lockdown;
  if (!ld || ld.phase !== "play") return;
  const isHero = state.youId === ld.playerId;
  if (!forced && !isHero) return;
  const q = ld.qs[ld.qi];
  if (!q) return;
  stopTick();
  const ok = i === q.correctIndex;
  ld.picked = i;
  state.picked = i;
  if (ok) ld.hits += 1;
  playSound(ok ? "correct" : "miss");
  state.pose = ok ? "win" : "loss";
  ld.phase = "flash";
  paint();
  setTimeout(() => {
    ld.qi += 1;
    ld.picked = -1;
    state.picked = -1;
    if (ld.qi >= LOCKDOWN_N) finishLockdown();
    else {
      ld.phase = "play";
      paint();
      publish();
      runLockdownClock();
    }
  }, 900);
}

function finishLockdown() {
  const ld = state.lockdown;
  if (!ld) return;
  stopTick();
  ld.won = ld.hits >= LOCKDOWN_WIN_AT;
  ld.phase = "result";
  if (ld.won) addScore(ld.playerId, ld.hits * LOCKDOWN_Q);
  Object.entries(ld.wagers).forEach(([id, w]) => {
    const hit = (w.side === "win" && ld.won) || (w.side === "lose" && !ld.won);
    addScore(id, hit ? w.amount : -w.amount);
  });
  state.pose = ld.won ? "win" : "loss";
  paint();
  publish();
  setTimeout(() => continueRound(), 1800);
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
  const line = state.players.map((p) => `${p.name} $${p.score}`).join(" · ");
  return `<span class="chip scores">${escapeHtml(line)}</span>`;
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
  if (!ld || ld.phase !== "wager") return "";
  const mine = ld.wagers[state.youId];
  const isHero = state.youId === ld.playerId;
  if (isHero) {
    return `<div class="wager"><p class="wager-copy">${tt("lockdownWagerHero", ld.wagerLeft)}</p></div>`;
  }
  return `<div class="wager">
    <p class="wager-copy">${tt("lockdownWagerOpp", escapeHtml(ld.name))}</p>
    <div class="wager-row">
      <button type="button" class="side ${mine?.side === "win" ? "on" : ""}" data-side="win">${tt("win")}</button>
      <button type="button" class="side lose ${mine?.side === "lose" ? "on" : ""}" data-side="lose">${tt("lose")}</button>
    </div>
    <div class="wager-row">
      ${WAGER_AMTS.map((n) =>
        `<button type="button" class="amt ${mine?.amount === n ? "on" : ""}" data-amt="${n}">$${n}</button>`
      ).join("")}
    </div>
    <p class="meta">${mine?.locked ? tt("lockedSide", mine.side, mine.amount) : tt("twoTaps")}</p>
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
          ${dirAcc("map", "MAP", "<small>During the read</small>", `
            <p class="dir-copy">During the 10-second read, tap a rival once. Stake = this question. If you buzz first and hit it, you bank <b>double</b> and they lose the stake. Miss, and you lose the stake. If someone else buzzes, MAP is off.</p>
          `)}
          ${dirAcc("lock", "Lockdown", "<small>Twice a show</small>", `
            <p class="dir-copy">Twice per show, after a correct buzz. That player plays <b>5</b>. Opponents tap WIN or LOSE and $100 / $500 / $1,000. Sixty seconds, or it skips ahead when everyone has locked. 4/5 pays WIN even money; otherwise LOSE pays. Those five bank at <b>$500 each</b> only if they clear the set.</p>
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
  state.lobbyOpen = "room";
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

function profileBody() {
  const p = state.profile || {};
  const belt = BELT_META[p.belt || "white"];
  const ab = p.abilityTier ? ABILITY_META[p.abilityTier] : null;
  return `
    <label class="field" for="nm">${tt("name")}</label>
    <input id="nm" type="text" value="${escapeHtml(p.displayName || "")}" maxlength="18" autocomplete="nickname"/>
    <label class="field" for="em">${tt("email")}</label>
    <input id="em" type="email" value="${escapeHtml(p.email || "")}" maxlength="120" autocomplete="email" placeholder="${tt("optional")}"/>
    <label class="field" for="th">${tt("photo")}</label>
    <div class="thumb-row">
      ${p.thumb ? `<img class="thumb" src="${p.thumb}" alt=""/>` : `<span class="thumb empty"></span>`}
      <input id="th" type="file" accept="image/*"/>
    </div>
    <p class="meta">${escapeHtml(tt("beltCareer", belt.label, ab ? ab.label : "", p.stats?.totalPoints || 0))}</p>
  `;
}

function dojoBody() {
  const p = state.profile;
  const placed = isPlaced();
  const d = state.dojo;
  if (d && d.q && !d.done) {
    const n = d.answers.length + 1;
    const reveal = d.picked >= 0;
    const showAns = Boolean(d.showAnswers);
    return `
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
    `;
  }
  if (placed) {
    const ab = ABILITY_META[p.abilityTier] || ABILITY_META.bronze;
    return `
      <p class="meta">${escapeHtml(tt("abilityRetake", ab.label, formatDue(p.nextPlacementDueAt)))}</p>
      <button class="ghost" id="retake" type="button">${tt("retakeDojo")}</button>
    `;
  }
  return `
    <p class="meta">${tt("dojoIntro")}</p>
    <button class="primary" id="dojoGo" type="button">${tt("startDojo")}</button>
  `;
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

  if (pad || mode === "join") {
    return `
      ${roomModeButtons()}
      <p class="dir-copy"><b>${tt("joinCopy")}</b></p>
      <label class="field" for="nm">${tt("yourName")}</label>
      <input id="nm" type="text" value="${escapeHtml(state.name)}" maxlength="18" autocomplete="nickname"/>
      <label class="field" for="jc">${tt("tvRoomCode")}</label>
      <input id="jc" type="text" value="${escapeHtml(state.room || state.joinInput)}" maxlength="8" placeholder="XXXX" autocomplete="off" autocapitalize="characters"/>
      <p class="meta">${tt("joinGateMeta")}</p>
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
    <label class="toggle">
      <input id="os" type="checkbox" ${state.onScreen ? "checked" : ""} ${forcedDisplay ? "disabled" : ""}/>
      <span>${tt("onScreen")}</span>
    </label>`}
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
    ` : `<p class="meta">${tt("offScreenHint")}</p>`}
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
  const goOff = Boolean(gate) && !(tv && (mode === "host" || mode === "cast"));
  const goLabel = goOff
    ? (!hasPhoneProfile() ? tt("profileFirst") : tt("dojoFirst"))
    : lobbyGoLabel();
  const d = state.dojo;
  const dojoLive = Boolean(d && d.q && !d.done);
  const dojoExtra = dojoLive
    ? `<small>${d.answers.length}/${PLACE_N}</small>`
    : (placed ? `<small>${escapeHtml((ab && ab.label) || tt("placed"))}</small>` : `<small>${tt("required")}</small>`);
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
        <div class="accord">
          ${tv || dojoLive ? "" : acc("profile", tt("profile"), `<small>${escapeHtml(belt.label)}${ab ? " · " + ab.label : ""}</small>`, profileBody())}
          ${tv || pad ? "" : acc("dojo", tt("dojo"), dojoExtra, dojoBody())}
          ${dojoLive && !tv ? "" : acc("room", joining ? tt("joinTv") : (mode === "cast" ? tt("castTv") : tt("room")), `<small>${joining ? (state.room || "code") : state.playerCount + " seats"}</small>`, roomBody())}
          ${pad || tv || dojoLive ? "" : acc("set", tt("set"), "", setBody())}
        </div>
        <div class="row">
          <button class="primary" id="go" type="button" ${goOff ? "disabled" : ""}>${goLabel}</button>
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
        return `<span class="seat ${on ? "human" : "bot"}">${escapeHtml(g.name)}${on ? tt("phoneReady") : ""}</span>`;
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
  const pad = state.onScreen && role === "pad";
  const ld = state.lockdown;
  const readyPhase = state.phase === "ready";
  const lockdownPlay = ld?.phase === "play" || ld?.phase === "flash";
  const showAns = ld
    ? lockdownPlay
    : ["buzz", "answer", "reveal"].includes(state.phase);
  const canBuzz = readyPhase
    ? (pad || !state.onScreen) && !state.readyIds[state.youId]
    : (!ld && (pad || !state.onScreen) && state.phase === "buzz" && !state.buzzed);
  const hero = ld ? ld.playerId === state.youId : true;
  const canPick = ld
    ? lockdownPlay && hero && ld.phase === "play"
    : state.phase === "answer" || (!state.onScreen && state.phase === "buzz");
  let prompt;
  if (readyPhase) prompt = "";
  else if (ld?.phase === "wager") prompt = `LOCKDOWN — ${ld.name} · ${tt("lockdownWagers")}`;
  else if (ld?.phase === "result") prompt = ld.won ? `${ld.name} cleared Lockdown ${ld.hits}/5.` : `${ld.name} broke Lockdown ${ld.hits}/5.`;
  else if (!q) prompt = tt("showEnd");
  else if (pad && !lockdownPlay) prompt = state.phase === "read" ? tt("padRead") : tt("padBuzz");
  else prompt = escapeHtml(q.prompt);
  const cat = readyPhase
    ? tt("ready")
    : (ld
      ? `Lockdown · ${ld.phase === "play" || ld.phase === "flash" ? `${ld.qi + 1}/${LOCKDOWN_N}` : ld.phase}`
      : (q && !pad ? escapeHtml(q.categoryTitle) : (pad ? tt("yourPad") : "")));
  const tier = readyPhase ? "READY" : (ld ? "LOCKDOWN" : (q ? q.tier.toUpperCase() : "END"));
  const n = readyPhase || ld ? "" : ` · ${state.i + 1}/${state.qs.length || ROUND}`;
  const buzzLabel = readyPhase
    ? (state.readyIds[state.youId] ? tt("ready") : tt("buzzReady"))
    : tt("buzz");
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI % STUDIOS.length]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>${tier}${n}</small></div>
      <div class="grow"></div>
      ${readyPhase ? "" : scoreboard()}
      <button class="word" id="rulesBtn" type="button">${tt("rules")}</button>
      <button class="word" id="quit" type="button">${tt("lobby")}</button>
    </div>
    <div class="play">
      ${readyPhase ? readyCardHTML() : `<div class="qwrap">
        <div class="qcard ${ld ? "lock" : ""} ${state.mapLive ? "map-on" : ""}">
          <p class="cat">${cat}</p>
          <p class="qtext">${prompt}</p>
          <p class="meta" id="clock">${clockText()}</p>
          ${rivalsHTML()}
        </div>
      </div>`}
      ${pad ? "" : `<div class="host"><img src="${POSE[state.pose] || POSE.idle}" alt="Jeremy" style="height:var(--host-h)"/></div>`}
    </div>
    ${readyPhase ? `<div></div>` : (ld?.phase === "wager" ? wagerHTML() : (showAns && q ? `<div class="answers">${q.choices.map((c, i) => {
      let cls = "ans";
      const picked = ld ? ld.picked : state.picked;
      const reveal = state.phase === "reveal" || ld?.phase === "flash" || ld?.phase === "result";
      if (reveal) {
        if (i === q.correctIndex) cls += " ok";
        else if (i === picked) cls += " bad";
      } else if (i === picked) cls += " on";
      const dis = canPick && !reveal ? "" : "disabled";
      return `<button class="${cls}" data-i="${i}" type="button" ${dis}><small>${LETTERS[i]}</small>${escapeHtml(c)}</button>`;
    }).join("")}</div>` : `<div></div>`))}
    <div class="buzzbar">
      ${!state.onScreen && !ld && !readyPhase ? `<div class="dock set-dock">
        <label class="slider-lab">${tt("jeremy")} <input id="hs" type="range" min="24" max="62" value="${state.hostH}" step="1"/></label>
        <label class="slider-lab">${tt("studio")} <input id="st" type="range" min="0" max="${STUDIOS.length - 1}" value="${state.studioI}" step="1"/></label>
      </div>` : ""}
      ${(pad || !tv) && !ld ? `<button class="buzzer ${canBuzz ? "lit" : ""} ${readyPhase && state.readyIds[state.youId] ? "ready-on" : ""}" id="buzz" type="button" ${canBuzz ? "" : "disabled"}>${buzzLabel}</button>` : ""}
      ${ld ? `<div class="lock-flag">${ld.phase === "wager" ? tt("lockdownWagers") : `${escapeHtml(ld.name)} · ${ld.hits} hit`}</div>` : ""}
      ${(pad && state.phase === "answer") ? `<button class="ghost mic" id="mic" type="button">${tt("speak")}</button>` : ""}
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
      if (id === "dojo" && state.lobbyOpen === "dojo" && !isTvDisplay() && needsPlacement(state.profile) && !state.dojo) startDojo();
      paint(true);
    };
  });
  document.querySelectorAll("[data-mp]").forEach((b) => {
    b.onclick = () => {
      state.mpMode = b.dataset.mp;
      localStorage.setItem("fa-mp", state.mpMode);
      state.statusMsg = "";
      if (state.mpMode === "join") {
        // Stay host UI until Join as buzzer succeeds — room form shows join fields.
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
  const os = $("#os");
  if (os) os.onchange = async (e) => {
    state.onScreen = e.target.checked;
    localStorage.setItem("fa-onscreen", state.onScreen ? "1" : "0");
    if (state.onScreen) await openRoom();
    paint(true);
  };
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
    state.statusMsg = "Set your phone profile name before joining.";
    state.lobbyOpen = "profile";
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
  const joined = await rooms("POST", { action: "join", code: state.room, name: state.name, id: state.youId });
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
    await joinAsBuzzer();
    return;
  }

  if (mode === "cast") {
    if (!isTvDisplay()) {
      const gate = lobbyGateReason();
      // Host phone generating a link for Silk still needs profile/placement for their seat.
      if (gate) {
        state.statusMsg = gate;
        state.lobbyOpen = !hasPhoneProfile() ? "profile" : "dojo";
        if (!hasPhoneProfile()) { paint(true); return; }
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
      state.lobbyOpen = !hasPhoneProfile() ? "profile" : "dojo";
      if (!hasPhoneProfile()) { paint(true); return; }
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
      if (!ld) return;
      const prev = ld.wagers[state.youId] || { amount: 100, side: "win" };
      const next = { side: b.dataset.side, amount: prev.amount };
      if (next.amount) applyWager(state.youId, next.side, next.amount);
      else {
        ld.wagers[state.youId] = next;
        paint();
      }
      if (bc) bc.postMessage({ type: "wager", id: state.youId, side: next.side, amount: next.amount });
      if (state.room) void rooms("POST", { action: "wager", code: state.room, id: state.youId, side: next.side, amount: next.amount });
    };
  });
  document.querySelectorAll("[data-amt]").forEach((b) => {
    b.onclick = () => {
      const ld = state.lockdown;
      if (!ld) return;
      const prev = ld.wagers[state.youId] || { side: "win" };
      applyWager(state.youId, prev.side || "win", Number(b.dataset.amt));
      if (bc) bc.postMessage({ type: "wager", id: state.youId, side: prev.side || "win", amount: Number(b.dataset.amt) });
      if (state.room) void rooms("POST", { action: "wager", code: state.room, id: state.youId, side: prev.side || "win", amount: Number(b.dataset.amt) });
    };
  });
  const bz = $("#buzz");
  if (bz) bz.onclick = () => buzz();
  const mic = $("#mic");
  if (mic) mic.onclick = listenVoice;
  const quit = $("#quit");
  if (quit) quit.onclick = () => {
    stopTick();
    clearAiBuzz();
    clearDojoTick();
    state.lockdown = null;
    state.phase = "lobby";
    state.readyIds = {};
    paint(true);
  };
  const force = $("#forceStart");
  if (force) force.onclick = () => {
    if (role === "pad" || state.phase !== "ready") return;
    startGame();
  };
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
      delete bot.skill;
      delete bot.buzzDelayMs;
    } else if (state.players.length < 12) {
      state.players.push({ id: g.id, name: g.name, score: 0, human: true, you: false });
    }
  });
}

function startGame() {
  seatPlayers();
  state.qs = deal(state.questions);
  state.spent = new Set(state.qs.map((q) => q.id));
  state.i = 0;
  state.lockdownAt = pickLockdownSlots();
  state.lockdown = null;
  state.maps = {};
  state.tally = { correct: 0, wrong: 0 };
  if (state.onScreen && !state.room) state.room = code();
  startPoll();
  startRead();
}

let poll = null;
let pollN = 0;
function startPoll() {
  if (poll) return;
  poll = setInterval(async () => {
    if (!state.room) return;
    const j = await rooms("GET");
    if (!j) return;
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
      // Also mark ready from guest flags if present
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
      const keep = state.name;
      const keepId = state.youId;
      const keepReady = { ...(state.readyIds || {}) };
      Object.assign(state, j.state);
      state.name = keep;
      state.youId = keepId;
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
      if (w.id && !state.lockdown.wagers[w.id]) applyWager(w.id, w.side, w.amount);
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
    state.studioI, state.hostH, state.maps[state.youId], state.mapLive, ld?.phase, ld?.qi, ld?.picked,
    state.rules, state.players.map((p) => p.score).join(","),
    state.lobbyOpen, state.playerCount, (state.guests || []).length,
    state.dojo?.answers?.length, state.dojo?.picked, state.dojo?.showAnswers, state.dojo?.readLeft,
    state.profile?.abilityTier, state.profile?.belt,
    state.dirOpen, state.qrOpen, state.mpMode, state.statusMsg, state.botFill, state.locale, Object.keys(state.readyIds || {}).filter((k) => state.readyIds[k]).join(","),
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
  if (needsPlacement(state.profile) && role !== "pad" && !tv) {
    state.lobbyOpen = "dojo";
    ensureDojo();
  } else {
    state.lobbyOpen = "room";
  }
  if (role === "pad") {
    state.onScreen = true;
    state.mpMode = "join";
    state.lobbyOpen = "room";
    if (joinCode) state.room = joinCode;
    startPoll();
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
