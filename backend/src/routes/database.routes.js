const express = require("express");
const router = express.Router();
const databaseController = require("../controllers/database.controller");
const { authenticate, authorize } = require("../middleware/auth");

// All database management endpoints require admin/pimpinan role
router.use(authenticate, authorize("admin"));

// GET /api/database/stats - Health & storage metrics
router.get("/stats", databaseController.getStats);

// POST /api/database/export - Custom modular export (excel, json, sql)
router.post("/export", databaseController.exportData);

// POST /api/database/cleanup-logs - Housekeeping old audit logs
router.post("/cleanup-logs", databaseController.cleanupLogs);

// POST /api/database/seed-dummy - Safely append realistic dummy data on live VPS
router.post("/seed-dummy", databaseController.seedDummy);

// POST /api/database/normalize-existing - Standardize existing customer & device records
router.post("/normalize-existing", databaseController.normalizeExisting);

module.exports = router;

