const prisma = require("../lib/prisma");

async function getStats() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [totalUsers, pendingUsers, activeKeys, todayRequests, totalRequests] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.apiKey.count({ where: { isActive: true } }),
      prisma.apiLog.count({ where: { createdAt: { gte: today } } }),
      prisma.apiLog.count(),
    ]);

  return { totalUsers, pendingUsers, activeKeys, todayRequests, totalRequests };
}

async function getDailyRequests(days = 30) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  // Raw query for date-bucketed aggregation
  const rows = await prisma.$queryRaw`
    SELECT
      DATE("createdAt" AT TIME ZONE 'UTC') AS date,
      COUNT(*)::int                         AS requests
    FROM api_logs
    WHERE "createdAt" >= ${since}
    GROUP BY DATE("createdAt" AT TIME ZONE 'UTC')
    ORDER BY date ASC
  `;

  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    requests: r.requests,
  }));
}

async function getTopEndpoints(limit = 10) {
  const rows = await prisma.$queryRaw`
    SELECT
      endpoint,
      COUNT(*)::int              AS total,
      AVG("responseTime")::int    AS "avgMs",
      SUM(CASE WHEN "statusCode" >= 400 THEN 1 ELSE 0 END)::int AS errors
    FROM api_logs
    GROUP BY endpoint
    ORDER BY total DESC
    LIMIT ${limit}
  `;
  return rows;
}

async function getPlanDistribution() {
  const rows = await prisma.apiKey.groupBy({
    by: ["plan"],
    where: { isActive: true },
    _count: { id: true },
  });
  return rows.map((r) => ({ plan: r.plan, count: r._count.id }));
}

async function listUsers(query) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip  = (page - 1) * limit;
  const status = query.status || undefined;

  const where = status ? { status } : {};

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, fullName: true, company: true,
        role: true, status: true, createdAt: true,
        _count: { select: { apiKeys: true } },
      },
    }),
  ]);

  return {
    data: users,
    pagination: {
      total, page, limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

async function updateUserStatus(userId, status) {
  const valid = ["ACTIVE", "PENDING", "SUSPENDED"];
  if (!valid.includes(status)) {
    throw Object.assign(new Error(`status must be one of: ${valid.join(", ")}`), { status: 400 });
  }

  const id = parseInt(userId);
  if (isNaN(id)) throw Object.assign(new Error("Invalid user id"), { status: 400 });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, email: true, fullName: true, role: true, status: true },
  });
  return { user: updated };
}

module.exports = { getStats, getDailyRequests, getTopEndpoints, getPlanDistribution, listUsers, updateUserStatus };
