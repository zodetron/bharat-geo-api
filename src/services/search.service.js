const prisma = require("../lib/prisma");
const { cacheGet, cacheSet } = require("../lib/redis");

const SEARCH_TTL = 300;       // 5 minutes
const AUTOCOMPLETE_TTL = 120; // 2 minutes
const AUTOCOMPLETE_LIMIT = 10;

// ── helpers ──────────────────────────────────────────────────────────────────

function ilike(q) {
  return { contains: q.trim(), mode: "insensitive" };
}

function validateQuery(q) {
  if (!q || typeof q !== "string" || q.trim().length < 2) {
    throw Object.assign(
      new Error("Query parameter 'q' must be at least 2 characters"),
      { status: 400 }
    );
  }
  return q.trim();
}

// ── search ───────────────────────────────────────────────────────────────────

async function search(query) {
  const q = validateQuery(query.q);
  const type = query.type || "all"; // state | district | subdistrict | village | all
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;

  const cacheKey = `search:${q.toLowerCase()}:${type}:${page}:${limit}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  const filter = ilike(q);
  const results = {};

  if (type === "all" || type === "state") {
    const [total, data] = await prisma.$transaction([
      prisma.state.count({ where: { name: filter } }),
      prisma.state.findMany({
        where: { name: filter },
        skip: type === "state" ? skip : 0,
        take: type === "state" ? limit : 5,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          censusCode: true,
          country: { select: { id: true, name: true } },
        },
      }),
    ]);
    results.states = { data, total };
  }

  if (type === "all" || type === "district") {
    const [total, data] = await prisma.$transaction([
      prisma.district.count({ where: { name: filter } }),
      prisma.district.findMany({
        where: { name: filter },
        skip: type === "district" ? skip : 0,
        take: type === "district" ? limit : 5,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          censusCode: true,
          state: { select: { id: true, name: true } },
        },
      }),
    ]);
    results.districts = { data, total };
  }

  if (type === "all" || type === "subdistrict") {
    const [total, data] = await prisma.$transaction([
      prisma.subDistrict.count({ where: { name: filter } }),
      prisma.subDistrict.findMany({
        where: { name: filter },
        skip: type === "subdistrict" ? skip : 0,
        take: type === "subdistrict" ? limit : 5,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          censusCode: true,
          district: {
            select: {
              id: true,
              name: true,
              state: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);
    results.subDistricts = { data, total };
  }

  if (type === "all" || type === "village") {
    const [total, data] = await prisma.$transaction([
      prisma.village.count({ where: { name: filter } }),
      prisma.village.findMany({
        where: { name: filter },
        skip: type === "village" ? skip : 0,
        take: type === "village" ? limit : 5,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          censusCode: true,
          subDistrict: {
            select: {
              id: true,
              name: true,
              district: {
                select: {
                  id: true,
                  name: true,
                  state: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      }),
    ]);
    results.villages = { data, total };
  }

  // For single-type searches, attach pagination
  const pagination =
    type !== "all"
      ? (() => {
          const bucket = results[`${type}s`] || results.subDistricts || results.villages;
          const total = bucket?.total ?? 0;
          return {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          };
        })()
      : undefined;

  const payload = { query: q, type, results, ...(pagination && { pagination }) };
  await cacheSet(cacheKey, payload, SEARCH_TTL);
  return payload;
}

// ── autocomplete ──────────────────────────────────────────────────────────────

async function autocomplete(query) {
  const q = validateQuery(query.q);
  const type = query.type || "village"; // default to village for address forms

  const cacheKey = `ac:${q.toLowerCase()}:${type}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  const filter = ilike(q);
  let suggestions = [];

  const villageSelect = {
    id: true,
    name: true,
    censusCode: true,
    subDistrict: {
      select: {
        id: true,
        name: true,
        district: {
          select: {
            id: true,
            name: true,
            state: { select: { id: true, name: true } },
          },
        },
      },
    },
  };

  switch (type) {
    case "state":
      suggestions = await prisma.state.findMany({
        where: { name: filter },
        take: AUTOCOMPLETE_LIMIT,
        orderBy: { name: "asc" },
        select: { id: true, name: true, censusCode: true },
      });
      break;

    case "district":
      suggestions = await prisma.district.findMany({
        where: { name: filter },
        take: AUTOCOMPLETE_LIMIT,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          censusCode: true,
          state: { select: { id: true, name: true } },
        },
      });
      break;

    case "subdistrict":
      suggestions = await prisma.subDistrict.findMany({
        where: { name: filter },
        take: AUTOCOMPLETE_LIMIT,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          censusCode: true,
          district: { select: { id: true, name: true } },
        },
      });
      break;

    case "village":
    default:
      suggestions = await prisma.village.findMany({
        where: { name: filter },
        take: AUTOCOMPLETE_LIMIT,
        orderBy: { name: "asc" },
        select: villageSelect,
      });
      break;
  }

  const payload = { query: q, type, suggestions };
  await cacheSet(cacheKey, payload, AUTOCOMPLETE_TTL);
  return payload;
}

module.exports = { search, autocomplete };
