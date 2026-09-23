const IDLE_MS = 30_000;
const GLOW_URL = "https://gmgbrand.vercel.app/games";
const app = document.getElementById("app");

const LOCALE_KEY = "fa-flow-locale";
const LOCALES = ["en", "fr", "de"];
function loadFlowLocale() {
  try {
    const v = (localStorage.getItem(LOCALE_KEY) || "en").toLowerCase().slice(0, 2);
    return LOCALES.includes(v) ? v : "en";
  } catch {
    return "en";
  }
}

const state = {
  authed: false,
  configured: true,
  tab: "console",
  week: null,
  topics: null,
  message: "",
  locked: new URLSearchParams(location.search).get("locked") === "1",
  filterTier: "all",
  locale: loadFlowLocale(),
  profiles: null,
  queue: {
    placement: null,
    weekRejections: [],
    placementRejections: [],
    lessons: null,
    rooms: [],
    error: "",
    loading: false,
  },
  rejectReady: null,
  archive: {
    months: null,
    placementPages: null,
    monthKey: null,
    index: null,
    weekKey: null,
    pageKey: null,
    kind: null,
    pack: null,
    studioCounts: null,
    filterTier: "all",
    filterTopic: "",
    loading: false,
  },
};

function withLocale(path) {
  const loc = state.locale || "en";
  if (!path || path.startsWith("login") || path.startsWith("logout") || path.startsWith("session") || path.startsWith("topics") || path.startsWith("profiles")) {
    return path;
  }
  const join = path.includes("?") ? "&" : "?";
  if (/[?&]locale=/.test(path)) return path;
  return `${path}${join}locale=${encodeURIComponent(loc)}`;
}

async function api(path, opts = {}) {
  const res = await fetch(`/api/flow/${withLocale(path)}`, {
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtCounts(c) {
  if (!c) return "—";
  const order = ["easy", "hard", "difficult", "finale", "extreme"];
  const parts = order
    .filter((k) => c[k] != null)
    .map((k) => `${c[k]} ${k}`);
  for (const [k, v] of Object.entries(c)) {
    if (!order.includes(k)) parts.push(`${v} ${k}`);
  }
  return parts.join(" · ") || "—";
}

function readyBenchHTML() {
  const ready = state.rejectReady;
  const questions = ready?.questions || [];
  const hand = ready?.onHand;
  if (!hand) return `<p class="mut">No question is on hand for Regenerate yet.</p>`;
  return `
    <div class="ready-bench">
      <p><b>${questions.length} ready</b> for rejected questions. <b>On hand</b> for Regenerate: ${esc(hand.prompt)}</p>
      <ol class="ready-list">
        ${questions.map((q, i) => `<li class="${i === 0 ? "on-hand" : ""}"><span>${i === 0 ? "On hand" : "Ready"}</span> ${esc(q.tier)} · ${esc(q.generation || "")} · ${esc(q.prompt)}</li>`).join("")}
      </ol>
    </div>`;
}

function archiveQItem(q) {
  const rejected = q.status === "rejected";
  const regen = state.rejectReady?.onHand ? "Regenerate · on hand" : "Regenerate";
  return `
    <div class="q-item ${esc(q.status || "")}">
      <div class="q-meta">${esc(q.tier)} · ${esc(q.topic)} · ${esc(q.generation || "")}${q.status ? ` · <b>${esc(q.status)}</b>` : ""} · ${esc(q.id)}</div>
      <div class="q-prompt">${esc(q.categoryTitle || "")}${q.categoryTitle ? " — " : ""}${esc(q.prompt || "")}</div>
      <div class="choices">${(q.choices || []).map((c, i) => `<div class="${i === q.correctIndex ? "hit" : ""}">${String.fromCharCode(65 + i)}. ${esc(c)}</div>`).join("")}</div>
      <div class="row" style="margin-top:10px">
        ${rejected
          ? `<button class="btn primary" data-arch-regen="${esc(q.id)}">${regen}</button>`
          : `<button class="btn danger" data-arch-reject="${esc(q.id)}">Reject</button>
             <button class="btn" data-arch-regen="${esc(q.id)}">Reject &amp; regenerate</button>`}
      </div>
    </div>`;
}

function bindArchiveQuestionActions(panel) {
  panel.querySelectorAll("[data-arch-reject]").forEach((b) =>
    b.addEventListener("click", () => archiveRejectOrRegen(b.dataset.archReject, false)),
  );
  panel.querySelectorAll("[data-arch-regen]").forEach((b) =>
    b.addEventListener("click", () => archiveRejectOrRegen(b.dataset.archRegen, true)),
  );
}

function render() {
  if (!app) return;
  if (!state.authed) {
    app.innerHTML = `
      <div class="login-screen">
        <p class="eyebrow">Private</p>
        <h1>Flow</h1>
        <p class="mut login-sub">Fast Answer console. The password stays on the server.</p>
        <form id="login-form" class="card login-card">
          ${state.locked ? `<div class="banner">Session locked — enter the password again.</div>` : ""}
          ${state.message ? `<div class="banner">${esc(state.message)}</div>` : ""}
          <label for="pw">Password</label>
          <input id="pw" name="password" type="password" autocomplete="current-password" required />
          <button class="btn primary" id="login" type="submit">Enter</button>
        </form>
        <p class="mut" style="margin-top:16px"><a class="glow-link" href="/">Back to the game</a></p>
      </div>`;
    document.getElementById("login-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      doLogin();
    });
    document.getElementById("pw")?.focus();
    return;
  }

  const pub = state.week?.publish;
  const sc = state.week?.studioCounts || {};
  const st = state.week?.statusCounts || {};
  const pack = state.week?.pack;

  app.innerHTML = `
    <div class="flow-head">
      <div>
        <p class="eyebrow">Private</p>
        <h1>Flow</h1>
        <p class="mut">Week ${esc(pack?.weekKey || "—")} · locale <b>${esc((state.locale||"en").toUpperCase())}</b> · review, metrics, profiles, rooms.</p>
      </div>
      <div class="row">
        <div class="lang-switch" role="group" aria-label="Locale">
          ${LOCALES.map((loc) =>
            `<button type="button" class="btn lang-btn ${state.locale===loc?"primary":""}" data-flow-locale="${loc}">${loc.toUpperCase()}</button>`
          ).join("")}
        </div>
        <a class="btn" href="/">Play</a>
        <button class="btn" id="logout">Log out</button>
      </div>
    </div>
    ${state.message ? `<div class="banner ok-banner">${esc(state.message)}</div>` : ""}
    <nav class="tabs">
      ${[
        ["console", "Console"],
        ["metrics", "Metrics"],
        ["queue", "Queue"],
        ["profiles", "Profiles"],
        ["rooms", "Rooms"],
        ["bank", "Bank"],
        ["archive", "Archives"],
        ["topic", "Topics"],
        ["reject", "Reject"],
      ].map(([t, label]) =>
        `<button data-tab="${t}" class="${state.tab===t?"on":""}">${label}</button>`
      ).join("")}
      <a href="${GLOW_URL}" target="_blank" rel="noopener noreferrer">Glow</a>
    </nav>
    <div id="panel"></div>
  `;

  document.getElementById("logout")?.addEventListener("click", doLogout);
  app.querySelectorAll("[data-flow-locale]").forEach((b) =>
    b.addEventListener("click", () => setFlowLocale(b.dataset.flowLocale)),
  );
  app.querySelectorAll("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      state.tab = b.dataset.tab;
      state.message = "";
      if (state.tab === "queue" || state.tab === "console" || state.tab === "rooms" || state.tab === "metrics" || state.tab === "reject") {
        if (state.tab !== "console" || !state.week) loadQueue(true);
        else render();
        return;
      }
      if (state.tab === "archive" && !state.archive.months) {
        loadArchiveMonths(true);
        return;
      }
      if (state.tab === "profiles") {
        loadProfiles(true);
        return;
      }
      render();
    }),
  );

  const panel = document.getElementById("panel");
  if (state.tab === "console") {
    renderConsole(panel);
  } else if (state.tab === "rooms") {
    renderRooms(panel);
  } else if (state.tab === "queue") {
    renderQueue(panel);
  } else if (state.tab === "metrics" || state.tab === "overview") {
    panel.innerHTML = `
      <div class="card">
        <h2>Metrics</h2>
        <div class="row" style="margin:12px 0 16px">
          <div class="stat"><b>${sc.easy||0}</b><span>easy</span></div>
          <div class="stat"><b>${sc.hard||0}</b><span>hard</span></div>
          <div class="stat"><b>${sc.difficult||0}</b><span>difficult</span></div>
          <div class="stat"><b>${sc.finale||0}</b><span>finale→extreme</span></div>
        </div>
        <div class="row" style="margin-bottom:16px">
          <div class="stat"><b>${st.pending||0}</b><span>pending</span></div>
          <div class="stat"><b>${st.approved||0}</b><span>approved</span></div>
          <div class="stat"><b>${st.rejected||0}</b><span>rejected</span></div>
        </div>
        <p class="mut">${esc(pack?.inspirationSummary || "")}</p>
        <p class="mut" style="margin-top:8px">
          Last publish: ${pub?.publishedAt ? esc(pub.publishedAt) : "not yet (repo may already ship questions.json)"}
          · ${pub?.questionCount ?? "—"} questions
          ${pub?.counts ? `· ${esc(JSON.stringify(pub.counts))}` : ""}
          ${pub?.generations ? `· generations ${esc(JSON.stringify(pub.generations))}` : ""}
        </p>
        <div class="row" style="margin-top:16px">
          <button class="btn primary" id="publish">Publish week → questions.json</button>
          <button class="btn" id="refresh">Refresh</button>
        </div>
        ${metricDonut()}
        <p class="mut" style="margin-top:12px">Durable path: <code>npm run handoff</code> (or <code>node scripts/publish-week.mjs</code>) then git push / redeploy. Handoff keeps each generation on <code>questions.json</code> and the FR/DE banks. EN publish also snapshots into <code>banks/archive/YYYY-MM/</code>. <a class="glow-link" href="${GLOW_URL}" target="_blank" rel="noopener noreferrer">Glow</a> opens the GMG game room.</p>
      </div>`;
    document.getElementById("publish")?.addEventListener("click", doPublish);
    document.getElementById("refresh")?.addEventListener("click", () => loadWeek(true));
  } else if (state.tab === "profiles") {
    const rows = state.profiles || [];
    panel.innerHTML = `
      <div class="card">
        <div class="row spread">
          <h2>Activated profiles</h2>
          <div class="row">
            <button class="btn" id="refreshProfiles">Refresh</button>
            <button class="btn primary" id="downloadMail">Download mailing list</button>
          </div>
        </div>
        <p class="mut">Players who tap <b>Enter Profile</b> (name, email, password) are activated here. The mailing list is every email on this list.</p>
        <p class="mut" style="margin-top:8px">${rows.length} active · ${rows.length} email${rows.length === 1 ? "" : "s"}</p>
        ${rows.length ? `
          <table class="plist">
            <thead><tr><th>Name</th><th>Email</th><th>Activated</th><th>Status</th></tr></thead>
            <tbody>
              ${rows.map((p) => `<tr>
                <td>${esc(p.displayName)}</td>
                <td>${esc(p.email)}</td>
                <td>${esc(p.activatedAt ? String(p.activatedAt).replace("T", " ").slice(0, 16) : "")}</td>
                <td>Active</td>
              </tr>`).join("")}
            </tbody>
          </table>` : `<p class="mut" style="margin-top:16px">No activated profiles yet.</p>`}
      </div>`;
    document.getElementById("refreshProfiles")?.addEventListener("click", () => loadProfiles(true));
    document.getElementById("downloadMail")?.addEventListener("click", downloadMailingList);
  } else if (state.tab === "bank") {
    const tiers = ["all", "easy", "hard", "difficult", "finale"];
    const qs = (pack?.questions || []).filter(
      (q) => state.filterTier === "all" || q.tier === state.filterTier,
    );
    const comedy = state.week?.comedy;
    const comedyLines = (rows) => (rows || []).length
      ? rows.map((r) => `<li><b>${esc(r.rating)}</b> · ${esc(r.prompt)}</li>`).join("")
      : `<li class="mut">None this week.</li>`;
    panel.innerHTML = `
      ${comedy ? `<div class="card" id="comedy-bot">
        <h2>${esc(comedy.bot)}</h2>
        <p class="mut">Q&A comedy bot · week ${esc(comedy.week)}. New funny questions, then the highest rated.</p>
        ${(comedy.blocked || []).length ? `<p class="mut">Safeguard held ${comedy.blocked.length}.</p>` : ""}
        <h3 class="tier-h">Viral this week</h3>
        <ul>${comedyLines(comedy.viral)}</ul>
        <h3 class="tier-h">Highest rated</h3>
        <ul>${comedyLines(comedy.highestRated)}</ul>
      </div>` : ""}
      <div class="card">
        <div class="row spread">
          <h2>Weekly bank review</h2>
          ${readyBenchHTML()}
          <select id="tierFilter">${tiers.map((t)=>`<option value="${t}" ${state.filterTier===t?"selected":""}>${t}</option>`).join("")}</select>
        </div>
        <div class="q-list" style="margin-top:12px">
          ${qs.map((q) => `
            <div class="q-item ${esc(q.status||"pending")}">
              <div class="q-meta">${esc(q.tier)} · ${esc(q.topic)} · ${esc(q.generation||"")} · <b>${esc(q.status||"pending")}</b> · ${esc(q.id)}</div>
              <div class="q-prompt">${esc(q.categoryTitle)} — ${esc(q.prompt)}</div>
              <div class="choices">${(q.choices||[]).map((c,i)=>`<div class="${i===q.correctIndex?"hit":""}">${String.fromCharCode(65+i)}. ${esc(c)}</div>`).join("")}</div>
              <div class="row" style="margin-top:10px">
                <button class="btn ok" data-approve="${esc(q.id)}">Approve</button>
                <button class="btn danger" data-reject="${esc(q.id)}">Reject</button>
                ${(q.status === "rejected")
                  ? `<button class="btn primary" data-regen="${esc(q.id)}">${state.rejectReady?.onHand ? "Regenerate · on hand" : "Regenerate"}</button>`
                  : `<button class="btn" data-regen="${esc(q.id)}">Reject &amp; regenerate</button>`}
                <button class="btn" data-pending="${esc(q.id)}">Pending</button>
              </div>
            </div>`).join("") || `<p class="mut">No questions in filter.</p>`}
        </div>
      </div>`;
    document.getElementById("tierFilter")?.addEventListener("change", (e) => {
      state.filterTier = e.target.value;
      render();
    });
    panel.querySelectorAll("[data-approve]").forEach((b) =>
      b.addEventListener("click", () => setStatus(b.dataset.approve, "approved")),
    );
    panel.querySelectorAll("[data-reject]").forEach((b) =>
      b.addEventListener("click", () => archiveRejectOrRegen(b.dataset.reject, false)),
    );
    panel.querySelectorAll("[data-regen]").forEach((b) =>
      b.addEventListener("click", () => archiveRejectOrRegen(b.dataset.regen, true)),
    );
    panel.querySelectorAll("[data-pending]").forEach((b) =>
      b.addEventListener("click", () => setStatus(b.dataset.pending, "pending")),
    );
  } else if (state.tab === "archive") {
    renderArchivePanel(panel);
  } else if (state.tab === "topic") {
    const topics = state.topics?.topics || [];
    panel.innerHTML = `
      <div class="card">
        <h2>Add topic</h2>
        <p class="mut">Adds to this Flow instance (Q-and-A shaped). Persist in studio for durability.</p>
        <label>id</label><input id="tid" placeholder="e.g. sports-canada"/>
        <label>title</label><input id="ttitle" placeholder="Sports · Canada"/>
        <label>blurb</label><input id="tblurb" placeholder="Short blurb"/>
        <label class="row"><input id="teasy" type="checkbox" style="width:auto;margin-right:8px"/> easy only</label>
        <button class="btn primary" id="addTopic">Add topic</button>
        <h3 class="tier-h">Topics</h3>
        <ul class="mut">${topics.map((t)=>`<li><code>${esc(t.id)}</code> — ${esc(t.title)}${t.easyOnly?" (easy only)":""}</li>`).join("")}</ul>
      </div>`;
    document.getElementById("addTopic")?.addEventListener("click", doAddTopic);
  } else if (state.tab === "reject") {
    const lessons = state.queue.lessons;
    const log = [
      ...(state.queue.weekRejections || []),
      ...(state.queue.placementRejections || []),
    ];
    panel.innerHTML = `
      <div class="card">
        <h2>Rejected-question log</h2>
        <p class="mut">Q-and-A is optional. Every reject lands in this log. Regenerate inserts the question on hand, then the next of the 12 moves up.</p>
        ${readyBenchHTML()}
        ${lessons ? `<p class="mut" style="margin-top:10px">${esc(lessons.brief)}</p>` : `<p class="mut">Loading the log…</p>`}
        ${lessons?.reasonCounts && Object.keys(lessons.reasonCounts).length ? `
          <ul class="mut">${Object.entries(lessons.reasonCounts).map(([k, n]) => `<li><code>${esc(k)}</code> — ${n}</li>`).join("")}</ul>
        ` : ""}
        <div class="row">
          <button class="btn" id="refreshRejectLog">Refresh log</button>
          <button class="btn" id="downloadRejectLog">Download log</button>
        </div>
      </div>
      <div class="card">
        <h2>Log</h2>
        ${log.length ? `<div class="q-list">${log.map((r) => {
          const snap = r.snapshot || {};
          const needs = r.regeneratedQuestionId ? `Replacement ${r.regeneratedQuestionId}` : "Needs regeneration";
          return `
            <div class="q-item rejected">
              <div class="q-meta">${esc(r.bank || "")} · ${esc(snap.tier || "")} · ${esc(needs)} · ${esc(r.questionId)} · ${(r.reasonCodes || []).map(esc).join(", ")}</div>
              <div class="q-prompt">${esc(snap.categoryTitle || "")}${snap.categoryTitle ? " — " : ""}${esc(snap.prompt || r.note || "")}</div>
              ${r.regeneratedQuestionId ? "" : `<div class="row" style="margin-top:10px"><button class="btn primary" data-log-regen="${esc(r.questionId)}" data-log-bank="${esc(r.bank || "weekly")}">${state.rejectReady?.onHand ? "Regenerate · on hand" : "Regenerate"}</button></div>`}
            </div>`;
        }).join("")}</div>` : `<p class="mut">No rejected questions yet.</p>`}
      </div>
      <div class="card">
        <h2>Reject → regenerate</h2>
        <p class="mut">Logs the rejection for locale <b>${esc((state.locale || "en").toUpperCase())}</b>. Leave the replacement blank to insert the question on hand.</p>
        <label>bank</label>
        <select id="rbank">
          <option value="week">Weekly bank</option>
          <option value="placement">Placement (Dojo)</option>
        </select>
        <label>question id</label><input id="rid" placeholder="w39-e-… or place-…"/>
        <label>reason codes (comma)</label><input id="rreasons" value="weak-distractors"/>
        <label>note</label><textarea id="rnote" rows="2"></textarea>
        <label>replacement prompt (optional)</label><textarea id="rprompt" rows="2"></textarea>
        <label>replacement choices CSV (optional, 4)</label><input id="rchoices" placeholder="A, B, C, D"/>
        <label>correctIndex</label><input id="ridx" type="number" min="0" max="3" value="0"/>
        <div class="row">
          <button class="btn danger" id="doReject">Reject &amp; log</button>
          <button class="btn primary" id="doRegen">Reject &amp; regenerate</button>
        </div>
      </div>`;
    document.getElementById("doReject")?.addEventListener("click", () => doReject(false));
    document.getElementById("doRegen")?.addEventListener("click", () => doReject(true));
    document.getElementById("refreshRejectLog")?.addEventListener("click", () => loadQueue(true));
    document.getElementById("downloadRejectLog")?.addEventListener("click", downloadRejectLog);
    panel.querySelectorAll("[data-log-regen]").forEach((b) =>
      b.addEventListener("click", () => archiveRejectOrRegen(b.dataset.logRegen, true, b.dataset.logBank)),
    );
  }
}

function flowCounts() {
  const weekQs = state.week?.pack?.questions || [];
  const placeQs = state.queue.placement?.pack?.questions || [];
  const all = [...weekQs, ...placeQs];
  return {
    pending: all.filter((q) => (q.status || "pending") === "pending").length,
    rejected: all.filter((q) => q.status === "rejected").length,
    approved: all.filter((q) => q.status === "approved").length,
    regen: (state.queue.weekRejections || []).length + (state.queue.placementRejections || []).length,
    profiles: (state.profiles || []).length,
    rooms: (state.queue.rooms || []).length,
  };
}

function gotoTab(tab) {
  state.tab = tab;
  state.message = "";
  render();
}

function renderConsole(panel) {
  const c = flowCounts();
  const cards = [
    ["queue", "Awaiting review", c.pending],
    ["queue", "Rejected", c.rejected],
    ["queue", "Regeneration", c.regen],
    ["profiles", "Profiles", c.profiles],
    ["rooms", "Open rooms", c.rooms],
  ];
  panel.innerHTML = `
    <section>
      <h2 class="eyebrow">Analytics</h2>
      <div class="metric-grid">
        ${cards.map(([tab, label, value], i) => `
          <button type="button" class="metric-card" data-goto="${tab}" data-goto-i="${i}">
            <span>${esc(label)}</span>
            <b>${value}</b>
          </button>`).join("")}
      </div>
      <p class="mut">${state.queue.loading ? "Refreshing banks, profiles, and rooms…" : "Counts cover the weekly bank and Dojo placement for this locale, plus activated profiles and open rooms."}</p>
    </section>
    <section class="card">
      <h2 class="eyebrow">Glow</h2>
      <p class="mut">GMGbrand links Flow out to the house game room — Fast Answer, SunFun, and Last Call on the glowing cards.</p>
      <p style="margin-top:12px"><a class="btn glow-link" href="${GLOW_URL}" target="_blank" rel="noopener noreferrer">Open Glow</a></p>
    </section>`;
  panel.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => gotoTab(b.dataset.goto)),
  );
}

function renderRooms(panel) {
  const rooms = state.queue.rooms || [];
  panel.innerHTML = `
    <div class="card">
      <div class="row spread">
        <h2>Open rooms</h2>
        <button class="btn" id="refreshRooms">Refresh rooms</button>
      </div>
      <p class="mut">Same list as Join TV. A room appears when its TV link is open. Delete removes it for everyone.</p>
      ${rooms.length ? rooms.map((r) => `
        <div class="room-admin">
          <div>
            <b>${esc(r.code)}</b>
            <span class="mut"> · ${esc(r.host || "TV")} · ${r.guests || 0} pads · ${esc(r.phase || "lobby")}</span>
          </div>
          <button class="btn danger" type="button" data-delete-room="${esc(r.code)}">Delete</button>
        </div>`).join("") : `<p class="mut" style="margin-top:12px">No open rooms.</p>`}
    </div>`;
  document.getElementById("refreshRooms")?.addEventListener("click", () => loadQueue(true));
  panel.querySelectorAll("[data-delete-room]").forEach((b) =>
    b.addEventListener("click", () => deleteFlowRoom(b.dataset.deleteRoom)),
  );
}

function metricDonut() {
  const c = flowCounts();
  const slices = [
    { label: "Pending", value: c.pending, color: "#e8a87c" },
    { label: "Approved", value: c.approved, color: "#7dd3fc" },
    { label: "Rejected", value: c.rejected, color: "#f87171" },
    { label: "Regeneration", value: c.regen, color: "#a78bfa" },
    { label: "Profiles", value: c.profiles, color: "#34d399" },
  ];
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 42;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = slices.map((s) => {
    const len = (s.value / total) * circ;
    const item = { ...s, dash: `${len} ${circ - len}`, offset };
    offset += len;
    return item;
  });
  return `
    <div class="donut-row" style="margin-top:16px">
      <svg viewBox="0 0 100 100" width="144" height="144" aria-hidden="true" style="transform:rotate(-90deg)">
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="12"></circle>
        ${arcs.filter((a) => a.value > 0).map((a) => `
          <circle cx="50" cy="50" r="${r}" fill="none" stroke="${a.color}" stroke-width="12"
            stroke-dasharray="${a.dash}" stroke-dashoffset="${-a.offset}"></circle>`).join("")}
      </svg>
      <ul class="donut-legend">
        ${slices.map((s) => `<li><span><i class="swatch" style="background:${s.color}"></i>${esc(s.label)}</span><span>${s.value}</span></li>`).join("")}
      </ul>
    </div>`;
}

function qCard(q, bank) {
  const status = q.status || "pending";
  return `
    <div class="q-item ${esc(status)}">
      <div class="q-meta">${esc(bank)} · ${esc(q.tier || "")} · ${esc(q.topic || "")} · <b>${esc(status)}</b> · ${esc(q.id)}</div>
      <div class="q-prompt">${esc(q.categoryTitle || "")}${q.categoryTitle ? " — " : ""}${esc(q.prompt || "")}</div>
    </div>`;
}

function renderQueue(panel) {
  if (state.queue.loading && !state.week && !state.queue.placement) {
    panel.innerHTML = `<div class="card"><p class="mut">Loading questions, profiles, and rooms…</p></div>`;
    return;
  }

  const weekQs = state.week?.pack?.questions || [];
  const placeQs = state.queue.placement?.pack?.questions || [];
  const pending = [
    ...weekQs.filter((q) => (q.status || "pending") === "pending").map((q) => ({ ...q, bank: "Weekly" })),
    ...placeQs.filter((q) => (q.status || "pending") === "pending").map((q) => ({ ...q, bank: "Placement" })),
  ];
  const rejected = [
    ...weekQs.filter((q) => q.status === "rejected").map((q) => ({ ...q, bank: "Weekly" })),
    ...placeQs.filter((q) => q.status === "rejected").map((q) => ({ ...q, bank: "Placement" })),
  ];
  const regen = [
    ...(state.queue.weekRejections || []).map((r) => ({ ...r, bank: "Weekly" })),
    ...(state.queue.placementRejections || []).map((r) => ({ ...r, bank: "Placement" })),
  ];
  const profiles = state.profiles || [];
  const rooms = state.queue.rooms || [];
  const list = (items, empty) =>
    items.length
      ? `<div class="q-list cap">${items.map((q) => qCard(q, q.bank)).join("")}</div>`
      : `<p class="mut">${empty}</p>`;

  panel.innerHTML = `
    ${state.queue.error ? `<div class="banner">${esc(state.queue.error)}</div>` : ""}
    <div class="card">
      <div class="row spread">
        <h2>Review queue</h2>
        <button class="btn" id="refreshQueue">Refresh</button>
      </div>
      <p class="mut">Every question still awaiting review, already rejected, or logged for regeneration — weekly bank and Dojo placement, locale <b>${esc((state.locale || "en").toUpperCase())}</b>. ${state.queue.lessons ? esc(state.queue.lessons.brief) : "Rejected questions feed a log so the next regenerate is better, even without Q-and-A."}</p>
      <h3 class="queue-sec">Awaiting review <span class="mut">(${pending.length})</span></h3>
      ${state.week || state.queue.placement
        ? list(pending, "No questions are waiting for review.")
        : `<p class="mut">Week and placement banks did not load.</p>`}
      <h3 class="queue-sec">Rejection <span class="mut">(${rejected.length})</span></h3>
      ${list(rejected, "No rejected questions.")}
      <h3 class="queue-sec">Regeneration <span class="mut">(${regen.length})</span></h3>
      ${regen.length ? `<div class="q-list cap">${regen.map((r) => {
        const snap = r.snapshot || {};
        const needs = r.regeneratedQuestionId ? "Replacement drafted" : "Needs regeneration";
        return `
          <div class="q-item rejected">
            <div class="q-meta">${esc(r.bank)} · ${esc(snap.tier || "")} · ${esc(needs)} · ${esc(r.questionId)} · ${(r.reasonCodes || []).map(esc).join(", ")}</div>
            <div class="q-prompt">${esc(snap.categoryTitle || "")}${snap.categoryTitle ? " — " : ""}${esc(snap.prompt || r.note || "")}</div>
            ${r.regeneratedQuestionId ? `<p class="mut">Replacement: <code>${esc(r.regeneratedQuestionId)}</code></p>` : `<div class="row" style="margin-top:10px"><button class="btn primary" data-q-regen="${esc(r.questionId)}" data-log-bank="${esc(r.bank || "weekly")}">Regenerate</button></div>`}
          </div>`;
      }).join("")}</div>` : `<p class="mut">No questions are logged for regeneration.</p>`}
    </div>
    <div class="card">
      <div class="row spread">
        <h2>Profiles</h2>
        <button class="btn primary" id="downloadMail">Download mailing list</button>
      </div>
      <p class="mut">${profiles.length} activated · ${profiles.length} email${profiles.length === 1 ? "" : "s"}. The CSV is every email on this list.</p>
      ${profiles.length ? `
        <table class="plist">
          <thead><tr><th>Name</th><th>Email</th><th>Activated</th><th>Status</th></tr></thead>
          <tbody>
            ${profiles.map((p) => `<tr>
              <td>${esc(p.displayName)}</td>
              <td>${esc(p.email)}</td>
              <td>${esc(p.activatedAt ? String(p.activatedAt).replace("T", " ").slice(0, 16) : "")}</td>
              <td>Active</td>
            </tr>`).join("")}
          </tbody>
        </table>` : `<p class="mut" style="margin-top:12px">No activated profiles yet. They appear when a player taps Enter Profile.</p>`}
    </div>
    <div class="card">
      <div class="row spread">
        <h2>Open rooms</h2>
        <button class="btn" id="refreshRooms">Refresh rooms</button>
      </div>
      <p class="mut">Same list as Join TV. A room appears when its TV link is open. Delete removes it for everyone.</p>
      ${rooms.length ? rooms.map((r) => `
        <div class="room-admin">
          <div>
            <b>${esc(r.code)}</b>
            <span class="mut"> · ${esc(r.host || "TV")} · ${r.guests || 0} pads · ${esc(r.phase || "lobby")}</span>
          </div>
          <button class="btn danger" type="button" data-delete-room="${esc(r.code)}">Delete</button>
        </div>`).join("") : `<p class="mut" style="margin-top:12px">No open rooms.</p>`}
    </div>`;

  document.getElementById("refreshQueue")?.addEventListener("click", () => loadQueue(true));
  document.getElementById("refreshRooms")?.addEventListener("click", () => loadQueue(true));
  document.getElementById("downloadMail")?.addEventListener("click", downloadMailingList);
  panel.querySelectorAll("[data-delete-room]").forEach((b) =>
    b.addEventListener("click", () => deleteFlowRoom(b.dataset.deleteRoom)),
  );
  panel.querySelectorAll("[data-q-regen]").forEach((b) =>
    b.addEventListener("click", () => archiveRejectOrRegen(b.dataset.qRegen, true, b.dataset.logBank)),
  );
  document.getElementById("refreshRooms")?.addEventListener("click", () => loadQueue(true));
  document.getElementById("downloadMail")?.addEventListener("click", downloadMailingList);
  panel.querySelectorAll("[data-delete-room]").forEach((b) =>
    b.addEventListener("click", () => deleteFlowRoom(b.dataset.deleteRoom)),
  );
}

function renderArchivePanel(panel) {
  const a = state.archive;
  if (a.loading) {
    panel.innerHTML = `<div class="card"><p class="mut">Loading archive…</p></div>`;
    return;
  }

  // Placement archive page (reject / regen enabled)
  if (a.kind === "placement" && a.pack) {
    const tiers = ["all", "easy", "hard", "difficult", "extreme"];
    const topicQ = (a.filterTopic || "").trim().toLowerCase();
    const qs = (a.pack.questions || []).filter((q) => {
      if (a.filterTier !== "all" && q.tier !== a.filterTier) return false;
      if (!topicQ) return true;
      const hay = `${q.topic || ""} ${q.categoryTitle || ""} ${q.prompt || ""} ${q.id || ""} ${q.generation || ""}`.toLowerCase();
      return hay.includes(topicQ);
    });
    const sc = a.studioCounts || {};
    panel.innerHTML = `
      <div class="card">
        <div class="row spread">
          <div>
            <button class="btn" id="archBackPlacement">← Archives</button>
            <h2 style="margin-top:12px">Placement <span class="mut" style="font-size:14px;font-family:var(--font-body)">(Dojo · reject / regenerate)</span></h2>
            <p class="mut">${esc(a.pack.title || a.pack.id || "")}</p>
            <p class="mut" style="margin-top:6px">${fmtCounts(sc)} · ${(a.pack.questions||[]).length} questions · Regenerate replaces that question on this card</p>
            ${readyBenchHTML()}
          </div>
        </div>
        <div class="row" style="margin-top:12px;gap:12px">
          <select id="archTier" style="width:auto;margin:0">${tiers.map((t)=>`<option value="${t}" ${a.filterTier===t?"selected":""}>${t}</option>`).join("")}</select>
          <input id="archTopic" style="width:min(280px,100%);margin:0" placeholder="Filter topic / generation / prompt…" value="${esc(a.filterTopic)}"/>
        </div>
        <div class="q-list" style="margin-top:12px">
          ${qs.map((q) => archiveQItem(q)).join("") || `<p class="mut">No questions in filter.</p>`}
        </div>
      </div>`;
    document.getElementById("archBackPlacement")?.addEventListener("click", () => {
      a.kind = null;
      a.pack = null;
      a.pageKey = null;
      a.monthKey = null;
      a.studioCounts = null;
      a.filterTier = "all";
      a.filterTopic = "";
      render();
    });
    document.getElementById("archTier")?.addEventListener("change", (e) => {
      a.filterTier = e.target.value;
      render();
    });
    document.getElementById("archTopic")?.addEventListener("input", (e) => {
      a.filterTopic = e.target.value;
      render();
    });
    panel.querySelectorAll("[data-p-approve]").forEach((b) =>
      b.addEventListener("click", () => setPlacementStatus(b.dataset.pApprove, "approved")),
    );
    panel.querySelectorAll("[data-p-pending]").forEach((b) =>
      b.addEventListener("click", () => setPlacementStatus(b.dataset.pPending, "pending")),
    );
    bindArchiveQuestionActions(panel);
    return;
  }

  // Week detail (reject / regenerate)
  if (a.pack && a.weekKey && a.monthKey) {
    const tiers = ["all", "easy", "hard", "difficult", "finale"];
    const topicQ = (a.filterTopic || "").trim().toLowerCase();
    const qs = (a.pack.questions || []).filter((q) => {
      if (a.filterTier !== "all" && q.tier !== a.filterTier) return false;
      if (!topicQ) return true;
      const hay = `${q.topic || ""} ${q.categoryTitle || ""} ${q.prompt || ""} ${q.id || ""}`.toLowerCase();
      return hay.includes(topicQ);
    });
    const sc = a.studioCounts || {};
    panel.innerHTML = `
      <div class="card">
        <div class="row spread">
          <div>
            <button class="btn" id="archBackWeek">← ${esc(a.monthKey)}</button>
            <h2 style="margin-top:12px">${esc(a.weekKey)} <span class="mut" style="font-size:14px;font-family:var(--font-body)">(archived · reject / regenerate)</span></h2>
            <p class="mut">${esc(a.pack.inspirationSummary || "")}</p>
            <p class="mut" style="margin-top:6px">${fmtCounts(sc)} · ${(a.pack.questions||[]).length} questions · Regenerate replaces that question on this card</p>
            ${readyBenchHTML()}
          </div>
        </div>
        <div class="row" style="margin-top:12px;gap:12px">
          <select id="archTier" style="width:auto;margin:0">${tiers.map((t)=>`<option value="${t}" ${a.filterTier===t?"selected":""}>${t}</option>`).join("")}</select>
          <input id="archTopic" style="width:min(280px,100%);margin:0" placeholder="Filter topic / prompt…" value="${esc(a.filterTopic)}"/>
        </div>
        <div class="q-list" style="margin-top:12px">
          ${qs.map((q) => archiveQItem(q)).join("") || `<p class="mut">No questions in filter.</p>`}
        </div>
      </div>`;
    document.getElementById("archBackWeek")?.addEventListener("click", () => {
      a.pack = null;
      a.weekKey = null;
      a.studioCounts = null;
      a.filterTier = "all";
      a.filterTopic = "";
      render();
    });
    document.getElementById("archTier")?.addEventListener("change", (e) => {
      a.filterTier = e.target.value;
      render();
    });
    const topicInput = document.getElementById("archTopic");
    topicInput?.addEventListener("input", (e) => {
      a.filterTopic = e.target.value;
      const topicQ = (a.filterTopic || "").trim().toLowerCase();
      const filtered = (a.pack.questions || []).filter((q) => {
        if (a.filterTier !== "all" && q.tier !== a.filterTier) return false;
        if (!topicQ) return true;
        const hay = `${q.topic || ""} ${q.categoryTitle || ""} ${q.prompt || ""} ${q.id || ""}`.toLowerCase();
        return hay.includes(topicQ);
      });
      const list = panel.querySelector(".q-list");
      if (!list) return;
      list.innerHTML = filtered.map((q) => archiveQItem(q)).join("") || `<p class="mut">No questions in filter.</p>`;
      bindArchiveQuestionActions(panel);
    });
    bindArchiveQuestionActions(panel);
    return;
  }

  // Month weeks list
  if (a.monthKey && a.index) {
    const weeks = [...(a.index.weeks || [])].sort((x, y) =>
      String(y.weekKey).localeCompare(String(x.weekKey)),
    );
    panel.innerHTML = `
      <div class="card">
        <div class="row spread">
          <div>
            <button class="btn" id="archBackMonths">← All months</button>
            <h2 style="margin-top:12px">${esc(a.monthKey)}</h2>
            <p class="mut">${weeks.length} week${weeks.length===1?"":"s"} · updated ${esc(a.index.updatedAt || "—")}</p>
          </div>
        </div>
        <div class="arch-list" style="margin-top:14px">
          ${weeks.map((w) => `
            <button class="arch-row" data-week="${esc(w.weekKey)}">
              <div class="row spread">
                <div>
                  <b>${esc(w.weekKey)}</b>
                  <div class="mut">${w.questionCount ?? "—"} questions · ${esc(fmtCounts(w.studioCounts || w.counts))}</div>
                </div>
                <span class="mut">${esc((w.publishedAt || "").slice(0, 10) || "")}</span>
              </div>
            </button>`).join("") || `<p class="mut">No weeks archived this month.</p>`}
        </div>
      </div>`;
    document.getElementById("archBackMonths")?.addEventListener("click", () => {
      a.monthKey = null;
      a.index = null;
      render();
    });
    panel.querySelectorAll("[data-week]").forEach((b) =>
      b.addEventListener("click", () => openArchiveWeek(a.monthKey, b.dataset.week)),
    );
    return;
  }

  // Root: placement pages + monthly weeks
  const months = a.months || [];
  const placementPages = a.placementPages || [];
  panel.innerHTML = `
    <div class="card">
      <h2>Placement</h2>
      <p class="mut">Dojo placement bank — reject and regenerate here. The log still learns if Q-and-A is not connected.</p>
      <div class="arch-list" style="margin-top:14px">
        ${placementPages.map((p) => `
          <button class="arch-row" data-placement="${esc(p.id)}">
            <div class="row spread">
              <div>
                <b>${esc(p.title || p.id)}</b>
                <div class="mut">${p.questionCount || 0} questions · ${(p.generations||[]).length} generations</div>
              </div>
              <span class="mut">placement</span>
            </div>
          </button>`).join("") || `<p class="mut">No placement pack bundled.</p>`}
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>Monthly archive</h2>
      <p class="mut">Published week packs by America/Toronto month. Reject a question, then regenerate from the log.</p>
      <div class="arch-list" style="margin-top:14px">
        ${months.map((m) => `
          <button class="arch-row" data-month="${esc(m.monthKey)}">
            <div class="row spread">
              <div>
                <b>${esc(m.monthKey)}</b>
                <div class="mut">${m.weekCount || 0} week${m.weekCount===1?"":"s"} · ${m.questionCount || 0} questions</div>
              </div>
              <span class="mut">${esc((m.updatedAt || "").slice(0, 10) || "")}</span>
            </div>
          </button>`).join("") || `<p class="mut">Archive empty — publish a week to seed it.</p>`}
      </div>
    </div>`;
  panel.querySelectorAll("[data-month]").forEach((b) =>
    b.addEventListener("click", () => openArchiveMonth(b.dataset.month)),
  );
  panel.querySelectorAll("[data-placement]").forEach((b) =>
    b.addEventListener("click", () => openPlacementPage(b.dataset.placement)),
  );
}

async function loadArchiveMonths(rerender) {
  state.archive.loading = true;
  if (rerender) render();
  try {
    const data = await api("archive");
    state.archive.months = data.months || [];
    state.archive.placementPages = data.placementPages || [];
  } catch (e) {
    state.message = e.message || "Failed to load archive";
    state.archive.months = [];
    state.archive.placementPages = [];
  } finally {
    state.archive.loading = false;
    if (rerender || state.tab === "archive") render();
  }
}

async function openArchiveMonth(monthKey) {
  state.archive.loading = true;
  render();
  try {
    const data = await api(`archive?month=${encodeURIComponent(monthKey)}`);
    state.archive.monthKey = monthKey;
    state.archive.index = data.index;
    state.archive.pack = null;
    state.archive.weekKey = null;
  } catch (e) {
    state.message = e.message;
  } finally {
    state.archive.loading = false;
    render();
  }
}

async function openArchiveWeek(monthKey, weekKey) {
  state.archive.loading = true;
  render();
  try {
    const data = await api(
      `archive?month=${encodeURIComponent(monthKey)}&week=${encodeURIComponent(weekKey)}`,
    );
    state.archive.monthKey = monthKey;
    state.archive.weekKey = weekKey;
    state.archive.pack = data.pack;
    state.archive.studioCounts = data.studioCounts;
    state.archive.filterTier = "all";
    state.archive.filterTopic = "";
    if (data.rejectReady) state.rejectReady = data.rejectReady;
  } catch (e) {
    state.message = e.message;
  } finally {
    state.archive.loading = false;
    render();
  }
}

async function doLogin() {
  const password = document.getElementById("pw")?.value || "";
  try {
    await api("login", { method: "POST", body: JSON.stringify({ password }) });
    state.authed = true;
    state.locked = false;
    state.message = "";
    await Promise.all([loadQueue(false), loadTopics(false)]);
    armIdle();
    render();
  } catch (e) {
    state.message = e.message || "Login failed";
    render();
  }
}

async function doLogout() {
  try {
    await api("logout", { method: "POST", body: "{}" });
  } catch { /* ignore */ }
  state.authed = false;
  state.week = null;
  state.archive = {
    months: null,
    placementPages: null,
    monthKey: null,
    index: null,
    weekKey: null,
    pageKey: null,
    kind: null,
    pack: null,
    studioCounts: null,
    filterTier: "all",
    filterTopic: "",
    loading: false,
  };
  render();
}

async function setFlowLocale(next) {
  const loc = LOCALES.includes(next) ? next : "en";
  state.locale = loc;
  try { localStorage.setItem(LOCALE_KEY, loc); } catch { /* ignore */ }
  state.message = `Locale ${loc.toUpperCase()}`;
  state.archive.months = null;
  state.archive.kind = null;
  state.archive.pack = null;
  state.archive.monthKey = null;
  try {
    if (state.tab === "queue" || state.tab === "console" || state.tab === "rooms" || state.tab === "metrics") await loadQueue(false);
    else {
      await loadWeek(false);
      if (state.tab === "archive") await loadArchiveMonths(false);
    }
  } catch (e) {
    state.message = e.message;
  }
  render();
}

async function loadWeek(rerender) {
  state.week = await api("week"); // locale via withLocale
  if (state.week?.rejectReady) state.rejectReady = state.week.rejectReady;
  if (rerender) render();
}

async function loadTopics(rerender) {
  state.topics = await api("topics");
  if (rerender) render();
}

async function setStatus(id, status) {
  await api("week", { method: "POST", body: JSON.stringify({ action: "status", id, status, locale: state.locale }) });
  await loadWeek(true);
}

async function doPublish() {
  try {
    const data = await api("publish", { method: "POST", body: JSON.stringify({ locale: state.locale }) });
    const arch = data.archive
      ? ` Archived ${data.archive.monthKey}/${data.archive.weekKey}.`
      : "";
    state.message = `Published ${data.meta?.questionCount} qs.${arch} ${data.note || ""}`;
    state.archive.months = null;
    await loadWeek(true);
  } catch (e) {
    state.message = e.message;
    render();
  }
}

async function doAddTopic() {
  try {
    await api("topics", {
      method: "POST",
      body: JSON.stringify({
        id: document.getElementById("tid").value.trim(),
        title: document.getElementById("ttitle").value.trim(),
        blurb: document.getElementById("tblurb").value.trim(),
        easyOnly: document.getElementById("teasy").checked,
      }),
    });
    state.message = "Topic added (runtime).";
    await loadTopics(true);
  } catch (e) {
    state.message = e.message;
    render();
  }
}

async function doReject(regen = false) {
  const choicesRaw = document.getElementById("rchoices").value.trim();
  const prompt = document.getElementById("rprompt").value.trim();
  const body = {
    action: regen ? "regenerate" : "reject",
    questionId: document.getElementById("rid").value.trim(),
    reasonCodes: document.getElementById("rreasons").value.split(",").map((s) => s.trim()).filter(Boolean),
    note: document.getElementById("rnote").value.trim(),
    locale: state.locale,
  };
  if (regen && !(prompt && choicesRaw) && state.rejectReady?.onHand?.id) body.onHandId = state.rejectReady.onHand.id;
  if (prompt && choicesRaw) {
    const choices = choicesRaw.split(",").map((s) => s.trim());
    if (choices.length === 4) {
      body.replacement = {
        prompt,
        choices,
        correctIndex: Number(document.getElementById("ridx").value) || 0,
      };
    }
  }
  const bank = document.getElementById("rbank")?.value || "week";
  try {
    const endpoint = bank === "placement" ? "placement" : "reject";
    if (bank === "placement") body.bank = "placement";
    if (regen) markReplacing(body.questionId);
    const data = await api(endpoint, { method: "POST", body: JSON.stringify(body) });
    if (data.ready) state.rejectReady = data.ready;
    if (regen && data.regenerated && replaceQuestionOnCard(body.questionId, data.regenerated)) {
      state.message = `Replaced ${body.questionId} on this card with the question that was on hand.`;
      render();
      return;
    }
    state.message = regen
      ? `Regenerated ${body.questionId} → ${data.regenerated?.id || "draft"}. ${data.learningBrief || ""}`
      : `Rejected ${data.rejection?.questionId}. ${data.learningBrief || ""}`;
    await loadQueue(false);
    if (bank === "placement") {
      state.archive.months = null;
      if (state.archive.kind === "placement") await openPlacementPage(state.archive.pageKey || "placement");
      else render();
    } else if (state.tab === "archive" && state.archive.weekKey) {
      await openArchiveWeek(state.archive.monthKey, state.archive.weekKey);
    } else {
      await loadWeek(true);
    }
  } catch (e) {
    state.message = e.message;
    render();
  }
}

function replaceQuestionOnCard(id, next) {
  if (!id || !next?.prompt) return false;
  const card = { ...next, status: next.status || "pending" };
  let hit = false;
  const swap = (list) => {
    if (!Array.isArray(list)) return;
    const i = list.findIndex((q) => q && q.id === id);
    if (i < 0) return;
    list.splice(i, 1, card);
    hit = true;
  };
  swap(state.archive?.pack?.questions);
  swap(state.week?.pack?.questions);
  swap(state.queue?.placement?.pack?.questions);
  return hit;
}

function markReplacing(id) {
  const safe = String(id).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const sel = `[data-arch-regen="${safe}"],[data-regen="${safe}"],[data-q-regen="${safe}"],[data-log-regen="${safe}"]`;
  document.querySelectorAll(sel).forEach((b) => b.closest(".q-item")?.classList.add("replacing"));
}

async function archiveRejectOrRegen(id, regen, bankHint) {
  const a = state.archive;
  const fromArchive = state.tab === "archive";
  const placement = (fromArchive && a.kind === "placement")
    || bankHint === "placement";
  const body = {
    action: regen ? "regenerate" : "reject",
    questionId: id,
    locale: state.locale,
    reasonCodes: regen ? ["archive-regen"] : ["archive-reject"],
    note: regen ? "Regenerated from Flow" : "Rejected from Flow",
  };
  if (placement) body.bank = "placement";
  if (regen && !body.replacement && state.rejectReady?.onHand?.id) body.onHandId = state.rejectReady.onHand.id;
  if (fromArchive && a.monthKey && a.monthKey !== "placement") {
    body.monthKey = a.monthKey;
    body.weekKey = a.weekKey || null;
  }
  if (regen) markReplacing(id);
  try {
    const endpoint = placement ? "placement" : "reject";
    const data = await api(endpoint, { method: "POST", body: JSON.stringify(body) });
    if (data.ready) state.rejectReady = data.ready;
    if (regen && data.regenerated && replaceQuestionOnCard(id, data.regenerated)) {
      state.message = `Replaced ${id} on this card with the question that was on hand.`;
      render();
      return;
    }
    state.message = regen
      ? `Regenerated ${id} → ${data.regenerated?.id || "draft"}. ${data.learningBrief || ""}`
      : `Rejected ${id}. ${data.learningBrief || ""}`;
    await loadQueue(false);
    if (fromArchive && placement) await openPlacementPage(a.pageKey || "placement");
    else if (fromArchive && a.weekKey) await openArchiveWeek(a.monthKey, a.weekKey);
    else if (state.tab === "bank") await loadWeek(true);
    else render();
  } catch (e) {
    state.message = e.message;
    render();
  }
}

async function downloadRejectLog() {
  try {
    const res = await fetch(`/api/flow/reject?download=1&locale=${encodeURIComponent(state.locale || "en")}`, {
      credentials: "same-origin",
    });
    if (!res.ok) throw new Error("Could not download the rejected-question log");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rejected-questions.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    state.message = "Rejected-question log downloaded.";
    render();
  } catch (e) {
    state.message = e.message;
    render();
  }
}

async function openPlacementPage(pageId) {
  state.archive.loading = true;
  render();
  try {
    const data = await api(`archive?month=placement&page=${encodeURIComponent(pageId || "placement")}`);
    state.archive.kind = "placement";
    state.archive.monthKey = "placement";
    state.archive.pageKey = pageId || data.pack?.id || "placement";
    state.archive.weekKey = null;
    state.archive.index = null;
    state.archive.pack = data.pack;
    state.archive.studioCounts = data.studioCounts;
    state.archive.filterTier = "all";
    state.archive.filterTopic = "";
    if (data.rejectReady) state.rejectReady = data.rejectReady;
    if (data.pages) state.archive.placementPages = data.pages;
  } catch (e) {
    state.message = e.message;
  } finally {
    state.archive.loading = false;
    render();
  }
}

async function setPlacementStatus(id, status) {
  try {
    await api("placement", {
      method: "POST",
      body: JSON.stringify({ action: "status", questionId: id, status, locale: state.locale }),
    });
    await openPlacementPage(state.archive.pageKey || "placement");
  } catch (e) {
    state.message = e.message;
    render();
  }
}

async function rejectPlacementQuick(id) {
  return archiveRejectOrRegen(id, false, "placement");
}

let idleTimer = null;
function armIdle() {
  const bump = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => {
      try {
        await api("logout", { method: "POST", body: "{}", keepalive: true });
      } catch { /* ignore */ }
      state.authed = false;
      state.locked = true;
      history.replaceState({}, "", "/flow/?locked=1");
      render();
    }, IDLE_MS);
  };
  ["pointerdown", "pointermove", "keydown", "touchstart", "scroll", "wheel"].forEach((ev) =>
    window.addEventListener(ev, bump, { capture: true, passive: true }),
  );
  bump();
}

async function loadQueue(rerender) {
  state.queue.loading = true;
  state.queue.error = "";
  if (rerender) render();
  const jobs = await Promise.allSettled([
    api("week"),
    api("placement"),
    api("reject"),
    api("placement?rejections=1"),
    api("profiles"),
    fetch("/api/rooms?list=1", { credentials: "same-origin" }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    }),
  ]);
  const [week, placement, weekRej, placeRej, profiles, rooms] = jobs;
  const errors = [];
  if (week.status === "fulfilled") {
    state.week = week.value;
    if (week.value?.rejectReady) state.rejectReady = week.value.rejectReady;
  }
  else errors.push(week.reason?.message || "Could not load the weekly bank");
  if (placement.status === "fulfilled") state.queue.placement = placement.value;
  else errors.push(placement.reason?.message || "Could not load placement");
  const rejectPayload = weekRej.status === "fulfilled" ? weekRej.value : {};
  if (rejectPayload.rejectReady) state.rejectReady = rejectPayload.rejectReady;
  const allLog = Array.isArray(rejectPayload.rejections) ? rejectPayload.rejections : [];
  state.queue.lessons = rejectPayload.lessons || null;
  state.queue.weekRejections = allLog.filter((e) => e.bank !== "placement");
  if (weekRej.status === "rejected") errors.push(weekRej.reason?.message || "Could not load rejections");
  const placeLog = placeRej.status === "fulfilled" ? (placeRej.value.rejections || []) : [];
  state.queue.placementRejections = placeLog.length ? placeLog : allLog.filter((e) => e.bank === "placement");
  if (placeRej.status === "rejected") errors.push(placeRej.reason?.message || "Could not load placement rejections");
  if (profiles.status === "fulfilled") state.profiles = profiles.value.profiles || [];
  else errors.push(profiles.reason?.message || "Could not load profiles");
  if (rooms.status === "fulfilled") state.queue.rooms = rooms.value.rooms || [];
  else errors.push(rooms.reason?.message || "Could not load rooms");
  state.queue.error = errors.filter(Boolean).join(" · ");
  state.queue.loading = false;
  if (rerender) render();
}

async function deleteFlowRoom(code) {
  try {
    const res = await fetch("/api/rooms", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete", code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    state.queue.rooms = data.rooms || [];
    state.message = `Deleted room ${code}.`;
  } catch (e) {
    state.message = e.message || "Could not delete room";
  }
  render();
}

async function loadProfiles(force) {
  if (!force && state.profiles) {
    render();
    return;
  }
  try {
    const data = await api("profiles");
    state.profiles = data.profiles || [];
    state.message = "";
  } catch (e) {
    state.message = e.message;
    state.profiles = state.profiles || [];
  }
  render();
}

async function downloadMailingList() {
  try {
    const res = await fetch("/api/flow/profiles?download=1", { credentials: "same-origin" });
    if (!res.ok) throw new Error("Could not download mailing list");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fast-answer-mailing-list.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    state.message = "Mailing list downloaded.";
    render();
  } catch (e) {
    state.message = e.message;
    render();
  }
}

async function boot() {
  try {
    const s = await api("session");
    state.configured = s.configured !== false;
    state.authed = Boolean(s.ok);
    if (state.authed) {
      await Promise.all([loadQueue(false), loadTopics(false)]);
      armIdle();
    }
  } catch {
    state.configured = true;
    state.authed = false;
  }
  render();
}

boot();
