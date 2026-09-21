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
const $ = (s, r = document) => r.querySelector(s);
const params = new URLSearchParams(location.search);
const role = params.get("role") || (params.get("pad") ? "pad" : "host");
const joinCode = (params.get("room") || "").toUpperCase();
const ROOM_API = location.pathname.includes("/fast-answer") ? "/api/fa/rooms" : "/api/rooms";

const BOTS = [
  { id: "hammond", name: "Hammond" },
  { id: "may", name: "May" },
];

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
  if (state.lockdown && state.lockdown.phase === "play") {
    return state.lockdown.qs[state.lockdown.qi] || null;
  }
  if (state.lockdown && state.lockdown.phase === "flash") {
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
  state.players = [
    { id: "you", name: state.name || "Player", score: 0, human: true, you: true },
    ...BOTS.map((b) => ({ ...b, score: 0, human: false, you: false })),
  ];
}

function startRead() {
  const q = currentQ();
  if (!q) {
    state.phase = "end";
    state.pose = (me()?.score || 0) >= 4000 ? "win" : "idle";
    paint();
    publish();
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
  state.aiBuzzT = setTimeout(() => {
    if (state.phase !== "buzz" || state.buzzed) return;
    const bot = ais[Math.floor(Math.random() * ais.length)];
    takeBuzz(bot.id, bot.name);
    setTimeout(() => aiPick(bot), 700);
  }, 2400 + Math.random() * 1600);
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

function aiPick(bot) {
  const q = currentQ();
  if (!q || state.phase !== "answer") return;
  const hit = { easy: 0.72, hard: 0.5, difficult: 0.32, extreme: 0.18 }[q.tier] || 0.4;
  const i = Math.random() < hit ? q.correctIndex : [0, 1, 2, 3].filter((n) => n !== q.correctIndex)[Math.floor(Math.random() * 3)];
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

function continueRound() {
  state.lockdown = null;
  state.i += 1;
  if (state.i >= state.qs.length) {
    state.phase = "end";
    state.pose = (me()?.score || 0) >= 4000 ? "win" : "idle";
    paint();
    publish();
  } else {
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
  BOTS.forEach((b) => {
    const p = playerById(b.id);
    if (!p || p.id === hero.id) return;
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
      const i = Math.random() < 0.42 ? q.correctIndex : (q.correctIndex + 1 + Math.floor(Math.random() * 3)) % 4;
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
    </ul>
    <button class="primary" id="rulesX" type="button">Close</button>
  </div>`;
}

function lobbyHTML() {
  const pad = role === "pad";
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>The game show that flies…?</small></div>
      <div class="grow"></div>
      <button class="word" id="rulesBtn" type="button">Rules</button>
    </div>
    <div class="lobby">
      <div class="lobby-copy">
        <h1>Fast Answer!</h1>
        <p>${pad
          ? "This phone is your buzzer. During the 10-second read, tap a rival to MAP. Then buzz."
          : "One locked page. 37 questions. MAP during the read. Lockdown twice."}</p>
        <p class="points">Easy $100 · Hard $500 · Difficult $1,000 · Extreme $5,000</p>
        <label class="field" for="nm">Your name</label>
        <input id="nm" type="text" value="${escapeHtml(state.name)}" maxlength="18" autocomplete="nickname"/>
        ${pad ? "" : `
        <label class="toggle">
          <input id="os" type="checkbox" ${state.onScreen ? "checked" : ""}/>
          <span>On Screen — TV shows Jeremy; phones are buzzers.</span>
        </label>
        ${state.onScreen ? "" : `
        <div class="dock">
          <label>Jeremy <input id="hs" type="range" min="24" max="62" value="${state.hostH}"/></label>
          <label>Studio <input id="st" type="range" min="0" max="${STUDIOS.length - 1}" value="${state.studioI}"/></label>
        </div>`}
        `}
        <div class="row">
          <button class="primary" id="go" type="button">${pad ? "Join as buzzer" : (state.onScreen ? "Open TV" : "Play")}</button>
        </div>
        <p class="status" id="stt">${joinCode ? "Joining room " + joinCode : ""}</p>
      </div>
      ${pad ? "" : `<div class="host" style="--host-h:${state.hostH}vh"><img src="${POSE.idle}" alt="Jeremy"/></div>`}
    </div>
    <div></div>
    <div class="buzzbar"></div>
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

function bindLobby() {
  const nm = $("#nm");
  if (nm) nm.oninput = (e) => {
    state.name = e.target.value;
    localStorage.setItem("fa-name", state.name);
  };
  const os = $("#os");
  if (os) os.onchange = (e) => {
    state.onScreen = e.target.checked;
    localStorage.setItem("fa-onscreen", state.onScreen ? "1" : "0");
    paint(true);
  };
  bindSliders();
  bindRules();
  const go = $("#go");
  if (go) go.onclick = async () => {
    if (role === "pad") {
      state.room = joinCode || code();
      state.onScreen = true;
      state.youId = "p-" + (state.name || "pad").toLowerCase().replace(/\s+/g, "");
      await rooms("POST", { action: "join", code: state.room, name: state.name, id: state.youId });
      startPoll();
      paint();
      return;
    }
    if (state.onScreen) {
      state.room = code();
      await rooms("POST", { action: "create", code: state.room, host: state.name });
    }
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
    };
  });
  document.querySelectorAll("[data-amt]").forEach((b) => {
    b.onclick = () => {
      const ld = state.lockdown;
      if (!ld) return;
      const prev = ld.wagers[state.youId] || { side: "win" };
      applyWager(state.youId, prev.side || "win", Number(b.dataset.amt));
      if (bc) bc.postMessage({ type: "wager", id: state.youId, side: prev.side || "win", amount: Number(b.dataset.amt) });
    };
  });
  const bz = $("#buzz");
  if (bz) bz.onclick = () => buzz();
  const mic = $("#mic");
  if (mic) mic.onclick = listenVoice;
  const quit = $("#quit");
  if (quit) quit.onclick = () => { stopTick(); clearAiBuzz(); state.lockdown = null; state.phase = "lobby"; paint(true); };
  bindSliders();
  bindRules();
}

function ingestGuests(guests) {
  if (!Array.isArray(guests) || !guests.length) return;
  guests.forEach((g) => {
    const id = g.id || ("p-" + String(g.name || "pad").toLowerCase().replace(/\s+/g, ""));
    if (state.players.some((p) => p.id === id || p.name === g.name)) return;
    const bot = state.players.find((p) => !p.human);
    if (bot) {
      bot.id = id;
      bot.name = g.name;
      bot.human = true;
    } else {
      state.players.push({ id, name: g.name, score: 0, human: true, you: false });
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
    if (j.guests) ingestGuests(j.guests);
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
  }, 400);
}

let lastKey = "";
function paint(force = false) {
  const app = $("#app");
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
  if (e.target && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
  if (e.code === "Space") { e.preventDefault(); buzz(); }
  const n = e.key && "1234abcd".includes(e.key.toLowerCase()) ? "1234abcd".indexOf(e.key.toLowerCase()) % 4 : -1;
  if (n >= 0) pick(n);
});

const bank = await fetch("./questions.json").then((r) => r.json());
state.questions = bank;
if (role === "pad") {
  state.onScreen = true;
  if (joinCode) state.room = joinCode;
  startPoll();
}
paint(true);
window.__fa = state;
