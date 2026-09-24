#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fa-parent-"));
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
  }));
}

const young = await call(profiles, "POST", {
  body: { action: "register", displayName: "Kid", email: "kid@example.com", password: "secret", age: 10, country: "US" },
  headers: { "x-vercel-ip-country": "US" },
});
assert.equal(young.status, 403);
assert.equal(young.json.parent, true);
assert.equal(young.json.profile, undefined);

const teen = await call(profiles, "POST", {
  body: { action: "register", displayName: "Teen", email: "teen@example.com", password: "secret", age: 16, country: "US" },
  headers: { "x-vercel-ip-country": "US" },
});
assert.equal(teen.status, 200);
const teenChild = await call(profiles, "POST", {
  body: { action: "child", displayName: "Small", loginName: "small", age: 10, country: "US", password: "secret" },
  headers: { "x-fa-profile": teen.json.token },
});
assert.equal(teenChild.status, 403);
assert.equal(teenChild.json.error, "parent");

const parent = await call(profiles, "POST", {
  body: { action: "register", displayName: "Ada", email: "ada@example.com", password: "secret", age: 30, country: "CA" },
  headers: { "x-vercel-ip-country": "CA" },
});
assert.equal(parent.status, 200);
const made = await call(profiles, "POST", {
  body: { action: "child", displayName: "Lou", loginName: "lou10", age: 10, country: "CA", password: "play" },
  headers: { "x-fa-profile": parent.json.token, "x-vercel-ip-country": "CA" },
});
assert.equal(made.status, 200);
assert.equal(made.json.profile.role, "child");
assert.equal(made.json.profile.email, "");
assert.equal(made.json.profile.consent, true);
assert.equal(made.json.profile.passwordHash, undefined);
assert.equal(made.json.profile.age, 10);

const tooSmall = await call(profiles, "POST", {
  body: { action: "child", displayName: "Tiny", loginName: "tiny", age: 9, country: "CA", password: "play" },
  headers: { "x-fa-profile": parent.json.token, "x-vercel-ip-country": "CA" },
});
assert.equal(tooSmall.status, 403);

const child = await call(profiles, "POST", {
  body: { action: "login", loginName: "Lou 10", password: "play" },
});
assert.equal(child.status, 200);
assert.equal(child.json.profile.loginName, "lou10");

const hostKey = "abcdef0123456789abcdef0123456789";
const older = await call(rooms, "POST", {
  body: { action: "create", code: "OLDER1", host: "TV", hostKey, ageFrom: 13, ageTo: 99 },
  headers: { "x-fa-host": hostKey },
});
assert.equal(older.status, 200);
const lied = await call(rooms, "POST", {
  body: { action: "join", code: "OLDER1", name: "Lou", seat: "play", age: 40, country: "US" },
  headers: { "x-fa-profile": child.json.token },
});
assert.equal(lied.status, 403);
assert.equal(lied.json.error, "age");

const openJoin = await call(rooms, "POST", {
  body: { action: "join", code: "OLDER1", name: "Lou", seat: "play", age: 40 },
});
assert.equal(openJoin.status, 401);

const youngRoom = await call(rooms, "POST", {
  body: { action: "create", code: "YOUNG1", host: "TV", hostKey, ageFrom: 10, ageTo: 99 },
  headers: { "x-fa-host": hostKey },
});
assert.equal(youngRoom.status, 200);
const seated = await call(rooms, "POST", {
  body: { action: "join", code: "YOUNG1", name: "Lou", seat: "play", age: 40, country: "US" },
  headers: { "x-fa-profile": child.json.token },
});
assert.equal(seated.status, 200);
const guest = seated.json.guests.find((g) => g.name === "Lou");
assert.equal(guest.age, 10);

const scored = await call(profiles, "POST", {
  body: { action: "score", score: 80, at: "2026-09-24T00:00:00.000Z" },
  headers: { "x-fa-profile": child.json.token },
});
assert.equal(scored.status, 200);

const off = await call(profiles, "POST", {
  body: { action: "revoke", childId: made.json.profile.id },
  headers: { "x-fa-profile": parent.json.token },
});
assert.equal(off.status, 200);
assert.equal(off.json.profile.consent, false);
const again = await call(profiles, "POST", {
  body: { action: "login", loginName: "lou10", password: "play" },
});
assert.equal(again.status, 403);
assert.equal(again.json.error, "revoked");
const blocked = await call(rooms, "POST", {
  body: { action: "join", code: "YOUNG1", name: "Lou", seat: "play", age: 18 },
  headers: { "x-fa-profile": child.json.token },
});
assert.equal(blocked.status, 403);
assert.equal(blocked.json.error, "revoked");

console.log("parental check ok");
