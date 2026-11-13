const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brand.controller");
const { authenticate, requirePermission } = require("../middleware/auth");

router.use(authenticate);

router.get("/", requirePermission("wiki.view", "inventory.view"), brandController.getAll);
router.post("/", requirePermission("inventory.manage"), brandController.create);

module.exports = router;
