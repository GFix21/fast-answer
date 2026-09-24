#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fa-release-"));
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

const { stripQuestion } = await import("../lib/strip-answers.js");
const { default: deck } = await import("../api/deck.js");
const { default: profiles } = await import("../api/profiles.js");
const { saveRoom } = await import("../lib/room-store.js");

const stripped = stripQuestion({
  id: "q",
  prompt: "Slogan?",
  choices: ["I Like Ike", "Other"],
  correctIndex: 0,
  banterHint: "Three little words.",
});
assert.equal(stripped.correctIndex, undefined);
assert.equal(stripped.banterHint, undefined);
assert.equal(stripped.prompt, "Slogan?");

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
  return handler(req, res).then(() => ({ status: res.statusCode, json: res.body ? JSON.parse(res.body) : null, headers: res.headers }));
}

const live = await call(deck, "GET", { query: { part: "live", locale: "en" } });
assert.equal(live.status, 200);
assert.equal(Array.isArray(live.json), true);
assert.ok(live.json.length > 10);
assert.equal(JSON.stringify(live.json).includes("correctIndex"), false);

const place = await call(deck, "GET", { query: { part: "placement", locale: "fr-CA" } });
assert.equal(place.status, 200);
assert.equal(JSON.stringify(place.json).includes("correctIndex"), false);

const hostKey = "abcdef0123456789abcdef0123456789";
await saveRoom({ code: "SHOW1", hostKey, host: "TV", state: {}, guests: [] });
const denied = await call(deck, "POST", { body: { action: "show", code: "SHOW1", locale: "en" } });
assert.equal(denied.status, 403);

const dealt = await call(deck, "POST", {
  body: { action: "show", code: "SHOW1", locale: "en" },
  headers: { "x-fa-host": hostKey },
});
assert.equal(dealt.status, 200);
assert.ok(dealt.json.questions.length >= 8);
assert.ok(dealt.json.questions.length <= 37);
assert.equal(dealt.json.questions.every((q) => Number.isInteger(q.correctIndex)), true);
const again = await call(deck, "POST", {
  body: { action: "show", code: "SHOW1", locale: "en" },
  headers: { "x-fa-host": hostKey },
});
assert.equal(again.json.questions[0].id, dealt.json.questions[0].id);

const young = await call(profiles, "POST", {
  body: { action: "register", displayName: "Kid", email: "kid@example.com", password: "secret", age: 10, country: "US" },
  headers: { "x-vercel-ip-country": "US" },
});
assert.equal(young.status, 403);

const created = await call(profiles, "POST", {
  body: { action: "register", displayName: "Ada", email: "ada@example.com", password: "secret", age: 30, country: "CA" },
  headers: { "x-vercel-ip-country": "CA" },
});
assert.equal(created.status, 200);
assert.ok(created.json.token);
assert.equal(created.json.profile.passwordHash, undefined);

const openScore = await call(profiles, "POST", {
  body: { action: "score", score: 500, at: "2026-09-24T00:00:00.000Z" },
});
assert.equal(openScore.status, 401);

const saved = await call(profiles, "POST", {
  body: { action: "score", id: "someone-else", score: 500, at: "2026-09-24T00:00:00.000Z" },
  headers: { "x-fa-profile": created.json.token },
});
assert.equal(saved.status, 200);
assert.equal(saved.json.scores[0].score, 500);

const listed = await call(profiles, "GET", {
  query: { scores: "1", id: "someone-else" },
  headers: { "x-fa-profile": created.json.token },
});
assert.equal(listed.json.scores[0].score, 500);

const bad = await call(profiles, "POST", {
  body: { action: "login", email: "ada@example.com", password: "nope" },
});
assert.equal(bad.status, 401);

const back = await call(profiles, "POST", {
  body: { action: "login", email: "ada@example.com", password: "secret" },
});
assert.equal(back.status, 200);
assert.equal(back.json.profile.email, "ada@example.com");

process.env.VERCEL = "1";
const offline = await call(profiles, "POST", {
  body: { action: "register", displayName: "Off", email: "off@example.com", password: "secret", age: 30, country: "CA" },
  headers: { "x-vercel-ip-country": "CA" },
});
assert.equal(offline.status, 503);
const dropped = await call(profiles, "POST", {
  body: { action: "score", score: 10, at: "2026-09-24T00:00:00.000Z" },
  headers: { "x-fa-profile": created.json.token },
});
assert.equal(dropped.status, 503);

console.log("release blockers ok");
