const jwt = require("jsonwebtoken");
const { getAuthorization, hasPermission } = require("../services/authorization.service");

// Active SSE client connections pool
const clients = new Set();

/**
 * Express handler for Server-Sent Events (SSE)
 * Route: GET /api/realtime/events
 */
async function sseHandler(req, res) {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null) || req.query.token;
    let user;
    let tokenExpiresAt;
    try {
        if (!token) return res.status(401).json({ message: "Token tidak ditemukan" });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        tokenExpiresAt = decoded.exp;
        user = await getAuthorization(decoded.id);
        if (!user) return res.status(401).json({ message: "User tidak ditemukan" });
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" || error.name === "NotBeforeError") {
            return res.status(401).json({ message: "Token tidak valid" });
        }
        return res.status(503).json({ message: "Layanan otorisasi tidak tersedia" });
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no" // Prevents buffering in Nginx / Caddy reverse proxy
    });

    const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const client = {
        id: clientId,
        res,
        user,
        tokenExpiresAt,
        connectedAt: new Date()
    };

    clients.add(client);

    // Initial connection acknowledgment
    res.write(`event: connected\ndata: ${JSON.stringify({ 
        status: "connected", 
        clientId, 
        userId: user.id,
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
async function broadcast(event, data = {}, filter = null) {
    for (const client of clients) {
        try {
            if (client.tokenExpiresAt && Date.now() >= client.tokenExpiresAt * 1000) { clients.delete(client); client.res.end(); continue; }
            const auth = await getAuthorization(client.user.id);
            if (!auth) { clients.delete(client); client.res.end(); continue; }
            if (filter) {
                if (filter.userId && auth.id !== filter.userId) continue;
                if (filter.role && !auth.roles.some(role => role.slug === filter.role)) continue;
            }
            if (event.startsWith("tiket:") && !hasPermission(auth, "tickets.view")) continue;
            if (event.startsWith("invoice:") && !hasPermission(auth, "invoices.view")) continue;
            if (event.startsWith("loaner:") && !hasPermission(auth, "loaners.view")) continue;
            if (event.startsWith("rma:") && !hasPermission(auth, "suppliers.view")) continue;
            if (event === "registration:updated" && !hasPermission(auth, "tickets.intake")) continue;
            if (event === "dashboard:refresh" && !hasPermission(auth, "dashboard.view")) continue;
            if (event === "notification:new") {
                if (data.user_id && data.user_id !== auth.id) continue;
                if (!data.user_id && data.recipient_role && !auth.roles.some(role => role.slug === data.recipient_role)) continue;
            }
            const safeData = event === "notification:new" ? data
                : event === "notification:updated" ? {}
                : event.startsWith("tiket:") || event.startsWith("invoice:") || event.startsWith("loaner:") || event.startsWith("rma:") ? {}
                : data;
            const payload = `event: ${event}\ndata: ${JSON.stringify({ ...safeData, _ts: Date.now() })}\n\n`;
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

