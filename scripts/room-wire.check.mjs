#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fa-rooms-"));
process.env.FA_ROOMS_DIR = dir;
process.env.FA_ROOMS_TMP = `${dir}-tmp`;
process.env.FLOW_PASSWORD = "room-wire-test-secret";

const { redactState } = await import("../lib/room-wire.js");
const { hashProfilePassword } = await import("../lib/password.js");
const { getFlowPassword } = await import("../lib/flow-auth.js");
const { t } = await import("../i18n.js");
const { dealRamp, SHOW_DEAL } = await import("../lib/generation-deal.js");
const { orderShowSets } = await import("../lib/show-pace.js");
const { default: handler } = await import("../api/rooms.js");
const { resetRoomsForTests } = await import("../lib/room-store.js");

assert.equal(t("fr", "tierHard"), "Dur");
assert.equal(t("fr-CA", "tierHard"), "Dur");
assert.notEqual(t("fr", "tierHard"), t("fr", "tierDifficult"));
assert.equal(t("de", "win"), "Gewinn");
for (const key of ["dirTvLead", "dirTvAir", "dirRoomSeats", "dirRoomModes"]) {
  assert.notEqual(t("fr", key), t("en", key));
  assert.equal(t("fr-CA", key), t("fr", key));
  assert.notEqual(t("de", key), t("en", key));
}
assert.match(t("fr", "dirTvLead"), /page web/);
assert.match(t("de", "dirTvLead"), /Webseite/);
assert.match(t("de", "dirScreenTitle"), /Bildschirm/);
assert.doesNotMatch(t("de", "onScreen"), /On Screen/);
assert.doesNotMatch(t("de", "offScreen"), /Off Screen/);

assert.notEqual(hashProfilePassword("same", "salt-a"), hashProfilePassword("same", "salt-b"));
assert.equal(hashProfilePassword("legacy"), hashProfilePassword("legacy"));
assert.notEqual(hashProfilePassword("legacy"), hashProfilePassword("legacy", "salt-a"));

const deck = [
  { id: "a", tier: "easy", prompt: "past?", choices: ["a", "b", "c", "d"], correctIndex: 0 },
  { id: "b", tier: "hard", prompt: "now?", choices: ["a", "b", "c", "d"], correctIndex: 2 },
  { id: "c", tier: "hard", prompt: "later?", choices: ["a", "b", "c", "d"], correctIndex: 1 },
];
const hidden = redactState({ phase: "read", i: 1, qs: deck, lockdownAt: [8, 36] });
assert.deepEqual(hidden.lockdownAt, []);
assert.equal(hidden.qs[0].prompt, undefined);
assert.equal(hidden.qs[1].prompt, "now?");
assert.equal(hidden.qs[1].correctIndex, undefined);
assert.equal(hidden.qs[2].prompt, undefined);
const shown = redactState({ phase: "reveal", i: 1, qs: deck });
assert.equal(shown.qs[1].correctIndex, 2);
const breaking = redactState({ phase: "setbreak", i: 1, qs: deck });
assert.equal(breaking.qs[1].prompt, undefined);

const weekly = JSON.parse(fs.readFileSync(new URL("../questions.json", import.meta.url), "utf8"));
const ramp = orderShowSets(dealRamp(weekly, { seats: ["gen-x", "gen-z"] }));
const counts = {};
for (const q of ramp) counts[q.tier] = (counts[q.tier] || 0) + 1;
assert.deepEqual(counts, SHOW_DEAL);
const order = [];
for (const q of ramp) if (order.at(-1) !== q.tier) order.push(q.tier);
assert.deepEqual(order, ["easy", "hard", "difficult", "extreme"]);

function call(method, { query = {}, body = {}, headers = {} } = {}) {
  const res = {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(n) { this.statusCode = n; return this; },
    end(s) { this.body = s == null ? "" : String(s); return this; },
  };
  const req = { method, query, body, headers };
  return handler(req, res).then(() => ({
    status: res.statusCode,
    json: res.body ? JSON.parse(res.body) : null,
  }));
}

resetRoomsForTests();
const key = "a".repeat(32);
const created = await call("POST", {
  body: { action: "create", code: "ROOM1", host: "TV", hostKey: key },
  headers: { "x-fa-host": key },
});
assert.equal(created.status, 200);
assert.equal(created.json.code, "ROOM1");
assert.equal(Object.hasOwn(created.json, "hostKey"), false);

const denied = await call("POST", {
  body: {
    action: "state",
    code: "ROOM1",
    state: { phase: "read", i: 0, qs: deck },
  },
});
assert.equal(denied.status, 403);

const posted = await call("POST", {
  body: {
    action: "state",
    code: "ROOM1",
    hostKey: key,
    state: { phase: "read", i: 1, qs: deck, lockdownAt: [8, 36] },
  },
  headers: { "x-fa-host": key },
});
assert.equal(posted.status, 200);
assert.equal(posted.json.state.qs[1].prompt, "now?");
assert.equal(posted.json.state.qs[1].correctIndex, undefined);
assert.equal(posted.json.state.qs[2].prompt, undefined);
assert.deepEqual(posted.json.state.lockdownAt, []);
assert.equal(Object.hasOwn(posted.json, "hostKey"), false);

const listed = await call("GET", { query: { list: "1" } });
assert.equal(listed.status, 401);

const peeked = await call("GET", { query: { code: "ROOM1" } });
assert.equal(peeked.json.state.qs[1].correctIndex, undefined);
assert.equal(Object.hasOwn(peeked.json, "refreshQs"), false);

delete process.env.FLOW_PASSWORD;
assert.equal(getFlowPassword(), "");
const closed = await call("GET", { query: { list: "1" } });
assert.equal(closed.status, 503);

console.log("room wire ok");
