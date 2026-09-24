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
import { dropoutEndsGame, nextQuestionAllowsJoin } from "./lib/seat-rules.js";
import {
  orderShowSets,
  setBreakDue,
  tierRunLength,
  lockdownSlots,
  mapUsesLeft,
  MAP_USES_PER_ROUND,
  SET_BREAK_S,
} from "./lib/show-pace.js";
import { dealRamp } from "./lib/generation-deal.js";
import { slangFor } from "./q-and-a/bots/slang.js";
import { hashProfilePassword } from "./lib/password.js";
import { redactState } from "./lib/room-wire.js";
import { spreadByGeneration } from "./lib/generation-deal.js";
import {
  buildDeviceCohort,
  bankSignature,
  placementSlice,
  sittingsRemaining,
  PLACEMENT_SITTINGS,
  PLACEMENT_MANDATORY_YEARS,
  addYearsIso,
  placementMandatoryAt,
  placementIsDue,
} from "./lib/device-cohort.js";
import {
  PACK_TARGET,
  LOCKDOWN_REFRESHES,
  packSummary,
  lockdownSet,
  refreshLockdown,
  defaultGeneration,
  generationForAge,
  generationForYears,
  generationForSeat,
  bracketForAge,
  AGE_BRACKETS,
} from "./lib/generation-packs.js";
import {
  COUNTRIES,
  requiredAge,
  minAgeFor,
  ageIsAllowed,
  detectCountry,
  normalizeCountry,
} from "./lib/age-gate.js";
import { GENERATIONS, normalizeGeneration } from "./q-and-a/map.js";
import { LOUIS_MAIL } from "./q-and-a/louis-liberty.js";

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
const FLOW_URL = "/flow/index.html";
const PROFILE_KEY = "fa-profile-v1";
const RECENT_Q_KEY = "fa-recent-qids-v1";
const RECENT_Q_MAX = 240;
const READ_S = 10;
const PLACE_READ_S = 5;
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
const BELT_STEP = 10000;
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
const DOJO_BACKGROUNDS = [
  { id: "lantern", src: "/dojo/lantern-hall.jpg", labelKey: "bgLantern" },
  { id: "garden", src: "/dojo/garden-shoji.jpg", labelKey: "bgGarden" },
  { id: "night", src: "/dojo/night-tatami.jpg", labelKey: "bgNight" },
];
function dojoBackground(id) {
  return DOJO_BACKGROUNDS.find((b) => b.id === id) || DOJO_BACKGROUNDS[0];
}
function botAvatar(id) {
  return id ? `/bots/${id}.jpg` : "";
}

const TOPICS_KEY = "fa-topics";
const TOPIC_BANK_IDS = {
  "sci-fi": ["sci-fi"],
  "grand-tour-top-gear": ["grand-tour", "grand-tour-top-gear"],
  "gmg-brand": ["gmg", "gmg-brand"],
  "dj-gigi": ["dj-gigi"],
  geography: ["geography"],
  "film-tv": ["film-tv"],
  art: ["art"],
  "cars-motoring": ["cars", "cars-motoring"],
  music: ["music"],
  "current-culture": ["culture", "current-culture"],
};
const FALLBACK_TOPICS = [
  { id: "sci-fi", title: "Sci-Fi", blurb: "Space operas, robots, timelines that refuse to behave.", defaultOn: true },
  { id: "grand-tour-top-gear", title: "The Grand Tour & Top Gear", blurb: "Clarkson, May, Hammond, Amazon Prime — and the cars that survived them.", defaultOn: true },
  { id: "gmg-brand", title: "GMG Brand / music culture", blurb: "Montréal label lore, roster vibes, night-owl culture.", defaultOn: true },
  { id: "dj-gigi", title: "DJ Gigi", blurb: "Flagship artist — Easy tier only.", easyOnly: true, defaultOn: true },
  { id: "geography", title: "Geography", blurb: "Capitals, coasts, and places worth a detour.", defaultOn: true },
  { id: "film-tv", title: "Film & TV", blurb: "Screens big and small — general knowledge.", defaultOn: true },
  { id: "art", title: "Art", blurb: "Canvases, movements, and the odd scandal.", defaultOn: false },
  { id: "cars-motoring", title: "Cars & motoring", blurb: "Engines, marques, and road-trip folklore.", defaultOn: true },
  { id: "music", title: "Music", blurb: "Hits, history, and headphones at 2 a.m.", defaultOn: true },
  { id: "current-culture", title: "Current culture", blurb: "What’s buzzing — inspired by today’s chatter.", defaultOn: true },
];

const CELEB_BOTS = [
  { id: "oprah", name: "Oprah", generation: "baby-boomer", skill: 0.62, buzzDelayMs: [900, 2400], blurb: "Composed. Reads the room." },
  { id: "elton", name: "Elton", generation: "baby-boomer", skill: 0.55, buzzDelayMs: [1200, 3000], blurb: "Showy. Fashionably late." },
  { id: "serena", name: "Serena", generation: "gen-x", skill: 0.6, buzzDelayMs: [700, 1800], blurb: "Competitive. First strike." },
  { id: "usain", name: "Usain", generation: "gen-x", skill: 0.48, buzzDelayMs: [500, 1400], blurb: "Fastest buzz. Coin-flip answers." },
  { id: "adele", name: "Adele", generation: "gen-y", skill: 0.58, buzzDelayMs: [1100, 2600], blurb: "Holds the note." },
  { id: "idris", name: "Idris", generation: "gen-x", skill: 0.61, buzzDelayMs: [1000, 2200], blurb: "Cool under lights." },
  { id: "keanu", name: "Keanu", generation: "gen-alpha", skill: 0.5, buzzDelayMs: [1400, 3200], blurb: "Chill. Occasionally lethal." },
  { id: "zendaya", name: "Zendaya", generation: "gen-z", skill: 0.56, buzzDelayMs: [800, 2100], blurb: "Poised, then pounces." },
  { id: "rihanna", name: "Rihanna", generation: "multi-gen", skill: 0.52, buzzDelayMs: [750, 2000], blurb: "Works. Works. Works." },
  { id: "denzel", name: "Denzel", generation: "baby-boomer", skill: 0.64, buzzDelayMs: [1000, 2400], blurb: "Precision over panic." },
  { id: "meryl", name: "Meryl", generation: "silent-generation", skill: 0.66, buzzDelayMs: [1300, 2800], blurb: "Never first. Rarely wrong." },
];
const GEN_KEYS = {
  "silent-generation": "genSilent",
  "baby-boomer": "genBoomer",
  "gen-x": "genX",
  "gen-y": "genY",
  "gen-z": "genZ",
  "gen-alpha": "genAlpha",
  "multi-gen": "genMulti",
};

const $ = (s, r = document) => r.querySelector(s);
const params = new URLSearchParams(location.search);
let role = params.get("role") || (params.get("pad") ? "pad" : "host");
const joinCode = (params.get("room") || "").toUpperCase();
const isDirections =
  params.get("page") === "directions" ||
  /(?:^|\/)directions\.html$/i.test(location.pathname);
const isDojoPage =
  params.get("page") === "dojo" ||
  /(?:^|\/)dojo\.html$/i.test(location.pathname) ||
  /(?:^|\/)dojo\/?$/i.test(location.pathname);
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

function loadStoredTopicIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(TOPICS_KEY) || "null");
    if (Array.isArray(raw) && raw.length) return raw.map(String);
  } catch { /* ignore */ }
  return FALLBACK_TOPICS.filter((t) => t.defaultOn !== false).map((t) => t.id);
}

const state = {
  phase: "lobby",
  onScreen: forcedDisplay,
  /** Topics and question refresh stay up only while this phone is creating a room. */
  roomSetup: false,
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
  mapUses: {},
  mapLive: false,
  setBreakLeft: 0,
  setBreakTier: "",
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
  dojoScroll: "scores",
  genAlphaOpen: false,
  genAlphaAbout: "",
  genAlphaNote: "",
  reviewGen: "",
  dojo: null,
  seatBots: [],
  guests: [],
  tally: { correct: 0, wrong: 0 },
  joinInput: "",
  dirOpen: "tv",
  qrOpen: false,
  readyIds: {},
  mpMode: (role === "pad" || joinCode) ? "join" : (forcedDisplay ? "host" : "off"),
  statusMsg: "",
  placementQs: [],
  botFill: true,
  locale: loadStoredLocale(),
  activeRooms: [],
  leftPad: false,
  wagerDraft: null,
  lastAnswerAt: 0,
  /** Inline Create / Unlock on the Host / Cast card ("" | "create" | "unlock"). */
  roomDojoPanel: "",
  /** Open accordion on the locked phone game page. */
  playOpen: "ask",
  /** Join a live show as a player, or watch and leave anytime. */
  viewing: false,
  seatIntent: "play",
  joinOffer: null,
  pendingJoins: [],
  dropoutIds: {},
  /** Phone entry gate (name, email, password) before the lobby. */
  entered: false,
  entryDraft: null,
  /** Country the device timezone points at. Raises the profile age with the chosen country. */
  detectedCountry: "",
  countrySource: "",
  /** Confirm the profile email, then set a new on-device password. */
  forgotPassword: false,
  topicCatalog: [],
  topicsOn: loadStoredTopicIds(),
  dealFresh: false,
  /** Two show decks plus placement questions kept on this device. */
  cohort: null,
  cohortShow: 0,
  placementPool: null,
  /** Shared “questions are being refreshed” banner. phase: loading | ready. */
  refreshNotice: null,
  refreshNoticeAt: 0,
  refreshAppliedAt: 0,
  refreshHoldUntil: 0,
};

const bc = "BroadcastChannel" in window ? new BroadcastChannel("fast-answer") : null;
let poll = null;
let pollN = 0;
let refreshInFlight = false;
let refreshHoldTimer = null;

function tt(key, ...args) {
  return t(state.locale, key, ...args);
}

async function loadBanksForLocale(locale = state.locale, { bust = false } = {}) {
  const loc = normalizeLocale(locale);
  const q = bust ? `?t=${Date.now()}` : "";
  const bank = await fetch(questionsUrl(loc) + q).then((r) => {
    if (!r.ok) throw new Error("questions " + loc);
    return r.json();
  });
  const loaded = Array.isArray(bank) ? bank : (bank.questions || []);
  state.questions = loaded.map((q) => (q?.slang ? q : { ...q, slang: slangFor(q.generation, loc) }));
  try {
    const place = await fetch(placementUrl(loc) + q).then((r) => (r.ok ? r.json() : null));
    state.placementQs = Array.isArray(place?.questions) ? place.questions : [];
  } catch {
    state.placementQs = [];
  }
  if (!state.topicCatalog.length) {
    try {
      const rows = await fetch("/q-and-a/topics.json").then((r) => (r.ok ? r.json() : []));
      if (Array.isArray(rows) && rows.length) state.topicCatalog = rows;
    } catch { /* keep fallback */ }
    if (!state.topicCatalog.length) state.topicCatalog = FALLBACK_TOPICS;
  }
  if (!Array.isArray(state.topicsOn) || !state.topicsOn.length) {
    state.topicsOn = state.topicCatalog.filter((t) => t.defaultOn !== false).map((t) => t.id);
  }
  document.documentElement.lang = loc;
  ensureCohort();
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
    state.dealFresh = false;
    if (state.dojo && state.dojo.q && !state.dojo.done) {
      clearDojoTick();
      state.dojo = null;
      if (
        needsPlacement(state.profile)
        && role !== "pad"
        && !isTvDisplay()
        && isProfileUnlocked()
      ) {
        if (isDojoPage) ensureDojo();
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
  const code = String(roomCode || "").toUpperCase();
  const u = new URL("/", location.origin);
  u.searchParams.set("tv", "1");
  if (code) u.searchParams.set("room", code);
  return u.toString();
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
function newPasswordSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function sealPassword(pw) {
  const passwordSalt = newPasswordSalt();
  return { passwordSalt, passwordHash: hashProfilePassword(pw, passwordSalt) };
}
function clearStoredProfile() {
  try { localStorage.removeItem(PROFILE_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem("fa-name"); } catch { /* ignore */ }
  try { sessionStorage.removeItem("fa-entered"); } catch { /* ignore */ }
  try { sessionStorage.removeItem("fa-dojo-mode"); } catch { /* ignore */ }
}
function applyProfileReset() {
  clearStoredProfile();
  state.name = "";
  state.profile = seedProfile();
  state.profile.displayName = "";
  state.profile.email = "";
  state.profile.passwordHash = "";
  state.entered = false;
  state.profileUnlocked = false;
  state.dojoMode = "create";
  state.entryDraft = null;
  state.roomDojoPanel = "";
  state.forgotPassword = false;
  state.statusMsg = tt("profileReset");
}
async function saveForgotPassword(email, pw, pw2) {
  if (!hasPhoneProfile() || !state.profile?.email) {
    state.forgotPassword = false;
    state.statusMsg = tt("forgotNoProfile");
    paint(true);
    return;
  }
  const stored = String(state.profile.email || "").trim().toLowerCase();
  const typed = String(email || "").trim().toLowerCase();
  if (!validEmail(typed) || typed !== stored) {
    state.statusMsg = tt("forgotEmailMismatch");
    paint(true);
    return;
  }
  if (String(pw || "").length < 4) {
    state.statusMsg = tt("passwordHint");
    paint(true);
    return;
  }
  if (pw !== pw2) {
    state.statusMsg = tt("passwordMismatch");
    paint(true);
    return;
  }
  const sealed = sealPassword(pw);
  saveProfile(sealed);
  state.forgotPassword = false;
  state.profileUnlocked = true;
  state.dojoMode = "home";
  state.roomDojoPanel = "";
  state.statusMsg = tt("passwordSaved");
  markEntered();
  if (isDojoPage && needsPlacement(state.profile)) startDojo();
  else paint(true);
}
function forgotPasswordHTML() {
  return `
    <p class="dir-copy"><b>${tt("forgotPassword")}</b></p>
    <p class="meta">${tt("forgotLead")}</p>
    <label class="field" for="forgotEmail">${tt("email")}</label>
    <input id="forgotEmail" type="email" value="${escapeHtml(state.profile?.email || "")}" maxlength="120" autocomplete="email"/>
    <label class="field" for="forgotPw">${tt("newPassword")}</label>
    <input id="forgotPw" type="password" maxlength="64" autocomplete="new-password" placeholder="${tt("passwordHint")}"/>
    <label class="field" for="forgotPw2">${tt("confirmPassword")}</label>
    <input id="forgotPw2" type="password" maxlength="64" autocomplete="new-password"/>
    <button class="primary" id="saveForgot" type="button">${tt("saveNewPassword")}</button>
    <button class="ghost" id="cancelForgot" type="button">${tt("cancel")}</button>
  `;
}
function bindForgotPassword() {
  const open = $("#forgotPassword");
  if (open) open.onclick = () => {
    state.forgotPassword = true;
    state.statusMsg = "";
    paint(true);
  };
  const cancel = $("#cancelForgot");
  if (cancel) cancel.onclick = () => {
    state.forgotPassword = false;
    state.statusMsg = "";
    paint(true);
  };
  const save = $("#saveForgot");
  if (save) save.onclick = () => {
    void saveForgotPassword(
      $("#forgotEmail") && $("#forgotEmail").value,
      $("#forgotPw") && $("#forgotPw").value,
      $("#forgotPw2") && $("#forgotPw2").value,
    );
  };
}
function maybeResetProfile() {
  // Only an explicit ?reset=1 clears the on-device profile.
  // A first visit must not wipe belts, scores, placement, or the saved password.
  let fromQuery = false;
  try {
    const u = new URL(location.href);
    if (u.searchParams.get("reset") === "1") {
      fromQuery = true;
      u.searchParams.delete("reset");
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    }
  } catch { /* ignore */ }
  if (fromQuery) applyProfileReset();
}
async function verifyProfilePassword(pw) {
  const want = state.profile?.passwordHash;
  if (!want) return false;
  const got = hashProfilePassword(pw, state.profile?.passwordSalt || "");
  return got === want;
}
async function copyText(value) {
  const text = String(value || "");
  const attempt = (async () => {
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
  })();
  // A clipboard permission prompt must not freeze the room list.
  const timed = new Promise((resolve) => setTimeout(() => resolve(false), 500));
  return Promise.race([attempt, timed]);
}
function humanPads() {
  return (state.guests || []).filter((g) => g && g.id && g.seat !== "view");
}
function humanPlayerIds() {
  return (state.players || []).filter((p) => p && p.human).map((p) => p.id);
}
function canLeaveNow() {
  if (state.viewing) return true;
  return state.phase === "lobby" || state.phase === "ready" || state.phase === "end";
}
function isSeatedPlay() {
  if (state.viewing) return false;
  if (role !== "pad") return true;
  if ((state.players || []).some((p) => p.id === state.youId || (p.you && p.name === state.name))) return true;
  // A joined phone is the buzzer even before the host copies that seat into the show.
  return state.seatIntent !== "view" && Boolean(state.youId);
}
function allPadsReady() {
  const pads = humanPads();
  const hostPlays = role !== "pad" && !state.onScreen && !isTvDisplay();
  if (!pads.length && !hostPlays) return false;
  if (hostPlays && !state.readyIds[state.youId]) return false;
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
/** Prefer unseen ids, and keep every Q-and-A generation in the tier when stock allows. */
function sampleByTier(all, tier, need, recentSet) {
  const pool = all.filter((q) => q.tier === tier);
  if (!pool.length || need <= 0) return [];
  const recentOrder = loadRecentQuestionIds();
  const rank = new Map(recentOrder.map((id, i) => [id, i]));
  return spreadByGeneration(pool, need, {
    isRecent: (q) => recentSet.has(q.id),
    rank: (q) => rank.get(q.id) ?? 9999,
    shuffle,
  }).map(shuffleQuestionChoices);
}
function generationCount(list) {
  return new Set((list || []).map((q) => String(q?.generation || "").trim()).filter(Boolean)).size;
}
function topicCatalog() {
  return state.topicCatalog.length ? state.topicCatalog : FALLBACK_TOPICS;
}
function bankIdsForTopic(id) {
  return TOPIC_BANK_IDS[id] || [id];
}
function selectedBankTopics() {
  const allowed = new Set();
  for (const id of state.topicsOn || []) {
    for (const bank of bankIdsForTopic(id)) allowed.add(bank);
  }
  return allowed;
}
function inSelectedTopics(q) {
  const allowed = selectedBankTopics();
  if (!allowed.size) return true;
  return allowed.has(String(q.topic || "").toLowerCase());
}
function questionsForDeal(all) {
  const preferred = (all || []).filter(inSelectedTopics);
  return preferred.length ? preferred : (all || []);
}
function topicDealKey() {
  return (state.topicsOn || []).slice().sort().join(",");
}
function deal(all) {
  const recent = new Set(loadRecentQuestionIds());
  const preferred = questionsForDeal(all);
  const take = (tier, need) => {
    const first = sampleByTier(preferred, tier, need, recent);
    if (first.length >= need || preferred === all) return first;
    const have = new Set(first.map((q) => q.id));
    const rest = sampleByTier((all || []).filter((q) => !have.has(q.id)), tier, need - first.length, recent);
    return [...first, ...rest];
  };
  return [
    ...take("easy", DEAL.easy),
    ...take("hard", DEAL.hard),
    ...take("difficult", DEAL.difficult),
    ...take("extreme", DEAL.extreme),
  ];
}
function refreshPlayerName() {
  return String(state.profile?.displayName || state.name || "TV").trim().slice(0, 40) || "TV";
}
function armRefreshHold() {
  if (state.refreshHoldUntil && Date.now() < state.refreshHoldUntil) return;
  state.refreshHoldUntil = Date.now() + 1600;
  if (refreshHoldTimer) clearTimeout(refreshHoldTimer);
  refreshHoldTimer = setTimeout(() => paint(true), 1650);
}
function broadcastRefresh() {
  if (!bc || !state.refreshNotice) return;
  bc.postMessage({
    type: "refresh-notice",
    notice: state.refreshNotice,
    refreshQs: state.refreshNotice.phase === "ready" ? (state.qs || []) : [],
  });
}
function adoptRefreshQuestions(questions, at) {
  if (!Array.isArray(questions) || !questions.length) return false;
  if (state.phase !== "lobby" && state.phase !== "ready") return false;
  if (state.refreshAppliedAt === at) return false;
  if (state.qs?.length) rememberDealtIds(state.qs.map((q) => q.id));
  state.qs = questions;
  state.dealFresh = true;
  state.dealTopicKey = topicDealKey();
  state.refreshAppliedAt = at;
  return true;
}
/** Apply a room refresh notice. Contestants in the lobby pick up the new set. */
function applyRefreshFromRoom(room) {
  const notice = room?.notice;
  if (!notice || notice.kind !== "refresh") return false;
  const at = Number(notice.at) || 0;
  const prevAt = Number(state.refreshNoticeAt) || 0;
  const phase = notice.phase === "ready" ? "ready" : "loading";
  if (at && at < prevAt) return false;
  if (at === prevAt && state.refreshNotice?.phase === phase) {
    if (phase !== "ready" || state.refreshAppliedAt === at) return false;
  }
  state.refreshNotice = {
    kind: "refresh",
    by: String(notice.by || "Player").slice(0, 40),
    phase,
    at,
  };
  state.refreshNoticeAt = at;
  armRefreshHold();
  if (phase === "ready") adoptRefreshQuestions(room.refreshQs, at);
  return true;
}
const COHORT_KEY = "fa-cohort-v1";
function readCohortBag() {
  try {
    const all = JSON.parse(localStorage.getItem(COHORT_KEY) || "{}");
    return all && typeof all === "object" ? all : {};
  } catch {
    return {};
  }
}
function readStoredCohort(locale) {
  const row = readCohortBag()[locale];
  return row && row.v === 2 ? row : null;
}
function writeStoredCohort(cohort) {
  if (!cohort?.locale) return;
  let all = {};
  try { all = JSON.parse(localStorage.getItem(COHORT_KEY) || "{}") || {}; } catch { all = {}; }
  all[cohort.locale] = cohort;
  try { localStorage.setItem(COHORT_KEY, JSON.stringify(all)); } catch { /* quota */ }
}
function cohortUsable(cohort, signature) {
  if (!cohort || cohort.v !== 2 || cohort.locale !== state.locale) return false;
  if (cohort.signature !== signature) return false;
  if (!(Date.parse(cohort.renewsAt) > Date.now())) return false;
  if (!cohort.packs) return false;
  return GENERATIONS.every((g) => Array.isArray(cohort.packs[g]));
}
function ensureCohort() {
  if (!state.questions?.length) return state.cohort;
  const signature = bankSignature(state.questions, state.placementQs);
  const saved = state.cohort?.locale === state.locale ? state.cohort : readStoredCohort(state.locale);
  if (cohortUsable(saved, signature)) {
    state.cohort = saved;
    return saved;
  }
  const prior = readCohortBag()[state.locale] || null;
  const built = buildDeviceCohort(state.questions, state.placementQs, state.locale);
  if (prior && prior.signature === signature && prior.builtAt) {
    built.builtAt = prior.builtAt;
    built.renewsAt = prior.renewsAt || built.renewsAt;
  }
  built.shows = built.shows.map((deck) => deck.map(shuffleQuestionChoices));
  built.placement = (built.placement || []).map(shuffleQuestionChoices);
  built.packs = Object.fromEntries(
    GENERATIONS.map((g) => [g, (built.packs[g] || []).map(shuffleQuestionChoices)]),
  );
  const summary = packSummary(built.packs);
  built.counts = summary.counts;
  built.held = summary.held;
  state.cohort = built;
  state.cohortShow = 0;
  writeStoredCohort(built);
  return built;
}
function genLabel(g) {
  const key = GEN_KEYS[normalizeGeneration(g)];
  return key ? tt(key) : "";
}
function questionCredit(q) {
  if (!q) return "";
  const gen = genLabel(q.fromGeneration || q.generation);
  if (q.fromPlayer && gen) return `${gen} · ${q.fromPlayer}`;
  return gen || "";
}
function playerGeneration(profile) {
  return generationForSeat(profile) || defaultGeneration(profile?.id || "you");
}
function readGeneration(el) {
  const g = normalizeGeneration(el && el.value);
  return GENERATIONS.includes(g) ? g : "";
}
function readAge(el) {
  const v = String((el && el.value) || "");
  return AGE_BRACKETS.includes(v) ? v : "";
}
function readCountry(el) {
  if (!el) return "";
  if (el.type === "radio") {
    const picked = document.querySelector(`input[name="${el.name}"]:checked`);
    return normalizeCountry(picked && picked.value);
  }
  return normalizeCountry(el.value);
}
function readYears(el) {
  const raw = String((el && el.value) || "").trim();
  if (!raw) return "";
  const n = Number(raw);
  return Number.isInteger(n) ? n : "";
}
function ageFormPrefix() {
  if ($("#entryAgeYears")) return "entryAge";
  if ($("#playerAgeYears")) return "playerAge";
  if ($("#roomPlayerAgeYears")) return "roomPlayerAge";
  return "";
}
function readAgeForm(prefix) {
  const id = prefix || ageFormPrefix();
  if (!id) return { age: "", country: "" };
  return {
    age: readYears($(`#${id}Years`)),
    country: readCountry($(`#${id}Country`)),
  };
}
function ageLimitPlace(chosen, detected) {
  const picked = normalizeCountry(chosen);
  const seen = normalizeCountry(detected);
  if (seen && minAgeFor(seen) > minAgeFor(picked || "OTHER")) return countryName(seen);
  return countryName(picked || seen || "OTHER");
}
function countryName(id) {
  const key = `country${normalizeCountry(id) || "Other"}`;
  const label = tt(key);
  return label === key ? "" : label;
}
function bindAgeToPack(prefix, genSel, opts = {}) {
  const years = document.querySelector(`#${prefix}Years`);
  const country = document.querySelector(`[data-country-for="${prefix}"]`);
  if (!years || !country) return;
  const apply = () => {
    const detected = state.detectedCountry || "";
    const chosen = readCountry(document.querySelector(`#${prefix}Country`));
    const age = readYears(years);
    const min = requiredAge(chosen, detected);
    years.min = String(min);
    const note = document.querySelector(`[data-pack-for="${prefix}"]`);
    const gate = document.querySelector(`[data-age-gate="${prefix}"]`);
    const place = ageLimitPlace(chosen, detected);
    if (gate) {
      gate.textContent = Number.isInteger(age) && age < min
        ? tt("ageTooYoung", min, place)
        : tt("ageNeed", min, place);
    }
    const gen = Number.isInteger(age) && age >= min ? generationForYears(age) : "";
    if (genSel) {
      const sel = document.querySelector(genSel);
      if (sel && gen) sel.value = gen;
    }
    if (note) note.textContent = gen ? tt("packFromAge", genLabel(gen)) : "";
    if (opts.save !== false && gen && state.profileUnlocked && hasPhoneProfile()) {
      saveProfile({
        age,
        country: chosen,
        detectedCountry: detected,
        ageBracket: bracketForAge(age),
        generation: gen,
      });
    }
    if (opts.after) opts.after();
  };
  years.oninput = apply;
  country.onchange = apply;
}
function ageBracketHTML(id, profile) {
  const p = profile && typeof profile === "object" ? profile : { ageBracket: profile };
  const detected = normalizeCountry(p.detectedCountry || state.detectedCountry);
  const country = normalizeCountry(p.country) || detected || "OTHER";
  const min = requiredAge(country, detected);
  const age = Number.isInteger(Number(p.age)) ? Number(p.age) : "";
  const gen = age !== "" && age >= min ? generationForYears(age) : generationForAge(p.ageBracket);
  const place = ageLimitPlace(country, detected);
  const identified = detected
    ? tt(state.countrySource === "ip" ? "countryIdentified" : "countryFromDevice", countryName(detected))
    : tt("countryChoose");
  return `
    <fieldset class="country-access" data-country-for="${id}">
      <legend class="field">${tt("country")}</legend>
      <p class="meta">${escapeHtml(identified)}</p>
      ${COUNTRIES.map((c) => `<label class="country-opt">
        <input type="radio" name="${id}Country" value="${c}" ${c === country ? `id="${id}Country" checked` : ""}/>
        <span>${escapeHtml(tt("country" + c))}</span>
        <small>${escapeHtml(tt("countryAge", minAgeFor(c)))}</small>
      </label>`).join("")}
    </fieldset>
    <label class="field" for="${id}Years">${tt("ageYears")}</label>
    <input id="${id}Years" type="number" inputmode="numeric" min="${min}" max="120" value="${age === "" ? "" : age}" />
    <p class="meta" data-age-gate="${id}">${escapeHtml(tt("ageNeed", min, place))}</p>
    <p class="meta" data-pack-for="${id}">${gen ? escapeHtml(tt("packFromAge", genLabel(gen))) : ""}</p>`;
}
function generationSelectHTML(id, selected, ageOrBracket) {
  const years = Number(ageOrBracket);
  const fromYears = Number.isInteger(years) && years >= 10 && years <= 120 ? generationForYears(years) : "";
  const bracket = fromYears ? "" : (AGE_BRACKETS.includes(ageOrBracket) ? ageOrBracket : "30s");
  const fromAge = fromYears || generationForAge(bracket);
  const current = fromAge || (GENERATIONS.includes(normalizeGeneration(selected))
    ? normalizeGeneration(selected)
    : playerGeneration(state.profile));
  return `
    <label class="field" for="${id}">${tt("yourGeneration")}</label>
    <select class="gen-select" id="${id}" disabled>
      ${GENERATIONS.map((g) => `<option value="${g}" ${g === current ? "selected" : ""}>${escapeHtml(genLabel(g))}</option>`).join("")}
    </select>`;
}
function playersForDeal() {
  if (Array.isArray(state.players) && state.players.length && state.phase !== "lobby" && state.phase !== "ready") {
    return state.players;
  }
  fillSeats();
  return seatedPreview();
}
function dealFromPacks() {
  const players = playersForDeal().map((p) => ({
    ...p,
    ageBracket: p.ageBracket || "",
    generation: generationForSeat(p) || defaultGeneration(p.id || p.name),
  }));
  const avoid = loadRecentQuestionIds();
  let result = dealRamp(state.questions, {
    seats: players,
    avoid,
    allow: (q) => inSelectedTopics(q),
  });
  if (result.length < Math.min(ROUND, 8)) {
    result = dealRamp(state.questions, { seats: players, avoid });
  }
  if (!result.length) result = deal(state.questions);
  return orderShowSets(attributeSeats(result, players));
}
function attributeSeats(questions, players) {
  const cursors = {};
  return (questions || []).map((q) => {
    const gen = q.generation || "";
    const matches = (players || []).filter((p) => (generationForSeat(p) || p.generation) === gen);
    const pool = matches.length ? matches : (players || []);
    const at = cursors[gen] || 0;
    cursors[gen] = at + 1;
    const seat = pool.length ? pool[at % pool.length] : null;
    return {
      ...q,
      choices: Array.isArray(q.choices) ? [...q.choices] : q.choices,
      fromGeneration: gen,
      fromPlayer: seat ? String(seat.name || "") : "",
    };
  });
}
function buildLockdownQuestions(avoidIds) {
  const cohort = ensureCohort();
  const prepared = cohort?.lockdownPrepared;
  if (Array.isArray(prepared) && prepared.length >= LOCKDOWN_N) return prepared.slice(0, LOCKDOWN_N);
  const players = playersForDeal();
  const qs = lockdownSet(players, cohort?.packs, avoidIds, LOCKDOWN_N, {
    refreshes: cohort?.lockdownRefreshes || 0,
  });
  if (qs.length >= LOCKDOWN_N) return qs;
  return leftoverQs(true).slice(0, LOCKDOWN_N);
}
function hostCanSetup() {
  return Boolean(state.roomSetup) && role !== "pad" && state.mpMode !== "join";
}
function refreshLockdownQuestions() {
  if (!hostCanSetup()) return;
  const cohort = ensureCohort();
  if (!cohort?.packs) return;
  const players = playersForDeal();
  const avoid = [
    ...((state.lockdown?.qs) || []).map((q) => q.id),
    ...((state.qs) || []).map((q) => q.id),
  ];
  const result = refreshLockdown({
    refreshes: cohort.lockdownRefreshes || 0,
    packs: cohort.packs,
    players,
    avoidIds: avoid,
    n: LOCKDOWN_N,
  });
  cohort.packs = result.packs;
  const summary = packSummary(result.packs);
  cohort.counts = summary.counts;
  cohort.held = summary.held;
  cohort.lockdownRefreshes = result.refreshes;
  if (result.questions.length) cohort.lockdownPrepared = result.questions;
  if (result.shuffled) cohort.packCursors = {};
  state.cohort = cohort;
  writeStoredCohort(cohort);
  const ld = state.lockdown;
  if (ld && (ld.phase === "wager" || ld.phase === "intro") && result.questions.length) {
    if (ld.phase === "wager" || ld.qi === 0) {
      ld.qs = result.questions.slice(0, LOCKDOWN_N);
      ld.qi = 0;
      ld.picked = -1;
      state.picked = -1;
    } else {
      const done = (ld.qs || []).slice(0, ld.qi);
      const rest = result.questions.filter((q) => !done.some((d) => d.id === q.id));
      ld.qs = [...done, ...rest].slice(0, LOCKDOWN_N);
      ld.picked = -1;
      state.picked = -1;
    }
  }
  state.statusMsg = result.shuffled
    ? tt("packsShuffled")
    : tt("lockdownRefreshed", result.refreshes, LOCKDOWN_REFRESHES);
  paint(true);
  publish();
}
function lockdownRefreshButton() {
  if (!hostCanSetup()) return "";
  const used = Number(state.cohort?.lockdownRefreshes) || 0;
  const label = used >= LOCKDOWN_REFRESHES ? tt("shufflePacks") : tt("lockdownRefresh");
  return `<button class="ghost js-refresh-lock" type="button">${escapeHtml(label)}</button>`;
}
function currentShowDeck() {
  const cohort = ensureCohort();
  const i = state.cohortShow === 1 ? 1 : 0;
  const deck = cohort?.shows?.[i];
  if (deck?.length) return deck.map((q) => ({ ...q, choices: [...q.choices] }));
  return deal(state.questions);
}
function flipShowDeck() {
  const cohort = ensureCohort();
  state.cohortShow = state.cohortShow === 1 ? 0 : 1;
  const deck = cohort?.shows?.[state.cohortShow];
  if (!deck?.length) return deal(state.questions);
  return deck.map((q) => ({ ...q, choices: [...q.choices] }));
}
function placementAttemptsLeft() {
  if (placementIsDue(state.profile)) return PLACEMENT_SITTINGS;
  const cohort = state.cohort || ensureCohort();
  return sittingsRemaining(
    state.profile?.placementSittingsUsed,
    cohort?.builtAt,
    state.profile?.cohortBuiltAt,
  );
}
function beginPlacementSitting() {
  const cohort = ensureCohort();
  const renewsAt = cohort?.renewsAt || addMonthsIso(new Date().toISOString(), 3);
  const mandatory = placementIsDue(state.profile);
  const left = placementAttemptsLeft();
  if (!mandatory && left <= 0) return { blocked: true, renewsAt };
  const usedSame = mandatory || state.profile?.cohortBuiltAt !== cohort?.builtAt
    ? 0
    : (Number(state.profile?.placementSittingsUsed) || 0);
  const pool = placementSlice(cohort?.placement?.length ? cohort.placement : state.placementQs, usedSame);
  saveProfile({
    cohortBuiltAt: cohort?.builtAt || "",
    placementSittingsUsed: usedSame + 1,
  });
  state.placementPool = pool;
  return { blocked: false, renewsAt, pool, left: left - 1 };
}
async function refreshQuestionSet() {
  if (refreshInFlight) return;
  refreshInFlight = true;
  const by = refreshPlayerName();
  if (state.qs?.length) rememberDealtIds(state.qs.map((q) => q.id));
  state.qs = dealFromPacks();
  state.dealFresh = true;
  state.dealTopicKey = topicDealKey();
  const at = Date.now();
  state.refreshNotice = { kind: "refresh", by, phase: "ready", at };
  state.refreshNoticeAt = at;
  state.refreshAppliedAt = at;
  armRefreshHold();
  const n = state.qs.length;
  state.statusMsg = tt("questionsRefreshed", n, state.questions.length, generationCount(state.qs));
  broadcastRefresh();
  paint(true);
  try {
    const inRoom = Boolean(state.room) && !isPad() && state.mpMode !== "join";
    if (inRoom) {
      const data = await rooms("POST", {
        action: "refresh",
        code: state.room,
        by,
        locale: state.locale,
        questions: state.qs,
      });
      if (data && !data.error && data.notice) applyRefreshFromRoom(data);
      broadcastRefresh();
      paint(true);
    }
  } finally {
    refreshInFlight = false;
  }
}
function refreshNoticeHTML() {
  const n = state.refreshNotice;
  if (!n?.by) return "";
  const holding = Date.now() < (state.refreshHoldUntil || 0);
  const text = n.phase !== "ready" || holding
    ? tt("questionsRefreshing", n.by)
    : tt("questionsRefreshedBy", n.by);
  return `<p class="refresh-note" role="status">${escapeHtml(text)}</p>`;
}
function questionRefreshHTML() {
  if (!hostCanSetup()) return "";
  const cohort = state.questions?.length ? ensureCohort() : state.cohort;
  const counts = cohort?.counts || packSummary(cohort?.packs || {}).counts;
  const chips = GENERATIONS.map((g) =>
    `<span>${escapeHtml(tt("packHeld", genLabel(g), counts[g] || 0, cohort?.target || PACK_TARGET))}</span>`
  ).join("");
  return `
    <div class="q-refresh">
      <button class="ghost js-refresh-qs" type="button">${tt("refreshQuestions")}</button>
      ${lockdownRefreshButton()}
      <p class="meta">${escapeHtml(tt("dealFromPacks"))}</p>
      <p class="meta pack-counts">${chips}</p>
    </div>`;
}
function pickLockdownSlots() {
  if ((state.qs?.length || 0) < 12) return [];
  return lockdownSlots(state.qs);
}
function leftoverQs(preferHard = false) {
  const recent = new Set(loadRecentQuestionIds());
  const selected = state.questions.filter((q) => !state.spent.has(q.id) && inSelectedTopics(q));
  const pool = selected.length ? selected : state.questions.filter((q) => !state.spent.has(q.id));
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
function fileToAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas"));
          return;
        }
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("image"));
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
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
  const n = Math.max(0, Math.floor(Number(pts) || 0));
  const index = Math.min(BELT_ORDER.length - 1, Math.floor(n / BELT_STEP));
  return BELT_ORDER[index];
}
function beltClimb(pts) {
  const points = Math.max(0, Math.floor(Number(pts) || 0));
  const index = Math.min(BELT_ORDER.length - 1, Math.floor(points / BELT_STEP));
  const belt = BELT_ORDER[index];
  const topped = index >= BELT_ORDER.length - 1;
  const into = points - index * BELT_STEP;
  const left = topped ? 0 : BELT_STEP - into;
  const next = topped ? belt : BELT_ORDER[index + 1];
  const pct = topped ? 100 : Math.max(0, Math.min(100, (into / BELT_STEP) * 100));
  return { belt, points, next, left, pct, topped };
}
function playerThumb(p) {
  if (!p) return "";
  if (p.thumb) return p.thumb;
  if (!p.human && p.id) return botAvatar(p.id);
  return "";
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
  return placementIsDue(p);
}
function mandatoryPlacementDue(p) {
  return placementMandatoryAt(p?.placementCompletedAt, p?.placementMandatoryAt);
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
    p.passwordSalt = String(p.passwordSalt || "");
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
    passwordSalt: "",
    stats: emptyStats(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
function validEmail(value) {
  const email = String(value || "").trim();
  return email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function entryReady(name, email, pw) {
  return String(name || "").trim().length > 0 && validEmail(email) && String(pw || "").length >= 4;
}
function entryIsExisting(name) {
  if (!hasPhoneProfile() || !state.profile?.passwordHash) return false;
  const typed = String(name || "").trim().toLowerCase();
  const stored = String(state.profile?.displayName || "").trim().toLowerCase();
  return Boolean(typed && stored && typed === stored);
}
function entryActionLabel(name) {
  return entryIsExisting(name) ? tt("enterProfile") : tt("createProfileBtn");
}
function needsEntryGate() {
  if (isDirections || forcedDisplay) return false;
  return !state.entered;
}
async function activateGameProfile(profile) {
  if (!profile?.email || !profile?.displayName) return;
  try {
    await fetch("/api/profiles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: profile.id,
        displayName: profile.displayName,
        email: profile.email,
        age: profile.age,
        country: profile.country,
        detectedCountry: profile.detectedCountry || state.detectedCountry || "",
      }),
    });
  } catch { /* lobby still opens if the list is unreachable */ }
}
function markEntered() {
  state.entered = true;
  state.profileUnlocked = true;
  try { sessionStorage.setItem("fa-entered", "1"); } catch { /* private mode */ }
  if (!isTvDisplay()) {
    state.mpMode = "join";
    state.lobbyOpen = "room";
    try { localStorage.setItem("fa-mp", "join"); } catch { /* ignore */ }
  }
}
async function commitNewProfile(name, email, pw) {
  const cleanName = String(name || "").trim().slice(0, 18);
  const cleanEmail = String(email || "").trim();
  if (!cleanName) {
    state.statusMsg = tt("gateProfile");
    paint(true);
    return false;
  }
  if (!validEmail(cleanEmail)) {
    state.statusMsg = tt("emailInvalid");
    paint(true);
    return false;
  }
  if (String(pw || "").length < 4) {
    state.statusMsg = tt("passwordHint");
    paint(true);
    return false;
  }
  const sealed = sealPassword(pw);
  const keepLegacy = Boolean(state.profile && !state.profile.passwordHash);
  const base = keepLegacy ? state.profile : seedProfile();
  state.profile = {
    ...base,
    id: base.id || uid(),
    displayName: cleanName,
    email: cleanEmail,
    passwordHash: sealed.passwordHash,
    passwordSalt: sealed.passwordSalt,
    createdAt: keepLegacy && base.createdAt ? base.createdAt : new Date().toISOString(),
  };
  const form = readAgeForm();
  const detected = state.detectedCountry || "";
  const min = requiredAge(form.country, detected);
  if (!ageIsAllowed(form.age, form.country, detected)) {
    state.statusMsg = tt("ageTooYoung", min, ageLimitPlace(form.country, detected));
    paint(true);
    return false;
  }
  const generation = generationForYears(form.age);
  saveProfile({
    displayName: cleanName,
    email: cleanEmail,
    passwordHash: sealed.passwordHash,
    passwordSalt: sealed.passwordSalt,
    age: form.age,
    country: form.country,
    detectedCountry: detected,
    ageBracket: bracketForAge(form.age),
    generation,
  });
  state.dojoMode = "home";
  state.roomDojoPanel = "";
  state.statusMsg = tt("profileCreated");
  state.entryDraft = null;
  markEntered();
  await activateGameProfile(state.profile);
  paint(true);
  return true;
}
function saveProfile(patch = {}) {
  const prev = state.profile || seedProfile();
  const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  next.stats = { ...emptyStats(), ...(prev.stats || {}), ...(patch.stats || {}) };
  next.belt = beltFromPoints(next.stats.totalPoints);
  next.displayName = String(next.displayName || "Player").trim().slice(0, 40) || "Player";
  next.email = String(next.email || "").trim().slice(0, 120);
  const generation = normalizeGeneration(next.generation);
  next.country = normalizeCountry(next.country);
  next.detectedCountry = normalizeCountry(next.detectedCountry || state.detectedCountry);
  const years = Number(next.age);
  if (Number.isInteger(years) && ageIsAllowed(years, next.country, next.detectedCountry)) {
    next.age = years;
    next.ageBracket = bracketForAge(years);
    next.generation = generationForYears(years);
  } else if (Number.isInteger(years)) {
    next.age = Number.isInteger(Number(prev.age)) ? Number(prev.age) : "";
    next.country = normalizeCountry(prev.country);
    next.ageBracket = AGE_BRACKETS.includes(String(prev.ageBracket || "")) ? String(prev.ageBracket) : "";
    next.generation = normalizeGeneration(prev.generation);
  } else {
    next.age = Number.isInteger(Number(prev.age)) ? Number(prev.age) : "";
    next.ageBracket = AGE_BRACKETS.includes(String(next.ageBracket || "")) ? String(next.ageBracket) : "";
    const fromAge = next.age !== "" ? generationForYears(next.age) : generationForAge(next.ageBracket);
    next.generation = fromAge || (GENERATIONS.includes(generation) ? generation : "");
  }
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
function pickPlacementQuestion(tier, exclude, seenGenerations) {
  const skip = new Set(exclude || []);
  const seen = seenGenerations instanceof Set ? seenGenerations : new Set();
  const pool = (state.placementPool && state.placementPool.length)
    ? state.placementPool
    : (state.placementQs && state.placementQs.length)
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
    const tierQs = available.filter((q) => q.tier === t);
    const freshGen = tierQs.find((q) => q.generation && !seen.has(q.generation));
    const hit = freshGen || tierQs[0];
    if (hit) return hit;
  }
  return available[0] || null;
}
function seenPlacementGenerations(d) {
  return new Set((d?.answers || []).map((a) => a.question?.generation).filter(Boolean));
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
  const you = {
    id: "you",
    name: state.name || "Player",
    human: true,
    you: true,
    score: 0,
    generation: playerGeneration(state.profile),
    age: state.profile?.age ?? "",
    ageBracket: state.profile?.ageBracket || "",
  };
  const guests = (state.guests || []).filter((g) => g.seat !== "view");
  const remain = Math.max(0, state.playerCount - 1 - guests.length);
  const bots = (state.seatBots || []).slice(0, remain);
  return [
    you,
    ...guests.map((g) => ({
      ...g,
      human: true,
      you: false,
      score: 0,
      ageBracket: g.ageBracket || "",
      generation: generationForSeat(g) || defaultGeneration(g.id || g.name),
    })),
    ...bots.map((b) => ({ ...b, human: false, score: 0 })),
  ].slice(0, 12);
}
function seatSpan(s) {
  const gen = genLabel(s.generation);
  const label = gen ? `${s.name} · ${gen}` : s.name;
  return `<span class="seat ${s.you ? "you" : s.human ? "human" : "bot"}" title="${escapeHtml(s.blurb || label)}">${escapeHtml(label)}</span>`;
}

function ensureHostKey() {
  const code = String(state.room || "");
  if (!code) return "";
  const storeKey = `fa-host-${code}`;
  let key = "";
  try { key = localStorage.getItem(storeKey) || ""; } catch { /* private mode */ }
  if (key.length < 16) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    key = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    try { localStorage.setItem(storeKey, key); } catch { /* private mode */ }
  }
  state.hostKey = key;
  return key;
}
async function rooms(method, body) {
  try {
    let qs = "";
    if (method === "GET") {
      if (body && body.list) return { error: "list" };
      else if (state.room) qs = `?code=${encodeURIComponent(state.room)}`;
      else return { error: "code" };
    }
    const headers = { "content-type": "application/json" };
    if (state.hostKey) headers["x-fa-host"] = state.hostKey;
    const res = await fetch(ROOM_API + qs, {
      method: method === "GET" ? "GET" : "POST",
      headers,
      body: method === "GET" ? undefined : JSON.stringify({ ...body, hostKey: state.hostKey || body?.hostKey || "" }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return data || { error: "http", status: res.status };
    return data;
  } catch {
    return null;
  }
}
async function refreshActiveRooms() {
  const data = await rooms("POST", { action: "lobby" });
  state.activeRooms = Array.isArray(data?.rooms) ? data.rooms : [];
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
  return redactState({
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
    players: state.players,
    maps: state.maps,
    mapUses: state.mapUses,
    mapLive: state.mapLive,
    setBreakLeft: state.setBreakLeft,
    setBreakTier: state.setBreakTier,
    lockdownAt: state.lockdownAt,
    lockdown: state.lockdown,
    playerCount: state.playerCount,
    readyIds: state.readyIds,
    guests: state.guests,
    dropoutIds: state.dropoutIds || {},
    pendingJoins: (state.pendingJoins || []).map((g) => g.id),
  });
}
function publish() {
  const snap = snapshot();
  if (bc) bc.postMessage(snap);
  if (role !== "pad" && state.room && state.hostKey) {
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
    if (d.type === "map" && role !== "pad" && mapPhaseOpen()) {
      applyRemoteMap(d.id, d.target);
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
    if (d.type === "refresh-notice") {
      if (applyRefreshFromRoom({ notice: d.notice, refreshQs: d.refreshQs })) paint(true);
      return;
    }
    if (role === "pad" && !state.leftPad && d.phase) {
      applyHostState(d);
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
  if (ld?.phase === "wager") return tt("lockWagerClock", ld.wagerLeft);
  if (ld?.phase === "intro") return tt("lockRulesClock", ld.introLeft);
  if (ld?.phase === "play") {
    const pts = lockdownPointsNow(ld);
    const isHero = state.youId === ld.playerId;
    if (!isHero && role === "pad") return tt("lockWaitClock", ld.waitLeft ?? LOCKDOWN_WAIT_S);
    return tt("lockPlayClock", ld.qi + 1, LOCKDOWN_N, ld.qLeft, pts);
  }
  if (ld?.phase === "result") return ld.won ? tt("lockCleared") : tt("lockBroken");
  if (state.phase === "setbreak") return tt("setBreakClock", state.setBreakLeft);
  if (state.phase === "read") {
    const t = playerById(state.maps[state.youId]);
    const left = mapUsesLeft(state.mapUses?.[state.youId]);
    return t
      ? tt("readMap", t.name, stakeOf(q), left, state.readLeft)
      : tt("readOpen", state.readLeft, left);
  }
  if (state.phase === "buzz") {
    return state.maps[state.youId] ? tt("buzzMap") : tt("buzzNow");
  }
  if (state.phase === "answer") return state.buzzBy ? tt("answerBy", state.buzzBy) : tt("yourAnswer");
  if (state.phase === "reveal") {
    if (!q) return "";
    return state.picked === q.correctIndex ? tt("correct") : tt("wrong");
  }
  if (state.phase === "end") return tt("showOver");
  return "";
}

function applyHostState(next) {
  const keepName = state.name;
  const keepId = state.youId;
  const keepProfile = state.profile;
  const keepViewing = state.viewing;
  const keepIntent = state.seatIntent;
  const keepReady = { ...(state.readyIds || {}) };
  const keepDropout = { ...(state.dropoutIds || {}) };
  Object.assign(state, next || {});
  state.name = keepName;
  state.youId = keepId;
  state.profile = keepProfile;
  state.viewing = keepViewing;
  state.seatIntent = keepIntent;
  state.readyIds = { ...keepReady, ...((next && next.readyIds) || {}) };
  state.dropoutIds = { ...keepDropout, ...((next && next.dropoutIds) || {}) };
}

function seatPlayers() {
  state.youId = "you";
  fillSeats();
  const guests = (state.guests || []).filter((g) => g.seat !== "view");
  const remain = Math.max(0, state.playerCount - 1 - guests.length);
  const bots = (state.seatBots || []).slice(0, remain);
  state.players = [
    {
      id: "you",
      name: state.name || "Player",
      score: 0,
      human: true,
      you: true,
      thumb: state.profile?.thumb || "",
      generation: playerGeneration(state.profile),
      age: state.profile?.age ?? "",
      ageBracket: state.profile?.ageBracket || "",
    },
    ...guests.map((g) => ({
      id: g.id,
      name: g.name,
      score: 0,
      human: true,
      you: false,
      thumb: g.thumb || "",
      ageBracket: g.ageBracket || "",
      generation: generationForSeat(g) || defaultGeneration(g.id || g.name),
    })),
    ...bots.map((b) => ({
      id: b.id,
      name: b.name,
      score: 0,
      human: false,
      you: false,
      skill: b.skill,
      buzzDelayMs: b.buzzDelayMs,
      thumb: botAvatar(b.id),
      generation: b.generation || defaultGeneration(b.id),
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
  const armedId = state.maps[id];
  state.mapLive = Boolean(armedId) && mapUsesLeft(state.mapUses?.[id]) > 0;
  if (!state.mapLive) delete state.maps[id];
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
  if (state.viewing) return;
  if (state.lockdown) return;
  if (state.phase === "ready") {
    if (!isSeatedPlay()) return;
    markReady();
    return;
  }
  if (!isSeatedPlay()) return;
  if (state.phase !== "buzz" || state.buzzed) return;
  takeBuzz(state.youId, state.name);
  if (bc) bc.postMessage({ type: "buzz", name: state.name, id: state.youId, room: state.room });
  if (state.room) void rooms("POST", { action: "buzz", code: state.room, name: state.name, id: state.youId });
}

function armMap(targetId) {
  if (!mapPhaseOpen()) return;
  const owner = mapOwnerId();
  if (owner !== state.youId) return;
  if (targetId === owner) return;
  const turningOff = state.maps[owner] === targetId;
  if (!turningOff && mapUsesLeft(state.mapUses?.[owner]) <= 0) return;
  if (turningOff) delete state.maps[owner];
  else state.maps[owner] = targetId;
  if (state.phase === "answer") {
    state.mapLive = Boolean(state.maps[owner]) && mapUsesLeft(state.mapUses?.[owner]) > 0;
  }
  paint();
  publish();
  if (bc) bc.postMessage({ type: "map", id: owner, target: state.maps[owner] || "", name: state.name });
  if (state.room) void rooms("POST", { action: "map", code: state.room, id: owner, target: state.maps[owner] || "" });
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
  const targetId = state.mapLive ? state.maps[answererId] : "";
  const rival = targetId ? playerById(targetId) : null;
  const mapped = Boolean(rival) && (rival.score || 0) >= stake && mapUsesLeft(state.mapUses?.[answererId]) > 0;
  if (ok) {
    if (mapped) {
      addScore(answererId, stake * 2);
      addScore(targetId, -stake);
    } else {
      addScore(answererId, stake);
    }
  } else if (mapped) {
    addScore(answererId, -stake);
  }
  if (mapped) {
    state.mapUses = { ...(state.mapUses || {}), [answererId]: (Number(state.mapUses?.[answererId]) || 0) + 1 };
  }
}

function mergeTopScores(existing, row) {
  const rows = [...(existing || [])];
  if (row && Number(row.score) > 0) rows.push(row);
  rows.sort((a, b) => Number(b.score) - Number(a.score) || String(b.at).localeCompare(String(a.at)));
  const seen = new Set();
  const out = [];
  for (const item of rows) {
    const score = Math.round(Number(item.score));
    if (!Number.isFinite(score) || score < 0) continue;
    const at = String(item.at || "");
    const key = `${score}|${at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      score,
      at,
      displayName: String(item.displayName || "").slice(0, 40),
    });
    if (out.length >= 12) break;
  }
  return out;
}
function recordCareer() {
  const p = state.profile;
  if (!p) return;
  const score = me()?.score || 0;
  const at = new Date().toISOString();
  const stats = {
    ...emptyStats(),
    ...(p.stats || {}),
    gamesPlayed: (p.stats?.gamesPlayed || 0) + 1,
    totalPoints: (p.stats?.totalPoints || 0) + Math.max(0, score),
    correctAnswers: (p.stats?.correctAnswers || 0) + (state.tally.correct || 0),
    wrongAnswers: (p.stats?.wrongAnswers || 0) + (state.tally.wrong || 0),
    bestScore: Math.max(p.stats?.bestScore || 0, score),
    lastPlayedAt: at,
  };
  const topScores = mergeTopScores(p.topScores, {
    score,
    at,
    displayName: p.displayName || state.name,
  });
  saveProfile({ stats, topScores });
  if (score > 0 && p.id) {
    void fetch("/api/profiles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "score",
        id: p.id,
        displayName: p.displayName || state.name,
        score,
        at,
      }),
    }).catch(() => {});
  }
}
async function syncTopScores() {
  const id = state.profile?.id;
  if (!id) return;
  try {
    const res = await fetch(`/api/profiles?scores=1&id=${encodeURIComponent(id)}`);
    if (!res.ok) return;
    const data = await res.json();
    const combined = mergeTopScores([...(state.profile?.topScores || []), ...(data.scores || [])], null);
    if (JSON.stringify(combined) !== JSON.stringify(state.profile?.topScores || [])) {
      saveProfile({ topScores: combined });
      paint(true);
    }
  } catch { /* vault unreachable; local scores stay */ }
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
  state.viewing = false;
  state.seatIntent = "play";
  state.joinOffer = null;
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

function seatPendingJoins() {
  if (role === "pad") return;
  const next = state.qs[state.i];
  if (!next || !nextQuestionAllowsJoin(state.qs, state.i - 1)) return;
  const pending = state.pendingJoins || [];
  if (!pending.length) return;
  for (const g of pending) {
    if (state.players.some((p) => p.id === g.id || p.name === g.name)) continue;
    const bot = state.players.find((p) => !p.human);
    if (bot) {
      bot.id = g.id;
      bot.name = g.name;
      bot.human = true;
      bot.you = false;
      bot.thumb = g.thumb || "";
      bot.ageBracket = g.ageBracket || "";
      bot.generation = generationForSeat(g) || defaultGeneration(g.id || g.name);
      delete bot.skill;
      delete bot.buzzDelayMs;
    } else if (state.players.length < 12) {
      state.players.push({
        id: g.id,
        name: g.name,
        score: 0,
        human: true,
        you: false,
        thumb: g.thumb || "",
        ageBracket: g.ageBracket || "",
        generation: generationForSeat(g) || defaultGeneration(g.id || g.name),
      });
    }
  }
  state.pendingJoins = pending.filter((g) => !state.players.some((p) => p.id === g.id));
}

function pressDropout() {
  if (canLeaveNow()) {
    leaveToLobby();
    return;
  }
  const id = state.youId;
  if (!id) return;
  state.dropoutIds = { ...(state.dropoutIds || {}), [id]: true };
  if (state.room) void rooms("POST", { action: "dropout", code: state.room, id });
  publish();
  maybeEndFromDropout();
  paint(true);
}

function maybeEndFromDropout() {
  if (role === "pad") return;
  if (state.phase === "lobby" || state.phase === "ready" || state.phase === "end") return;
  if (dropoutEndsGame(humanPlayerIds(), state.dropoutIds)) finishShow();
}

function continueRound() {
  state.lockdown = null;
  state.i += 1;
  if (state.i >= state.qs.length) {
    finishShow();
    return;
  }
  seatPendingJoins();
  maybeEndFromDropout();
  if (state.phase === "end") return;
  const prev = state.qs[state.i - 1];
  const next = state.qs[state.i];
  if (setBreakDue(prev?.tier, next?.tier, tierRunLength(state.qs, state.i))) {
    startSetBreak(next.tier);
    return;
  }
  state.picked = -1;
  state.phase = "between";
  state.pose = "next";
  paint();
  publish();
  setTimeout(startRead, 450);
}

function startSetBreak(tier) {
  state.phase = "setbreak";
  state.pose = "next";
  state.picked = -1;
  state.buzzed = false;
  state.buzzBy = "";
  state.buzzId = "";
  state.mapLive = false;
  state.maps = {};
  state.setBreakTier = tier || "";
  state.setBreakLeft = SET_BREAK_S;
  clearAiBuzz();
  paint();
  publish();
  stopTick();
  state.tick = setInterval(() => {
    if (state.phase !== "setbreak") {
      stopTick();
      return;
    }
    state.setBreakLeft -= 1;
    if (state.setBreakLeft <= 0) {
      stopTick();
      startRead();
      return;
    }
    const clock = $("#clock");
    if (clock) clock.textContent = clockText();
    publish();
  }, 1000);
}

function tierName(tier) {
  const key = {
    easy: "tierEasy",
    hard: "tierHard",
    difficult: "tierDifficult",
    extreme: "tierExtreme",
  }[tier];
  return key ? tt(key) : "";
}
function lockdownLogo(ld, backMore = "") {
  if (!ld) return tt("lockdownWord");
  if (ld.phase === "play" || ld.phase === "flash") {
    return `${tt("lockdownWord")} · ${ld.qi + 1}/${LOCKDOWN_N}${backMore}`;
  }
  if (ld.phase === "wager") return tt("lockdownWagers");
  if (ld.phase === "intro") return tt("lockRulesClock", ld.introLeft);
  if (ld.phase === "result") return ld.won ? tt("lockCleared") : tt("lockBroken");
  return tt("lockdownWord");
}

function mapPhaseOpen() {
  if (state.lockdown || state.phase === "setbreak") return false;
  return state.phase === "read" || state.phase === "buzz" || state.phase === "answer";
}

function mapOwnerId() {
  if (state.phase === "answer") return state.buzzId || state.youId;
  return state.youId;
}

function applyRemoteMap(id, target) {
  if (!id || !mapPhaseOpen()) return;
  const next = target ? String(target) : "";
  if (next && next !== state.maps[id] && mapUsesLeft(state.mapUses?.[id]) <= 0) return;
  if (next) state.maps[id] = next;
  else delete state.maps[id];
  if (state.phase === "answer" && id === (state.buzzId || state.youId)) {
    state.mapLive = Boolean(state.maps[id]) && mapUsesLeft(state.mapUses?.[id]) > 0;
  }
  paint();
  publish();
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
  if (state.viewing) return;
  if (role === "pad" && !fromRemote && !isSeatedPlay()) return;
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
  if (state.phase === "reveal" || state.phase === "end" || state.phase === "read" || state.phase === "lobby" || state.phase === "setbreak") return;
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
  const qs = buildLockdownQuestions([
    ...((state.qs) || []).map((q) => q.id),
    ...(state.spent ? [...state.spent] : []),
  ]);
  if (qs.length < LOCKDOWN_N) {
    continueRound();
    return;
  }
  if (state.cohort?.lockdownPrepared) {
    delete state.cohort.lockdownPrepared;
    writeStoredCohort(state.cohort);
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
    const src = playerThumb(p);
    const thumb = src
      ? `<img class="av" src="${src}" alt=""/>`
      : `<span class="av empty" aria-hidden="true"></span>`;
    return `<span class="score-cell ${p.you ? "you" : ""}">${thumb}<span class="score-name">${escapeHtml(p.name)}</span><b>$${p.score}</b></span>`;
  }).join("");
  return `<div class="scores-row">${cells}</div>`;
}

function rivalsHTML() {
  const q = currentQ();
  if (!q || !mapPhaseOpen()) return "";
  const owner = mapOwnerId();
  if (owner !== state.youId) return "";
  const phoneBoard = !isTvDisplay() && role !== "pad" && !state.onScreen;
  const show = state.phase === "read" || state.phase === "buzz" || (phoneBoard && state.phase === "answer");
  if (!show) return "";
  const left = mapUsesLeft(state.mapUses?.[owner]);
  const armed = state.maps[owner];
  if (left <= 0 && !armed) {
    return `<div class="rivals"><span class="rivals-lab">${escapeHtml(tt("mapSpent"))}</span></div>`;
  }
  const stake = stakeOf(q);
  return `<div class="rivals">
    <span class="rivals-lab">${tt("mapLab", stake, left, MAP_USES_PER_ROUND)}</span>
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
      <p class="wager-copy">${tt("lockIntroPlay", escapeHtml(ld.name), LOCKDOWN_N, LOCKDOWN_WIN_AT)}</p>
      <p class="wager-copy">${tt("lockIntroPoints")}</p>
      <p class="wager-copy">${tt("lockIntroStart", ld.introLeft)}</p>
      ${lockdownRefreshButton()}
    </div>`;
  }
  if (ld.phase !== "wager") return "";
  const mine = ld.wagers[state.youId] || state.wagerDraft;
  const isHero = state.youId === ld.playerId;
  if (isHero) {
    return `<div class="wager"><p class="wager-copy">${tt("lockdownWagerHero", ld.wagerLeft)}</p>${lockdownRefreshButton()}</div>`;
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
    ${lockdownRefreshButton()}
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
  const armed = state.maps[answerer] || "";
  const left = mapUsesLeft(state.mapUses?.[answerer]);
  if (left <= 0 && !armed) {
    return `<div class="map-steal"><span class="rivals-lab">${escapeHtml(tt("mapSpent"))}</span></div>`;
  }
  const rivals = state.players.filter((p) => p.id !== answerer);
  if (!rivals.length) return "";
  return `<div class="map-steal">
    <span class="rivals-lab">${tt("mapStealLab", doubled, left, MAP_USES_PER_ROUND)}</span>
    ${rivals.map((p) =>
      `<button type="button" class="rival ${armed === p.id ? "on" : ""}" data-map="${p.id}">${escapeHtml(p.name)} <b>−$${stake}</b></button>`
    ).join("")}
  </div>`;
}

function rulesHTML() {
  if (!state.rules) return "";
  return `<div class="sheet" id="sheet">
    <div class="sheet-bar">
      <h2>${tt("rulesTitle")}</h2>
      <button class="primary" id="rulesX" type="button">${tt("close")}</button>
    </div>
    <ul>
      <li><b>${tt("rule37")}</b></li>
      <li><b>${tt("ruleRead")}</b></li>
      <li><b>${tt("ruleMap")}</b></li>
      <li><b>${tt("ruleSet")}</b></li>
      <li><b>${tt("ruleLock")}</b></li>
      <li><b>${tt("ruleDojo")}</b></li>
      <li><b>${tt("ruleRoom")}</b></li>
    </ul>
    <a class="word dir-full" href="./directions.html">${tt("fullDirections")}</a>
  </div>`;
}

function footHTML() {
  const flow = isTvDisplay()
    ? `<span class="copy">© GMG Brand Label</span>`
    : `<a class="flow" href="${FLOW_URL}" target="_blank" rel="noopener noreferrer">Flow</a>
    <span class="copy">© GMG Brand Label</span>`;
  return `<div class="buzzbar foot">${flow}</div>`;
}

/** Header actions, ranked: Rules, then Dojo, then Directions. Flow stays in the footer only. */
function headerLinks({ dojo = false, directions = false } = {}) {
  const dojoLink = dojo && !(isTvDisplay() && forcedDisplay)
    ? `<a class="word" href="${dojoHref()}">${tt("dojo")}</a>`
    : "";
  const dirLink = directions
    ? `<a class="word" href="./directions.html">${tt("directions")}</a>`
    : "";
  return `<button class="word rules-link" id="rulesBtn" type="button">${tt("rules")}</button>${dojoLink}${dirLink}`;
}

function joinQrChip(size = 120) {
  if (!state.room || !isTvDisplay()) return "";
  const open = state.qrOpen;
  const url = encodeURIComponent(shareUrl());
  return `<div class="qr-chip ${open ? "open" : "collapsed"}" id="qrChip">
    <button type="button" class="qr-toggle" id="qrToggle" aria-expanded="${open ? "true" : "false"}" title="${escapeHtml(state.room)}">
      ${open ? tt("hideJoin") : tt("joinChip", escapeHtml(state.room))}
    </button>
    ${open ? `<img class="qr corner" alt="${escapeHtml(tt("qrJoinAlt"))}" src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${url}"/>
    <p class="qr-code">${tt("roomLabel", `<b>${escapeHtml(state.room)}</b>`)}</p>` : ""}
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
      ${headerLinks()}
    </div>
    <div class="lobby">
      <div class="lobby-copy">
        <h1 class="sr-only">${tt("directionsTitle")}</h1>
        <img class="brand" src="${TITLE_3D}" alt="Fast Answer!"/>
        <div class="accord">
          ${dirAcc("lang", tt("dirLangTitle"), "<small>EN · FR · DE</small>", `
            <p class="dir-copy">${tt("dirLangBody")}</p>
          `)}
          ${dirAcc("tv", tt("dirTvTitle"), `<small>${tt("dirTvExtra")}</small>`, `
            <p class="dir-copy">${tt("dirTvLead")}</p>
            <p class="dir-copy">${tt("dirTvSilk")}</p>
            <ol class="dir-ol">
              <li>${tt("dirTvBest")}</li>
              <li>${tt("dirTvQr")}</li>
              <li>${tt("dirTvReady")}</li>
              <li>${tt("dirTvJoin")}</li>
              <li>${tt("dirTvAir")}</li>
            </ol>
          `)}
          ${dirAcc("screen", tt("dirScreenTitle"), `<small>${tt("dirScreenExtra")}</small>`, `
            <p class="dir-copy"><b>${tt("dirOff")}</b></p>
            <p class="dir-copy"><b>${tt("dirOn")}</b></p>
            <p class="dir-copy">${tt("dirOnFeatures")}</p>
            <p class="dir-copy">${tt("dirDojoExtra")}</p>
          `)}
          ${dirAcc("room", tt("dirRoomTitle"), "<small>2–12</small>", `
            <p class="dir-copy">${tt("dirRoomSeats")}</p>
            <p class="dir-copy">${tt("dirRoomOwns")}</p>
            <p class="dir-copy">${tt("dirRoomStart")}</p>
            <p class="dir-copy">${tt("dirRoomModes")}</p>
          `)}
          ${dirAcc("points", tt("dirPointsTitle"), "<small>37Q</small>", `
            <p class="dir-copy">${tt("dirPointsBody")}</p>
            <div class="points-grid">
              <span>20 ${tt("tierEasy")}</span><b>$100</b>
              <span>10 ${tt("tierHard")}</span><b>$500</b>
              <span>5 ${tt("tierDifficult")}</span><b>$1,000</b>
              <span>2 ${tt("tierExtreme")}</span><b>$5,000</b>
            </div>
            <p class="dir-copy">${tt("dirPointsMore")}</p>
          `)}
          ${dirAcc("map", tt("dirMapTitle"), "<small>4</small>", `
            <p class="dir-copy">${tt("dirMapBody")}</p>
          `)}
          ${dirAcc("lock", tt("dirLockTitle"), "<small>2</small>", `
            <p class="dir-copy">${tt("dirLockBody")}</p>
          `)}
          ${dirAcc("dojo", tt("dirDojoTitle"), "<small>10</small>", `
            <p class="dir-copy">${tt("dirDojoBody")}</p>
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
    ${rulesHTML()}
  `;
}

function dojoPageHTML() {
  const bg = dojoBackground(state.profile?.dojoBg);
  return `
    <img class="bg" alt="" src="${bg.src}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>${tt("dojo")}</small></div>
      <div class="grow"></div>
      ${languageSwitcherHtml(state.locale)}
      <a class="word" href="/">${tt("lobby")}</a>
      ${headerLinks()}
    </div>
    <div class="dojo-page">
      <div class="dojo-page-scroll">
        ${dojoBody()}
        <p class="status" id="stt">${escapeHtml(state.statusMsg || "")}</p>
      </div>
    </div>
    <div></div>
    ${footHTML()}
    ${rulesHTML()}
  `;
}

function bindDojoPage() {
  document.querySelectorAll("[data-locale]").forEach((b) => {
    b.onclick = () => { void setLocale(b.dataset.locale); };
  });
  bindDojoSurface();
  bindRules();
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
  bindRules();
}

let dojoTick = null;
function clearDojoTick() {
  if (dojoTick) clearInterval(dojoTick);
  dojoTick = null;
}

function ensureDojo() {
  if (state.dojo && state.dojo.q) return;
  startDojo();
}

function finishDojo() {
  clearDojoTick();
  const d = state.dojo;
  if (!d) return;
  const correct = d.answers.filter((a) => a.correct).length;
  const abilityTier = abilityFromDojo(d.answers);
  const completedAt = new Date().toISOString();
  const ids = d.answers.map((a) => a.question.id);
  const cohort = ensureCohort();
  const mandatoryAt = addYearsIso(completedAt, PLACEMENT_MANDATORY_YEARS);
  saveProfile({
    abilityTier,
    placementScore: correct,
    placementCompletedAt: completedAt,
    placementMandatoryAt: mandatoryAt,
    nextPlacementDueAt: mandatoryAt,
    cohortBuiltAt: cohort?.builtAt || state.profile?.cohortBuiltAt || "",
    placementQuestionIds: [...(state.profile?.placementQuestionIds || []), ...ids].slice(-200),
  });
  state.dojo = { ...d, done: true, q: null, picked: -1, showAnswers: false };
  state.dojoMode = "home";
  state.statusMsg = tt("placementDone", (ABILITY_META[abilityTier] || ABILITY_META.bronze).label);
  paint(true);
}

function armDojoRead() {
  clearDojoTick();
  const d = state.dojo;
  if (!d || !d.q || d.done) return;
  d.showAnswers = false;
  d.readLeft = PLACE_READ_S;
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
  d.q = pickPlacementQuestion(d.tier, d.used, seenPlacementGenerations(d));
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

function dojoModeForGate() {
  if (!hasPhoneProfile()) return "create";
  if (needsPasswordSetup()) return "setpw";
  if (!state.profileUnlocked) return "unlock";
  return "home";
}
function dojoHref(mode) {
  const next = mode || dojoModeForGate();
  return "/dojo.html?mode=" + encodeURIComponent(next);
}
function openDojoPage(mode) {
  const next = mode || dojoModeForGate();
  state.dojoMode = next;
  try { sessionStorage.setItem("fa-dojo-mode", next); } catch { /* ignore */ }
  if (!isDojoPage) {
    location.href = dojoHref(next);
    return;
  }
  if (next === "home" && state.profileUnlocked && needsPlacement(state.profile) && !(state.dojo && state.dojo.q)) {
    startDojo();
    return;
  }
  paint(true);
}
function startDojo() {
  clearDojoTick();
  const begun = beginPlacementSitting();
  if (begun.blocked) {
    state.dojo = state.dojo ? { ...state.dojo, done: true, q: null } : null;
    state.statusMsg = tt("placementLocked", formatDue(begun.renewsAt));
    if (isDojoPage) paint(true);
    return;
  }
  state.placementPool = begun.pool;
  const q = pickPlacementQuestion("hard", new Set());
  state.dojo = {
    q,
    answers: [],
    used: new Set(),
    picked: -1,
    tier: "hard",
    done: false,
    showAnswers: false,
    readLeft: PLACE_READ_S,
  };
  state.dojoMode = "home";
  try { sessionStorage.setItem("fa-dojo-mode", "home"); } catch { /* ignore */ }
  if (!isDojoPage) {
    location.href = dojoHref("home");
    return;
  }
  armDojoRead();
}

function placementNoteHTML() {
  const left = placementAttemptsLeft();
  const due = formatDue((state.cohort && state.cohort.renewsAt) || "");
  if (state.profile?.placementCompletedAt && placementIsDue(state.profile)) {
    return `<p class="meta">${escapeHtml(tt("placementExpired"))}</p>`;
  }
  if (!isPlaced() && left === PLACEMENT_SITTINGS) return `<p class="meta">${tt("dojoIntro")}</p>`;
  const again = mandatoryPlacementDue(state.profile);
  const againLine = again ? ` ${tt("placementAgain", formatDue(again))}` : "";
  return `<p class="meta">${escapeHtml(tt("placementLeft", left, due) + againLine)}</p>`;
}
function refreshPlacementSet() {
  const before = state.profile?.placementSittingsUsed || 0;
  startDojo();
  if ((state.profile?.placementSittingsUsed || 0) > before && state.dojo?.q) {
    state.statusMsg = tt("placementRefreshed");
    paint(true);
  }
}

function acc(id, title, extra, body, scope = "lobby") {
  const current = scope === "play" ? state.playOpen : state.lobbyOpen;
  const open = current === id;
  return `<section class="acc ${open ? "open" : ""}">
    <button type="button" class="acc-h" data-acc="${id}" data-acc-scope="${scope}"><span>${title}</span>${extra || ""}</button>
    ${open ? `<div class="acc-body">${body}</div>` : ""}
  </section>`;
}

function beltStripHTML(activeBelt, points) {
  const climb = beltClimb(points);
  const cur = activeBelt || climb.belt || "white";
  const meta = BELT_META[cur] || BELT_META.white;
  const nextMeta = BELT_META[climb.next] || meta;
  const line = climb.topped
    ? tt("beltMax", meta.label, climb.points)
    : tt("beltClimb", meta.label, climb.points, nextMeta.label, climb.left);
  return `<div class="belt-strip" role="img" aria-label="${escapeHtml(tt("beltAria", meta.label))}">
    ${BELT_ORDER.map((id) => {
      const m = BELT_META[id];
      const on = id === cur ? " on" : "";
      return `<span class="belt-seg${on}" style="--belt:${m.color}" title="${escapeHtml(m.label)}"></span>`;
    }).join("")}
  </div>
  <div class="belt-meter" aria-hidden="true"><span style="width:${climb.pct}%"></span></div>
  <p class="belt-lab">${escapeHtml(line)}</p>
  <p class="meta">${escapeHtml(tt("beltStep"))}</p>`;
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
  return `<div class="dojo-stage">${inner}${genAlphaReviewHTML()}</div>`;
}

function reviewGeneration() {
  const picked = normalizeGeneration(state.reviewGen);
  if (GENERATIONS.includes(picked)) return picked;
  return playerGeneration(state.profile) || "gen-alpha";
}

function questionsForReviewGen() {
  const gen = reviewGeneration();
  return (state.questions || []).filter((q) => normalizeGeneration(q.generation) === gen);
}

function genAlphaQuestions() {
  return questionsForReviewGen();
}

function genAlphaMailHref() {
  const list = genAlphaQuestions();
  const id = state.genAlphaAbout || list[0]?.id || "";
  const q = list.find((item) => item.id === id);
  const note = String(state.genAlphaNote || "").trim();
  const subject = q ? `Question on ${q.id}` : "Gen Alpha questions";
  const body = [
    "To: gmgbrandlable",
    q ? `Question: ${q.prompt}` : "Gen Alpha questions",
    note ? `Question on this question: ${note}` : "",
  ].filter(Boolean).join("\n");
  return `mailto:${LOUIS_MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Read-only list for the generation picked in Dojo, then a note that emails gmgbrandlable. */
function genAlphaReviewHTML() {
  const open = state.genAlphaOpen === true;
  const gen = reviewGeneration();
  const list = questionsForReviewGen();
  const picked = state.genAlphaAbout || list[0]?.id || "";
  const lead = gen === "gen-alpha" ? tt("genAlphaReviewLead") : tt("genReviewLead");
  return `<section class="gen-alpha-review ${open ? "open" : ""}">
    <button type="button" class="acc-h" id="genAlphaToggle">${escapeHtml(tt("genAlphaReview"))}</button>
    ${open ? `<div class="gen-alpha-body">
      <label class="field" for="dojoGen">${escapeHtml(tt("pickGen"))}</label>
      <select class="gen-select" id="dojoGen">
        ${GENERATIONS.map((g) => `<option value="${g}" ${g === gen ? "selected" : ""}>${escapeHtml(genLabel(g))}</option>`).join("")}
      </select>
      <p class="meta">${escapeHtml(lead)}</p>
      ${list.length ? `<ol class="gen-alpha-list">
        ${list.map((q) => `<li>
          ${q.slang ? `<p class="q-slang">${escapeHtml(q.slang)}</p>` : ""}
          <p>${escapeHtml(q.prompt)}</p>
          <ol class="gen-alpha-choices">
            ${(q.choices || []).map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
          </ol>
        </li>`).join("")}
      </ol>` : `<p class="meta">${escapeHtml(tt("genAlphaReviewEmpty"))}</p>`}
      <div class="gen-alpha-ask">
        <p class="field-lab">${escapeHtml(tt("questionsOnQuestions"))}</p>
        <p class="meta">${escapeHtml(tt("questionsOnQuestionsLead"))}</p>
        <label class="field" for="genAlphaAbout">${escapeHtml(tt("questionsOnQuestionsPick"))}</label>
        <select id="genAlphaAbout" ${list.length ? "" : "disabled"}>
          ${list.map((q) => `<option value="${escapeHtml(q.id)}" ${q.id === picked ? "selected" : ""}>${escapeHtml(q.prompt)}</option>`).join("")}
        </select>
        <label class="field" for="genAlphaNote">${escapeHtml(tt("questionsOnQuestionsNote"))}</label>
        <textarea id="genAlphaNote" maxlength="500" rows="3">${escapeHtml(state.genAlphaNote || "")}</textarea>
        <a class="ghost" id="genAlphaMail" href="${escapeHtml(genAlphaMailHref())}">${escapeHtml(tt("questionsOnQuestionsSend"))}</a>
      </div>
    </div>` : ""}
  </section>`;
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
        : tt("dojoRead", d.readLeft ?? PLACE_READ_S)}</p>
      ${d.q.slang ? `<p class="q-slang">${escapeHtml(d.q.slang)}</p>` : ""}
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
      <button class="ghost" id="refreshPlacement" type="button" ${placementAttemptsLeft() <= 0 ? "disabled" : ""}>${tt("refreshPlacement")}</button>
      ${placementNoteHTML()}
    `);
  }

  // Create profile (no stored profile yet)
  if (!hasPhoneProfile() || mode === "create") {
    return dojoChrome(`
      <p class="dir-copy">${tt("createProfileIntro")}</p>
      <label class="field" for="nm">${tt("name")}</label>
      <input id="nm" type="text" value="${escapeHtml(p.displayName && hasPhoneProfile() ? p.displayName : "")}" maxlength="18" autocomplete="nickname" placeholder="${tt("name")}"/>
      ${generationSelectHTML("playerGen", p.generation, p.age || p.ageBracket)}
      ${ageBracketHTML("playerAge", p)}
      <label class="field" for="emNew">${tt("email")}</label>
      <input id="emNew" type="email" value="${escapeHtml(p.email || "")}" maxlength="120" autocomplete="email" placeholder="${tt("email")}"/>
      <label class="field" for="pwNew">${tt("password")}</label>
      <input id="pwNew" type="password" maxlength="64" autocomplete="new-password" placeholder="${tt("passwordHint")}"/>
      <label class="field" for="thDojo">${tt("photoTv")}</label>
      <div class="thumb-row">
        ${p.thumb ? `<img class="thumb" src="${p.thumb}" alt=""/>` : `<span class="thumb empty"></span>`}
        <input id="thDojo" type="file" accept="image/*"/>
      </div>
      <button class="primary" id="createProfile" type="button">${tt("createProfileBtn")}</button>
      ${hasPhoneProfile() ? `<button class="ghost" id="dojoCancelMode" type="button">${tt("cancel")}</button>` : ""}
    `);
  }

  // Legacy: profile exists but no password yet
  if (needsPasswordSetup() || mode === "setpw") {
    return dojoChrome(`
      <p class="dir-copy">${tt("setPasswordIntro")}</p>
      <p class="meta">${escapeHtml(p.displayName || "")}</p>
      ${beltStripHTML(p.belt, p.stats?.totalPoints)}
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
    if (state.forgotPassword) {
      return dojoChrome(`${forgotPasswordHTML()}<p class="status" id="stt">${escapeHtml(state.statusMsg || "")}</p>`);
    }
    return dojoChrome(`
      <p class="dir-copy">${tt("unlockIntro")}</p>
      <p class="meta">${escapeHtml(p.displayName || "")}</p>
      ${beltStripHTML(p.belt, p.stats?.totalPoints)}
      ${p.abilityTier ? medalHTML(p.abilityTier) : `<p class="meta">${tt("medalPending")}</p>`}
      <label class="field" for="pwUnlock">${tt("password")}</label>
      <input id="pwUnlock" type="password" maxlength="64" autocomplete="current-password"/>
      <button class="primary" id="unlockProfile" type="button">${tt("unlockProfile")}</button>
      <button class="word" id="forgotPassword" type="button">${tt("forgotPassword")}</button>
      <button class="ghost" id="resetProfile" type="button">${tt("resetProfile")}</button>
      <button class="ghost" id="dojoCreateAlt" type="button">${tt("createProfile")}</button>
    `);
  }

  // Unlocked home / edit
  const ab = p.abilityTier ? ABILITY_META[p.abilityTier] : null;
  const scores = p.topScores || [];
  const scrollOpen = state.dojoScroll !== "closed";
  return dojoChrome(`
    <p class="dir-copy">${tt("dojoUnlockedIntro")}</p>
    ${beltStripHTML(p.belt, p.stats?.totalPoints)}
    ${medalHTML(p.abilityTier)}
    <p class="meta">${escapeHtml(tt("beltCareer", (BELT_META[p.belt || "white"] || BELT_META.white).label, ab ? ab.label : "", p.stats?.totalPoints || 0))}</p>
    <section class="scroll-acc ${scrollOpen ? "open" : ""}">
      <button type="button" class="scroll-h" id="scoreScroll">${escapeHtml(tt("topScores"))}</button>
      ${scrollOpen ? `<div class="scroll-roll">
        <p class="scroll-note">${escapeHtml(tt("scoreVault"))}</p>
        ${scores.length ? `<ol class="score-list">
          ${scores.map((row) => `<li><b>$${Number(row.score).toLocaleString()}</b><span>${escapeHtml(String(row.at || "").replace("T", " ").slice(0, 16))}</span></li>`).join("")}
        </ol>` : `<p class="scroll-note">${escapeHtml(tt("topScoresEmpty"))}</p>`}
      </div>` : ""}
    </section>
    <p class="field-lab">${escapeHtml(tt("dojoBg"))}</p>
    <div class="dojo-bgs">
      ${DOJO_BACKGROUNDS.map((b) => `
        <button type="button" class="dojo-bg ${dojoBackground(p.dojoBg).id === b.id ? "on" : ""}" data-dojo-bg="${b.id}">
          <img src="${b.src}" alt=""/>
          <span>${escapeHtml(tt(b.labelKey))}</span>
        </button>`).join("")}
    </div>
    <label class="field" for="nm">${tt("name")}</label>
    <input id="nm" type="text" value="${escapeHtml(p.displayName || "")}" maxlength="18" autocomplete="nickname"/>
    ${generationSelectHTML("playerGen", p.generation, p.age || p.ageBracket)}
    ${ageBracketHTML("playerAge", p)}
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
      ? `<p class="meta">${escapeHtml(tt("abilityRetake", (ab && ab.label) || tt("placed"), formatDue(mandatoryPlacementDue(p) || p.placementCompletedAt)))}</p>`
      : ""}
    ${placementNoteHTML()}
    <button class="primary" id="${p.abilityTier ? "retake" : "dojoGo"}" type="button" ${placementAttemptsLeft() <= 0 && placed ? "disabled" : ""}>${p.abilityTier ? tt("retakeMedal") : tt("startDojo")}</button>
    <button class="ghost" id="refreshPlacement" type="button" ${placementAttemptsLeft() <= 0 ? "disabled" : ""}>${tt("refreshPlacement")}</button>
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

/** Go to Dojo / Create / Unlock, always together on the Join TV (and Host/Cast) card. */
function roomDojoEntryHTML() {
  if (isTvDisplay()) return "";
  const gate = lobbyGateReason();
  const panel = state.roomDojoPanel || "";
  const p = state.profile || {};
  let extra = "";
  if (panel === "create") {
    extra = `
      <div class="dojo-inline">
        <p class="dir-copy">${tt("createProfileIntro")}</p>
        <label class="field" for="roomNm">${tt("name")}</label>
        <input id="roomNm" type="text" value="${escapeHtml(hasPhoneProfile() ? (p.displayName || "") : (state.name || ""))}" maxlength="18" autocomplete="nickname"/>
        ${generationSelectHTML("roomPlayerGen", p.generation, p.age || p.ageBracket)}
        ${ageBracketHTML("roomPlayerAge", p)}
        <label class="field" for="roomEm">${tt("email")}</label>
        <input id="roomEm" type="email" value="${escapeHtml(p.email || "")}" maxlength="120" autocomplete="email"/>
        <label class="field" for="roomPwNew">${tt("password")}</label>
        <input id="roomPwNew" type="password" maxlength="64" autocomplete="new-password" placeholder="${tt("passwordHint")}"/>
        <label class="field" for="roomTh">${tt("photoTv")}</label>
        <input id="roomTh" type="file" accept="image/*"/>
        <button class="primary" id="roomCreateSubmit" type="button">${tt("createProfileBtn")}</button>
      </div>`;
  } else if (panel === "unlock") {
    if (!hasPhoneProfile()) {
      extra = `<p class="meta">${tt("gateProfile")}</p>`;
    } else if (needsPasswordSetup()) {
      extra = `
        <div class="dojo-inline">
          <p class="dir-copy">${tt("setPasswordIntro")}</p>
          <label class="field" for="roomPwNew">${tt("password")}</label>
          <input id="roomPwNew" type="password" maxlength="64" autocomplete="new-password" placeholder="${tt("passwordHint")}"/>
          <label class="field" for="roomPwConfirm">${tt("confirmPassword")}</label>
          <input id="roomPwConfirm" type="password" maxlength="64" autocomplete="new-password"/>
          <button class="primary" id="roomSetPw" type="button">${tt("savePassword")}</button>
        </div>`;
    } else if (!state.profileUnlocked) {
      extra = state.forgotPassword ? forgotPasswordHTML() : `
        <div class="dojo-unlock-mini">
          <p class="dir-copy">${tt("unlockIntro")}</p>
          <label class="field" for="pwUnlockRoom">${tt("password")}</label>
          <div class="copy-row">
            <input id="pwUnlockRoom" type="password" maxlength="64" autocomplete="current-password" placeholder="${tt("password")}"/>
            <button class="primary" type="button" id="roomUnlockProfile">${tt("unlockShort")}</button>
          </div>
          <button class="word" id="forgotPassword" type="button">${tt("forgotPassword")}</button>
        </div>`;
    } else {
      extra = `<p class="meta">${tt("joinReadyMeta")}</p>`;
    }
  }
  return `
    <div class="dojo-gate-panel">
      ${dojoGateChipsHTML()}
      ${gate ? `<p class="dir-copy"><b>${escapeHtml(gate)}</b></p>` : ""}
      <div class="row dojo-gate-actions" role="group" aria-label="${escapeHtml(tt("dojo"))}">
        <a class="primary" id="goToDojo" href="${dojoHref()}">${tt("goToDojo")}</a>
        <button class="ghost ${panel === "create" ? "on" : ""}" type="button" id="roomCreateProfile">${tt("createShort")}</button>
        <button class="ghost ${panel === "unlock" ? "on" : ""}" type="button" id="roomShowUnlock">${tt("unlockShort")}</button>
      </div>
      ${hasPhoneProfile() ? `<p class="meta">${escapeHtml(p.displayName || "")}${p.email ? ` · ${escapeHtml(p.email)}` : ""}</p>` : ""}
      ${extra}
      ${genAlphaReviewHTML()}
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
  if (isTvDisplay() && forcedDisplay) return "";
  const modes = [
    ["off", tt("offScreenTab")],
    ["cast", tt("castTv")],
    ["join", tt("joinRoom")],
  ];
  return `<div class="mp-modes" role="tablist">
    ${modes.map(([id, label]) =>
      `<button type="button" class="mp-mode ${state.mpMode === id ? "on" : ""}" data-mp="${id}">${label}</button>`
    ).join("")}
  </div>`;
}

function roomListHTML(screen) {
  const want = screen === "tv" ? "tv" : "off";
  const rooms = (state.activeRooms || []).filter((r) => (r.screen === "tv" ? "tv" : "off") === want);
  const title = want === "tv" ? tt("tvRooms") : tt("offScreenRooms");
  const rows = rooms.map((r) => `
    <div class="room-row">
      <span class="room-meta"><b>${escapeHtml(r.code)}</b>${r.host ? ` · ${escapeHtml(r.host)}` : ""}${r.guests ? ` · ${r.guests}` : ""}</span>
      <button type="button" class="primary" data-join-room="${escapeHtml(r.code)}">${tt("joinShort")}</button>
    </div>`).join("");
  return `
    <div class="rooms-list">
      <p class="field">${title}</p>
      ${rows || `<p class="meta">${tt("noRooms")}</p>`}
    </div>`;
}

function screenModeHTML() {
  if (role === "pad") return "";
  const locked = Boolean(forcedDisplay);
  return `
    <div class="screen-modes" role="radiogroup" aria-label="Screen mode">
      <label class="toggle">
        <input id="osOff" type="radio" name="screenMode" ${!state.onScreen ? "checked" : ""} ${locked ? "disabled" : ""}/>
        <span>${tt("offScreen")}</span>
      </label>
      <label class="toggle">
        <input id="os" type="radio" name="screenMode" ${state.onScreen ? "checked" : ""} ${locked ? "disabled" : ""}/>
        <span>${tt("onScreenShort")}</span>
      </label>
    </div>
    ${state.onScreen && !locked ? `<button class="ghost" data-off-screen type="button">${tt("offScreenReturn")}</button>` : ""}
    <p class="meta">${state.onScreen ? tt("onScreen") : tt("offScreenHint")}</p>
  `;
}

function topicLine(topic, field, fallback) {
  const key = `topic_${topic.id}_${field}`;
  const value = tt(key);
  return value === key ? fallback : value;
}
function topicsBody() {
  const rows = topicCatalog();
  const on = new Set(state.topicsOn || []);
  return `
    ${questionRefreshHTML()}
    <p class="dir-copy">${tt("topicsLead")}</p>
    ${rows.map((topic) => `
      <label class="topic-row">
        <input type="checkbox" data-topic="${escapeHtml(topic.id)}" ${on.has(topic.id) ? "checked" : ""}/>
        <span>
          <b>${escapeHtml(topicLine(topic, "title", topic.title))}</b>
          <span>${escapeHtml(topicLine(topic, "blurb", topic.blurb || ""))}</span>
        </span>
      </label>
    `).join("")}
  `;
}

function playerCountHTML() {
  const n = state.playerCount;
  const buttons = Array.from({ length: 11 }, (_, i) => i + 2).map((count) =>
    `<button type="button" class="seat-n-btn ${n === count ? "on" : ""}" data-seats="${count}">${count}</button>`
  ).join("");
  return `
    <div class="seat-pick">
      <label class="field" for="pc">${tt("players")} <b>${n}</b></label>
      <div class="seat-n" role="group" aria-label="${escapeHtml(tt("players"))}">${buttons}</div>
      <input id="pc" type="range" min="2" max="12" value="${n}"/>
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
    const readyName = (state.profile && state.profile.displayName) || state.name || "Player";
    const offer = state.joinOffer;
    return `
      ${roomModeButtons()}
      <div class="dojo-gate-actions">
        <a class="ghost" id="goToDojo" href="${dojoHref()}">${tt("goToDojo")}</a>
      </div>
      ${genAlphaReviewHTML()}
      <div class="player-ready" role="status">
        <b>${escapeHtml(readyName)}</b>
        <span>${tt("activeReady")}</span>
      </div>
      <p class="dir-copy"><b>${tt("joinCopy")}</b></p>
      <label class="field" for="jc">${tt("tvRoomCode")}</label>
      <div class="copy-row join-code-row">
        <input id="jc" type="text" value="${escapeHtml(state.room || state.joinInput)}" maxlength="8" placeholder="XXXX" autocomplete="off" autocapitalize="characters"/>
        <button class="primary" id="joinRoom" type="button">${tt("joinRoom")}</button>
      </div>
      <p class="meta">${tt("joinByCode")}</p>
      ${roomListHTML("off")}
      ${roomListHTML("tv")}
      ${offer ? `
        <div class="join-offer">
          <p class="dir-copy"><b>${tt("joinInAction")}</b> ${escapeHtml(String(offer.tier || offer.phase || "").toUpperCase())}</p>
          <div class="row">
            <button class="ghost" type="button" id="joinView">${tt("viewShow")}</button>
            <button class="primary" type="button" id="joinPlay" ${offer.canPlay ? "" : "disabled"}>${tt("playShow")}</button>
          </div>
          <p class="meta">${offer.canPlay ? tt("playSeatOpen") : tt("playSeatClosed")}</p>
        </div>` : ""}
    `;
  }

  if (mode === "cast") {
    return `
      ${roomModeButtons()}
      <p class="dir-copy"><b>${tt("castCopy")}</b></p>
      ${playerCountHTML()}
      <label class="toggle">
        <input id="botFill" type="checkbox" ${state.botFill ? "checked" : ""}/>
        <span>${tt("fillBots")}</span>
      </label>
      <div class="seats">
        ${seats.map((s) => seatSpan(s)).join("")}
      </div>
      <p class="room-code">${tt("roomLabel", `<b id="codeCopy">${escapeHtml(state.room || "····")}</b>`)}</p>
      ${state.room ? `
        <label class="field" for="silkUrl">${tt("silkLink")}</label>
        <div class="copy-row">
          <input id="silkUrl" type="text" readonly value="${escapeHtml(silk)}"/>
          <button class="ghost" id="copySilk" type="button">${tt("copy")}</button>
        </div>
        <img class="qr" alt="${escapeHtml(tt("qrOpenAlt"))}" src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(silk)}"/>
        <p class="meta">${escapeHtml(tt("padJoinMeta", state.room, humans, bots))}</p>
      ` : `<p class="meta">${tt("makeTvLinkMeta")}</p>`}
      <button class="primary" id="openBuzzer" type="button">${tt("openBuzzer")}</button>
      <button class="ghost" id="castGo" type="button">${state.room ? tt("goCastCopy") : tt("goCastMake")}</button>
      ${roomListHTML("off")}
      ${roomListHTML("tv")}
      ${roomDojoEntryHTML()}
    `;
  }

  if (!isTvDisplay() && !state.onScreen) {
    const readyName = (state.profile && state.profile.displayName) || state.name || "Player";
    return `
      ${roomModeButtons()}
      <div class="player-ready" role="status">
        <b>${escapeHtml(readyName)}</b>
        <span>${tt("activeReady")}</span>
      </div>
      ${state.roomSetup ? `
        <p class="dir-copy">${tt("hostSetup")}</p>
        <p class="room-code">${tt("roomLabel", `<b>${escapeHtml(state.room || "····")}</b>`)}</p>
        ${topicsBody()}
        <button class="primary" id="openBuzzer" type="button">${tt("openBuzzer")}</button>
        <button class="ghost" id="castRoom" type="button">${tt("castThisRoom")}</button>
      ` : `
        <p class="dir-copy">${tt("offScreenHint")}</p>
        <button class="primary" id="createRoom" type="button">${tt("createRoom")}</button>
      `}
      ${roomListHTML("off")}
      ${roomListHTML("tv")}
      ${genAlphaReviewHTML()}
    `;
  }

  return `
    ${roomModeButtons()}
    ${playerCountHTML()}
    <label class="toggle">
      <input id="botFill" type="checkbox" ${state.botFill ? "checked" : ""}/>
      <span>${tt("fillBots")}</span>
    </label>
    <div class="seats">
      ${seats.map((s) => seatSpan(s)).join("")}
    </div>
    ${state.onScreen || isTvDisplay() ? `
      <p class="dir-copy">${tt("onScreenOwns")}</p>
      <p class="room-code">${tt("roomLabel", `<b id="codeCopy">${escapeHtml(state.room || "····")}</b>`)}</p>
      ${state.room ? `
        <div class="copy-row">
          <input id="silkUrl" type="text" readonly value="${escapeHtml(silk || tvSilkUrl(state.room))}"/>
          <button class="ghost" id="copySilk" type="button">${tt("copy")}</button>
        </div>
        <img class="qr" alt="${escapeHtml(tt("qrJoinAlt"))}" src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(shareUrl())}"/>
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
  const mode = pad ? "join" : (state.mpMode || "off");
  if (pad || mode === "join") return tt("goJoin");
  if (mode === "cast") return state.room ? tt("goCastCopy") : tt("goCastMake");
  if (isTvDisplay() || state.onScreen) return tt("goOpenTv");
  if (state.roomSetup || state.room) return tt("openBuzzer");
  return tt("createRoom");
}

function lobbyGateReason() {
  if (isTvDisplay()) return "";
  if (!hasPhoneProfile()) return tt("gateProfile");
  if (needsPasswordSetup()) return tt("gateSetPassword");
  if (!state.profileUnlocked) return tt("gatePassword");
  if (!isPlaced()) return tt("gateDojo");
  return "";
}

function entryHTML() {
  const p = state.profile || {};
  const draft = state.entryDraft || {};
  const name = draft.name != null ? draft.name : (hasPhoneProfile() ? (p.displayName || "") : (state.name && state.name !== "Player" ? state.name : ""));
  const email = draft.email != null ? draft.email : (p.email || "");
  const pw = draft.password || "";
  const ready = entryReady(name, email, pw);
  const existing = entryIsExisting(name);
  const stored = Boolean(hasPhoneProfile() && p.passwordHash);
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>${tt("tagline")}</small></div>
      <div class="grow"></div>
      ${languageSwitcherHtml(state.locale)}
      ${headerLinks({ dojo: true })}
    </div>
    <div class="entry-stage">
      <img class="entry-title" src="${TITLE_3D}" alt="Fast Answer!"/>
      <form class="entry-card" id="entryForm" autocomplete="on">
        <p class="dir-copy">${tt("entryLead")}</p>
        ${stored ? `<p class="meta">${tt("entryCreateHint")}</p>` : ""}
        ${state.forgotPassword && existing ? forgotPasswordHTML() : `
        <label class="field" for="entryName">${tt("name")}</label>
        <input id="entryName" type="text" value="${escapeHtml(name)}" maxlength="18" autocomplete="nickname" placeholder="${tt("name")}"/>
        <label class="field" for="entryEmail">${tt("email")}</label>
        <input id="entryEmail" type="email" value="${escapeHtml(email)}" maxlength="120" autocomplete="email" placeholder="${tt("email")}"/>
        ${existing ? "" : ageBracketHTML("entryAge", { ...p, ...draft, detectedCountry: state.detectedCountry })}
        <label class="field" for="entryPw">${tt("password")}</label>
        <input id="entryPw" type="password" value="${escapeHtml(pw)}" maxlength="64" autocomplete="${existing ? "current-password" : "new-password"}" placeholder="${tt("passwordHint")}"/>
        <p class="meta">${tt("deviceLockNote")}</p>
        <button class="primary ${ready ? "" : "hidden"}" id="enterProfile" type="button">${entryActionLabel(name)}</button>
        ${stored ? `<button class="word ${existing ? "" : "hidden"}" id="forgotPassword" type="button">${tt("forgotPassword")}</button>` : ""}
        ${stored ? `<button class="word" id="entryCreateNew" type="button">${tt("createNewProfile")}</button>` : ""}
        <button class="ghost" id="resetProfile" type="button">${tt("resetProfile")}</button>
        `}
        <p class="status" id="stt">${escapeHtml(state.statusMsg || "")}</p>
      </form>
    </div>
    <div></div>
    ${footHTML()}
    ${rulesHTML()}
  `;
}

function bindEntry() {
  document.querySelectorAll("[data-locale]").forEach((b) => {
    b.onclick = () => { syncEntryDraft(); void setLocale(b.dataset.locale); };
  });
  const nameEl = $("#entryName");
  const emailEl = $("#entryEmail");
  const pwEl = $("#entryPw");
  const btn = $("#enterProfile");
  const forgot = $("#forgotPassword");
  const sync = () => {
    syncEntryDraft();
    const nm = nameEl && nameEl.value;
    const em = emailEl && emailEl.value;
    const pw = pwEl && pwEl.value;
    const existing = entryIsExisting(nm);
    const ageOk = existing || ageIsAllowed(readYears($("#entryAgeYears")), readCountry($("#entryAgeCountry")), state.detectedCountry);
    if (btn) {
      btn.classList.toggle("hidden", !entryReady(nm, em, pw) || !ageOk);
      btn.textContent = entryActionLabel(nm);
    }
    if (pwEl) pwEl.autocomplete = existing ? "current-password" : "new-password";
    if (forgot) forgot.classList.toggle("hidden", !existing);
  };
  bindAgeToPack("entryAge", null, { save: false, after: sync });
  if (nameEl) nameEl.oninput = sync;
  if (emailEl) emailEl.oninput = sync;
  if (pwEl) {
    pwEl.oninput = sync;
    pwEl.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); void submitEntry(); } };
  }
  const form = $("#entryForm");
  if (form) form.onsubmit = (e) => { e.preventDefault(); void submitEntry(); };
  if (btn) btn.onclick = () => { void submitEntry(); };
  const createNew = $("#entryCreateNew");
  if (createNew) createNew.onclick = () => {
    state.entryDraft = { name: "", email: "", password: "" };
    state.forgotPassword = false;
    state.statusMsg = "";
    paint(true);
    requestAnimationFrame(() => {
      const el = $("#entryName");
      if (el) el.focus();
    });
  };
  const resetProfile = $("#resetProfile");
  if (resetProfile) resetProfile.onclick = () => { applyProfileReset(); paint(true); };
  bindForgotPassword();
  bindRules();
}

function syncEntryDraft() {
  state.entryDraft = {
    name: String(($("#entryName") && $("#entryName").value) || ""),
    email: String(($("#entryEmail") && $("#entryEmail").value) || ""),
    password: String(($("#entryPw") && $("#entryPw").value) || ""),
    age: readYears($("#entryAgeYears")),
    country: readCountry($("#entryAgeCountry")),
    ageBracket: readAge($("#entryAge")) || (state.entryDraft && state.entryDraft.ageBracket) || "",
  };
}

async function submitEntry() {
  syncEntryDraft();
  const name = String(state.entryDraft?.name || "").trim().slice(0, 18);
  const email = String(state.entryDraft?.email || "").trim();
  const pw = String(state.entryDraft?.password || "");
  if (!entryReady(name, email, pw)) return;
  if (entryIsExisting(name)) {
    const ok = await verifyProfilePassword(pw);
    if (!ok) {
      state.statusMsg = tt("wrongPassword");
      paint(true);
      return;
    }
    const ageBracket = readAge($("#entryAge"));
    saveProfile({ displayName: name, email, ...(ageBracket ? { ageBracket } : {}) });
    state.dojoMode = "home";
    state.roomDojoPanel = "";
    state.statusMsg = tt("profileEntered");
    state.entryDraft = null;
    markEntered();
    await activateGameProfile(state.profile);
    paint(true);
    return;
  }
  await commitNewProfile(name, email, pw);
}

function lobbyHTML() {
  const pad = isPad();
  const tv = isTvDisplay();
  const mode = pad ? "join" : (state.mpMode || "host");
  const gate = lobbyGateReason();
  const joining = pad || mode === "join";
  // Phone: keep primary enabled — when gated it is a clear Dojo CTA, not a grey dead button.
  const goGated = Boolean(gate) && !(tv && (mode === "host" || mode === "cast"));
  const goLabel = goGated
    ? (!hasPhoneProfile() ? tt("profileFirst")
      : needsPasswordSetup() ? tt("passwordFirst")
      : !state.profileUnlocked ? tt("unlockFirst")
      : tt("dojoFirst"))
    : lobbyGoLabel();
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
      ${headerLinks({ dojo: true, directions: true })}
      ${refreshNoticeHTML()}
    </div>
    <div class="lobby">
      <div class="lobby-copy">
        <h1 class="sr-only">Fast Answer!</h1>
        <img class="brand" src="${TITLE_3D}" alt="Fast Answer!"/>
        ${lobbySetupBannerHTML()}
        <div class="accord">
          ${acc("room", joining ? tt("joinRoom") : (mode === "cast" ? tt("castTv") : (!tv || !state.onScreen ? tt("offScreenRooms") : tt("room"))), `<small>${joining ? (state.room || "code") : state.playerCount + " seats"}</small>`, roomBody())}
          ${pad || (tv && forcedDisplay) ? "" : acc("set", tt("set"), "", setBody())}
        </div>
        ${!pad && !tv && !state.onScreen ? "" : `<div class="row">
          <button class="primary ${goGated ? "go-dojo-cta" : ""}" id="go" type="button">${goLabel}</button>
          ${state.onScreen && !forcedDisplay && role !== "pad" ? `<button class="ghost" data-off-screen type="button">${tt("offScreenReturn")}</button>` : ""}
        </div>`}
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
  const breaking = state.phase === "setbreak";
  const lockdownPlay = ld?.phase === "play" || ld?.phase === "flash";
  const lockdownIntro = ld?.phase === "intro";
  const isHero = ld ? ld.playerId === state.youId : true;
  const waiterPad = pad && ld && lockdownPlay && !isHero;
  const showAns = ld
    ? (lockdownPlay && (isHero || !pad) && !waiterPad)
    : ["buzz", "answer", "reveal"].includes(state.phase);
  const seated = isSeatedPlay();
  const canBuzz = readyPhase
    ? seated && (pad || !state.onScreen) && !state.readyIds[state.youId]
    : (!ld && seated && (pad || !state.onScreen) && state.phase === "buzz" && !state.buzzed);
  const canPick = state.viewing || (pad && !seated)
    ? false
    : ld
      ? lockdownPlay && isHero && ld.phase === "play"
      : state.phase === "answer" || (!state.onScreen && !pad && state.phase === "buzz");
  let prompt;
  if (readyPhase) prompt = "";
  else if (state.phase === "between") prompt = "";
  else if (endPhase) prompt = tt("showEnd");
  else if (ld?.phase === "wager") prompt = `LOCKDOWN — ${ld.name} · ${tt("lockdownWagers")}`;
  else if (ld?.phase === "intro") prompt = escapeHtml(tt("lockRulesClock", ld.introLeft));
  else if (ld?.phase === "result") prompt = escapeHtml(ld.won
    ? tt("lockResultClear", ld.name, ld.hits, ld.earned || 0)
    : tt("lockResultBroke", ld.name, ld.hits, ld.earned || 0));
  else if (breaking) prompt = escapeHtml(tierName(state.setBreakTier));
  else if (!q) prompt = tt("showEnd");
  else if (state.viewing) prompt = tt("viewingNow");
  else if (pad && !seated) prompt = tt("queuedPlay");
  else if (waiterPad) prompt = tt("lockdownWait", ld.waitLeft ?? LOCKDOWN_WAIT_S);
  else if (!q) prompt = tt("showEnd");
  else prompt = escapeHtml(q.prompt);
  const slang = q?.slang && prompt === escapeHtml(q.prompt)
    ? `<p class="q-slang">${escapeHtml(q.slang)}</p>`
    : "";
  const backMore = q?.lockdownJump === "back-more" ? ` · ${tt("lockdownBackMore")}` : "";
  const between = state.phase === "between";
  const cat = readyPhase
    ? tt("ready")
    : between
      ? ""
      : endPhase
        ? tt("logoEnd")
        : breaking
          ? tt("setBreakCat")
          : (ld
            ? lockdownLogo(ld, backMore)
            : (q ? escapeHtml([q.categoryTitle, questionCredit(q)].filter(Boolean).join(" · ")) : ""));
  const tier = readyPhase ? tt("logoReady") : (endPhase ? tt("logoEnd") : (between ? "" : (breaking ? tt("setBreakCat") : (ld ? tt("lockdownWord") : (q ? tierName(q.tier) : tt("logoEnd"))))));
  const n = readyPhase || ld || endPhase || breaking || between ? "" : ` · ${state.i + 1}/${state.qs.length || ROUND}`;
  const buzzLabel = readyPhase
    ? (state.readyIds[state.youId] ? tt("ready") : tt("buzzReady"))
    : tt("buzz");
  const leaveLabel = state.viewing && !endPhase ? tt("exitShow") : tt("lobby");
  const dropped = Boolean(state.dropoutIds && state.dropoutIds[state.youId]);
  const leaveTop = canLeaveNow()
    ? `<button class="word" id="quit" type="button">${leaveLabel}</button>`
    : "";
  const dropoutBtn = !canLeaveNow() && !endPhase
    ? `<button class="ghost" id="dropout" type="button" ${dropped ? "disabled" : ""}>${dropped ? tt("dropoutPressed") : tt("dropout")}</button>`
    : "";
  const phoneBoard = !tv && (pad || !state.onScreen);
  if (phoneBoard) {
    const answersMarkup = showAns && q
      ? `<div class="answers phone-answers">${q.choices.map((c, i) => {
          let cls = "ans";
          const picked = ld ? ld.picked : state.picked;
          const reveal = state.phase === "reveal" || ld?.phase === "flash" || ld?.phase === "result";
          if (reveal) {
            if (i === q.correctIndex) cls += " ok";
            else if (i === picked) cls += " bad";
          } else if (i === picked) cls += " on";
          const dis = canPick && !reveal ? "" : "disabled";
          return `<button class="${cls}" data-i="${i}" type="button" ${dis}><small>${LETTERS[i]}</small>${escapeHtml(c)}</button>`;
        }).join("")}</div>`
      : (breaking
        ? `<p class="meta">${escapeHtml(tt("setBreakClock", state.setBreakLeft))}</p>`
        : `<p class="meta">${tt("answersWait")}</p>`);
    return `
      <img class="bg" alt="" src="${STUDIOS[state.studioI % STUDIOS.length]}"/>
      <div class="veil"></div>
      <div class="top">
        <div class="logo">Fast Answer!<small>${tier}${n}</small></div>
        <div class="grow"></div>
        <button class="word rules-link" id="rulesBtn" type="button">${tt("rules")}</button>
        ${canLeaveNow() ? `<button class="word" id="quit" type="button">${leaveLabel}</button>` : ""}
        ${refreshNoticeHTML()}
      </div>
      <div class="phone-lock">
        <div class="phone-board">
          <div class="qcard ${ld ? "lock" : ""} ${breaking ? "setbreak" : ""} ${state.mapLive ? "map-on" : ""}">
            <p class="cat">${cat}</p>
            ${slang}
            <p class="qtext ${breaking ? "setbreak" : ""}">${prompt}</p>
            <p class="meta" id="clock">${endPhase ? scoreboard() : clockText()}</p>
          </div>
          <div class="phone-answers">${answersMarkup}</div>
          ${endPhase ? "" : `<div class="phone-scores">${scoreboard()}</div>`}
        </div>
        <div class="buzzbar">
          ${rivalsHTML()}
          ${!ld && !endPhase && !breaking ? `<button class="buzzer ${canBuzz ? "lit" : ""}" id="buzz" type="button" ${canBuzz ? "" : "disabled"}>${buzzLabel}</button>` : ""}
          ${!ld && !endPhase && !breaking && !pad ? `<div class="dock set-dock">
            <label class="slider-lab">${tt("jeremy")} <input id="hs" type="range" min="24" max="62" value="${state.hostH}" step="1"/></label>
            <label class="slider-lab">${tt("studio")} <input id="st" type="range" min="0" max="${STUDIOS.length - 1}" value="${state.studioI}" step="1"/></label>
          </div>` : ""}
          ${dropoutBtn}
          ${dropped && !canLeaveNow() ? `<p class="meta">${tt("dropoutWait")}</p>` : ""}
        </div>
      </div>
      ${rulesHTML()}
    `;
  }
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI % STUDIOS.length]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>${tier}${n}</small></div>
      <div class="grow"></div>
      ${readyPhase || endPhase ? "" : scoreboard()}
      <button class="word rules-link" id="rulesBtn" type="button">${tt("rules")}</button>
      ${leaveTop}
      ${refreshNoticeHTML()}
    </div>
    <div class="play">
      ${readyPhase ? readyCardHTML() : (endPhase ? `<div class="qwrap"><div class="qcard">
        <p class="cat">${tt("logoEnd")}</p>
        <p class="qtext">${tt("showEnd")}</p>
        <p class="meta" id="clock">${scoreboard()}</p>
        <div class="row" style="margin-top:12px">
          <button class="primary" id="quit" type="button">${tt("lobby")}</button>
        </div>
      </div></div>` : `<div class="qwrap">
        <div class="qcard ${ld ? "lock" : ""} ${breaking ? "setbreak" : ""} ${state.mapLive ? "map-on" : ""}">
          <p class="cat">${cat}</p>
          ${slang}
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
    }).join("")}${mapStealHTML()}</div>` : (waiterPad ? `<div class="wager"><p class="wager-copy">${tt("lockdownWait", ld.waitLeft ?? LOCKDOWN_WAIT_S)}</p><p class="meta">${tt("glimpseOnly")}</p></div>` : `<div></div>`)))}
    <div class="buzzbar">
      ${!state.onScreen && !pad && !ld && !readyPhase && !endPhase ? `<div class="dock set-dock">
        <label class="slider-lab">${tt("jeremy")} <input id="hs" type="range" min="24" max="62" value="${state.hostH}" step="1"/></label>
        <label class="slider-lab">${tt("studio")} <input id="st" type="range" min="0" max="${STUDIOS.length - 1}" value="${state.studioI}" step="1"/></label>
      </div>` : ""}
      ${(pad || !tv) && !ld && !endPhase && !breaking && !state.viewing && seated ? `<button class="buzzer ${canBuzz ? "lit" : ""} ${readyPhase && state.readyIds[state.youId] ? "ready-on" : ""}" id="buzz" type="button" ${canBuzz ? "" : "disabled"}>${buzzLabel}</button>` : ""}
      ${ld ? `<div class="lock-flag">${ld.phase === "wager" ? tt("lockdownWagers") : ld.phase === "intro" ? escapeHtml(tt("lockRulesClock", ld.introLeft)) : escapeHtml(tt("lockFlag", ld.name, ld.hits, ld.earned || 0))}</div>` : ""}
      ${(pad && (state.phase === "answer" || (ld?.phase === "play" && isHero))) ? `<button class="ghost mic" id="mic" type="button">${tt("speak")}</button>` : ""}
      ${dropoutBtn}
      ${dropped && !canLeaveNow() ? `<p class="meta">${tt("dropoutWait")}</p>` : ""}
      ${(canLeaveNow() && (pad || endPhase || state.viewing)) ? `<button class="ghost" id="quitBar" type="button">${leaveLabel}</button>` : ""}
    </div>
    ${joinQrChip(140)}
    ${rulesHTML()}
  `;
}

async function openRoom(screen) {
  const next = screen === "tv" || (screen !== "off" && isTvDisplay()) ? "tv" : "off";
  state.room = state.room || code();
  ensureHostKey();
  const saved = await rooms("POST", {
    action: "create",
    code: state.room,
    host: state.name,
    hostKey: state.hostKey,
    screen: next,
  });
  if (!saved || saved.error) {
    state.statusMsg = tt("roomNotListed", state.room);
  }
  startPoll();
  return saved;
}

async function createOffScreenRoom() {
  if (!isTvDisplay()) {
    const gate = lobbyGateReason();
    if (gate) {
      state.statusMsg = gate;
      openDojoPage(dojoModeForGate());
      return;
    }
  }
  state.onScreen = false;
  state.room = Math.random().toString(36).slice(2, 6).toUpperCase();
  state.joinInput = state.room;
  state.mpMode = "off";
  state.roomSetup = true;
  state.lobbyOpen = "room";
  try {
    localStorage.setItem("fa-mp", "off");
    localStorage.setItem("fa-onscreen", "0");
  } catch { /* ignore */ }
  saveProfile({ displayName: state.name });
  const saved = await openRoom("off");
  state.roomSetup = true;
  await refreshActiveRooms();
  if (saved && !saved.error) state.statusMsg = "";
  paint(true);
}

async function openBuzzer() {
  if (!state.room) {
    await createOffScreenRoom();
  }
  if (!state.room) return;
  ensureHostKey();
  state.onScreen = false;
  state.roomSetup = false;
  state.lobbyOpen = "room";
  try { localStorage.setItem("fa-onscreen", "0"); } catch { /* ignore */ }
  enterReady();
}

async function castThisRoom() {
  if (!state.room) return;
  ensureHostKey();
  const saved = await rooms("POST", { action: "cast", code: state.room, hostKey: state.hostKey });
  state.roomSetup = false;
  state.onScreen = isTvDisplay();
  state.mpMode = "cast";
  state.lobbyOpen = "room";
  try {
    localStorage.setItem("fa-mp", "cast");
    localStorage.setItem("fa-onscreen", state.onScreen ? "1" : "0");
  } catch { /* ignore */ }
  if (!saved || saved.error) state.statusMsg = tt("roomNotListed", state.room);
  else state.statusMsg = tt("castListed", state.room);
  await refreshActiveRooms();
  paint(true);
  if (saved && !saved.error) {
    const ok = await copyText(tvSilkUrl(state.room));
    if (!ok) {
      state.statusMsg = tt("copyFail", tvSilkUrl(state.room));
      paint(true);
    }
  }
}

function bindDojoSurface() {
  const createProfile = $("#createProfile");
  if (createProfile) createProfile.onclick = async () => {
    const name = String(($("#nm") && $("#nm").value) || "").trim().slice(0, 18);
    const email = String(($("#emNew") && $("#emNew").value) || "");
    const pw = String(($("#pwNew") && $("#pwNew").value) || "");
    await commitNewProfile(name, email, pw);
  };
  const roomCreateSubmit = $("#roomCreateSubmit");
  if (roomCreateSubmit) roomCreateSubmit.onclick = async () => {
    const name = String(($("#roomNm") && $("#roomNm").value) || "").trim().slice(0, 18);
    const email = String(($("#roomEm") && $("#roomEm").value) || "");
    const pw = String(($("#roomPwNew") && $("#roomPwNew").value) || "");
    await commitNewProfile(name, email, pw);
  };
  const commitPassword = async (pw, pw2) => {
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
    const sealed = sealPassword(pw);
    saveProfile(sealed);
    state.profileUnlocked = true;
    state.dojoMode = "home";
    state.roomDojoPanel = "";
    state.statusMsg = tt("passwordSaved");
    if (needsPlacement(state.profile)) startDojo();
    else paint(true);
  };
  const setProfilePw = $("#setProfilePw");
  if (setProfilePw) setProfilePw.onclick = async () => {
    const pw = String(($("#pwNew") && $("#pwNew").value) || "");
    const pw2 = String(($("#pwConfirm") && $("#pwConfirm").value) || "");
    await commitPassword(pw, pw2);
  };
  const roomSetPw = $("#roomSetPw");
  if (roomSetPw) roomSetPw.onclick = async () => {
    const pw = String(($("#roomPwNew") && $("#roomPwNew").value) || "");
    const pw2 = String(($("#roomPwConfirm") && $("#roomPwConfirm").value) || "");
    await commitPassword(pw, pw2);
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
    try { sessionStorage.setItem("fa-dojo-mode", "unlock"); } catch { /* ignore */ }
    state.statusMsg = tt("profileLocked");
    paint(true);
  };
  const resetProfile = $("#resetProfile");
  if (resetProfile) resetProfile.onclick = () => { applyProfileReset(); paint(true); };
  bindForgotPassword();
  const dojoCreateAlt = $("#dojoCreateAlt");
  if (dojoCreateAlt) dojoCreateAlt.onclick = () => openDojoPage("create");
  const dojoCancelMode = $("#dojoCancelMode");
  if (dojoCancelMode) dojoCancelMode.onclick = () => {
    state.dojoMode = needsPasswordSetup() ? "setpw" : (state.profileUnlocked ? "home" : "unlock");
    try { sessionStorage.setItem("fa-dojo-mode", state.dojoMode); } catch { /* ignore */ }
    paint(true);
  };
  const saveProfileEdit = $("#saveProfileEdit");
  if (saveProfileEdit) saveProfileEdit.onclick = async () => {
    if (!state.profileUnlocked) return;
    const name = String(($("#nm") && $("#nm").value) || state.name).trim().slice(0, 18);
    const email = String(($("#em") && $("#em").value) || "").trim().slice(0, 120);
    const pw = String(($("#pwNew") && $("#pwNew").value) || "");
    const pw2 = String(($("#pwConfirm") && $("#pwConfirm").value) || "");
    const generation = readGeneration($("#playerGen"));
    const form = readAgeForm("playerAge");
    const detected = state.detectedCountry || "";
    if (!ageIsAllowed(form.age, form.country, detected)) {
      state.statusMsg = tt("ageTooYoung", requiredAge(form.country, detected), ageLimitPlace(form.country, detected));
      paint(true);
      return;
    }
    const patch = {
      displayName: name || state.name,
      email,
      age: form.age,
      country: form.country,
      detectedCountry: detected,
      ageBracket: bracketForAge(form.age),
      generation: generationForYears(form.age) || generation,
    };
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
      Object.assign(patch, sealPassword(pw));
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
      void fileToAvatar(file).then((thumb) => {
        saveProfile({ thumb });
        state.statusMsg = tt("profileSaved");
        paint(true);
      }).catch(() => {
        state.statusMsg = tt("photoBig");
        paint(true);
      });
    };
  };
  bindThumb($("#thDojo"));
  bindThumb($("#roomTh"));
  const scoreScroll = $("#scoreScroll");
  if (scoreScroll) scoreScroll.onclick = () => {
    state.dojoScroll = state.dojoScroll === "closed" ? "scores" : "closed";
    paint(true);
  };
  bindAgeToPack("playerAge", "#playerGen");
  document.querySelectorAll("[data-dojo-bg]").forEach((b) => {
    b.onclick = () => {
      saveProfile({ dojoBg: b.dataset.dojoBg });
      paint(true);
    };
  });
  const dojoGo = $("#dojoGo");
  if (dojoGo) dojoGo.onclick = () => startDojo();
  const retake = $("#retake");
  if (retake) retake.onclick = () => startDojo();
  const refreshPlacement = $("#refreshPlacement");
  if (refreshPlacement) refreshPlacement.onclick = () => { void refreshPlacementSet(); };
  document.querySelectorAll("[data-dojo]").forEach((b) => {
    b.onclick = () => dojoPick(Number(b.dataset.dojo));
  });
  bindGenAlphaReview();
}

function bindGenAlphaReview() {
  const toggle = $("#genAlphaToggle");
  if (toggle) toggle.onclick = () => {
    state.genAlphaOpen = !state.genAlphaOpen;
    paint(true);
  };
  const genPick = $("#dojoGen");
  if (genPick) genPick.onchange = () => {
    state.reviewGen = genPick.value;
    state.genAlphaAbout = "";
    paint(true);
  };
  const about = $("#genAlphaAbout");
  const note = $("#genAlphaNote");
  const mail = $("#genAlphaMail");
  const sync = () => {
    if (about) state.genAlphaAbout = about.value;
    if (note) state.genAlphaNote = note.value;
    if (mail) mail.setAttribute("href", genAlphaMailHref());
  };
  if (about) about.onchange = sync;
  if (note) note.oninput = sync;
}

function bindLobby() {
  document.querySelectorAll("[data-locale]").forEach((b) => {
    b.onclick = () => { void setLocale(b.dataset.locale); };
  });
  bindAcc();
  document.querySelectorAll("[data-mp]").forEach((b) => {
    b.onclick = () => {
      state.mpMode = b.dataset.mp;
      localStorage.setItem("fa-mp", state.mpMode);
      state.statusMsg = "";
      state.lobbyOpen = "room";
      if (state.mpMode === "off" || state.mpMode === "join" || state.mpMode === "cast") {
        void refreshActiveRooms().then(() => paint(true));
        return;
      }
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
    void fileToAvatar(file).then((thumb) => {
      saveProfile({ thumb });
      paint(true);
    }).catch(() => {
      state.statusMsg = tt("photoBig");
      paint(true);
    });
  };
  const pc = $("#pc");
  if (pc) pc.oninput = (e) => {
    state.playerCount = clamp(Number(e.target.value), 2, 12);
    localStorage.setItem("fa-seats", String(state.playerCount));
    fillSeats();
    paint(true);
  };
  document.querySelectorAll("[data-seats]").forEach((b) => {
    b.onclick = () => {
      state.playerCount = clamp(Number(b.dataset.seats), 2, 12);
      localStorage.setItem("fa-seats", String(state.playerCount));
      fillSeats();
      paint(true);
    };
  });
  document.querySelectorAll(".js-refresh-qs").forEach((b) => {
    b.onclick = () => { void refreshQuestionSet(); };
  });
  document.querySelectorAll(".js-refresh-lock").forEach((b) => {
    b.onclick = () => refreshLockdownQuestions();
  });
  bindAgeToPack("playerAge", "#playerGen");
  bindAgeToPack("roomPlayerAge", "#roomPlayerGen");
  const botFill = $("#botFill");
  if (botFill) botFill.onchange = (e) => {
    state.botFill = Boolean(e.target.checked);
    localStorage.setItem("fa-bots", state.botFill ? "1" : "0");
    fillSeats();
    paint(true);
  };
  const bindScreen = async (on) => {
    if (forcedDisplay && !on) return;
    state.onScreen = Boolean(on);
    localStorage.setItem("fa-onscreen", state.onScreen ? "1" : "0");
    if (state.onScreen) {
      state.mpMode = "host";
      localStorage.setItem("fa-mp", "host");
      state.lobbyOpen = "room";
      await openRoom("tv");
    }
    paint(true);
  };
  const os = $("#os");
  if (os) os.onchange = () => { if (os.checked) void bindScreen(true); };
  const osOff = $("#osOff");
  if (osOff) osOff.onchange = () => { if (osOff.checked) void bindScreen(false); };
  document.querySelectorAll("[data-off-screen]").forEach((b) => {
    b.onclick = () => void bindScreen(false);
  });
  document.querySelectorAll("[data-topic]").forEach((box) => {
    box.onchange = () => {
      const id = String(box.dataset.topic || "");
      if (!id) return;
      const next = new Set(state.topicsOn || []);
      if (box.checked) next.add(id);
      else next.delete(id);
      if (!next.size) {
        box.checked = true;
        state.statusMsg = tt("topicsNeedOne");
        paint(true);
        return;
      }
      state.topicsOn = [...next];
      try { localStorage.setItem(TOPICS_KEY, JSON.stringify(state.topicsOn)); } catch { /* ignore */ }
      state.dealFresh = false;
      state.statusMsg = "";
      paint(true);
    };
  });
  const joinRoomBtn = $("#joinRoom");
  if (joinRoomBtn) joinRoomBtn.onclick = () => {
    const jc = $("#jc");
    const code = jc ? String(jc.value || "") : (state.joinInput || "");
    void beginJoin(code);
  };
  document.querySelectorAll("[data-join-room]").forEach((b) => {
    b.onclick = () => {
      const code = String(b.dataset.joinRoom || "");
      if (!code) return;
      const jc = $("#jc");
      if (jc) jc.value = code.toUpperCase();
      void beginJoin(code);
    };
  });
  const createRoomBtn = $("#createRoom");
  if (createRoomBtn) createRoomBtn.onclick = () => { void createOffScreenRoom(); };
  const castRoomBtn = $("#castRoom");
  if (castRoomBtn) castRoomBtn.onclick = () => { void castThisRoom(); };
  document.querySelectorAll("#openBuzzer").forEach((b) => {
    b.onclick = () => { void openBuzzer(); };
  });
  document.querySelectorAll("[data-join-now]").forEach((b) => {
    b.onclick = () => {
      const code = String(b.dataset.joinNow || "");
      if (!code) return;
      const jc = $("#jc");
      if (jc) jc.value = code.toUpperCase();
      void beginJoin(code);
    };
  });
  const joinView = $("#joinView");
  if (joinView) joinView.onclick = () => { void confirmJoin("view"); };
  const joinPlay = $("#joinPlay");
  if (joinPlay) joinPlay.onclick = () => { void confirmJoin("play"); };
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
  const routeToDojo = () => openDojoPage(dojoModeForGate());
  const goToDojoBtn = $("#goToDojo");
  if (goToDojoBtn) goToDojoBtn.onclick = (e) => {
    e.preventDefault();
    routeToDojo();
  };
  const bannerGoDojo = $("#bannerGoDojo");
  if (bannerGoDojo) bannerGoDojo.onclick = () => routeToDojo();
  const toggleRoomPanel = (which) => {
    state.roomDojoPanel = state.roomDojoPanel === which ? "" : which;
    state.lobbyOpen = "room";
    paint(true);
  };
  const roomCreateProfile = $("#roomCreateProfile");
  if (roomCreateProfile) roomCreateProfile.onclick = () => toggleRoomPanel("create");
  const roomShowUnlock = $("#roomShowUnlock");
  if (roomShowUnlock) roomShowUnlock.onclick = () => toggleRoomPanel("unlock");
  const roomUnlockProfile = $("#roomUnlockProfile");
  if (roomUnlockProfile) roomUnlockProfile.onclick = async () => {
    const pw = String(($("#pwUnlockRoom") && $("#pwUnlockRoom").value) || "");
    const ok = await verifyProfilePassword(pw);
    if (!ok) {
      state.statusMsg = tt("wrongPassword");
      state.roomDojoPanel = "unlock";
      state.lobbyOpen = "room";
      paint(true);
      return;
    }
    state.profileUnlocked = true;
    state.dojoMode = "home";
    state.roomDojoPanel = "";
    state.statusMsg = "";
    if (needsPlacement(state.profile)) startDojo();
    else paint(true);
  };
  bindDojoSurface();
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
  bindSliders();
  bindRules();
  const go = $("#go");
  if (go) go.onclick = () => void onLobbyGo();
  const startPhone = $("#startPhone");
  if (startPhone) startPhone.onclick = () => void startPhoneGame();
  const castGo = $("#castGo");
  if (castGo) castGo.onclick = () => void onLobbyGo();
  bindQrChip();
}

async function beginJoin(raw) {
  const code = String(raw || state.room || state.joinInput || joinCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (!code || code.length < 3) {
    state.statusMsg = tt("enterCode");
    state.lobbyOpen = "room";
    state.mpMode = "join";
    paint(true);
    return false;
  }
  if (!hasPhoneProfile()) {
    state.statusMsg = tt("gateProfile");
    openDojoPage("create");
    return false;
  }
  if (needsPasswordSetup() || !state.profileUnlocked) {
    state.statusMsg = needsPasswordSetup() ? tt("gateSetPassword") : tt("gatePassword");
    openDojoPage(dojoModeForGate());
    return false;
  }
  if (!isPlaced()) {
    state.statusMsg = tt("dojoPhone");
    openDojoPage("home");
    return false;
  }
  state.room = code;
  state.joinInput = code;
  const live = await rooms("GET");
  const phase = live && live.state && live.state.phase;
  if (!live || live.error || !phase || phase === "lobby" || phase === "ready") {
    state.viewing = false;
    state.seatIntent = "play";
    state.joinOffer = null;
    return joinAsBuzzer();
  }
  const qs = live.state.qs || [];
  const index = Number(live.state.i) || 0;
  const current = (live.state.q && live.state.q.tier) || (qs[index] && qs[index].tier) || "";
  state.joinOffer = {
    code,
    phase,
    canPlay: phase !== "end" && nextQuestionAllowsJoin(qs, index),
    tier: current,
  };
  state.lobbyOpen = "room";
  state.mpMode = "join";
  state.statusMsg = "";
  paint(true);
  return false;
}

async function confirmJoin(intent) {
  const offer = state.joinOffer;
  if (!offer) return beginJoin(state.room);
  if (intent === "play" && !offer.canPlay) {
    state.statusMsg = tt("playSeatClosed");
    paint(true);
    return false;
  }
  state.viewing = intent === "view";
  state.seatIntent = intent === "view" ? "view" : "play";
  state.room = offer.code;
  state.joinInput = offer.code;
  state.joinOffer = null;
  return joinAsBuzzer();
}

function ageGateMessage() {
  const detected = state.profile?.detectedCountry || state.detectedCountry;
  return tt("ageTooYoung", requiredAge(state.profile?.country, detected), ageLimitPlace(state.profile?.country, detected));
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
    openDojoPage("create");
    return false;
  }
  if (needsPasswordSetup() || !state.profileUnlocked) {
    state.statusMsg = needsPasswordSetup() ? tt("gateSetPassword") : tt("gatePassword");
    openDojoPage(dojoModeForGate());
    return false;
  }
  if (!isPlaced()) {
    state.statusMsg = tt("dojoPhone");
    openDojoPage("home");
    return false;
  }
  if (!state.viewing && !ageIsAllowed(state.profile?.age, state.profile?.country, state.profile?.detectedCountry || state.detectedCountry)) {
    state.statusMsg = ageGateMessage();
    openDojoPage("home");
    return false;
  }
  saveProfile({ displayName: state.name });
  const prevRole = role;
  role = "pad";
  state.mpMode = "join";
  localStorage.setItem("fa-mp", "join");
  state.room = code;
  state.joinInput = code;
  state.onScreen = false;
  state.youId = "p-" + (state.profile?.id || state.name || "pad").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16);
  if (!state.youId || state.youId === "p-") state.youId = "p-" + uid().slice(0, 8);
  state.leftPad = false;
  const joined = await rooms("POST", {
    action: "join",
    code: state.room,
    name: state.name,
    id: state.youId,
    thumb: state.profile?.thumb || "",
    seat: state.viewing ? "view" : "play",
    age: state.profile?.age ?? "",
    country: state.profile?.country || "",
    detectedCountry: state.profile?.detectedCountry || state.detectedCountry || "",
    ageBracket: state.profile?.ageBracket || "",
    generation: playerGeneration(state.profile),
  });
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
    applyHostState(live.state);
    if (live.guests) ingestGuests(live.guests);
  } else {
    state.phase = "ready";
  }
  state.statusMsg = state.viewing
    ? tt("joinedView", code)
    : (live?.state?.phase && live.state.phase !== "lobby" && live.state.phase !== "ready"
      ? tt("queuedPlay")
      : tt("joinedPlay", code));
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
    await beginJoin(state.room || state.joinInput || joinCode);
    return;
  }

  if (mode === "cast") {
    if (!isTvDisplay()) {
      const gate = lobbyGateReason();
      if (gate) {
        state.statusMsg = gate;
        openDojoPage(dojoModeForGate());
        return;
      }
    }
    saveProfile({ displayName: state.name });
    if (!state.room) state.room = Math.random().toString(36).slice(2, 6).toUpperCase();
    state.onScreen = isTvDisplay();
    state.roomSetup = false;
    try { localStorage.setItem("fa-onscreen", state.onScreen ? "1" : "0"); } catch { /* ignore */ }
    await openRoom("tv");
    await refreshActiveRooms();
    state.statusMsg = tt("castListed", state.room);
    state.lobbyOpen = "room";
    paint(true);
    const url = tvSilkUrl(state.room);
    const ok = await copyText(url);
    if (!ok) {
      state.statusMsg = tt("copyFail", url);
      paint(true);
    }
    return;
  }

  if (!isTvDisplay() && !state.onScreen) {
    if (state.roomSetup && state.room) await openBuzzer();
    else await createOffScreenRoom();
    return;
  }

  if (!isTvDisplay()) {
    const gate = lobbyGateReason();
    if (gate) {
      state.statusMsg = gate;
      openDojoPage(dojoModeForGate());
      return;
    }
  }
  saveProfile({ displayName: state.name });
  if (state.onScreen || isTvDisplay()) {
    await openRoom("tv");
    enterReady();
    return;
  }
  startGame();
}

function bindAcc() {
  document.querySelectorAll("[data-acc]").forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.acc;
      if (b.dataset.accScope === "play") state.playOpen = state.playOpen === id ? "" : id;
      else state.lobbyOpen = state.lobbyOpen === id ? "" : id;
      paint(true);
    };
  });
}

async function startPhoneGame() {
  const gate = lobbyGateReason();
  if (gate) {
    state.statusMsg = gate;
    openDojoPage(dojoModeForGate());
    return;
  }
  state.onScreen = false;
  state.viewing = false;
  state.mpMode = "host";
  localStorage.setItem("fa-onscreen", "0");
  localStorage.setItem("fa-mp", "host");
  saveProfile({ displayName: state.name });
  state.playOpen = "ask";
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
  document.querySelectorAll(".js-refresh-lock").forEach((b) => {
    b.onclick = () => refreshLockdownQuestions();
  });
  const bz = $("#buzz");
  if (bz) bz.onclick = () => buzz();
  const mic = $("#mic");
  if (mic) mic.onclick = listenVoice;
  const goLobby = () => leaveToLobby();
  document.querySelectorAll("#quit, #quitBar").forEach((el) => { el.onclick = goLobby; });
  const dropout = $("#dropout");
  if (dropout) dropout.onclick = () => pressDropout();
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
  bindAcc();
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
      seat: g.seat === "view" ? "view" : "play",
      age: Number.isInteger(Number(g.age)) ? Number(g.age) : "",
      ageBracket: String(g.ageBracket || "").slice(0, 8),
      generation: String(g.generation || "").slice(0, 40),
    }))
    .slice(0, 11);
  if (state.phase === "lobby" || state.phase === "ready") return;
  if (role === "pad") return;
  const queued = [];
  state.guests.forEach((g) => {
    if (g.seat === "view") return;
    if (state.players.some((p) => p.id === g.id || p.name === g.name)) {
      const existing = state.players.find((p) => p.id === g.id || p.name === g.name);
      if (existing && g.thumb) existing.thumb = g.thumb;
      return;
    }
    queued.push(g);
  });
  state.pendingJoins = queued;
}

function startGame() {
  seatPlayers();
  state.playOpen = "ask";
  const reuse = Boolean(state.dealFresh && Array.isArray(state.qs) && state.qs.length)
    && state.dealTopicKey === topicDealKey();
  if (!reuse) state.qs = dealFromPacks();
  state.dealFresh = false;
  state.spent = new Set(state.qs.map((q) => q.id));
  rememberDealtIds(state.qs.map((q) => q.id));
  state.i = 0;
  state.lockdownAt = pickLockdownSlots();
  state.lockdown = null;
  state.maps = {};
  state.mapUses = {};
  state.setBreakLeft = 0;
  state.setBreakTier = "";
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
    if (applyRefreshFromRoom(j)) paint(true);
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
    if (role !== "pad" && j.dropoutIds) {
      state.dropoutIds = { ...(state.dropoutIds || {}), ...j.dropoutIds };
      maybeEndFromDropout();
    }
    if (role === "pad" && j.state && j.state.phase) {
      // Kicked from TV?
      if (j.state.kickedId && j.state.kickedId === state.youId && (j.state.kickedAt || 0) > (state.lastKickAt || 0)) {
        state.lastKickAt = j.state.kickedAt;
        state.statusMsg = "Removed from room by TV.";
        leaveToLobby();
        return;
      }
      if (j.state.phase === "lobby") {
        if (state.phase === "lobby") state.phase = "ready";
        if (state.showLive) return;
        paint(true);
        return;
      }
      if (state.showLive && (j.state.phase === "ready" || j.state.phase === "lobby")) return;
      if (["read", "buzz", "answer", "reveal", "setbreak", "between", "end"].includes(j.state.phase)) {
        state.showLive = true;
      }
      applyHostState(j.state);
      if (j.dropoutIds) state.dropoutIds = { ...(state.dropoutIds || {}), ...j.dropoutIds };
      if (Array.isArray(j.state.qs) && j.state.qs.length) state.qs = j.state.qs;
      if (j.guests) ingestGuests(j.guests);
      paint();
    }
    if (role !== "pad" && j.state?.buzzed && !state.buzzed && state.phase === "buzz") {
      takeBuzz(j.state.buzzId || "", j.state.buzzBy || "Player");
    }
    if (role !== "pad" && j.state?.maps && mapPhaseOpen()) {
      Object.entries(j.state.maps).forEach(([id, target]) => {
        if (!target) {
          delete state.maps[id];
          return;
        }
        if (state.maps[id] === target) return;
        if (mapUsesLeft(state.mapUses?.[id]) <= 0) return;
        state.maps[id] = target;
      });
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
    if (role !== "pad" && state.hostKey && state.room && state.phase !== "lobby" && pollN % 5 === 0) {
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
  if (isDojoPage) {
    app.className = "stage dojo";
    applyHostSize();
    app.innerHTML = dojoPageHTML();
    bindDojoPage();
    return;
  }
  app.className = "stage"
    + (role === "pad" ? " pad" : "")
    + (state.onScreen && role !== "pad" ? " tv" : "")
    + (state.phase === "lobby" && state.onScreen && role !== "pad" ? " tv-scroll" : "")
    + (state.phase !== "lobby" && (role === "pad" || !state.onScreen) ? " phone" : "")
    + (state.lockdown ? " lockdown" : "")
    + (state.rules ? " rules-open" : "");
  document.documentElement.classList.toggle("tv-scroll", app.classList.contains("tv-scroll"));
  document.body.classList.toggle("tv-scroll", app.classList.contains("tv-scroll"));
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
    state.profile?.dojoBg, (state.profile?.topScores || []).length, state.dojoScroll, state.forgotPassword ? 1 : 0,
    state.profileUnlocked ? 1 : 0, state.dojoMode, state.roomDojoPanel, state.profile?.passwordHash ? 1 : 0,
    state.dirOpen, state.qrOpen, state.mpMode, state.statusMsg, state.botFill, state.locale,
    Object.keys(state.readyIds || {}).filter((k) => state.readyIds[k]).join(","),
    state.wagerDraft?.side, state.wagerDraft?.amount, (state.activeRooms || []).map((r) => `${r.code}:${r.screen || ""}`).join(","),
    state.roomSetup ? 1 : 0,
    state.viewing ? 1 : 0, state.joinOffer?.code || "", state.joinOffer?.canPlay ? 1 : 0,
    state.playOpen, (state.topicsOn || []).join(","),
    state.dealFresh ? (state.qs || []).length : 0,
    state.refreshNotice?.phase || "",
    state.refreshNotice?.by || "",
    state.refreshNoticeAt || 0,
    state.cohortShow || 0,
    state.cohort?.lockdownRefreshes || 0,
    state.profile?.generation || "",
    state.profile?.placementSittingsUsed || 0,
    Object.keys(state.dropoutIds || {}).sort().join(","),
    (state.pendingJoins || []).map((g) => g.id).join(","),
    ld?.wagers?.[state.youId]?.locked, ld?.wagers?.[state.youId]?.side, ld?.wagers?.[state.youId]?.amount,
  ].join("|");
  if (!force && key === lastKey && frame === "play") {
    const clock = $("#clock");
    if (clock) clock.textContent = clockText();
    return;
  }
  lastKey = key;
  if (state.phase === "lobby" && needsEntryGate()) {
    app.innerHTML = entryHTML();
    bindEntry();
  } else if (state.phase === "lobby") {
    app.innerHTML = lobbyHTML();
    bindLobby();
  } else {
    app.innerHTML = playHTML();
    bindPlay();
  }
}

window.addEventListener("keydown", (e) => {
  if (isDirections || isDojoPage) return;
  if (e.target && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
  if (e.code === "Space") { e.preventDefault(); buzz(); }
  const n = e.key && "1234abcd".includes(e.key.toLowerCase()) ? "1234abcd".indexOf(e.key.toLowerCase()) % 4 : -1;
  if (n >= 0) pick(n);
});

async function identifyCountry() {
  const tz = detectCountry();
  let fromIp = "";
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch("/api/country", {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      fromIp = normalizeCountry(data && data.country);
      if (fromIp === "OTHER") fromIp = "";
    }
  } catch {
    /* This host has no IP country header. The device zone is the fallback. */
  }
  state.detectedCountry = fromIp || tz || "";
  state.countrySource = fromIp ? "ip" : (state.detectedCountry ? "timezone" : "");
}

maybeResetProfile();
if (isDirections) {
  document.documentElement.lang = state.locale;
  paint(true);
  window.__fa = state;
} else if (isDojoPage) {
  if (forcedDisplay) {
    location.replace("/");
  } else {
    try {
      await loadBanksForLocale(state.locale);
    } catch {
      state.statusMsg = "Questions did not load.";
    }
    state.profile = loadProfile();
    if (state.profile?.displayName) state.name = state.profile.displayName;
    state.profileUnlocked = false;
    let sessionEntered = false;
    try { sessionEntered = sessionStorage.getItem("fa-entered") === "1"; } catch { /* ignore */ }
    state.entered = Boolean(sessionEntered && hasPhoneProfile());
    if (state.entered) state.profileUnlocked = true;
    const qMode = params.get("mode");
    let stored = "";
    try { stored = sessionStorage.getItem("fa-dojo-mode") || ""; } catch { /* ignore */ }
    const allowed = ["create", "unlock", "setpw", "home"];
    state.dojoMode = allowed.includes(qMode) ? qMode : (allowed.includes(stored) ? stored : dojoModeForGate());
    await identifyCountry();
    paint(true);
    void syncTopScores();
    window.__fa = state;
  }
} else {
  try {
    await loadBanksForLocale(state.locale);
  } catch {
    state.statusMsg = "Questions did not load.";
  }
  state.profile = loadProfile();
  if (state.profile?.displayName) state.name = state.profile.displayName;
  state.botFill = localStorage.getItem("fa-bots") !== "0";
  fillSeats();
  const tv = isTvDisplay() || forcedDisplay;
  state.profileUnlocked = false;
  let sessionEntered = false;
  try { sessionEntered = sessionStorage.getItem("fa-entered") === "1"; } catch { /* ignore */ }
  state.entered = Boolean(forcedDisplay || (sessionEntered && hasPhoneProfile()));
  if (state.entered && !forcedDisplay) state.profileUnlocked = true;
  // Keep the room card open (Join TV when that mode is selected) so Create / Unlock
  // sit on the same card after a refresh. Dojo stays one tap away.
  state.lobbyOpen = "room";
  state.roomDojoPanel = "";
  if (!hasPhoneProfile()) state.dojoMode = "create";
  else if (needsPasswordSetup()) state.dojoMode = "setpw";
  else state.dojoMode = "unlock";
  await identifyCountry();
  if (forcedDisplay) {
    // ?tv=1 is the Silk link. It owns this room even if the browser last used Join TV.
    state.onScreen = true;
    state.mpMode = "host";
    state.lobbyOpen = "room";
    if (joinCode) state.room = joinCode;
    try {
      localStorage.setItem("fa-onscreen", "1");
      localStorage.setItem("fa-mp", "host");
    } catch { /* ignore */ }
    void openRoom("tv").then(() => refreshActiveRooms()).then(() => paint(true));
  } else if (role === "pad") {
    state.onScreen = true; // pad follows the room; the chrome stays a phone pad
    state.mpMode = "join";
    state.lobbyOpen = "room";
    if (joinCode) state.room = joinCode;
    void refreshActiveRooms().then(() => paint(true));
    startPoll();
  } else {
    state.onScreen = false;
    state.roomSetup = false;
    if (joinCode) {
      state.mpMode = "join";
      state.room = joinCode;
    } else {
      state.mpMode = "off";
    }
    try { localStorage.setItem("fa-onscreen", "0"); } catch { /* ignore */ }
    void refreshActiveRooms().then(() => paint(true));
  }
  paint(true);
  window.__fa = state;
}
