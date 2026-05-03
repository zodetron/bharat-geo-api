const { Router } = require("express");
const auth = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/authenticate");

const router = Router();

router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);
router.get("/auth/me", authenticate, auth.me);

module.exports = router;
