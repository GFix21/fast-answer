const IDLE_MS = 30_000;
const app = document.getElementById("app");

const state = {
  authed: false,
  configured: true,
  tab: "overview",
  week: null,
  topics: null,
  message: "",
  locked: new URLSearchParams(location.search).get("locked") === "1",
  filterTier: "all",
};

async function api(path, opts = {}) {
  const res = await fetch(`/api/flow/${path}`, {
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

function render() {
  if (!state.authed) {
    app.innerHTML = `
      <div class="login-wrap card">
        <h1>Flow</h1>
        <p class="mut">Fast Answer admin — password gate</p>
        ${state.locked ? `<div class="banner">Idle lock — sign in again.</div>` : ""}
        ${!state.configured ? `<div class="banner">Server missing FLOW_PASSWORD env.</div>` : ""}
        ${state.message ? `<div class="banner">${esc(state.message)}</div>` : ""}
        <label>Password</label>
        <input id="pw" type="password" autocomplete="current-password" />
        <button class="btn primary" id="login">Unlock</button>
        <p class="mut" style="margin-top:16px"><a href="/" style="color:var(--accent)">← Back to game</a></p>
      </div>`;
    document.getElementById("login")?.addEventListener("click", doLogin);
    document.getElementById("pw")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin();
    });
    return;
  }

  const pub = state.week?.publish;
  const sc = state.week?.studioCounts || {};
  const st = state.week?.statusCounts || {};
  const pack = state.week?.pack;

  app.innerHTML = `
    <div class="row spread">
      <div>
        <h1>Flow · Fast Answer</h1>
        <p class="mut">Week ${esc(pack?.weekKey || "—")} · review → publish → questions.json</p>
      </div>
      <div class="row">
        <a class="btn" href="/">Play</a>
        <button class="btn" id="logout">Log out</button>
      </div>
    </div>
    ${state.message ? `<div class="banner ok-banner">${esc(state.message)}</div>` : ""}
    <nav class="tabs">
      ${["overview","bank","topic","reject"].map((t) =>
        `<button data-tab="${t}" class="${state.tab===t?"on":""}">${
          t==="overview"?"Overview":t==="bank"?"Weekly bank":t==="topic"?"Add topic":"Reject / regen"
        }</button>`
      ).join("")}
    </nav>
    <div id="panel"></div>
  `;

  document.getElementById("logout")?.addEventListener("click", doLogout);
  app.querySelectorAll("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      state.tab = b.dataset.tab;
      state.message = "";
      render();
    }),
  );

  const panel = document.getElementById("panel");
  if (state.tab === "overview") {
    panel.innerHTML = `
      <div class="card">
        <h2>Publish status</h2>
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
        </p>
        <div class="row" style="margin-top:16px">
          <button class="btn primary" id="publish">Publish week → questions.json</button>
          <button class="btn" id="refresh">Refresh</button>
        </div>
        <p class="mut" style="margin-top:12px">Durable Hobby path: <code>node scripts/publish-week.mjs</code> then git push / redeploy. FLOW_PASSWORD is env-only.</p>
      </div>`;
    document.getElementById("publish")?.addEventListener("click", doPublish);
    document.getElementById("refresh")?.addEventListener("click", () => loadWeek(true));
  } else if (state.tab === "bank") {
    const tiers = ["all", "easy", "hard", "difficult", "finale"];
    const qs = (pack?.questions || []).filter(
      (q) => state.filterTier === "all" || q.tier === state.filterTier,
    );
    panel.innerHTML = `
      <div class="card">
        <div class="row spread">
          <h2>Weekly bank review</h2>
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
      b.addEventListener("click", () => setStatus(b.dataset.reject, "rejected")),
    );
    panel.querySelectorAll("[data-pending]").forEach((b) =>
      b.addEventListener("click", () => setStatus(b.dataset.pending, "pending")),
    );
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
    panel.innerHTML = `
      <div class="card">
        <h2>Reject → regenerate</h2>
        <p class="mut">Logs rejection + optional replacement. Prefer full regen in Q-and-A studio.</p>
        <label>question id</label><input id="rid" placeholder="w39-e-…"/>
        <label>reason codes (comma)</label><input id="rreasons" value="weak-distractors"/>
        <label>note</label><textarea id="rnote" rows="2"></textarea>
        <label>replacement prompt (optional)</label><textarea id="rprompt" rows="2"></textarea>
        <label>replacement choices CSV (optional, 4)</label><input id="rchoices" placeholder="A, B, C, D"/>
        <label>correctIndex</label><input id="ridx" type="number" min="0" max="3" value="0"/>
        <button class="btn danger" id="doReject">Reject &amp; log</button>
      </div>`;
    document.getElementById("doReject")?.addEventListener("click", doReject);
  }
}

async function doLogin() {
  const password = document.getElementById("pw")?.value || "";
  try {
    await api("login", { method: "POST", body: JSON.stringify({ password }) });
    state.authed = true;
    state.locked = false;
    state.message = "";
    await Promise.all([loadWeek(false), loadTopics(false)]);
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
  render();
}

async function loadWeek(rerender) {
  state.week = await api("week");
  if (rerender) render();
}

async function loadTopics(rerender) {
  state.topics = await api("topics");
  if (rerender) render();
}

async function setStatus(id, status) {
  await api("week", { method: "POST", body: JSON.stringify({ action: "status", id, status }) });
  await loadWeek(true);
}

async function doPublish() {
  try {
    const data = await api("publish", { method: "POST", body: "{}" });
    state.message = `Published ${data.meta?.questionCount} qs. ${data.note || ""}`;
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

async function doReject() {
  const choicesRaw = document.getElementById("rchoices").value.trim();
  const prompt = document.getElementById("rprompt").value.trim();
  const body = {
    questionId: document.getElementById("rid").value.trim(),
    reasonCodes: document.getElementById("rreasons").value.split(",").map((s) => s.trim()).filter(Boolean),
    note: document.getElementById("rnote").value.trim(),
  };
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
  try {
    const data = await api("reject", { method: "POST", body: JSON.stringify(body) });
    state.message = `Rejected ${data.rejection?.questionId}. ${data.learningBrief || ""}`;
    await loadWeek(true);
  } catch (e) {
    state.message = e.message;
    render();
  }
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

async function boot() {
  try {
    const s = await api("session");
    state.configured = s.configured !== false;
    state.authed = Boolean(s.ok);
    if (state.authed) {
      await Promise.all([loadWeek(false), loadTopics(false)]);
      armIdle();
    }
  } catch {
    state.configured = true;
    state.authed = false;
  }
  render();
}

boot();
