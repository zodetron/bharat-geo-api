const { Router } = require("express");
const search = require("../controllers/search.controller");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const { rateLimiter } = require("../middleware/rateLimiter");

const router = Router();

router.use(apiKeyAuth);
router.use(rateLimiter);

router.get("/search", search.search);
router.get("/autocomplete", search.autocomplete);

module.exports = router;
