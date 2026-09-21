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
      ${["overview","bank","archive","topic","reject"].map((t) =>
        `<button data-tab="${t}" class="${state.tab===t?"on":""}">${
          t==="overview"?"Overview":t==="bank"?"Weekly bank":t==="archive"?"Archives":t==="topic"?"Add topic":"Reject / regen"
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
      if (state.tab === "archive" && !state.archive.months) {
        loadArchiveMonths(true);
        return;
      }
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
        <p class="mut" style="margin-top:12px">Durable Hobby path: <code>node scripts/publish-week.mjs</code> then git push / redeploy. FLOW_PASSWORD is env-only. Publish also snapshots into <code>banks/archive/YYYY-MM/</code>.</p>
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
    panel.innerHTML = `
      <div class="card">
        <h2>Reject → regenerate</h2>
        <p class="mut">Logs rejection + optional replacement. Weekly bank or Placement archive. Prefer full regen in Q-and-A studio.</p>
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
        <button class="btn danger" id="doReject">Reject &amp; log</button>
      </div>`;
    document.getElementById("doReject")?.addEventListener("click", doReject);
  }
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
            <h2 style="margin-top:12px">Placement <span class="mut" style="font-size:14px;font-family:var(--font-body)">(Dojo · reject / regen)</span></h2>
            <p class="mut">${esc(a.pack.title || a.pack.id || "")}</p>
            <p class="mut" style="margin-top:6px">${fmtCounts(sc)} · ${(a.pack.questions||[]).length} questions · Q-and-A banks/placement</p>
          </div>
        </div>
        <div class="row" style="margin-top:12px;gap:12px">
          <select id="archTier" style="width:auto;margin:0">${tiers.map((t)=>`<option value="${t}" ${a.filterTier===t?"selected":""}>${t}</option>`).join("")}</select>
          <input id="archTopic" style="width:min(280px,100%);margin:0" placeholder="Filter topic / generation / prompt…" value="${esc(a.filterTopic)}"/>
        </div>
        <div class="q-list" style="margin-top:12px">
          ${qs.map((q) => `
            <div class="q-item ${esc(q.status||"pending")}">
              <div class="q-meta">${esc(q.tier)} · ${esc(q.topic)} · ${esc(q.generation||"")} · <b>${esc(q.status||"pending")}</b> · ${esc(q.id)}</div>
              <div class="q-prompt">${esc(q.categoryTitle)} — ${esc(q.prompt)}</div>
              <div class="choices">${(q.choices||[]).map((c,i)=>`<div class="${i===q.correctIndex?"hit":""}">${String.fromCharCode(65+i)}. ${esc(c)}</div>`).join("")}</div>
              <div class="row" style="margin-top:10px">
                <button class="btn ok" data-p-approve="${esc(q.id)}">Approve</button>
                <button class="btn danger" data-p-reject="${esc(q.id)}">Reject</button>
                <button class="btn" data-p-pending="${esc(q.id)}">Pending</button>
                <button class="btn" data-p-regen="${esc(q.id)}">Reject → regen form</button>
              </div>
            </div>`).join("") || `<p class="mut">No questions in filter.</p>`}
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
    panel.querySelectorAll("[data-p-reject]").forEach((b) =>
      b.addEventListener("click", () => rejectPlacementQuick(b.dataset.pReject)),
    );
    panel.querySelectorAll("[data-p-regen]").forEach((b) =>
      b.addEventListener("click", () => {
        state.tab = "reject";
        state.message = "";
        render();
        queueMicrotask(() => {
          const bank = document.getElementById("rbank");
          const rid = document.getElementById("rid");
          if (bank) bank.value = "placement";
          if (rid) rid.value = b.dataset.pRegen;
        });
      }),
    );
    return;
  }

  // Week detail (read-only browse)
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
            <h2 style="margin-top:12px">${esc(a.weekKey)} <span class="mut" style="font-size:14px;font-family:var(--font-body)">(archived · read-only)</span></h2>
            <p class="mut">${esc(a.pack.inspirationSummary || "")}</p>
            <p class="mut" style="margin-top:6px">${fmtCounts(sc)} · ${(a.pack.questions||[]).length} questions</p>
          </div>
        </div>
        <div class="row" style="margin-top:12px;gap:12px">
          <select id="archTier" style="width:auto;margin:0">${tiers.map((t)=>`<option value="${t}" ${a.filterTier===t?"selected":""}>${t}</option>`).join("")}</select>
          <input id="archTopic" style="width:min(280px,100%);margin:0" placeholder="Filter topic / prompt…" value="${esc(a.filterTopic)}"/>
        </div>
        <div class="q-list" style="margin-top:12px">
          ${qs.map((q) => `
            <div class="q-item ${esc(q.status||"")}">
              <div class="q-meta">${esc(q.tier)} · ${esc(q.topic)} · ${esc(q.generation||"")}${q.status?` · <b>${esc(q.status)}</b>`:""} · ${esc(q.id)}</div>
              <div class="q-prompt">${esc(q.categoryTitle)} — ${esc(q.prompt)}</div>
              <div class="choices">${(q.choices||[]).map((c,i)=>`<div class="${i===q.correctIndex?"hit":""}">${String.fromCharCode(65+i)}. ${esc(c)}</div>`).join("")}</div>
            </div>`).join("") || `<p class="mut">No questions in filter.</p>`}
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
      list.innerHTML = filtered.map((q) => `
            <div class="q-item ${esc(q.status||"")}">
              <div class="q-meta">${esc(q.tier)} · ${esc(q.topic)} · ${esc(q.generation||"")}${q.status?` · <b>${esc(q.status)}</b>`:""} · ${esc(q.id)}</div>
              <div class="q-prompt">${esc(q.categoryTitle)} — ${esc(q.prompt)}</div>
              <div class="choices">${(q.choices||[]).map((c,i)=>`<div class="${i===q.correctIndex?"hit":""}">${String.fromCharCode(65+i)}. ${esc(c)}</div>`).join("")}</div>
            </div>`).join("") || `<p class="mut">No questions in filter.</p>`;
    });
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
      <p class="mut">Dojo placement bank from Q-and-A — separate archive page for reject / regenerate.</p>
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
      <p class="mut">Published week packs by America/Toronto month. Read-only browse.</p>
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
  const bank = document.getElementById("rbank")?.value || "week";
  try {
    const endpoint = bank === "placement" ? "placement" : "reject";
    if (bank === "placement") body.action = "reject";
    const data = await api(endpoint, { method: "POST", body: JSON.stringify(body) });
    state.message = `Rejected ${data.rejection?.questionId}. ${data.learningBrief || ""}`;
    if (bank === "placement") {
      state.archive.months = null;
      if (state.archive.kind === "placement") await openPlacementPage(state.archive.pageKey || "placement");
      else render();
    } else {
      await loadWeek(true);
    }
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
      body: JSON.stringify({ action: "status", questionId: id, status }),
    });
    await openPlacementPage(state.archive.pageKey || "placement");
  } catch (e) {
    state.message = e.message;
    render();
  }
}

async function rejectPlacementQuick(id) {
  try {
    const data = await api("placement", {
      method: "POST",
      body: JSON.stringify({
        action: "reject",
        questionId: id,
        reasonCodes: ["flow-quick-reject"],
        note: "Rejected from Placement archive page",
      }),
    });
    state.message = `Rejected ${data.rejection?.questionId}.`;
    await openPlacementPage(state.archive.pageKey || "placement");
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
