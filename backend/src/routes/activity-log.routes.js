const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const { getAll, getStats } = require("../controllers/activity-log.controller");

const router = express.Router();

router.use(authenticate);
router.use(authorize("admin"));

router.get("/stats", getStats);
router.get("/", getAll);

module.exports = router;

