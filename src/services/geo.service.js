const prisma = require("../lib/prisma");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginated(data, total, page, limit) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

async function getStates(query) {
  const { page, limit, skip } = parsePagination(query);

  const [total, states] = await prisma.$transaction([
    prisma.state.count(),
    prisma.state.findMany({
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        censusCode: true,
        country: { select: { id: true, name: true, isoCode: true } },
      },
    }),
  ]);

  return paginated(states, total, page, limit);
}

async function getDistrictsByState(stateId, query) {
  const id = parseInt(stateId);
  if (isNaN(id)) throw Object.assign(new Error("Invalid state id"), { status: 400 });

  const state = await prisma.state.findUnique({
    where: { id },
    select: { id: true, name: true, censusCode: true },
  });
  if (!state) throw Object.assign(new Error("State not found"), { status: 404 });

  const { page, limit, skip } = parsePagination(query);

  const [total, districts] = await prisma.$transaction([
    prisma.district.count({ where: { stateId: id } }),
    prisma.district.findMany({
      where: { stateId: id },
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: { id: true, name: true, censusCode: true },
    }),
  ]);

  return { state, ...paginated(districts, total, page, limit) };
}

async function getSubDistrictsByDistrict(districtId, query) {
  const id = parseInt(districtId);
  if (isNaN(id)) throw Object.assign(new Error("Invalid district id"), { status: 400 });

  const district = await prisma.district.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      censusCode: true,
      state: { select: { id: true, name: true } },
    },
  });
  if (!district) throw Object.assign(new Error("District not found"), { status: 404 });

  const { page, limit, skip } = parsePagination(query);

  const [total, subDistricts] = await prisma.$transaction([
    prisma.subDistrict.count({ where: { districtId: id } }),
    prisma.subDistrict.findMany({
      where: { districtId: id },
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: { id: true, name: true, censusCode: true },
    }),
  ]);

  return { district, ...paginated(subDistricts, total, page, limit) };
}

async function getVillagesBySubDistrict(subDistrictId, query) {
  const id = parseInt(subDistrictId);
  if (isNaN(id)) throw Object.assign(new Error("Invalid sub-district id"), { status: 400 });

  const subDistrict = await prisma.subDistrict.findUnique({
    where: { id },
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
  });
  if (!subDistrict) throw Object.assign(new Error("Sub-district not found"), { status: 404 });

  const { page, limit, skip } = parsePagination(query);

  const [total, villages] = await prisma.$transaction([
    prisma.village.count({ where: { subDistrictId: id } }),
    prisma.village.findMany({
      where: { subDistrictId: id },
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        censusCode: true,
        totalPopulation: true,
        malePopulation: true,
        femalePopulation: true,
        totalHouseholds: true,
      },
    }),
  ]);

  return { subDistrict, ...paginated(villages, total, page, limit) };
}

module.exports = {
  getStates,
  getDistrictsByState,
  getSubDistrictsByDistrict,
  getVillagesBySubDistrict,
};
