const express = require("express");
const router = express.Router();
const { sseHandler, getConnectedClientsCount } = require("../utils/sse");

// SSE streaming endpoint: GET /api/realtime/events
router.get("/events", sseHandler);

// Status check: GET /api/realtime/status
router.get("/status", (req, res) => {
    res.json({
        activeConnections: getConnectedClientsCount(),
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

