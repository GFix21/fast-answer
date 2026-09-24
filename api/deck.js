/**
 * Question deck.
 * GET returns prompts and choices only.
 * POST deals one show, one lockdown, or one placement sitting to the room host.
 * The answer key is not a public file.
 */
import { getRoom, saveRoom } from "../lib/room-store.js";
import { readFullBank } from "../lib/sealed-bank.js";
import { stripBank, stripQuestion, shuffleKeyedQuestion } from "../lib/strip-answers.js";
import { dealShow } from "../lib/generation-deal.js";
import { orderShowSets } from "../lib/show-pace.js";
import { replayQuestions } from "../lib/set-archive.js";
import { questionDealable } from "../lib/content-freeze.js";

const LIVE = {
  en: "questions.json",
  fr: "questions.fr.json",
  "fr-CA": "questions.fr-CA.json",
  de: "questions.de.json",
};
const PLACE = {
  en: "banks/placement/generational-first-pass.json",
  fr: "banks/placement/fr/generational-first-pass.json",
  "fr-CA": "banks/placement/fr-CA/generational-first-pass.json",
  de: "banks/placement/de/generational-first-pass.json",
};

const hits = globalThis.__faDeckHits || (globalThis.__faDeckHits = new Map());

function localeOf(raw) {
  const text = String(raw || "en").trim().replace(/_/g, "-");
  if (/^fr-ca$/i.test(text)) return "fr-CA";
  const v = text.toLowerCase().slice(0, 2);
  return v === "fr" || v === "de" ? v : "en";
}

function liveQuestions(locale) {
  const data = readFullBank(LIVE[localeOf(locale)]);
  const list = Array.isArray(data) ? data : (data?.questions || []);
  return list.filter((q) => questionDealable(q));
}

function placementQuestions(locale) {
  const data = readFullBank(PLACE[localeOf(locale)]);
  const list = Array.isArray(data) ? data : (data?.questions || []);
  return list.filter((q) => questionDealable(q));
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

function queryOf(req) {
  if (req.query && typeof req.query === "object" && Object.keys(req.query).length) return req.query;
  try {
    return Object.fromEntries(new URL(req.url || "/", "http://local").searchParams);
  } catch {
    return {};
  }
}

function readBody(req) {
  if (req.body == null) {
    return new Promise((resolve) => {
      let raw = "";
      req.on("data", (c) => { raw += c; });
      req.on("end", () => {
        try { resolve(raw ? JSON.parse(raw) : {}); }
        catch { resolve(null); }
      });
      req.on("error", () => resolve(null));
    });
  }
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "{}"); }
    catch { return null; }
  }
  return req.body;
}

function clientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"] || req.headers?.["X-Forwarded-For"] || "";
  return String(forwarded).split(",")[0].trim() || String(req.headers?.["x-real-ip"] || "local");
}

function allow(ip, bucket, max) {
  const key = `${bucket}:${ip || "unknown"}`;
  const now = Date.now();
  const prev = (hits.get(key) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (prev.length >= max) {
    hits.set(key, prev);
    return false;
  }
  prev.push(now);
  hits.set(key, prev);
  return true;
}

function hostKey(req, body) {
  const header = req.headers?.["x-fa-host"] || req.headers?.["X-Fa-Host"] || "";
  return String(header || body?.hostKey || "").trim().slice(0, 80);
}

function inTopics(q, topics) {
  const allowTopics = new Set((topics || []).map((t) => String(t).toLowerCase()).filter(Boolean));
  if (!allowTopics.size) return true;
  return allowTopics.has(String(q.topic || "").toLowerCase());
}

function keyed(list) {
  return (list || []).map(shuffleKeyedQuestion);
}

export default async function handler(req, res) {
  try {
    return await handleDeck(req, res);
  } catch (err) {
    if (err && err.code === "store") return json(res, 503, { error: "store" });
    throw err;
  }
}

async function handleDeck(req, res) {
  if (req.method === "GET") {
    const query = queryOf(req);
    const locale = localeOf(query.locale);
    if (query.part === "placement") {
      const questions = placementQuestions(locale).map(stripQuestion);
      return json(res, 200, { questions });
    }
    return json(res, 200, stripBank(liveQuestions(locale)));
  }
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  const body = await readBody(req);
  if (!body) return json(res, 400, { error: "Invalid JSON" });
  const code = String(body.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  const key = hostKey(req, body);
  const room = code ? await getRoom(code) : null;
  if (!room || !room.hostKey || key.length < 16 || room.hostKey !== key) {
    return json(res, 403, { error: "host" });
  }
  const ip = clientIp(req);
  const locale = localeOf(body.locale);

  if (body.action === "placement") {
    if ((room.placementDeals || 0) >= 3) return json(res, 429, { error: "limit" });
    if (!allow(ip, "placement", 6)) return json(res, 429, { error: "limit" });
    const questions = keyed(placementQuestions(locale)).slice(0, 10);
    await saveRoom({ ...room, placementDeals: (room.placementDeals || 0) + 1 });
    return json(res, 200, { questions, practice: true });
  }

  if (body.action === "lockdown") {
    if (!allow(ip, "lockdown", 20)) return json(res, 429, { error: "limit" });
    const avoid = new Set([
      ...(Array.isArray(body.avoid) ? body.avoid : []),
      ...((room.answerDeck || []).map((q) => q.id)),
    ].map(String));
    const pool = liveQuestions(locale).filter((q) =>
      q && !avoid.has(String(q.id)) && q.funny !== true && q.humorous !== true && q.structure !== "joke"
      && (q.tier === "hard" || q.tier === "difficult" || q.tier === "extreme"));
    const questions = keyed(pool).slice(0, 5);
    await saveRoom({ ...room, lockdownDeck: questions });
    return json(res, 200, { questions });
  }

  if (body.action !== "show" && body.action !== "replay") return json(res, 400, { error: "action" });
  const setId = String(body.setId || "").trim().slice(0, 80);
  const replay = body.action === "replay";
  const sameDeck = Array.isArray(room.answerDeck) && room.answerDeck.length && body.again !== true
    && (replay ? room.replayOf === setId : !room.replayOf);
  if (sameDeck) {
    return json(res, 200, { questions: room.answerDeck, practice: Boolean(body.practice || replay) });
  }
  if (!allow(ip, "show", 12)) return json(res, 429, { error: "limit" });
  let source;
  if (replay) {
    const packed = replayQuestions(setId, locale);
    if (packed.error || !Array.isArray(packed.questions) || !packed.questions.length) {
      return json(res, packed.status || 404, { error: packed.error || "set" });
    }
    source = packed.questions;
  } else {
    const pool = liveQuestions(locale).filter((q) => inTopics(q, body.topics));
    source = pool.length >= 8 ? pool : liveQuestions(locale);
  }
  const questions = keyed(orderShowSets(dealShow(source, body.avoid || [])));
  await saveRoom({ ...room, answerDeck: questions, replayOf: replay ? setId : "" });
  return json(res, 200, { questions, practice: Boolean(body.practice || replay) });
}
