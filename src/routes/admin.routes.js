const { Router } = require("express");
const admin = require("../controllers/admin.controller");
const apiKey = require("../controllers/apiKey.controller");
const { authenticate } = require("../middleware/authenticate");
const { requireRole } = require("../middleware/authenticate");

const router = Router();

const adminAuth = [authenticate, requireRole("ADMIN")];

router.get("/admin/stats",            ...adminAuth, admin.getStats);
router.get("/admin/analytics",        ...adminAuth, admin.getAnalytics);
router.get("/admin/users",            ...adminAuth, admin.listUsers);
router.patch("/admin/users/:id",      ...adminAuth, admin.updateUserStatus);
router.get("/admin/api-keys",         ...adminAuth, apiKey.listAll);
router.patch("/admin/api-keys/:id",   ...adminAuth, apiKey.update);

module.exports = router;
