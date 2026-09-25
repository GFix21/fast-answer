/**
 * Which banked set the show deals.
 * Empty means the live questions.json files stay in play.
 * Redis keeps the switch on Vercel. The file is the fallback.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getRedis } from "./redis.js";

const KEY = "fa:flow:main-set";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "banks/flow/main.json");

export function readMainSetFile() {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return String(data?.id || "").trim();
  } catch {
    return "";
  }
}

export async function readMainSetId() {
  try {
    const redis = await getRedis();
    if (redis) {
      const id = await redis.get(KEY);
      if (typeof id === "string") return id.trim();
    }
  } catch { /* file */ }
  return readMainSetFile();
}

export async function writeMainSetId(id) {
  const next = String(id || "").trim();
  const body = { id: next, setAt: new Date().toISOString() };
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, `${JSON.stringify(body, null, 2)}\n`);
  } catch { /* read-only deploy */ }
  try {
    const redis = await getRedis();
    if (redis) {
      if (next) await redis.set(KEY, next);
      else await redis.del(KEY);
    }
  } catch { /* file only */ }
  return body;
}
