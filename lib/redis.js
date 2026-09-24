/** Shared Upstash client. Rooms, profiles, and scores use the same keys. */
let redisClient = null;
let redisOff = false;

export function redisConfig() {
  if (redisOff) return null;
  const url = process.env.FAST_ANSWER_REDIS_KV_REST_API_URL
    || process.env.UPSTASH_REDIS_REST_URL
    || process.env.KV_REST_API_URL
    || "";
  const token = process.env.FAST_ANSWER_REDIS_KV_REST_API_TOKEN
    || process.env.UPSTASH_REDIS_REST_TOKEN
    || process.env.KV_REST_API_TOKEN
    || "";
  if (!url || !token) return null;
  return { url, token };
}

export async function getRedis() {
  const cfg = redisConfig();
  if (!cfg) return null;
  if (redisClient) return redisClient;
  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis(cfg);
    return redisClient;
  } catch {
    return null;
  }
}

export function storeRequired() {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

export function resetRedisForTests() {
  redisOff = true;
  redisClient = null;
}
