const express = require("express");
const router = express.Router();
const databaseController = require("../controllers/database.controller");
const { authenticate, requirePermission, requireSuperAdmin } = require("../middleware/auth");

router.use(authenticate);

// GET /api/database/stats - Health & storage metrics
router.get("/stats", requirePermission("system.database"), databaseController.getStats);

// POST /api/database/export - Custom modular export (excel, json, sql)
router.post("/export", requirePermission("system.database"), databaseController.exportData);

// POST /api/database/cleanup-logs - Housekeeping old audit logs
router.post("/cleanup-logs", requirePermission("system.database_maintain"), databaseController.cleanupLogs);

// POST /api/database/seed-dummy - Safely append realistic dummy data on live VPS
router.post("/seed-dummy", requireSuperAdmin, databaseController.seedDummy);

// POST /api/database/normalize-existing - Standardize existing customer & device records
router.post("/normalize-existing", requirePermission("system.database_maintain"), databaseController.normalizeExisting);

module.exports = router;

