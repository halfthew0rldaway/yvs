const express = require("express");
const { authenticate, requirePermission } = require("../middleware/auth");
const { adminDashboard, teknisiDashboard, teknisiList, exportActivities, exportDatabase } = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(authenticate);

router.get("/admin", requirePermission("dashboard.report"), adminDashboard);
router.get("/teknisi", requirePermission("dashboard.view"), teknisiDashboard);
router.get("/teknisi-list", requirePermission("tickets.assign"), teknisiList);
router.get("/activities/export", requirePermission("audit.view"), exportActivities);
router.get("/database/export", requirePermission("system.database"), exportDatabase);

module.exports = router;
