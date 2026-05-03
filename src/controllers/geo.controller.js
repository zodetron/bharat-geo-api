const geoService = require("../services/geo.service");

function respond(res, result) {
  res.json({ success: true, ...result });
}

async function getStates(req, res, next) {
  try {
    respond(res, await geoService.getStates(req.query));
  } catch (err) {
    next(err);
  }
}

async function getDistrictsByState(req, res, next) {
  try {
    respond(res, await geoService.getDistrictsByState(req.params.id, req.query));
  } catch (err) {
    next(err);
  }
}

async function getSubDistrictsByDistrict(req, res, next) {
  try {
    respond(res, await geoService.getSubDistrictsByDistrict(req.params.id, req.query));
  } catch (err) {
    next(err);
  }
}

async function getVillagesBySubDistrict(req, res, next) {
  try {
    respond(res, await geoService.getVillagesBySubDistrict(req.params.id, req.query));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStates,
  getDistrictsByState,
  getSubDistrictsByDistrict,
  getVillagesBySubDistrict,
};
