const express = require("express");
const { authenticate, requirePermission } = require("../middleware/auth");
const { getAll, getStats } = require("../controllers/activity-log.controller");

const router = express.Router();

router.use(authenticate);
router.use(requirePermission("audit.view"));

router.get("/stats", getStats);
router.get("/", getAll);

module.exports = router;

