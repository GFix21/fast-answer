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
const READ_S = 8;
const POINTS = { easy: 100, hard: 500, difficult: 1000, finale: 10000 };
const ROUND = 12;
const LETTERS = "ABCD";
const $ = (s, r = document) => r.querySelector(s);
const params = new URLSearchParams(location.search);
const role = params.get("role") || (params.get("pad") ? "pad" : "host");
const joinCode = (params.get("room") || "").toUpperCase();
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
  score: 0,
  streak: 0,
  picked: -1,
  buzzed: false,
  buzzBy: "",
  readLeft: READ_S,
  tick: null,
  questions: [],
  listening: false,
};

const bc = "BroadcastChannel" in window ? new BroadcastChannel("fast-answer") : null;

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
  const easy = shuffle(all.filter((q) => q.tier === "easy"));
  const hard = shuffle(all.filter((q) => q.tier === "hard"));
  const diff = shuffle(all.filter((q) => q.tier === "difficult"));
  const fin = shuffle(all.filter((q) => q.tier === "finale"));
  return [...easy.slice(0, 6), ...hard.slice(0, 3), ...diff.slice(0, 2), ...fin.slice(0, 1)].slice(0, ROUND);
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
    score: state.score,
    buzzed: state.buzzed,
    buzzBy: state.buzzBy,
    picked: state.picked,
    readLeft: state.readLeft,
    studioI: state.studioI,
    room: state.room,
    qs: state.qs,
    q: currentQ(),
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
      state.buzzed = true;
      state.buzzBy = d.name || "Player";
      state.phase = "answer";
      state.pose = "wait";
      paint();
      publish();
      return;
    }
    if (role === "pad" && d.phase) {
      const keepName = state.name;
      Object.assign(state, d);
      state.name = keepName;
      paint();
    }
  };
}

function stopTick() {
  if (state.tick) clearInterval(state.tick);
  state.tick = null;
}
function clockText() {
  const q = currentQ();
  if (state.phase === "read") return `Answers in ${state.readLeft}s`;
  if (state.phase === "buzz") return "Buzz now";
  if (state.phase === "answer") return state.buzzBy ? `${state.buzzBy} — your answer` : "Your answer";
  if (state.phase === "reveal") {
    if (!q) return "";
    return state.picked === q.correctIndex ? "Correct" : "Wrong";
  }
  if (state.phase === "end") return "That’s the show";
  return "";
}
function startRead() {
  const q = currentQ();
  if (!q) {
    state.phase = "end";
    paint();
    publish();
    return;
  }
  state.phase = "read";
  state.pose = "question";
  state.picked = -1;
  state.buzzed = false;
  state.buzzBy = "";
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
    } else {
      const clock = $("#clock");
      if (clock) clock.textContent = clockText();
    }
  }, 1000);
}
function buzz() {
  if (state.phase !== "buzz" || state.buzzed) return;
  state.buzzed = true;
  state.buzzBy = state.name;
  state.phase = "answer";
  state.pose = "wait";
  playSound("buzz");
  paint();
  publish();
  if (bc) bc.postMessage({ type: "buzz", name: state.name, room: state.room });
  if (state.room) void rooms("POST", { action: "buzz", code: state.room, name: state.name });
}
function pick(i) {
  if (state.phase === "reveal" || state.phase === "end" || state.phase === "read" || state.phase === "lobby") return;
  if (state.onScreen && role === "pad" && !state.buzzed) return;
  if (!state.onScreen && state.phase === "buzz") {
    state.buzzed = true;
    state.buzzBy = state.name;
    state.phase = "answer";
  }
  if (state.phase !== "answer") return;
  const q = currentQ();
  if (!q) return;
  state.picked = i;
  const ok = i === q.correctIndex;
  state.pose = ok ? "win" : "loss";
  playSound(ok ? "correct" : "miss");
  if (ok) {
    state.streak += 1;
    state.score += POINTS[q.tier] || 100;
  } else state.streak = 0;
  state.phase = "reveal";
  paint();
  publish();
  setTimeout(() => {
    state.i += 1;
    if (state.i >= state.qs.length) {
      state.phase = "end";
      state.pose = state.score >= 1500 ? "win" : "idle";
      paint();
      publish();
    } else {
      state.pose = "next";
      paint();
      setTimeout(startRead, 900);
    }
  }, 2200);
}

function listenVoice() {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) {
    const clock = $("#clock");
    if (clock) clock.textContent = "Voice isn’t on this browser — tap an answer";
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

function lobbyHTML() {
  const pad = role === "pad";
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>The game show that flies…?</small></div>
      <div class="grow"></div>
    </div>
    <div class="lobby">
      <div class="lobby-copy">
        <h1>Fast Answer!</h1>
        <p>${pad
          ? "This phone is your buzzer. Answers sit at the top. Buzz, then speak or tap."
          : "One locked page — no scrolling. On Screen puts Jeremy on the TV; phones become buzzers."}</p>
        <label class="field" for="nm">Your name</label>
        <input id="nm" type="text" value="${escapeHtml(state.name)}" maxlength="18" autocomplete="nickname"/>
        ${pad ? "" : `
        <label class="toggle">
          <input id="os" type="checkbox" ${state.onScreen ? "checked" : ""}/>
          <span>On Screen — TV shows Jeremy, the question, and the answers. Phones are buzzers only.</span>
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
        <p class="status" id="stt">${joinCode ? "Joining room " + joinCode : (state.onScreen && !pad ? "Scan the QR after the room opens" : "")}</p>
      </div>
      ${pad ? "" : `<div class="host" style="--host-h:${state.hostH}vh"><img src="${POSE.idle}" alt="Jeremy"/></div>`}
    </div>
    <div></div>
    <div class="buzzbar"></div>
  `;
}

function playHTML() {
  const q = currentQ();
  const tv = state.onScreen && role !== "pad";
  const pad = state.onScreen && role === "pad";
  const showQ = !pad;
  const showAns = pad
    ? ["buzz", "answer", "reveal"].includes(state.phase)
    : !state.onScreen
      ? ["buzz", "answer", "reveal"].includes(state.phase)
      : ["buzz", "answer", "reveal"].includes(state.phase);
  const canBuzz = (pad || !state.onScreen) && state.phase === "buzz" && !state.buzzed;
  const canPick = state.phase === "answer" || (!state.onScreen && state.phase === "buzz");
  const prompt = !q
    ? "That’s the show."
    : pad
      ? (state.phase === "read" ? "Listen to Jeremy on the screen." : "Answers only — buzz, then speak or tap.")
      : escapeHtml(q.prompt);
  return `
    <img class="bg" alt="" src="${STUDIOS[state.studioI % STUDIOS.length]}"/>
    <div class="veil"></div>
    <div class="top">
      <div class="logo">Fast Answer!<small>${q ? q.tier.toUpperCase() : "END"} · ${state.i + 1}/${state.qs.length || ROUND}</small></div>
      <div class="grow"></div>
      <span class="chip">${escapeHtml(state.name)} <b>$${state.score}</b></span>
      ${state.room ? `<span class="chip">ROOM ${escapeHtml(state.room)}</span>` : ""}
      ${state.buzzBy ? `<span class="chip">BUZZ ${escapeHtml(state.buzzBy)}</span>` : ""}
      ${!state.onScreen ? `<div class="dock">
        <label>Jeremy <input id="hs" type="range" min="24" max="62" value="${state.hostH}"/></label>
        <label>Studio <input id="st" type="range" min="0" max="${STUDIOS.length - 1}" value="${state.studioI}"/></label>
      </div>` : ""}
      <button class="word" id="osToggle" type="button">${state.onScreen ? "On Screen" : "Single page"}</button>
      <button class="word" id="quit" type="button">Lobby</button>
    </div>
    <div class="play">
      <div class="qwrap">
        <div class="qcard">
          <p class="cat">${q && showQ ? escapeHtml(q.categoryTitle) : (pad ? "Your pad" : "")}</p>
          <p class="qtext">${prompt}</p>
          <p class="meta" id="clock">${clockText()}</p>
        </div>
      </div>
      ${pad ? "" : `<div class="host"><img src="${POSE[state.pose] || POSE.idle}" alt="Jeremy"/></div>`}
    </div>
    ${showAns && q ? `<div class="answers">${q.choices.map((c, i) => {
      let cls = "ans";
      if (state.phase === "reveal") {
        if (i === q.correctIndex) cls += " ok";
        else if (i === state.picked) cls += " bad";
      } else if (i === state.picked) cls += " on";
      const dis = canPick && state.phase !== "reveal" ? "" : "disabled";
      return `<button class="${cls}" data-i="${i}" type="button" ${dis}><small>${LETTERS[i]}</small>${escapeHtml(c)}</button>`;
    }).join("")}</div>` : `<div></div>`}
    <div class="buzzbar">
      ${(pad || !tv) ? `<button class="buzzer ${canBuzz ? "lit" : ""}" id="buzz" type="button" ${canBuzz ? "" : "disabled"}>Buzz</button>` : ""}
      ${(pad && state.phase === "answer") ? `<button class="ghost mic" id="mic" type="button">Speak the answer</button>` : ""}
      ${tv && state.room ? `<img class="qr" alt="Join on your phone" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl())}"/>` : ""}
    </div>
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
  const go = $("#go");
  if (go) go.onclick = async () => {
    if (role === "pad") {
      state.room = joinCode || code();
      state.onScreen = true;
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

function bindPlay() {
  document.querySelectorAll(".ans").forEach((b) => {
    b.onclick = () => pick(Number(b.dataset.i));
  });
  const bz = $("#buzz");
  if (bz) bz.onclick = () => buzz();
  const mic = $("#mic");
  if (mic) mic.onclick = listenVoice;
  const quit = $("#quit");
  if (quit) quit.onclick = () => { stopTick(); state.phase = "lobby"; paint(true); };
  const os = $("#osToggle");
  if (os) os.onclick = () => {
    state.onScreen = !state.onScreen;
    localStorage.setItem("fa-onscreen", state.onScreen ? "1" : "0");
    if (state.onScreen && !state.room) state.room = code();
    paint(true);
  };
  bindSliders();
}

function startGame() {
  state.qs = deal(state.questions);
  state.i = 0;
  state.score = 0;
  state.streak = 0;
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
    if (role === "pad" && j.state && j.state.phase) {
      const keep = state.name;
      Object.assign(state, j.state);
      state.name = keep;
      if (j.state.q && (!state.qs[state.i] || state.qs[state.i].id !== j.state.q.id)) {
        state.qs[state.i] = j.state.q;
      }
      if (Array.isArray(j.state.qs) && j.state.qs.length) state.qs = j.state.qs;
      paint();
    }
    if (role !== "pad" && j.state?.buzzed && !state.buzzed && state.phase === "buzz") {
      state.buzzed = true;
      state.buzzBy = j.state.buzzBy || "Player";
      state.phase = "answer";
      state.pose = "wait";
      paint();
      publish();
    }
  }, 400);
}

let lastKey = "";
function paint(force = false) {
  const app = $("#app");
  app.className = "stage" + (role === "pad" ? " pad" : "") + (state.onScreen && role !== "pad" ? " tv" : "");
  applyHostSize();
  const frame = state.phase === "lobby" ? "lobby" : "play";
  const key = [frame, role, state.onScreen, state.phase, state.i, state.buzzed, state.picked, state.pose, state.studioI].join("|");
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
