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
const role = params.get("role") || (params.get("pad") ? "pad" : "host");
const joinCode = (params.get("room") || "").toUpperCase();
const isDirections =
  params.get("page") === "directions" ||
  /(?:^|\/)directions\.html$/i.test(location.pathname);
const ROOM_API = location.pathname.includes("/fast-answer") ? "/api/fa/rooms" : "/api/rooms";

const state = {
  phase: "lobby",
  onScreen: localStorage.getItem("fa-onscreen") === "1",
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
};

const bc = "BroadcastChannel" in window ? new BroadcastChannel("fast-answer") : null;

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
  const available = shuffle(state.questions.filter((q) => !skip.has(q.id)));
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
  const need = Math.max(1, Math.min(11, (state.playerCount || 3) - 1));
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
    if (!res.ok) return null;
    return await res.json();
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
    room: state.room,
    qs: state.qs,
    q: currentQ(),
    players: state.players,
    maps: state.maps,
    mapLive: state.mapLive,
    lockdownAt: state.lockdownAt,
    lockdown: state.lockdown,
    playerCount: state.playerCount,
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
    return state.maps[state.youId] ? "Buzz now — MAP is armed" : "Buzz now";
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

function buzz() {
  if (state.lockdown) return;
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
    if (clock) clock.textContent = "Voice isn't on this browser — tap an answer";
    return;
  }
  const r = new Rec();
  r.lang = "en-US";
  r.interimResults = false;
  r.maxAlternatives = 3;
  state.listening = true;
  const mic = $("#mic");
  if (mic) mic.textContent = "Listening…";
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
    if (m) m.textContent = "Speak the answer";
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
    <span class="rivals-lab">MAP $${stake}</span>
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
    return `<div class="wager"><p class="wager-copy">Opponents are locking WIN / LOSE on you. ${ld.wagerLeft}s</p></div>`;
  }
  return `<div class="wager">
    <p class="wager-copy">Lockdown — ${escapeHtml(ld.name)} plays 5. Tap a side, then a stake.</p>
    <div class="wager-row">
      <button type="button" class="side ${mine?.side === "win" ? "on" : ""}" data-side="win">Win</button>
      <button type="button" class="side lose ${mine?.side === "lose" ? "on" : ""}" data-side="lose">Lose</button>
    </div>
    <div class="wager-row">
      ${WAGER_AMTS.map((n) =>
        `<button type="button" class="amt ${mine?.amount === n ? "on" : ""}" data-amt="${n}">$${n}</button>`
      ).join("")}
    </div>
    <p class="meta">${mine?.locked ? `Locked ${mine.side.toUpperCase()} $${mine.amount}` : "Two taps. No extra screens."}</p>
  </div>`;
}

function rulesHTML() {
  if (!state.rules) return "";
  return `<div class="sheet" id="sheet">
    <h2>Rules</h2>
    <ul>
      <li><b>37 questions.</b> 20 Easy $100 · 10 Hard $500 · 5 Difficult $1,000 · 2 Extreme $5,000.</li>
      <li><b>10-second read</b>, then buzz. First buzz answers. Miss = $0. You do not lose points.</li>
      <li><b>MAP</b> — during the read, tap a rival. Stake = this question. Buzz first and hit it: you bank double, they lose the stake. Miss: you lose the stake. If someone else buzzes, MAP is off.</li>
      <li><b>Lockdown</b> twice per show, after a correct buzz. That player plays 5. Opponents tap WIN or LOSE and a stake (60s, or instant when all lock). 4/5 pays WIN even money; otherwise LOSE pays. The 5 bank at $500 each only if they clear it.</li>
      <li><b>Dojo</b> — ten tap questions, no buzz. Bronze / Silver / Gold for three months. Belts rise with career points.</li>
      <li><b>Room</b> — 2 to 12 seats. Phones join the TV over On Screen. Empty seats are celebrity bots.</li>
    </ul>
    <a class="word dir-full" href="./directions.html">Full directions</a>
    <button class="primary" id="rulesX" type="button">Close</button>
  </div>`;
}

function footHTML() {
  return `<div class="buzzbar foot">
    <a class="flow" href="${FLOW_URL}" target="_blank" rel="noopener noreferrer">Flow</a>
    <span class="copy">© GMG Brand Label</span>
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
      <div class="logo">Fast Answer!<small>Directions & Rules</small></div>
      <div class="grow"></div>
      <a class="word" href="./index.html">Lobby</a>
    </div>
    <div class="lobby">
      <div class="lobby-copy">
        <h1 class="sr-only">Directions and Rules</h1>
        <img class="brand" src="${TITLE_3D}" alt="Fast Answer!"/>
        <div class="accord">
          ${dirAcc("tv", "Television", "<small>Not AirPlay</small>", `
            <p class="dir-copy">The television is a <b>web page</b>, not a transmitter. Fast Answer does not send AirPlay, Chromecast, or Smart View from inside the game. Those belong to the phone, laptop, or TV.</p>
            <ol class="dir-ol">
              <li><b>Best.</b> Open Fast Answer in the TV’s own browser. Turn <b>On Screen</b> on in Room. The set is the host.</li>
              <li><b>No browser on the TV.</b> AirPlay, Chromecast, or Smart View the Fast Answer tab from a phone or laptop onto the set. The mirrored device is still the host. Other phones do not watch that stream.</li>
              <li><b>HDMI</b> from a laptop is the same idea — the laptop is the host.</li>
            </ol>
            <p class="dir-copy">Phones never receive the TV picture. After On Screen is on, the TV prints a <b>QR and a room code</b>. Each phone opens that pad: answers on top, Buzz at the bottom. The room keeps the TV and the pads in step.</p>
            <p class="dir-copy">AirPlay can put the <b>show</b> on the set. It does not turn phones into buzzers. Pads still join by QR.</p>
          `)}
          ${dirAcc("screen", "On Screen", "<small>TV + pads</small>", `
            <p class="dir-copy"><b>On Screen off</b> — one locked page. Jeremy, the question, the answers, and the buzzer sit together. Drag Jeremy and Studio in Set. Local play: you plus celebrity bots.</p>
            <p class="dir-copy"><b>On Screen on</b> — this display is the television. It hides the buzzer. Phones become pads. Empty seats stay celebrity bots until a pad takes them, up to 12.</p>
            <p class="dir-copy">After a buzz, the pad can <b>speak</b> the answer or tap A–D. Space bar buzzes on a keyboard. Keys 1–4 or A–D pick.</p>
          `)}
          ${dirAcc("room", "Multiplayer", "<small>2–12</small>", `
            <p class="dir-copy">Room holds <b>2 to 12</b> seats. You take one. Empty seats fill with celebrity first names — Oprah, Elton, Serena, Usain, Adele, Idris, Keanu, Zendaya, Rihanna, Denzel, Meryl — each with its own skill and buzz timing.</p>
            <p class="dir-copy">Turn On Screen on. Share the QR or the code. Each phone opens the pad page and joins. Pads <b>replace bots</b> as they arrive. The TV stays the picture; the phones stay the buzzers.</p>
            <p class="dir-copy">Two tabs on the same device also sync. A pad never needs AirPlay.</p>
          `)}
          ${dirAcc("points", "Points", "<small>37 questions</small>", `
            <p class="dir-copy">One show is <b>37 questions</b>. Ten seconds to read, then buzz. First buzz answers.</p>
            <div class="points-grid">
              <span>20 Easy</span><b>$100</b>
              <span>10 Hard</span><b>$500</b>
              <span>5 Difficult</span><b>$1,000</b>
              <span>2 Extreme</span><b>$5,000</b>
            </div>
            <p class="dir-copy">A miss on a regular question is <b>$0</b>. You do not lose points — unless MAP is armed.</p>
          `)}
          ${dirAcc("map", "MAP", "<small>During the read</small>", `
            <p class="dir-copy">During the 10-second read, tap a rival once. Stake = this question. If you buzz first and hit it, you bank <b>double</b> and they lose the stake. Miss, and you lose the stake. If someone else buzzes, MAP is off.</p>
          `)}
          ${dirAcc("lock", "Lockdown", "<small>Twice a show</small>", `
            <p class="dir-copy">Twice per show, after a correct buzz. That player plays <b>5</b>. Opponents tap WIN or LOSE and $100 / $500 / $1,000. Sixty seconds, or it skips ahead when everyone has locked. 4/5 pays WIN even money; otherwise LOSE pays. Those five bank at <b>$500 each</b> only if they clear the set.</p>
          `)}
          ${dirAcc("dojo", "Dojo", "<small>10 taps</small>", `
            <p class="dir-copy">Ten tap questions in the lobby. No buzz. Places you Bronze, Silver, or Gold for about three months. Play stays gated until placement is current. Karate belts rise with career points, separate from ability.</p>
          `)}
        </div>
        <div class="row">
          <a class="primary" href="./index.html">Back to lobby</a>
        </div>
      </div>
      <div class="host" style="--host-h:${state.hostH}vh"><img src="${POSE.idle}" alt="Jeremy"/></div>
    </div>
    <div></div>
    ${footHTML()}
  `;
}

function bindDirections() {
  document.querySelectorAll("[data-dir]").forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.dir;
      state.dirOpen = state.dirOpen === id ? "" : id;
      paint(true);
    };
  });
}

function ensureDojo() {
  if (state.dojo && state.dojo.q) return;
  const used = new Set(state.profile?.placementQuestionIds || []);
  const q = pickPlacementQuestion("hard", used);
  state.dojo = { q, answers: [], used, picked: -1, tier: "hard" };
}

function finishDojo() {
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
  state.dojo = { ...d, done: true, q: null, picked: -1 };
  state.lobbyOpen = "room";
  paint(true);
}

function dojoPick(i) {
  const d = state.dojo;
  if (!d || !d.q || d.done) return;
  const ok = i === d.q.correctIndex;
  d.picked = i;
  d.answers.push({ question: d.q, correct: ok });
  d.used.add(d.q.id);
  playSound(ok ? "correct" : "miss");
  paint(true);
  setTimeout(() => {
    if (d.answers.length >= PLACE_N) {
      finishDojo();
      return;
    }
    d.tier = nextPlacementTier(d.tier, ok);
    d.q = pickPlacementQuestion(d.tier, d.used);
    d.picked = -1;
    paint(true);
  }, 420);
}

function startDojo() {
  const used = new Set(state.profile?.placementQuestionIds || []);
  const q = pickPlacementQuestion("hard", used);
  state.dojo = { q, answers: [], used, picked: -1, tier: "hard", done: false };
  state.lobbyOpen = "dojo";
  paint(true);
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
    <label class="field" for="nm">Name</label>
    <input id="nm" type="text" value="${escapeHtml(p.displayName || "")}" maxlength="18" autocomplete="nickname"/>
    <label class="field" for="em">Email</label>
    <input id="em" type="email" value="${escapeHtml(p.email || "")}" maxlength="120" autocomplete="email" placeholder="optional"/>
    <label class="field" for="th">Photo</label>
    <div class="thumb-row">
      ${p.thumb ? `<img class="thumb" src="${p.thumb}" alt=""/>` : `<span class="thumb empty"></span>`}
      <input id="th" type="file" accept="image/*"/>
    </div>
    <p class="meta">${escapeHtml(belt.label)} belt${ab ? " · " + ab.label + " ability" : ""} · ${(p.stats?.totalPoints || 0)} career</p>
  `;
}

function dojoBody() {
  const p = state.profile;
  const placed = isPlaced();
  const d = state.dojo;
  if (d && d.q && !d.done) {
    const n = d.answers.length + 1;
    const reveal = d.picked >= 0;
    return `
      <p class="meta">Dojo ${n}/${PLACE_N} · tap an answer · no buzz</p>
      <p class="dojo-q">${escapeHtml(d.q.prompt)}</p>
      <div class="dojo-ans">
        ${d.q.choices.map((c, i) => {
          let cls = "ans";
          if (reveal) {
            if (i === d.q.correctIndex) cls += " ok";
            else if (i === d.picked) cls += " bad";
          }
          return `<button class="${cls}" type="button" data-dojo="${i}" ${reveal ? "disabled" : ""}><small>${LETTERS[i]}</small>${escapeHtml(c)}</button>`;
        }).join("")}
      </div>
    `;
  }
  if (placed) {
    const ab = ABILITY_META[p.abilityTier] || ABILITY_META.bronze;
    return `
      <p class="meta">${escapeHtml(ab.label)} · ${p.placementScore || 0}/${PLACE_N} · retake after ${formatDue(p.nextPlacementDueAt)}</p>
      <button class="ghost" id="retake" type="button">Retake dojo</button>
    `;
  }
  return `
    <p class="meta">Ten tap questions. No buzz. Places you Bronze, Silver, or Gold for three months.</p>
    <button class="primary" id="dojoGo" type="button">Start dojo</button>
  `;
}

function roomBody() {
  const pad = role === "pad";
  const seats = seatedPreview();
  const humans = seats.filter((s) => s.human).length;
  if (pad) {
    return `
      <label class="field" for="nm">Your name</label>
      <input id="nm" type="text" value="${escapeHtml(state.name)}" maxlength="18" autocomplete="nickname"/>
      <label class="field" for="jc">Room code</label>
      <input id="jc" type="text" value="${escapeHtml(state.room || state.joinInput)}" maxlength="8" placeholder="XXXX" autocomplete="off"/>
      <p class="meta">This phone is the buzzer. Join the TV, then buzz.</p>
    `;
  }
  return `
    <label class="field">Players <b>${state.playerCount}</b></label>
    <input id="pc" type="range" min="2" max="12" value="${state.playerCount}"/>
    <div class="seats">
      ${seats.map((s) => `<span class="seat ${s.you ? "you" : s.human ? "human" : "bot"}" title="${escapeHtml(s.blurb || s.name)}">${escapeHtml(s.name)}</span>`).join("")}
    </div>
    <label class="toggle">
      <input id="os" type="checkbox" ${state.onScreen ? "checked" : ""}/>
      <span>On Screen — TV shows Jeremy; phones are buzzers. Empty seats stay celebrity bots.</span>
    </label>
    ${state.onScreen ? `
      <p class="room-code">Room <b id="codeCopy">${escapeHtml(state.room || "····")}</b></p>
      ${state.room ? `<img class="qr" alt="Join on your phone" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl())}"/>` : ""}
      <p class="meta">${humans} human${humans === 1 ? "" : "s"} · ${seats.length - humans} bot${seats.length - humans === 1 ? "" : "s"} · phones replace bots as they join</p>
    ` : `<p class="meta">Local show — you plus celebrity bots. Flip On Screen to open a room for pads.</p>`}
  `;
}

function setBody() {
  return `
    <div class="dock in-acc">
      <label>Jeremy <input id="hs" type="range" min="24" max="62" value="${state.hostH}"/></label>
      <label>Studio <input id="st" type="range" min="0" max="${STUDIOS.length - 1}" value="${state.studioI}"/></label>
    </div>
    <p class="meta">Live on this page. Host and studio stay in frame — nothing scrolls.</p>
  `;
}

function lobbyHTML() {
  const pad = role === "pad";
  const p = state.profile || {};
  const placed = isPlaced();
  const belt = BELT_META[p.belt || "white"];
  const ab = p.abilityTier ? ABILITY_META[p.abilityTier] : null;
  const goLabel = pad ? "Join as buzzer" : (state.onScreen ? "Open TV" : "Play");
  const goOff = !pad && !placed;
  const d = state.dojo;
  const dojoLive = Boolean(d && d.q && !d.done);
  const dojoExtra = dojoLive
    ? `<small>${d.answers.length}/${PLACE_N}</small>`
    : (placed ? `<small>${escapeHtml((ab && ab.label) || "Placed")}</small>` : `<small>Required</small>`);
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>The game show that flies…?</small></div>
      <div class="grow"></div>
      ${state.room ? `<span class="chip">${escapeHtml(state.room)}</span>` : ""}
      <a class="word" href="./directions.html">Directions</a>
    </div>
    <div class="lobby">
      <div class="lobby-copy">
        <h1 class="sr-only">Fast Answer!</h1>
        <img class="brand" src="${TITLE_3D}" alt="Fast Answer!"/>
        <div class="accord">
          ${pad || dojoLive ? "" : acc("profile", "Profile", `<small>${escapeHtml(belt.label)}${ab ? " · " + ab.label : ""}</small>`, profileBody())}
          ${pad ? "" : acc("dojo", "Dojo", dojoExtra, dojoBody())}
          ${dojoLive ? "" : acc("room", pad ? "Join" : "Room", `<small>${pad ? (state.room || "code") : state.playerCount + " seats"}</small>`, roomBody())}
          ${pad || dojoLive ? "" : acc("set", "Set", "", setBody())}
        </div>
        <div class="row">
          <button class="primary" id="go" type="button" ${goOff ? "disabled" : ""}>${goOff ? "Dojo first" : goLabel}</button>
        </div>
        <p class="status" id="stt">${goOff ? "Finish the 10-question dojo to play." : (joinCode ? "Joining room " + joinCode : "")}</p>
      </div>
      ${pad ? "" : `<div class="host" style="--host-h:${state.hostH}vh"><img src="${POSE.idle}" alt="Jeremy"/></div>`}
    </div>
    <div></div>
    ${footHTML()}
    ${rulesHTML()}
  `;
}

function playHTML() {
  const q = currentQ();
  const tv = state.onScreen && role !== "pad";
  const pad = state.onScreen && role === "pad";
  const ld = state.lockdown;
  const lockdownPlay = ld?.phase === "play" || ld?.phase === "flash";
  const showAns = ld
    ? lockdownPlay
    : ["buzz", "answer", "reveal"].includes(state.phase);
  const canBuzz = !ld && (pad || !state.onScreen) && state.phase === "buzz" && !state.buzzed;
  const hero = ld ? ld.playerId === state.youId : true;
  const canPick = ld
    ? lockdownPlay && hero && ld.phase === "play"
    : state.phase === "answer" || (!state.onScreen && state.phase === "buzz");
  let prompt;
  if (ld?.phase === "wager") prompt = `LOCKDOWN — ${ld.name} plays five. Opponents wager.`;
  else if (ld?.phase === "result") prompt = ld.won ? `${ld.name} cleared Lockdown ${ld.hits}/5.` : `${ld.name} broke Lockdown ${ld.hits}/5.`;
  else if (!q) prompt = "That's the show.";
  else if (pad && !lockdownPlay) prompt = state.phase === "read" ? "Listen to Jeremy. Tap a rival to MAP." : "Answers only — buzz, then speak or tap.";
  else prompt = escapeHtml(q.prompt);
  const cat = ld
    ? `Lockdown · ${ld.phase === "play" || ld.phase === "flash" ? `${ld.qi + 1}/${LOCKDOWN_N}` : ld.phase}`
    : (q && !pad ? escapeHtml(q.categoryTitle) : (pad ? "Your pad" : ""));
  const tier = ld ? "LOCKDOWN" : (q ? q.tier.toUpperCase() : "END");
  const n = ld ? "" : ` · ${state.i + 1}/${state.qs.length || ROUND}`;
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI % STUDIOS.length]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>${tier}${n}</small></div>
      <div class="grow"></div>
      ${scoreboard()}
      <button class="word" id="rulesBtn" type="button">Rules</button>
      <button class="word" id="quit" type="button">Lobby</button>
    </div>
    <div class="play">
      <div class="qwrap">
        <div class="qcard ${ld ? "lock" : ""} ${state.mapLive ? "map-on" : ""}">
          <p class="cat">${cat}</p>
          <p class="qtext">${prompt}</p>
          <p class="meta" id="clock">${clockText()}</p>
          ${rivalsHTML()}
        </div>
      </div>
      ${pad ? "" : `<div class="host"><img src="${POSE[state.pose] || POSE.idle}" alt="Jeremy"/></div>`}
    </div>
    ${ld?.phase === "wager" ? wagerHTML() : (showAns && q ? `<div class="answers">${q.choices.map((c, i) => {
      let cls = "ans";
      const picked = ld ? ld.picked : state.picked;
      const reveal = state.phase === "reveal" || ld?.phase === "flash" || ld?.phase === "result";
      if (reveal) {
        if (i === q.correctIndex) cls += " ok";
        else if (i === picked) cls += " bad";
      } else if (i === picked) cls += " on";
      const dis = canPick && !reveal ? "" : "disabled";
      return `<button class="${cls}" data-i="${i}" type="button" ${dis}><small>${LETTERS[i]}</small>${escapeHtml(c)}</button>`;
    }).join("")}</div>` : `<div></div>`)}
    <div class="buzzbar">
      ${!state.onScreen && !ld ? `<div class="dock">
        <label>Jeremy <input id="hs" type="range" min="24" max="62" value="${state.hostH}"/></label>
        <label>Studio <input id="st" type="range" min="0" max="${STUDIOS.length - 1}" value="${state.studioI}"/></label>
      </div>` : ""}
      ${(pad || !tv) && !ld ? `<button class="buzzer ${canBuzz ? "lit" : ""}" id="buzz" type="button" ${canBuzz ? "" : "disabled"}>Buzz</button>` : ""}
      ${ld ? `<div class="lock-flag">${ld.phase === "wager" ? "Lockdown wagers" : `${escapeHtml(ld.name)} · ${ld.hits} hit`}</div>` : ""}
      ${(pad && state.phase === "answer") ? `<button class="ghost mic" id="mic" type="button">Speak the answer</button>` : ""}
      ${tv && state.room ? `<img class="qr" alt="Join on your phone" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl())}"/>` : ""}
    </div>
    ${rulesHTML()}
  `;
}

async function openRoom() {
  state.room = state.room || code();
  await rooms("POST", { action: "create", code: state.room, host: state.name });
  startPoll();
}

function bindLobby() {
  document.querySelectorAll("[data-acc]").forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.acc;
      state.lobbyOpen = state.lobbyOpen === id ? "" : id;
      if (id === "dojo" && state.lobbyOpen === "dojo" && needsPlacement(state.profile) && !state.dojo) startDojo();
      paint(true);
    };
  });
  const nm = $("#nm");
  if (nm) nm.oninput = (e) => {
    state.name = e.target.value;
    localStorage.setItem("fa-name", state.name);
    if (role !== "pad") saveProfile({ displayName: state.name });
  };
  const em = $("#em");
  if (em) em.oninput = (e) => saveProfile({ email: e.target.value });
  const th = $("#th");
  if (th) th.onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 400000) {
      const stt = $("#stt");
      if (stt) stt.textContent = "Photo is too large — keep it under 400 KB.";
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
  const os = $("#os");
  if (os) os.onchange = async (e) => {
    state.onScreen = e.target.checked;
    localStorage.setItem("fa-onscreen", state.onScreen ? "1" : "0");
    if (state.onScreen) await openRoom();
    paint(true);
  };
  const jc = $("#jc");
  if (jc) jc.oninput = (e) => {
    state.joinInput = e.target.value.toUpperCase();
    state.room = state.joinInput;
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
  if (go) go.onclick = async () => {
    if (role === "pad") {
      state.room = (state.room || state.joinInput || joinCode || code()).toUpperCase();
      state.onScreen = true;
      state.youId = "p-" + (state.name || "pad").toLowerCase().replace(/\s+/g, "");
      await rooms("POST", { action: "join", code: state.room, name: state.name, id: state.youId });
      startPoll();
      paint();
      return;
    }
    if (!isPlaced()) {
      state.lobbyOpen = "dojo";
      if (!state.dojo || !state.dojo.q) startDojo();
      else paint(true);
      return;
    }
    saveProfile({ displayName: state.name });
    if (state.onScreen) await openRoom();
    startGame();
  };
}

function bindSliders() {
  const hs = $("#hs");
  if (hs) hs.oninput = (e) => {
    state.hostH = Number(e.target.value);
    localStorage.setItem("fa-hosth", String(state.hostH));
    applyHostSize();
  };
  const st = $("#st");
  if (st) st.oninput = (e) => {
    state.studioI = Number(e.target.value);
    localStorage.setItem("fa-studio", String(state.studioI));
    const bg = $(".bg");
    if (bg) bg.src = STUDIOS[state.studioI];
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
    state.lockdown = null;
    state.phase = "lobby";
    paint(true);
  };
  bindSliders();
  bindRules();
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
function startPoll() {
  if (poll) return;
  poll = setInterval(async () => {
    if (!state.room) return;
    const j = await rooms("GET");
    if (!j) return;
    if (j.guests) {
      const before = (state.guests || []).map((g) => g.id).join(",");
      ingestGuests(j.guests);
      const after = (state.guests || []).map((g) => g.id).join(",");
      if (state.phase === "lobby" && before !== after) paint(true);
    }
    if (role === "pad" && j.state && j.state.phase) {
      const keep = state.name;
      const keepId = state.youId;
      Object.assign(state, j.state);
      state.name = keep;
      state.youId = keepId;
      if (Array.isArray(j.state.qs) && j.state.qs.length) state.qs = j.state.qs;
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
    state.studioI, state.maps[state.youId], state.mapLive, ld?.phase, ld?.qi, ld?.picked,
    state.rules, state.players.map((p) => p.score).join(","),
    state.lobbyOpen, state.playerCount, (state.guests || []).length,
    state.dojo?.answers?.length, state.dojo?.picked, state.profile?.abilityTier, state.profile?.belt,
    state.dirOpen,
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
  paint(true);
  window.__fa = state;
} else {
  const bank = await fetch("./questions.json").then((r) => r.json());
  state.questions = bank;
  state.profile = loadProfile();
  if (state.profile?.displayName) state.name = state.profile.displayName;
  fillSeats();
  if (needsPlacement(state.profile) && role !== "pad") {
    state.lobbyOpen = "dojo";
    ensureDojo();
  } else {
    state.lobbyOpen = "room";
  }
  if (role === "pad") {
    state.onScreen = true;
    state.lobbyOpen = "room";
    if (joinCode) state.room = joinCode;
    startPoll();
  } else if (state.onScreen) {
    void openRoom();
  }
  paint(true);
  window.__fa = state;
}
