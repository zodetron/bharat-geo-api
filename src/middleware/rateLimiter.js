const { Redis } = require("@upstash/redis");

// Plan → daily request ceiling
const PLAN_LIMITS = {
  FREE:      5_000,
  PREMIUM:   50_000,
  PRO:       300_000,
  UNLIMITED: 1_000_000,
};

function getRedisClient() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// Seconds remaining until midnight UTC — so every counter resets at 00:00 UTC
function secondsUntilMidnightUTC() {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.ceil((midnight - now) / 1000);
}

// Returns today's date string used as part of the Redis key (UTC)
function todayUTC() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

async function rateLimiter(req, res, next) {
  // Must run after apiKeyAuth — needs req.apiKey
  if (!req.apiKey) return next();

  const { id: apiKeyId, plan } = req.apiKey;
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;

  const redis = getRedisClient();

  // Graceful degradation: if Redis is not configured, allow the request through
  if (!redis) return next();

  const key = `rl:${apiKeyId}:${todayUTC()}`;

  try {
    // INCR is atomic — safe under concurrent requests
    const count = await redis.incr(key);

    // Set expiry only on the first increment (avoids resetting TTL on every request)
    if (count === 1) {
      await redis.expire(key, secondsUntilMidnightUTC());
    }

    const remaining = Math.max(0, limit - count);
    const resetAt   = new Date();
    resetAt.setUTCHours(24, 0, 0, 0); // next midnight UTC

    // Standard rate-limit headers (RFC 6585 style)
    res.setHeader("X-RateLimit-Limit",     limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset",     Math.ceil(resetAt.getTime() / 1000));
    res.setHeader("X-RateLimit-Plan",      plan);

    if (count > limit) {
      return res.status(429).json({
        success: false,
        error: "Daily rate limit exceeded.",
        plan,
        limit,
        resetAt: resetAt.toISOString(),
      });
    }

    next();
  } catch {
    // Redis failure → allow request rather than blocking legitimate traffic
    next();
  }
}

module.exports = { rateLimiter, PLAN_LIMITS };
