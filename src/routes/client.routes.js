const { Router } = require("express");
const { authenticate } = require("../middleware/authenticate");
const { getUsage, getDailyUsage } = require("../services/client.service");

const router = Router();

router.get("/client/usage", authenticate, async (req, res, next) => {
  try {
    const data = await getUsage(req.user.userId);
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
});

router.get("/client/usage/daily", authenticate, async (req, res, next) => {
  try {
    const days = Math.min(90, parseInt(req.query.days) || 14);
    const data = await getDailyUsage(req.user.userId, days);
    res.json({ success: true, daily: data });
  } catch (e) { next(e); }
});

module.exports = router;
