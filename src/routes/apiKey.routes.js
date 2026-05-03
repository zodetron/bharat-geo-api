const { Router } = require("express");
const apiKeyController = require("../controllers/apiKey.controller");
const { authenticate } = require("../middleware/authenticate");

const router = Router();

router.post("/api-keys", authenticate, apiKeyController.create);
router.get("/api-keys", authenticate, apiKeyController.list);
router.delete("/api-keys/:id", authenticate, apiKeyController.revoke);

module.exports = router;
