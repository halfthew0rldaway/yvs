const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
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
router.get("/devices", getDevices);
router.get("/devices/stats", getDeviceStats);
router.post("/devices", authorize("admin"), createDevice);
router.put("/devices/:id", authorize("admin"), updateDevice);
router.delete("/devices/:id", authorize("admin"), deleteDevice);

// Records / loan activity routes
router.get("/records", getRecords);
router.get("/records/ticket/:tiketId", getRecordsByTicket);
router.post("/records", authorize("admin", "teknisi"), createRecord);
router.put("/records/:id/return", authorize("admin", "teknisi"), returnRecord);

module.exports = router;

