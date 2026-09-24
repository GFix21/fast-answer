/**
 * What a phone is allowed to see of a live room.
 * The TV keeps the full deck. The wire gets the current prompt and choices,
 * and the correct choice only when that question is on the reveal.
 */

function asIndex(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function redactQuestion(q, { visible = false, reveal = false } = {}) {
  if (!q || typeof q !== "object") return null;
  const id = String(q.id || "");
  const tier = String(q.tier || "");
  if (!visible) return { id, tier };
  const out = {
    id,
    tier,
    topic: String(q.topic || ""),
    generation: String(q.generation || ""),
    fromPlayer: String(q.fromPlayer || ""),
    fromGeneration: String(q.fromGeneration || ""),
    categoryTitle: String(q.categoryTitle || ""),
    prompt: String(q.prompt || ""),
    choices: Array.isArray(q.choices) ? q.choices.slice(0, 4).map((c) => String(c)) : [],
    slang: String(q.slang || ""),
  };
  const correctIndex = Number(q.correctIndex);
  if (reveal && Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex < out.choices.length) {
    out.correctIndex = correctIndex;
  }
  return out;
}

export function redactState(state) {
  const src = state && typeof state === "object" ? state : {};
  const phase = String(src.phase || "");
  const i = asIndex(src.i);
  const mainHidden = phase === "setbreak" || phase === "lobby" || phase === "ready" || phase === "end" || phase === "lockdown" || phase === "between" || !phase;
  const revealMain = phase === "reveal";
  const qs = Array.isArray(src.qs)
    ? src.qs.map((q, index) => redactQuestion(q, {
      visible: !mainHidden && index === i,
      reveal: revealMain && index === i,
    }))
    : [];
  let lockdown = null;
  if (src.lockdown && typeof src.lockdown === "object") {
    const ld = src.lockdown;
    const qi = asIndex(ld.qi);
    const show = ld.phase === "play" || ld.phase === "flash" || ld.phase === "result";
    const reveal = ld.phase === "flash" || ld.phase === "result";
    lockdown = {
      phase: ld.phase || "",
      playerId: ld.playerId || "",
      name: ld.name || "",
      qi,
      hits: ld.hits || 0,
      earned: ld.earned || 0,
      picked: Number.isInteger(ld.picked) ? ld.picked : -1,
      wagerLeft: ld.wagerLeft,
      introLeft: ld.introLeft,
      qLeft: ld.qLeft,
      waitLeft: ld.waitLeft,
      won: Boolean(ld.won),
      wagers: ld.wagers && typeof ld.wagers === "object" ? ld.wagers : {},
      qs: Array.isArray(ld.qs)
        ? ld.qs.map((q, index) => redactQuestion(q, {
          visible: show && index === qi,
          reveal: reveal && index === qi,
        }))
        : [],
    };
  }
  return {
    phase,
    i,
    pose: src.pose || "",
    buzzed: Boolean(src.buzzed),
    buzzBy: src.buzzBy || "",
    buzzId: src.buzzId || "",
    picked: Number.isInteger(src.picked) ? src.picked : -1,
    readLeft: src.readLeft,
    studioI: src.studioI,
    hostH: src.hostH,
    room: src.room || "",
    qs,
    q: qs[i] || null,
    players: Array.isArray(src.players) ? src.players : [],
    maps: src.maps && typeof src.maps === "object" ? src.maps : {},
    mapUses: src.mapUses && typeof src.mapUses === "object" ? src.mapUses : {},
    mapLive: Boolean(src.mapLive),
    setBreakLeft: src.setBreakLeft || 0,
    setBreakTier: src.setBreakTier || "",
    lockdown,
    lockdownAt: [],
    playerCount: src.playerCount,
    readyIds: src.readyIds && typeof src.readyIds === "object" ? src.readyIds : {},
    guests: Array.isArray(src.guests) ? src.guests : [],
    dropoutIds: src.dropoutIds && typeof src.dropoutIds === "object" ? src.dropoutIds : {},
    pendingJoins: Array.isArray(src.pendingJoins) ? src.pendingJoins : [],
    kickedId: src.kickedId || "",
    kickedAt: src.kickedAt || 0,
    lastAnswer: src.lastAnswer || null,
    lastWager: src.lastWager || null,
  };
}

/** Room list and phone polls never receive the host key or upcoming answers. */
export function publicRoom(room, { host = false } = {}) {
  if (!room || !room.code) return { error: "missing" };
  const out = {
    code: room.code,
    host: room.host || "",
    name: String(room.name || "").slice(0, 32),
    joinWait: Math.min(45, Math.max(5, Number(room.joinWait) || 15)),
    ageFrom: Number.isFinite(Number(room.ageFrom)) ? Number(room.ageFrom) : 13,
    ageTo: Number.isFinite(Number(room.ageTo)) ? Number(room.ageTo) : 99,
    screen: room.screen === "tv" ? "tv" : "off",
    guests: room.guests || [],
    state: redactState(room.state || {}),
    buzzes: Array.isArray(room.buzzes) ? room.buzzes.slice(-20) : [],
    dropoutIds: room.dropoutIds || {},
    notice: room.notice || null,
    createdAt: room.createdAt || 0,
    updatedAt: room.updatedAt || 0,
  };
  if (host && Array.isArray(room.refreshQs)) out.refreshQs = room.refreshQs;
  return out;
}
