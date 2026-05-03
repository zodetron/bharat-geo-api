const { Router } = require("express");
const geo = require("../controllers/geo.controller");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const { rateLimiter } = require("../middleware/rateLimiter");

const router = Router();

router.use(apiKeyAuth);
router.use(rateLimiter);

router.get("/states", geo.getStates);
router.get("/states/:id/districts", geo.getDistrictsByState);
router.get("/districts/:id/subdistricts", geo.getSubDistrictsByDistrict);
router.get("/subdistricts/:id/villages", geo.getVillagesBySubDistrict);

module.exports = router;
