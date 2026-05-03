const prisma = require("../lib/prisma");
const { PLAN_LIMITS } = require("../middleware/rateLimiter");
const { Redis } = require("@upstash/redis");

function getRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

async function getUsage(userId) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [apiKeys, todayTotal, recentLogs] = await prisma.$transaction([
    prisma.apiKey.findMany({
      where: { userId, isActive: true },
      select: { id: true, keyPrefix: true, plan: true, createdAt: true, expiresAt: true },
    }),
    prisma.apiLog.count({
      where: { userId, createdAt: { gte: today } },
    }),
    prisma.apiLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, endpoint: true, method: true,
        statusCode: true, responseTime: true, createdAt: true,
      },
    }),
  ]);

  // Pull per-key usage from Redis (live counters)
  const redis = getRedis();
  const keyUsage = await Promise.all(
    apiKeys.map(async (key) => {
      const limit = PLAN_LIMITS[key.plan] ?? PLAN_LIMITS.FREE;
      let used = 0;
      if (redis) {
        try {
          used = parseInt(await redis.get(`rl:${key.id}:${todayUTC()}`)) || 0;
        } catch { /* no-op */ }
      }
      return {
        ...key,
        limit,
        usedToday: used,
        remaining: Math.max(0, limit - used),
        percentUsed: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
      };
    })
  );

  return {
    apiKeys: keyUsage,
    todayTotal,
    recentLogs: recentLogs.map((l) => ({ ...l, id: l.id.toString() })),
  };
}

async function getDailyUsage(userId, days = 14) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw`
    SELECT
      DATE("createdAt" AT TIME ZONE 'UTC') AS date,
      COUNT(*)::int                         AS requests,
      AVG("responseTime")::int              AS "avgMs"
    FROM api_logs
    WHERE "userId" = ${userId}
      AND "createdAt" >= ${since}
    GROUP BY DATE("createdAt" AT TIME ZONE 'UTC')
    ORDER BY date ASC
  `;

  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    requests: r.requests,
    avgMs: r.avgMs,
  }));
}

module.exports = { getUsage, getDailyUsage };
