const { Redis } = require("@upstash/redis");

let redis = null;

function getRedis() {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null; // graceful no-op when Redis is not configured
  }

  redis = new Redis({ url, token });
  return redis;
}

async function cacheGet(key) {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds) {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch {
    // non-fatal
  }
}

async function cacheDel(pattern) {
  const client = getRedis();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(...keys);
  } catch {
    // non-fatal
  }
}

module.exports = { cacheGet, cacheSet, cacheDel };
