const { Router } = require("express");
const authRoutes   = require("./auth.routes");
const apiKeyRoutes = require("./apiKey.routes");
const adminRoutes  = require("./admin.routes");
const clientRoutes = require("./client.routes");
const geoRoutes    = require("./geo.routes");
const searchRoutes = require("./search.routes");

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

router.use(authRoutes);
router.use(apiKeyRoutes);
router.use(adminRoutes);
router.use(clientRoutes);
router.use(geoRoutes);
router.use(searchRoutes);

module.exports = router;
