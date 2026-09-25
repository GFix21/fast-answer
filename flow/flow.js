import { normalizeFlowLocale, FLOW_LOCALES } from "../lib/flow-locale.js";
import { answerInQuestion } from "../lib/answer-in-question.js";
import { flowLocaleLabel, t as translate } from "./strings.js";

const IDLE_MS = 30_000;
const GLOW_URL = "https://gmgbrand.vercel.app/games";
const app = document.getElementById("app");

const LOCALE_KEY = "fa-flow-locale";
const LOCALES = FLOW_LOCALES;
function loadFlowLocale() {
  try {
    const q = new URLSearchParams(location.search).get("locale");
    const stored = localStorage.getItem(LOCALE_KEY);
    return normalizeFlowLocale(q || stored || "en");
  } catch {
    return "en";
  }
}

function t(key, vars) {
  return translate(state.locale, key, vars);
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
  fan: null,
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
    filterLeak: false,
    loading: false,
  },
};

function withLocale(path) {
  const loc = state.locale || "en";
  if (!path || path.startsWith("login") || path.startsWith("logout") || path.startsWith("session") || path.startsWith("topics") || path.startsWith("profiles") || path.startsWith("fan-mail")) {
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
    .map((k) => `${c[k]} ${t("tier_" + k)}`);
  for (const [k, v] of Object.entries(c)) {
    if (!order.includes(k)) parts.push(`${v} ${k}`);
  }
  return parts.join(" · ") || "—";
}

function readyBenchHTML() {
  const ready = state.rejectReady;
  const questions = ready?.questions || [];
  const hand = ready?.onHand;
  if (!hand) return `<p class="mut">${t("noReplacement")}</p>`;
  return `
    <div class="ready-bench">
      <p><b>${questions.length} ${t("readyCount")}</b>. <b>${t("potential")}</b> : ${esc(hand.prompt)}</p>
      <ol class="ready-list">
        ${questions.map((q, i) => `<li class="${i === 0 ? "on-hand" : ""}"><span>${i === 0 ? t("potentialShort") : t("readyShort")}</span> ${esc(t("tier_" + (q.tier || "")))} · ${esc(q.prompt)}</li>`).join("")}
      </ol>
    </div>`;
}

function potentialReplacement(exceptId) {
  const list = state.rejectReady?.questions || [];
  return list.find((q) => q && q.id !== exceptId) || null;
}

function statusText(status) {
  const s = status || "active";
  if (s === "active" || s === "pending" || s === "approved" || s === "rejected") return t(s);
  return s;
}

function weekProgress(row) {
  const n = row?.questionCount ?? (row?.questions || []).length ?? 0;
  const target = row?.weekTarget || 1050;
  const complete = row?.weekComplete === true || n >= target;
  return complete ? t("weekFull", { n, target }) : t("weekOpen", { n, target });
}

function filteredArchiveQuestions(a) {
  const topicQ = (a.filterTopic || "").trim().toLowerCase();
  return (a.pack?.questions || []).filter((q) => {
    if (a.filterTier !== "all" && q.tier !== a.filterTier) return false;
    if (a.filterLeak && !answerInQuestion(q)) return false;
    if (!topicQ) return true;
    const hay = `${q.topic || ""} ${q.categoryTitle || ""} ${q.prompt || ""} ${q.id || ""} ${q.generation || ""}`.toLowerCase();
    return hay.includes(topicQ);
  });
}

function archiveFiltersHTML(a, tiers) {
  const leaks = (a.pack?.questions || []).filter((q) => answerInQuestion(q)).length;
  return `
        <div class="row" style="margin-top:12px;gap:12px">
          <select id="archTier" style="width:auto;margin:0">${tiers.map((tier) => `<option value="${tier}" ${a.filterTier === tier ? "selected" : ""}>${t("tier_" + tier)}</option>`).join("")}</select>
          <input id="archSearch" style="width:min(280px,100%);margin:0" placeholder="${t("searchPh")}" value="${esc(a.filterTopic)}"/>
          <button class="btn ${a.filterLeak ? "on" : ""}" id="archLeak" type="button">${t("leakToggle")}</button>
          <span class="mut">${t("leakCount", { n: leaks })}</span>
        </div>`;
}

function bindArchiveFilters(a) {
  document.getElementById("archTier")?.addEventListener("change", (e) => {
    a.filterTier = e.target.value;
    render();
  });
  document.getElementById("archSearch")?.addEventListener("input", (e) => {
    const pos = e.target.selectionStart;
    a.filterTopic = e.target.value;
    render();
    const next = document.getElementById("archSearch");
    if (!next) return;
    next.focus();
    next.setSelectionRange(pos, pos);
  });
  document.getElementById("archLeak")?.addEventListener("click", () => {
    a.filterLeak = !a.filterLeak;
    render();
  });
}

function archiveQItem(q) {
  const offer = potentialReplacement(q.id);
  const status = q.status || "active";
  return `
    <div class="q-item ${esc(status)}">
      <div class="q-meta">${esc(t("tier_" + (q.tier || "")))} · ${esc(q.topic)} · ${esc(q.generation || "")} · <b>${esc(statusText(status))}</b> · ${esc(q.id)}</div>
      <div class="q-prompt">${esc(q.categoryTitle || "")}${q.categoryTitle ? " — " : ""}${esc(q.prompt || "")}</div>
      ${answerInQuestion(q) ? `<div class="leak-flag">${t("leakFlag")}</div>` : ""}
      <details class="ans-fold">
        <summary>${t("answersFold")}</summary>
        <div class="choices">${(q.choices || []).map((c, i) => `<div class="${i === q.correctIndex ? "hit" : ""}">${String.fromCharCode(65 + i)}. ${esc(c)}</div>`).join("")}</div>
      </details>
      ${offer ? `
        <div class="replace-offer">
          <div>
            <div class="mut">${t("potential")}</div>
            <div class="q-prompt" style="margin:4px 0 0">${esc(offer.prompt)}</div>
          </div>
          <button class="btn primary" type="button" data-arch-replace="${esc(q.id)}" data-on-hand="${esc(offer.id)}">${t("replace")}</button>
        </div>` : `<p class="mut" style="margin-top:10px">${t("noReplacement")}</p>`}
    </div>`;
}

function bindArchiveQuestionActions(panel) {
  panel.querySelectorAll("[data-arch-replace]").forEach((b) =>
    b.addEventListener("click", () => archiveRejectOrRegen(b.dataset.archReplace, true, null, b.dataset.onHand)),
  );
}

function render() {
  if (!app) return;
  document.documentElement.lang = state.locale === "fr-CA" ? "fr-CA" : (state.locale || "en");
  if (!state.authed) {
    app.innerHTML = `
      <div class="login-screen">
        <p class="eyebrow">${t("private")}</p>
        <h1>Flow</h1>
        <p class="mut login-sub">${t("loginSub")}</p>
        <form id="login-form" class="card login-card">
          ${state.locked ? `<div class="banner">${t("locked")}</div>` : ""}
          ${state.message ? `<div class="banner">${esc(state.message)}</div>` : ""}
          <label for="pw">${t("password")}</label>
          <input id="pw" name="password" type="password" autocomplete="current-password" required />
          <button class="btn primary" id="login" type="submit">${t("enter")}</button>
        </form>
        <div class="lang-switch" role="group" aria-label="${t("localeGroup")}" style="margin-top:16px">
          ${LOCALES.map((loc) =>
            `<button type="button" class="btn lang-btn ${state.locale===loc?"primary":""}" data-flow-locale="${loc}">${flowLocaleLabel(loc)}</button>`
          ).join("")}
        </div>
        <p class="mut" style="margin-top:16px"><a class="glow-link" href="/">${t("backGame")}</a></p>
      </div>`;
    document.getElementById("login-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      doLogin();
    });
    document.getElementById("pw")?.focus();
    app.querySelectorAll("[data-flow-locale]").forEach((b) =>
      b.addEventListener("click", () => setFlowLocale(b.dataset.flowLocale)),
    );
    return;
  }

  const pub = state.week?.publish;
  const sc = state.week?.studioCounts || {};
  const st = state.week?.statusCounts || {};
  const pack = state.week?.pack;

  app.innerHTML = `
    <div class="flow-head">
      <div>
        <p class="eyebrow">${t("private")}</p>
        <h1>Flow</h1>
        <p class="mut">${t("weekLine", { week: pack?.weekKey || "—", locale: flowLocaleLabel(state.locale) })}</p>
      </div>
      <div class="row">
        <div class="lang-switch" role="group" aria-label="${t("localeGroup")}">
          ${LOCALES.map((loc) =>
            `<button type="button" class="btn lang-btn ${state.locale===loc?"primary":""}" data-flow-locale="${loc}">${flowLocaleLabel(loc)}</button>`
          ).join("")}
        </div>
        <a class="btn" href="/">${t("play")}</a>
        <button class="btn" id="logout">${t("logout")}</button>
      </div>
    </div>
    ${state.message ? `<div class="banner ok-banner">${esc(state.message)}</div>` : ""}
    <nav class="tabs">
      ${[
        ["console", t("tab_console")],
        ["metrics", t("tab_metrics")],
        ["queue", t("tab_queue")],
        ["profiles", t("tab_profiles")],
        ["fan", t("tab_fan")],
        ["rooms", t("tab_rooms")],
        ["bank", t("tab_bank")],
        ["archive", t("tab_archive")],
        ["topic", t("tab_topic")],
        ["reject", t("tab_reject")],
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
      if (state.tab === "metrics") {
        Promise.all([loadQueue(false), loadFan(false)]).then(() => render()).catch((e) => {
          state.message = e.message || "Could not load metrics";
          render();
        });
        return;
      }
      if (state.tab === "queue" || state.tab === "console" || state.tab === "rooms" || state.tab === "reject") {
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
      if (state.tab === "fan" || state.tab === "metrics") {
        loadFan(true);
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
        <h2>${t("metrics")}</h2>
        <div class="row" style="margin:12px 0 16px">
          <div class="stat"><b>${sc.easy||0}</b><span>${t("tier_easy")}</span></div>
          <div class="stat"><b>${sc.hard||0}</b><span>${t("tier_hard")}</span></div>
          <div class="stat"><b>${sc.difficult||0}</b><span>${t("tier_difficult")}</span></div>
          <div class="stat"><b>${sc.finale||0}</b><span>${t("tier_finale")}</span></div>
        </div>
        <div class="row" style="margin-bottom:16px">
          <div class="stat"><b>${state.fan?.metrics?.mailingJoins || 0}</b><span>${t("metricJoins")}</span></div>
          <div class="stat"><b>${state.fan?.metrics?.musicOn || 0}</b><span>${t("metricMusic")}</span></div>
          <div class="stat"><b>${state.fan?.metrics?.openChat || 0}</b><span>${t("metricChat")}</span></div>
          <div class="stat"><b>${state.fan?.metrics?.gameRoom || 0}</b><span>${t("metricRoom")}</span></div>
          <div class="stat"><b>${state.fan?.metrics?.games || 0}</b><span>${t("metricGames")}</span></div>
        </div>
        <div class="row" style="margin-bottom:16px">
          <div class="stat"><b>${st.active||0}</b><span>${t("active")}</span></div>
          <div class="stat"><b>${st.pending||0}</b><span>${t("pending")}</span></div>
          <div class="stat"><b>${st.approved||0}</b><span>${t("approved")}</span></div>
          <div class="stat"><b>${st.rejected||0}</b><span>${t("rejected")}</span></div>
        </div>
        <p class="mut">${esc(pack?.inspirationSummary || "")}</p>
        <p class="mut" style="margin-top:8px">
          ${t("lastPublish")}: ${pub?.publishedAt ? esc(pub.publishedAt) : t("notYet")}
          · ${pub?.questionCount ?? "—"} ${t("questions")}
          ${pub?.counts ? `· ${esc(JSON.stringify(pub.counts))}` : ""}
          ${pub?.generations ? `· generations ${esc(JSON.stringify(pub.generations))}` : ""}
        </p>
        <div class="row" style="margin-top:16px">
          <button class="btn primary" id="publish">${t("publishWeek")}</button>
          <button class="btn" id="refresh">${t("refresh")}</button>
        </div>
        ${metricDonut()}
        <p class="mut" style="margin-top:12px">${t("durable")} <a class="glow-link" href="${GLOW_URL}" target="_blank" rel="noopener noreferrer">Glow</a></p>
      </div>`;
    document.getElementById("publish")?.addEventListener("click", doPublish);
    document.getElementById("refresh")?.addEventListener("click", () => loadWeek(true));
  } else if (state.tab === "profiles") {
    const rows = state.profiles || [];
    panel.innerHTML = `
      <div class="card">
        <div class="row spread">
          <h2>${t("activatedProfiles")}</h2>
          <div class="row">
            <button class="btn" id="refreshProfiles">Refresh</button>
            <button class="btn" id="downloadMail">${t("downloadMail")}</button>
            <button class="btn primary" id="copyList">${t("copyList")}</button>
          </div>
        </div>
        <p class="mut">${t("profilesNote")}</p>
        <p class="mut" style="margin-top:8px">${rows.length} active · ${rows.length} email${rows.length === 1 ? "" : "s"}</p>
        ${rows.length ? `
          <table class="plist">
            <thead><tr><th>${t("name")}</th><th>${t("email")}</th><th>${t("activated")}</th><th>${t("status")}</th></tr></thead>
            <tbody>
              ${rows.map((p) => `<tr>
                <td>${esc(p.displayName)}</td>
                <td>${esc(p.email)}</td>
                <td>${esc(p.activatedAt ? String(p.activatedAt).replace("T", " ").slice(0, 16) : "")}</td>
                <td>${t("active")}</td>
              </tr>`).join("")}
            </tbody>
          </table>` : `<p class="mut" style="margin-top:16px">${t("noProfiles")}</p>`}
      </div>`;
    document.getElementById("refreshProfiles")?.addEventListener("click", () => loadProfiles(true));
    document.getElementById("downloadMail")?.addEventListener("click", downloadMailingList);
    document.getElementById("copyList")?.addEventListener("click", pushMailingList);
  } else if (state.tab === "fan") {
    renderFan(panel);
  } else if (state.tab === "bank") {
    const tiers = ["all", "easy", "hard", "difficult", "finale"];
    const qs = (pack?.questions || []).filter(
      (q) => state.filterTier === "all" || q.tier === state.filterTier,
    );
    const comedy = state.week?.comedy;
    const louis = state.week?.louis;
    const comedyLines = (rows) => (rows || []).length
      ? rows.map((r) => `<li><b>${esc(r.rating)}</b> · ${esc(r.prompt)}</li>`).join("")
      : `<li class="mut">${t("noneWeek")}</li>`;
    const louisNotes = (louis?.shaped || [])
      .map((r) => (r.notes || []).find((n) => /kind line/i.test(n)))
      .filter(Boolean);
    panel.innerHTML = `
      ${louis ? `<div class="card" id="louis-liberty">
        <h2>${esc(louis.bot)}</h2>
        <p class="mut">${t("louisBlurb")}</p>
        <p class="mut">${t("louisCount", { shaped: (louis.shaped || []).length, held: (louis.held || []).length, mail: louis.mail || "" })}</p>
        ${(louis.held || []).length ? `<ul>${louis.held.map((r) => `<li>${esc(r.prompt)} · ${esc((r.reasons || []).join(", "))}</li>`).join("")}</ul>` : ""}
        ${louisNotes.length ? `<p class="mut">${louisNotes.length} still want a kind line so a miss stays light.</p>` : ""}
      </div>` : ""}
      ${comedy ? `<div class="card" id="comedy-bot">
        <h2>${esc(comedy.bot)}</h2>
        <p class="mut">${t("comedyBlurb", { week: comedy.week || "" })}</p>
        ${(comedy.blocked || []).length ? `<p class="mut">${esc(louis?.bot || "Louis Liberty")} held ${comedy.blocked.length}.</p>` : ""}
        <h3 class="tier-h">${t("viralWeek")}</h3>
        <ul>${comedyLines(comedy.viral)}</ul>
        <h3 class="tier-h">${t("highest")}</h3>
        <ul>${comedyLines(comedy.highestRated)}</ul>
      </div>` : ""}
      <div class="card">
        <div class="row spread">
          <h2>${t("bankReview")}</h2>
          ${readyBenchHTML()}
          <select id="tierFilter">${tiers.map((tier)=>`<option value="${tier}" ${state.filterTier===tier?"selected":""}>${t("tier_"+tier)}</option>`).join("")}</select>
        </div>
        <div class="q-list" style="margin-top:12px">
          ${qs.map((q) => `
            <div class="q-item ${esc(q.status||"active")}">
              <div class="q-meta">${esc(q.tier)} · ${esc(q.topic)} · ${esc(q.generation||"")} · <b>${esc(statusText(q.status||"active"))}</b> · ${esc(q.id)}</div>
              <div class="q-prompt">${esc(q.categoryTitle)} — ${esc(q.prompt)}</div>
              <div class="choices">${(q.choices||[]).map((c,i)=>`<div class="${i===q.correctIndex?"hit":""}">${String.fromCharCode(65+i)}. ${esc(c)}</div>`).join("")}</div>
              <div class="row" style="margin-top:10px">
                <button class="btn ok" data-approve="${esc(q.id)}">${t("approve")}</button>
                <button class="btn danger" data-reject="${esc(q.id)}">${t("reject")}</button>
                <button class="btn" data-pending="${esc(q.id)}">${t("pendingBtn")}</button>
              </div>
            </div>`).join("") || `<p class="mut">${t("noFilter")}</p>`}
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
    panel.querySelectorAll("[data-pending]").forEach((b) =>
      b.addEventListener("click", () => setStatus(b.dataset.pending, "pending")),
    );
  } else if (state.tab === "archive") {
    renderArchivePanel(panel);
  } else if (state.tab === "topic") {
    const topics = state.topics?.topics || [];
    panel.innerHTML = `
      <div class="card">
        <h2>${t("addTopic")}</h2>
        <p class="mut">${t("topicNote")}</p>
        <label>id</label><input id="tid" placeholder="e.g. sports-canada"/>
        <label>title</label><input id="ttitle" placeholder="Sports · Canada"/>
        <label>blurb</label><input id="tblurb" placeholder="Short blurb"/>
        <label class="row"><input id="teasy" type="checkbox" style="width:auto;margin-right:8px"/> ${t("easyOnly")}</label>
        <button class="btn primary" id="addTopic">${t("addTopic")}</button>
        <h3 class="tier-h">${t("topics")}</h3>
        <ul class="mut">${topics.map((topic)=>`<li><code>${esc(topic.id)}</code> — ${esc(topic.title)}${topic.easyOnly?" ("+t("easyOnly")+")":""}</li>`).join("")}</ul>
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
        <h2>${t("rejectLogTitle")}</h2>
        <p class="mut">${t("rejectLogNote")}</p>
        ${lessons ? "" : `<p class="mut">${t("loadingLog")}</p>`}
        <div class="row">
          <button class="btn" id="refreshRejectLog">${t("refreshLog")}</button>
          <button class="btn" id="downloadRejectLog">${t("downloadLog")}</button>
        </div>
      </div>
      <div class="card">
        <h2>${t("logTitle")}</h2>
        ${log.length ? `<div class="q-list">${log.map((r) => {
          const snap = r.snapshot || {};
          const needs = r.regeneratedQuestionId ? t("replacementOf", { id: r.regeneratedQuestionId }) : t("logged");
          return `
            <div class="q-item rejected">
              <div class="q-meta">${esc(r.bank || "")} · ${esc(snap.tier || "")} · ${esc(needs)} · ${esc(r.questionId)} · ${(r.reasonCodes || []).map(esc).join(", ")}</div>
              <div class="q-prompt">${esc(snap.categoryTitle || "")}${snap.categoryTitle ? " — " : ""}${esc(snap.prompt || r.note || "")}</div>
            </div>`;
        }).join("")}</div>` : `<p class="mut">${t("noRejected")}</p>`}
      </div>`;
    document.getElementById("refreshRejectLog")?.addEventListener("click", () => loadQueue(true));
    document.getElementById("downloadRejectLog")?.addEventListener("click", downloadRejectLog);
  }
}

function flowCounts() {
  const weekQs = state.week?.pack?.questions || [];
  const placeQs = state.queue.placement?.pack?.questions || [];
  const all = [...weekQs, ...placeQs];
  return {
    active: all.filter((q) => (q.status || "active") === "active").length,
    pending: all.filter((q) => q.status === "pending").length,
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
    ["queue", t("active"), c.active],
    ["queue", t("rejectedCard"), c.rejected],
    ["reject", t("regenCard"), c.regen],
    ["profiles", t("profilesCard"), c.profiles],
    ["rooms", t("roomsCard"), c.rooms],
  ];
  panel.innerHTML = `
    <section>
      <h2 class="eyebrow">${t("analytics")}</h2>
      <div class="metric-grid">
        ${cards.map(([tab, label, value], i) => `
          <button type="button" class="metric-card" data-goto="${tab}" data-goto-i="${i}">
            <span>${esc(label)}</span>
            <b>${value}</b>
          </button>`).join("")}
      </div>
      <p class="mut">${state.queue.loading ? t("refreshing") : t("countsNote")}</p>
    </section>
    <section class="card">
      <h2 class="eyebrow">${t("glowTitle")}</h2>
      <p class="mut">${t("glowNote")}</p>
      <p style="margin-top:12px"><a class="btn glow-link" href="${GLOW_URL}" target="_blank" rel="noopener noreferrer">${t("openGlow")}</a></p>
    </section>`;
  panel.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => gotoTab(b.dataset.goto)),
  );
}

function roomAdminLists(rooms) {
  const block = (screen) => {
    const want = screen === "tv" ? "tv" : "off";
    const rows = (rooms || []).filter((r) => (r.screen === "tv" ? "tv" : "off") === want);
    const title = want === "tv" ? t("onScreenRooms") : t("offScreenRooms");
    return `
      <h3 class="queue-sec">${title}</h3>
      ${rows.length ? rows.map((r) => `
        <div class="room-admin">
          <div>
            <b>${esc(r.name || r.code)}</b>
            <span class="mut"> · ${esc(r.code)}${r.host ? ` · ${esc(r.host)}` : ""} · ${r.guests || 0} · ${esc(r.phase || "lobby")}</span>
          </div>
          <button class="btn danger" type="button" data-delete-room="${esc(r.code)}">${t("delete")}</button>
        </div>`).join("") : `<p class="mut">${t("noRooms")}</p>`}`;
  };
  return `${block("off")}${block("tv")}`;
}

function renderRooms(panel) {
  const rooms = state.queue.rooms || [];
  panel.innerHTML = `
    <div class="card">
      <div class="row spread">
        <h2>${t("openRooms")}</h2>
        <button class="btn" id="refreshRooms">${t("refreshRooms")}</button>
      </div>
      <p class="mut">${t("roomsNote")}</p>
      ${roomAdminLists(rooms)}
    </div>`;
  document.getElementById("refreshRooms")?.addEventListener("click", () => loadQueue(true));
  panel.querySelectorAll("[data-delete-room]").forEach((b) =>
    b.addEventListener("click", () => deleteFlowRoom(b.dataset.deleteRoom)),
  );
}

function metricDonut() {
  const c = flowCounts();
  const slices = [
    { label: t("active"), value: c.active, color: "#f5d76e" },
    { label: t("pending"), value: c.pending, color: "#e8a87c" },
    { label: t("approved"), value: c.approved, color: "#7dd3fc" },
    { label: t("rejected"), value: c.rejected, color: "#f87171" },
    { label: t("regenCard"), value: c.regen, color: "#a78bfa" },
    { label: t("profilesCard"), value: c.profiles, color: "#34d399" },
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
  const status = q.status || "active";
  return `
    <div class="q-item ${esc(status)}">
      <div class="q-meta">${esc(bank)} · ${esc(q.tier || "")} · ${esc(q.topic || "")} · <b>${esc(statusText(status))}</b> · ${esc(q.id)}</div>
      <div class="q-prompt">${esc(q.categoryTitle || "")}${q.categoryTitle ? " — " : ""}${esc(q.prompt || "")}</div>
    </div>`;
}

function renderQueue(panel) {
  if (state.queue.loading && !state.week && !state.queue.placement) {
    panel.innerHTML = `<div class="card"><p class="mut">${t("loadingQueue")}</p></div>`;
    return;
  }

  const weekQs = state.week?.pack?.questions || [];
  const placeQs = state.queue.placement?.pack?.questions || [];
  const activeQs = [
    ...weekQs.filter((q) => (q.status || "active") === "active").map((q) => ({ ...q, bank: "Weekly" })),
    ...placeQs.filter((q) => (q.status || "active") === "active").map((q) => ({ ...q, bank: "Placement" })),
  ];
  const pending = [
    ...weekQs.filter((q) => q.status === "pending").map((q) => ({ ...q, bank: "Weekly" })),
    ...placeQs.filter((q) => q.status === "pending").map((q) => ({ ...q, bank: "Placement" })),
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
        <h2>${t("reviewQueue")}</h2>
        <button class="btn" id="refreshQueue">${t("refresh")}</button>
      </div>
      <p class="mut">${t("queueNote", { locale: flowLocaleLabel(state.locale) })}</p>
      <h3 class="queue-sec">${t("active")} <span class="mut">(${activeQs.length})</span></h3>
      <p class="mut">${t("activeNote")}</p>
      ${state.week || state.queue.placement
        ? list(activeQs, t("waitingNone"))
        : `<p class="mut">${t("banksMissing")}</p>`}
      ${pending.length ? `<h3 class="queue-sec">${t("awaiting")} <span class="mut">(${pending.length})</span></h3>${list(pending, t("waitingNone"))}` : ""}
      <h3 class="queue-sec">${t("rejection")} <span class="mut">(${rejected.length})</span></h3>
      ${list(rejected, t("noRejectedQs"))}
      <h3 class="queue-sec">${t("regenCard")} <span class="mut">(${regen.length})</span></h3>
      ${regen.length ? `<div class="q-list cap">${regen.map((r) => {
        const snap = r.snapshot || {};
        const needs = r.regeneratedQuestionId ? t("replacementOf", { id: r.regeneratedQuestionId }) : t("inLog");
        return `
          <div class="q-item rejected">
            <div class="q-meta">${esc(r.bank)} · ${esc(snap.tier || "")} · ${esc(needs)} · ${esc(r.questionId)} · ${(r.reasonCodes || []).map(esc).join(", ")}</div>
            <div class="q-prompt">${esc(snap.categoryTitle || "")}${snap.categoryTitle ? " — " : ""}${esc(snap.prompt || r.note || "")}</div>
          </div>`;
      }).join("")}</div>` : `<p class="mut">${t("noneLogged")}</p>`}
    </div>
    <div class="card">
      <div class="row spread">
        <h2>${t("profiles")}</h2>
        <button class="btn" id="downloadMail">${t("downloadMail")}</button>
        <button class="btn primary" id="copyList">${t("copyList")}</button>
      </div>
      <p class="mut">${profiles.length === 1 ? t("mailOne", { n: profiles.length }) : t("mailLine", { n: profiles.length })}</p>
      ${profiles.length ? `
        <table class="plist">
          <thead><tr><th>${t("name")}</th><th>${t("email")}</th><th>${t("activated")}</th><th>${t("status")}</th></tr></thead>
          <tbody>
            ${profiles.map((p) => `<tr>
              <td>${esc(p.displayName)}</td>
              <td>${esc(p.email)}</td>
              <td>${esc(p.activatedAt ? String(p.activatedAt).replace("T", " ").slice(0, 16) : "")}</td>
              <td>${t("active")}</td>
            </tr>`).join("")}
          </tbody>
        </table>` : `<p class="mut" style="margin-top:12px">${t("noProfiles")}</p>`}
    </div>
    <div class="card">
      <div class="row spread">
        <h2>${t("openRooms")}</h2>
        <button class="btn" id="refreshRooms">${t("refreshRooms")}</button>
      </div>
      <p class="mut">${t("roomsNote")}</p>
      ${roomAdminLists(rooms)}
    </div>`;

  document.getElementById("refreshQueue")?.addEventListener("click", () => loadQueue(true));
  document.getElementById("refreshRooms")?.addEventListener("click", () => loadQueue(true));
  document.getElementById("downloadMail")?.addEventListener("click", downloadMailingList);
  document.getElementById("copyList")?.addEventListener("click", pushMailingList);
  panel.querySelectorAll("[data-delete-room]").forEach((b) =>
    b.addEventListener("click", () => deleteFlowRoom(b.dataset.deleteRoom)),
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
    panel.innerHTML = `<div class="card"><p class="mut">${t("loadingArchive")}</p></div>`;
    return;
  }

  // Placement archive page (reject / regen enabled)
  if (a.kind === "placement" && a.pack) {
    const tiers = ["all", "easy", "hard", "difficult", "extreme"];
    const qs = filteredArchiveQuestions(a);
    const sc = a.studioCounts || {};
    panel.innerHTML = `
      <div class="card">
        <div class="row spread">
          <div>
            <button class="btn" id="archBackPlacement">${t("backArchives")}</button>
            <h2 style="margin-top:12px">${t("placementTitle")}</h2>
            <p class="mut">${esc(a.pack.title || a.pack.id || "")}</p>
            <p class="mut" style="margin-top:6px">${t("countsLine", { counts: fmtCounts(sc), n: (a.pack.questions || []).length })}</p>
            ${readyBenchHTML()}
          </div>
        </div>
        ${archiveFiltersHTML(a, tiers)}
        <div class="q-list" style="margin-top:12px">
          ${qs.map((q) => archiveQItem(q)).join("") || `<p class="mut">${t("noFilter")}</p>`}
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
      a.filterLeak = false;
      render();
    });
    bindArchiveFilters(a);
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
    const qs = filteredArchiveQuestions(a);
    const sc = a.studioCounts || {};
    panel.innerHTML = `
      <div class="card">
        <div class="row spread">
          <div>
            <button class="btn" id="archBackWeek">← ${esc(a.monthKey)}</button>
            <h2 style="margin-top:12px">${esc(a.weekKey)}</h2>
            <p class="mut">${esc(a.pack.inspirationSummary || "")}</p>
            <p class="mut" style="margin-top:6px">${t("countsLine", { counts: fmtCounts(sc), n: (a.pack.questions || []).length })}</p>
            <p class="mut">${esc(weekProgress(a.pack))}. ${t("activeNote")}</p>
            ${readyBenchHTML()}
          </div>
        </div>
        ${archiveFiltersHTML(a, tiers)}
        <div class="q-list" style="margin-top:12px">
          ${qs.map((q) => archiveQItem(q)).join("") || `<p class="mut">${t("noFilter")}</p>`}
        </div>
      </div>`;
    document.getElementById("archBackWeek")?.addEventListener("click", () => {
      a.pack = null;
      a.weekKey = null;
      a.studioCounts = null;
      a.filterTier = "all";
      a.filterTopic = "";
      a.filterLeak = false;
      render();
    });
    bindArchiveFilters(a);
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
            <button class="btn" id="archBackMonths">${t("backMonths")}</button>
            <h2 style="margin-top:12px">${esc(a.monthKey)}</h2>
            <p class="mut">${weeks.length} ${weeks.length===1?t("weekOne"):t("weekMany")} · ${t("updated")} ${esc(a.index.updatedAt || "—")}</p>
          </div>
        </div>
        <div class="arch-list" style="margin-top:14px">
          ${weeks.map((w) => `
            <button class="arch-row" data-week="${esc(w.weekKey)}">
              <div class="row spread">
                <div>
                  <b>${esc(w.weekKey)}</b>
                  <div class="mut">${w.questionCount ?? "—"} ${t("questions")} · ${esc(weekProgress(w))} · ${esc(fmtCounts(w.studioCounts || w.counts))}</div>
                </div>
                <span class="mut">${esc((w.publishedAt || "").slice(0, 10) || "")}</span>
              </div>
            </button>`).join("") || `<p class="mut">${t("noWeeks")}</p>`}
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
      <h2>${t("placementTitle")}</h2>
      <p class="mut">${t("placementNote")}</p>
      <div class="arch-list" style="margin-top:14px">
        ${placementPages.map((p) => `
          <button class="arch-row" data-placement="${esc(p.id)}">
            <div class="row spread">
              <div>
                <b>${esc(p.title || p.id)}</b>
                <div class="mut">${p.questionCount || 0} ${t("questions")}</div>
              </div>
              <span class="mut">${t("placementTag")}</span>
            </div>
          </button>`).join("") || `<p class="mut">${t("noPlacement")}</p>`}
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>${t("setsTitle")}</h2>
      <p class="mut">${t("setsNote")}</p>
      <div class="arch-list" style="margin-top:14px">
        ${(a.sets || []).map((s) => `
          <div class="arch-row">
            <div class="row spread">
              <div>
                <b>${esc(s.id)}</b>
                <div class="mut">${esc(s.folder)} · ${s.questions || 0} ${t("questions")}</div>
                <div class="mut">${s.archived ? t("setArchived") : t("setRunning", { until: (s.playUntil || "").slice(0, 10) })}</div>
              </div>
              <span>
                ${s.archived ? `<button class="btn" type="button" data-set-zip="${esc(s.id)}">${t("downloadSet")}</button>
                <a class="btn primary" href="/?replay=${encodeURIComponent(s.id)}">${t("replaySet")}</a>` : ""}
              </span>
            </div>
          </div>`).join("") || `<p class="mut">${t("setsEmpty")}</p>`}
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>${t("monthlyTitle")}</h2>
      <p class="mut">${t("monthlyNote")}</p>
      <div class="arch-list" style="margin-top:14px">
        ${months.map((m) => `
          <button class="arch-row" data-month="${esc(m.monthKey)}">
            <div class="row spread">
              <div>
                <b>${esc(m.monthKey)}</b>
                <div class="mut">${m.weekCount || 0} ${m.weekCount===1?t("weekOne"):t("weekMany")} · ${m.questionCount || 0} ${t("questions")}</div>
              </div>
              <span class="mut">${esc((m.updatedAt || "").slice(0, 10) || "")}</span>
            </div>
          </button>`).join("") || `<p class="mut">${t("emptyArchive")}</p>`}
      </div>
    </div>`;
  panel.querySelectorAll("[data-month]").forEach((b) =>
    b.addEventListener("click", () => openArchiveMonth(b.dataset.month)),
  );
  panel.querySelectorAll("[data-set-zip]").forEach((b) =>
    b.addEventListener("click", () => downloadSetZip(b.dataset.setZip)),
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
    try {
      const sets = await api("sets");
      state.archive.sets = sets.sets || [];
    } catch {
      state.archive.sets = [];
    }
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
    state.archive.filterLeak = false;
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
    filterLeak: false,
    loading: false,
  };
  render();
}

async function setFlowLocale(next) {
  const loc = LOCALES.includes(next) ? next : "en";
  state.locale = loc;
  try { localStorage.setItem(LOCALE_KEY, loc); } catch { /* ignore */ }
  state.message = t("localeSet", { locale: flowLocaleLabel(loc) });
  if (!state.authed) {
    render();
    return;
  }
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
    state.message = t("topicAdded");
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
  const sel = `[data-arch-replace="${safe}"]`;
  document.querySelectorAll(sel).forEach((b) => b.closest(".q-item")?.classList.add("replacing"));
}

async function archiveRejectOrRegen(id, regen, bankHint, onHandId) {
  const a = state.archive;
  const fromArchive = state.tab === "archive";
  const placement = (fromArchive && a.kind === "placement")
    || bankHint === "placement";
  const body = {
    action: regen ? "regenerate" : "reject",
    questionId: id,
    locale: state.locale,
    reasonCodes: regen ? ["archive-replace"] : ["archive-reject"],
    note: regen ? "Replaced from the archive" : "Rejected from Flow",
  };
  if (placement) body.bank = "placement";
  if (regen) body.onHandId = onHandId || state.rejectReady?.onHand?.id || undefined;
  if (fromArchive && a.monthKey && a.monthKey !== "placement") {
    body.monthKey = a.monthKey;
    body.weekKey = a.weekKey || null;
  }
  if (regen) markReplacing(id);
  try {
    const endpoint = placement ? "placement" : "reject";
    const data = await api(endpoint, { method: "POST", body: JSON.stringify(body) });
    if (data.ready) state.rejectReady = data.ready;
    if (regen && data.regenerated) replaceQuestionOnCard(id, data.regenerated);
    state.message = regen
      ? t("replacedLogged", { id })
      : `${t("reject")} ${id}`;
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
    state.message = t("downloadedLog");
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
    state.archive.filterLeak = false;
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
    state.message = t("deletedRoom", { code });
  } catch (e) {
    state.message = e.message || "Could not delete room";
  }
  render();
}

async function loadFan(rerender) {
  const data = await api("fan-mail");
  state.fan = data;
  if (rerender) render();
}

function renderFan(panel) {
  const letter = state.fan?.letter || { subject: "", body: "", attachment: null };
  const sends = state.fan?.sends || [];
  const song = letter.attachment
    ? `<p class="mut">${esc(letter.attachment.name)} · ${esc(letter.attachment.href || "")}</p>`
    : "";
  panel.innerHTML = `
    <div class="card">
      <h2>${t("fanTitle")}</h2>
      <p class="mut">${t("fanLead")} ${esc(letter.from || "gmgbrandlabel@gmail.com")}</p>
      <label class="field">${t("fanSubject")}</label>
      <input id="fanSubject" maxlength="120" value="${esc(letter.subject || "")}"/>
      <label class="field">${t("fanBody")}</label>
      <textarea id="fanBody" class="letter-box" maxlength="4000">${esc(letter.body || "")}</textarea>
      ${song}
      <label class="field">${t("fanSong")}</label>
      <input id="fanSong" type="file" accept="audio/*"/>
      <input id="fanSongUrl" type="url" placeholder="https://"/>
      <p class="mut">${t("fanSongNote")}</p>
      <label class="topic-row"><input id="fanClear" type="checkbox"/> ${t("fanClear")}</label>
      <div class="row" style="margin-top:12px">
        <button class="btn primary" id="fanSave" type="button">${t("fanSave")}</button>
      </div>
    </div>
    <div class="card">
      <h2>${t("fanSends")}</h2>
      ${sends.length ? `<table class="plist"><thead><tr><th>${t("name")}</th><th>${t("email")}</th><th>${t("activated")}</th></tr></thead><tbody>
        ${sends.map((row) => `<tr><td>${esc(row.name)}</td><td>${esc(row.email)}</td><td>${esc(String(row.at || "").replace("T", " ").slice(0, 16))}${row.mailed ? " · sent" : ""}</td></tr>`).join("")}
      </tbody></table>` : `<p class="mut">${t("fanNone")}</p>`}
    </div>`;
  document.getElementById("fanSave")?.addEventListener("click", saveFan);
}

async function saveFan() {
  const subject = document.getElementById("fanSubject")?.value || "";
  const body = document.getElementById("fanBody")?.value || "";
  const url = document.getElementById("fanSongUrl")?.value || "";
  const clearSong = Boolean(document.getElementById("fanClear")?.checked);
  const file = document.getElementById("fanSong")?.files?.[0];
  const payload = { subject, body, attachmentUrl: url, clearSong };
  if (file) {
    if (file.size > 140000) {
      state.message = t("fanSongNote");
      render();
      return;
    }
    const data = await file.arrayBuffer();
    const bytes = new Uint8Array(data);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    payload.songBase64 = btoa(binary);
    payload.songType = file.type || "audio/mpeg";
    payload.attachmentName = file.name || "song";
  }
  try {
    state.fan = await api("fan-mail", { method: "POST", body: JSON.stringify(payload) });
    state.message = t("fanSaved");
  } catch (e) {
    state.message = e.message || "Could not save the letter";
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

async function downloadSetZip(id) {
  state.message = "";
  try {
    const res = await fetch(`/api/flow/sets?download=${encodeURIComponent(id)}`, { credentials: "same-origin" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Could not download that set");
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${id}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
    state.message = t("setDownloaded", { id });
  } catch (e) {
    state.message = e.message || "Could not download that set";
  }
  render();
}

async function pushMailingList() {
  try {
    const res = await fetch("/api/flow/profiles", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "push-list" }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.reason === "secret") {
      state.message = t("listSecret");
    } else if (!res.ok) {
      throw new Error(data.reason || "Could not copy the mailing list");
    } else {
      state.message = t("listCopied", { added: data.added ?? 0 });
    }
  } catch (e) {
    state.message = e.message;
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
    state.message = t("mailDownloaded");
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
