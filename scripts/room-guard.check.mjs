#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fa-guard-"));
process.env.FA_ROOMS_DIR = path.join(dir, "rooms");
process.env.FA_ROOMS_TMP = path.join(dir, "rooms-tmp");
process.env.FA_PROFILES_PATH = path.join(dir, "profiles.json");
process.env.FA_PROFILES_TMP = path.join(dir, "profiles-tmp.json");
process.env.FA_SCORE_DIR = path.join(dir, "scores");
process.env.FA_SCORE_TMP = path.join(dir, "scores-tmp");
delete process.env.VERCEL;
delete process.env.FAST_ANSWER_REDIS_KV_REST_API_URL;
delete process.env.FAST_ANSWER_REDIS_KV_REST_API_TOKEN;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;

const { default: profiles } = await import("../api/profiles.js");
const { default: rooms } = await import("../api/rooms.js");
const { resetRoomsForTests } = await import("../lib/room-store.js");

function call(handler, method, { query = {}, body = {}, headers = {} } = {}) {
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
    headers: res.headers,
  }));
}

resetRoomsForTests();
const hostKey = "h".repeat(32);
const other = "s".repeat(32);
const created = await call(rooms, "POST", {
  body: { action: "create", code: "ROOM", host: "TV", hostKey, name: "Den" },
  headers: { "x-fa-host": hostKey },
});
assert.equal(created.status, 200);
assert.equal(created.json.name, "Den");

const spoof = await call(rooms, "POST", {
  body: { action: "create", code: "ROOM", host: "TV", hostKey: other, name: "Hijack" },
  headers: { "x-fa-host": other },
});
assert.equal(spoof.status, 403);
assert.equal(spoof.json.error, "host");
const peek = await call(rooms, "GET", { query: { code: "ROOM" } });
assert.equal(peek.status, 200);
assert.equal(peek.json.name, "Den");

const evil = await call(rooms, "OPTIONS", { headers: { origin: "https://evil.example" } });
assert.equal(evil.status, 204);
assert.equal(evil.headers["access-control-allow-origin"], undefined);
assert.notEqual(evil.headers["access-control-allow-origin"], "*");
const home = await call(rooms, "GET", {
  query: { code: "ROOM" },
  headers: { origin: "https://fast-answer-seven.vercel.app" },
});
assert.equal(home.headers["access-control-allow-origin"], "https://fast-answer-seven.vercel.app");

const parent = await call(profiles, "POST", {
  body: { action: "register", displayName: "Ada", email: "ada-room@example.com", password: "secret", age: 30, country: "US" },
  headers: { "x-vercel-ip-country": "US" },
});
assert.equal(parent.status, 200);
const joined = await call(rooms, "POST", {
  body: { action: "join", code: "ROOM", name: "Ada", seat: "play", age: 12, id: "spoof-id" },
  headers: { "x-fa-profile": parent.json.token, "x-vercel-ip-country": "US" },
});
assert.equal(joined.status, 200);
assert.ok(joined.json.guestKey && joined.json.guestKey.length >= 32);
assert.equal(joined.json.guests.every((g) => !Object.hasOwn(g, "guestKey") && !Object.hasOwn(g, "profileId")), true);
const me = joined.json.guests.find((g) => g.name === "Ada");
assert.ok(me && me.id);

const bare = await call(rooms, "POST", {
  body: { action: "buzz", code: "ROOM", name: "Ada", id: "spoof-id" },
});
assert.equal(bare.status, 403);

const buzzed = await call(rooms, "POST", {
  body: { action: "buzz", code: "ROOM", name: "Not Ada", id: "someone-else" },
  headers: { "x-fa-guest": joined.json.guestKey },
});
assert.equal(buzzed.status, 200);
assert.equal(buzzed.json.state.buzzId, me.id);
assert.equal(buzzed.json.state.buzzBy, "Ada");
assert.equal(buzzed.json.guestKey, undefined);

const viewing = await call(rooms, "POST", {
  body: { action: "join", code: "ROOM", name: "Watcher", seat: "view" },
});
assert.equal(viewing.status, 200);
assert.ok(viewing.json.guestKey);
const viewBuzz = await call(rooms, "POST", {
  body: { action: "buzz", code: "ROOM", name: "Watcher", id: "someone-else" },
  headers: { "x-fa-guest": viewing.json.guestKey },
});
assert.equal(viewBuzz.status, 403);

process.env.VERCEL = "1";
const down = await call(rooms, "POST", {
  body: { action: "create", code: "DOWN1", host: "TV", hostKey, name: "Off" },
  headers: { "x-fa-host": hostKey },
});
assert.equal(down.status, 503);
assert.equal(down.json.error, "store");

console.log("room guard ok");
