const jwt = require("jsonwebtoken");

// Active SSE client connections pool
const clients = new Set();

/**
 * Express handler for Server-Sent Events (SSE)
 * Route: GET /api/realtime/events
 */
function sseHandler(req, res) {
    // Standard headers for SSE streaming
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no" // Prevents buffering in Nginx / Caddy reverse proxy
    });

    // Optional user authentication via query param or Authorization header
    let user = null;
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null) || req.query.token;

    if (token) {
        try {
            user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (_) {
            // Token expired or invalid; still keep public stream connection open
        }
    }

    const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const client = {
        id: clientId,
        res,
        user,
        connectedAt: new Date()
    };

    clients.add(client);

    // Initial connection acknowledgment
    res.write(`event: connected\ndata: ${JSON.stringify({ 
        status: "connected", 
        clientId, 
        userRole: user?.role || "guest",
        timestamp: new Date().toISOString() 
    })}\n\n`);

    // Periodic heartbeat comment (every 25 seconds) to prevent socket timeout
    const heartbeatTimer = setInterval(() => {
        try {
            res.write(": heartbeat\n\n");
        } catch (_) {
            clearInterval(heartbeatTimer);
            clients.delete(client);
        }
    }, 25000);

    // Clean up on disconnect
    req.on("close", () => {
        clearInterval(heartbeatTimer);
        clients.delete(client);
    });

    req.on("error", () => {
        clearInterval(heartbeatTimer);
        clients.delete(client);
    });
}

/**
 * Broadcast an event to all connected clients (or filtered by role/user)
 * @param {string} event - Name of the event (e.g. 'dashboard:refresh', 'tiket:updated', 'notification:new')
 * @param {object} data - Payload data
 * @param {object} [filter] - Optional filter { role, userId }
 */
function broadcast(event, data = {}, filter = null) {
    const payload = `event: ${event}\ndata: ${JSON.stringify({ ...data, _ts: Date.now() })}\n\n`;

    for (const client of clients) {
        try {
            if (filter) {
                if (filter.userId && client.user?.id !== filter.userId) continue;
                if (filter.role && client.user?.role !== filter.role && client.user?.role !== "pimpinan") continue;
            }
            client.res.write(payload);
        } catch (_) {
            clients.delete(client);
        }
    }
}

/**
 * Get count of active SSE client connections
 */
function getConnectedClientsCount() {
    return clients.size;
}

module.exports = {
    sseHandler,
    broadcast,
    getConnectedClientsCount
};

