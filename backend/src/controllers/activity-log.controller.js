const prisma = require("../config/database");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");

// Mengambil daftar audit log dengan filter pencarian, entitas, rentang tanggal, dan pagination
async function getAll(req, res) {
    try {
        const { search, entity, startDate, endDate, sortOrder = "desc" } = req.query;
        const { isPaginated, page, limit, skip } = parsePagination(req.query);

        const andConditions = [];

        if (search) {
            andConditions.push({
                OR: [
                    { action: { contains: search } },
                    { user_nama: { contains: search } },
                    { entity: { contains: search } }
                ]
            });
        }

        if (entity && entity !== "all") {
            const ent = String(entity).toLowerCase().trim();
            andConditions.push({
                OR: [
                    { entity: { equals: ent } },
                    { entity: { contains: ent } }
                ]
            });
        }

        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate) {
                dateFilter.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.lte = end;
            }
            andConditions.push({ created_at: dateFilter });
        }

        const where = andConditions.length > 0 ? { AND: andConditions } : {};
        const orderBy = { created_at: sortOrder === "asc" ? "asc" : "desc" };

        if (!isPaginated) {
            const logs = await prisma.activityLog.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, nama: true, email: true, role: true }
                    }
                },
                orderBy,
                take: 500
            });
            return res.json(logs);
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, nama: true, email: true, role: true }
                    }
                },
                orderBy,
                skip,
                take: limit
            }),
            prisma.activityLog.count({ where })
        ]);

        return res.json(buildPaginationResponse(logs, total, page, limit));
    } catch (error) {
        console.error("Error in activity-log getAll:", error);
        return res.status(500).json({ message: "Gagal mengambil log aktivitas", error: error.message });
    }
}

// Mengambil statistik ringkas audit log
async function getStats(req, res) {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [totalLogs, todayLogs, entitiesGroup, topUsers] = await Promise.all([
            prisma.activityLog.count(),
            prisma.activityLog.count({
                where: { created_at: { gte: todayStart } }
            }),
            prisma.activityLog.groupBy({
                by: ["entity"],
                _count: { id: true }
            }),
            prisma.activityLog.groupBy({
                by: ["user_nama"],
                _count: { id: true },
                orderBy: {
                    _count: { id: "desc" }
                },
                take: 3
            })
        ]);

        // Urutkan entitas terbanyak secara descending
        const sortedEntities = entitiesGroup
            .map(e => ({
                entity: e.entity || "sistem",
                count: e._count.id
            }))
            .sort((a, b) => b.count - a.count);

        return res.json({
            totalLogs,
            todayLogs,
            entities: sortedEntities,
            topUsers: topUsers.map(u => ({
                user_nama: u.user_nama || "Sistem",
                count: u._count.id
            }))
        });
    } catch (error) {
        console.error("Error in activity-log getStats:", error);
        return res.status(500).json({ message: "Gagal mengambil statistik log", error: error.message });
    }
}

module.exports = {
    getAll,
    getStats
};
