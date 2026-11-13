const express = require("express");
const { authenticate, requirePermission } = require("../middleware/auth");
const {
    getDevices,
    getDeviceStats,
    createDevice,
    updateDevice,
    deleteDevice,
    getRecords,
    getRecordsByTicket,
    createRecord,
    returnRecord
} = require("../controllers/loaner.controller");

const router = express.Router();

router.use(authenticate);

// Devices pool routes
router.get("/devices", requirePermission("loaners.view"), getDevices);
router.get("/devices/stats", requirePermission("loaners.view"), getDeviceStats);
router.post("/devices", requirePermission("loaners.manage"), createDevice);
router.put("/devices/:id", requirePermission("loaners.manage"), updateDevice);
router.delete("/devices/:id", requirePermission("loaners.manage"), deleteDevice);

// Records / loan activity routes
router.get("/records", requirePermission("loaners.view"), getRecords);
router.get("/records/ticket/:tiketId", requirePermission("loaners.view"), getRecordsByTicket);
router.post("/records", requirePermission("loaners.manage"), createRecord);
router.put("/records/:id/return", requirePermission("loaners.manage"), returnRecord);

module.exports = router;

