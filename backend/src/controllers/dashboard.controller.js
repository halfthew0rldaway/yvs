const prisma = require("../config/database");
const { getSlaStatus } = require("../utils/tiket");

// Dashboard Admin
async function adminDashboard(req, res) {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 6 months ago for revenue trend
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [
            totalCustomer,
            totalPerangkat,
            tiketAktif,
            tiketSelesai,
            sparepartHampirHabis,
            pendapatanBulanIni,
            tiketBerdasarkanStatus,
            recentActivities,
            invoicesForTrend,
            completedTickets,
            diagnosisList,
            activeTiketsForSla,
            totalWikis
        ] = await Promise.all([
            prisma.customer.count(),
            prisma.perangkat.count(),
            prisma.tiketServis.count({
                where: {
                    status: {
                        notIn: ["selesai", "diambil", "dibatalkan"],
                    },
                },
            }),
            prisma.tiketServis.count({
                where: { status: { in: ["selesai", "diambil"] } },
            }),
            prisma.sparepart.findMany({
                where: { stok: { lte: 5 } },
                orderBy: { stok: "asc" },
                take: 8,
            }),
            prisma.invoice.aggregate({
                where: { created_at: { gte: startOfMonth } },
                _sum: { total_biaya: true },
            }),
            prisma.tiketServis.groupBy({
                by: ['status'],
                _count: { _all: true }
            }),
            prisma.activityLog.findMany({
                orderBy: { created_at: "desc" },
                take: 10,
            }),
            // Revenue trend: all invoices from last 6 months
            prisma.invoice.findMany({
                where: { created_at: { gte: sixMonthsAgo } },
                select: { total_biaya: true, created_at: true }
            }),
            // Average completion time: completed tickets with both dates
            prisma.tiketServis.findMany({
                where: {
                    status: { in: ["selesai", "diambil"] },
                    completed_at: { not: null }
                },
                select: { created_at: true, completed_at: true }
            }),
            // Top kerusakan from diagnosis
            prisma.diagnosis.findMany({
                select: { masalah: true }
            }),
            // Active tickets for detailed SLA compliance analysis
            prisma.tiketServis.findMany({
                where: {
                    status: { notIn: ["selesai", "diambil", "dibatalkan"] }
                },
                select: {
                    id: true,
                    status: true,
                    sla_paket: true,
                    created_at: true,
                    disetujui_at: true,
                    target_pengecekan_at: true,
                    target_selesai_at: true,
                }
            }),
            prisma.repairWiki.count()
        ]);

        // Transform chart data
        const chartData = tiketBerdasarkanStatus.map(item => ({
            name: item.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            value: item._count._all
        }));

        // --- Tren Pendapatan Bulanan (6 bulan) ---
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const trendMap = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            trendMap[key] = { bulan: monthNames[d.getMonth()], pendapatan: 0 };
        }
        for (const inv of invoicesForTrend) {
            const d = inv.created_at;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (trendMap[key]) {
                trendMap[key].pendapatan += inv.total_biaya || 0;
            }
        }
        const trendPendapatan = Object.values(trendMap);

        // --- Rata-rata Waktu Penyelesaian (dalam hari) ---
        let rataRataHari = 0;
        if (completedTickets.length > 0) {
            const totalDays = completedTickets.reduce((sum, t) => {
                const diffMs = new Date(t.completed_at) - new Date(t.created_at);
                return sum + (diffMs / (1000 * 60 * 60 * 24));
            }, 0);
            rataRataHari = Math.round((totalDays / completedTickets.length) * 10) / 10;
        }

        // --- Top 5 Jenis Kerusakan ---
        const kerusakanCount = {};
        for (const d of diagnosisList) {
            // Normalize: take first sentence / first 60 chars as category
            const key = (d.masalah || "Lainnya").substring(0, 60).trim();
            kerusakanCount[key] = (kerusakanCount[key] || 0) + 1;
        }
        const topKerusakan = Object.entries(kerusakanCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));

        // --- Analisis Kepatuhan & Antrean Estimasi SLA ---
        let expressCount = 0;
        let overdueCount = 0;
        let warningCount = 0;
        let onTrackCount = 0;
        let pendingApprovalCount = 0;

        for (const t of activeTiketsForSla) {
            if (t.sla_paket === "express") expressCount++;
            const sla = getSlaStatus(t);
            if (sla.is_paused) {
                pendingApprovalCount++;
            } else if (sla.is_overdue) {
                overdueCount++;
            } else if (sla.is_warning) {
                warningCount++;
            } else {
                onTrackCount++;
            }
        }

        const totalActiveSla = activeTiketsForSla.length;
        const slaChartData = [
            { name: "Sesuai Estimasi", shortName: "On Track", value: onTrackCount, color: "#10b981", percent: totalActiveSla > 0 ? Math.round((onTrackCount / totalActiveSla) * 100) : 0 },
            { name: "Mendekati Batas", shortName: "Warning (<12j)", value: warningCount, color: "#f59e0b", percent: totalActiveSla > 0 ? Math.round((warningCount / totalActiveSla) * 100) : 0 },
            { name: "Melewati Estimasi", shortName: "Overdue", value: overdueCount, color: "#ef4444", percent: totalActiveSla > 0 ? Math.round((overdueCount / totalActiveSla) * 100) : 0 },
            { name: "Menunggu Persetujuan", shortName: "Pause (ACC)", value: pendingApprovalCount, color: "#64748b", percent: totalActiveSla > 0 ? Math.round((pendingApprovalCount / totalActiveSla) * 100) : 0 },
        ];

        return res.json({
            totalCustomer,
            totalPerangkat,
            tiketAktif,
            tiketSelesai,
            sparepartHampirHabis,
            pendapatanBulanIni: pendapatanBulanIni._sum.total_biaya || 0,
            chartData,
            recentActivities,
            trendPendapatan,
            rataRataHari,
            totalTiketSelesaiDihitung: completedTickets.length,
            topKerusakan,
            expressCount,
            overdueCount,
            slaSummary: {
                totalActive: totalActiveSla,
                expressCount,
                overdueCount,
                warningCount,
                onTrackCount,
                pendingApprovalCount,
                chartData: slaChartData
            },
            totalWikis
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Dashboard Teknisi
async function teknisiDashboard(req, res) {
    try {
        const teknisiId = req.user.id;
        const now = new Date();

        const [
            tiketDitugaskan, 
            tiketTersedia, 
            menungguDiagnosis, 
            dalamPerbaikan, 
            tiketSelesai, 
            tiketBerdasarkanStatus, 
            activeTickets,
            activeTiketsForSla
        ] = await Promise.all([
            prisma.tiketServis.count({
                where: { 
                    teknisi_id: teknisiId,
                    status: { notIn: ["selesai", "diambil", "dibatalkan"] } 
                },
            }),
            prisma.tiketServis.count({
                where: { status: "diterima", teknisi_id: null },
            }),
            prisma.tiketServis.count({
                where: { teknisi_id: teknisiId, status: "diterima" },
            }),
            prisma.tiketServis.count({
                where: { teknisi_id: teknisiId, status: "dalam_perbaikan" },
            }),
            prisma.tiketServis.count({
                where: {
                    teknisi_id: teknisiId,
                    status: { in: ["selesai", "diambil"] },
                },
            }),
            prisma.tiketServis.groupBy({
                by: ['status'],
                where: { 
                    teknisi_id: teknisiId,
                    status: { notIn: ["selesai", "diambil", "dibatalkan"] }
                },
                _count: { _all: true }
            }),
            prisma.tiketServis.findMany({
                where: { 
                    teknisi_id: teknisiId,
                    status: { notIn: ["selesai", "diambil", "dibatalkan"] }
                },
                include: {
                    perangkat: {
                        include: { customer: true }
                    }
                },
                orderBy: { created_at: 'desc' },
                take: 5
            }),
            prisma.tiketServis.findMany({
                where: {
                    teknisi_id: teknisiId,
                    status: { notIn: ["selesai", "diambil", "dibatalkan"] }
                },
                select: {
                    id: true,
                    status: true,
                    sla_paket: true,
                    target_pengecekan_at: true,
                    target_selesai_at: true,
                    created_at: true,
                    status_estimasi: true
                }
            })
        ]);

        // SLA Analytics Engine for Teknisi
        let expressCount = 0;
        let overdueCount = 0;
        let warningCount = 0;
        let onTrackCount = 0;
        let pendingApprovalCount = 0;

        for (const t of activeTiketsForSla) {
            if (t.sla_paket === "express") expressCount++;
            const sla = getSlaStatus(t);
            if (sla.is_paused) {
                pendingApprovalCount++;
            } else if (sla.is_overdue) {
                overdueCount++;
            } else if (sla.is_warning) {
                warningCount++;
            } else {
                onTrackCount++;
            }
        }

        const totalActiveSla = activeTiketsForSla.length;
        const slaChartData = [
            { name: "Sesuai Estimasi", shortName: "On Track", value: onTrackCount, color: "#10b981", percent: totalActiveSla > 0 ? Math.round((onTrackCount / totalActiveSla) * 100) : 0 },
            { name: "Mendekati Batas", shortName: "Warning (<12j)", value: warningCount, color: "#f59e0b", percent: totalActiveSla > 0 ? Math.round((warningCount / totalActiveSla) * 100) : 0 },
            { name: "Melewati Estimasi", shortName: "Overdue", value: overdueCount, color: "#ef4444", percent: totalActiveSla > 0 ? Math.round((overdueCount / totalActiveSla) * 100) : 0 },
            { name: "Menunggu Persetujuan", shortName: "Pause (ACC)", value: pendingApprovalCount, color: "#64748b", percent: totalActiveSla > 0 ? Math.round((pendingApprovalCount / totalActiveSla) * 100) : 0 },
        ];

        // Transform chart data
        const chartData = tiketBerdasarkanStatus.map(item => ({
            name: item.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            value: item._count._all
        }));

        const enrichedActiveTickets = activeTickets.map(t => ({
            ...t,
            sla_status: getSlaStatus(t)
        }));

        return res.json({
            tiketDitugaskan,
            tiketTersedia,
            menungguDiagnosis,
            dalamPerbaikan,
            tiketSelesai,
            chartData,
            activeTickets: enrichedActiveTickets,
            expressCount,
            overdueCount,
            slaSummary: {
                totalActive: totalActiveSla,
                expressCount,
                overdueCount,
                warningCount,
                onTrackCount,
                pendingApprovalCount,
                chartData: slaChartData
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Daftar teknisi untuk dropdown
async function teknisiList(req, res) {
    try {
        const teknisis = await prisma.user.findMany({
            where: { role: "teknisi" },
            select: { id: true, nama: true, email: true },
        });

        return res.json(teknisis);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

async function exportActivities(req, res) {
    try {
        const dateParam = req.query.date || new Date().toISOString().split("T")[0];
        
        // Buat rentang waktu untuk hari yang dipilih (00:00:00 sampai 23:59:59)
        const startDate = new Date(`${dateParam}T00:00:00.000Z`);
        const endDate = new Date(`${dateParam}T23:59:59.999Z`);

        const activities = await prisma.activityLog.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate,
                }
            },
            orderBy: { created_at: "asc" },
        });

        // Convert to CSV
        const header = "ID,User ID,User Nama,Action,Created At\n";
        const rows = activities.map(a => `${a.id},${a.user_id},"${a.user_nama}","${a.action.replace(/"/g, '""')}","${a.created_at.toISOString()}"`).join("\n");
        const csv = header + rows;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=activity_log_${dateParam}.csv`);
        return res.send(csv);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

async function exportDatabase(req, res) {
    try {
        const [
            rawUsers, customers, perangkats, tiketServis, diagnosis, logPerbaikans,
            brands, spareparts, penggunaanSpareparts, restockLogs, invoices, activityLogs
        ] = await Promise.all([
            prisma.user.findMany(),
            prisma.customer.findMany(),
            prisma.perangkat.findMany(),
            prisma.tiketServis.findMany(),
            prisma.diagnosis.findMany(),
            prisma.logPerbaikan.findMany(),
            prisma.brand.findMany(),
            prisma.sparepart.findMany(),
            prisma.penggunaanSparepart.findMany(),
            prisma.restockLog.findMany(),
            prisma.invoice.findMany(),
            prisma.activityLog.findMany(),
        ]);

        // Strip sensitive credentials (password hashes and reset tokens)
        const users = rawUsers.map(({ password, reset_password_token, reset_password_expires, ...safeUser }) => safeUser);

        const dbExport = {
            users,
            customers,
            perangkats,
            tiketServis,
            diagnosis,
            logPerbaikans,
            brands,
            spareparts,
            penggunaanSpareparts,
            restockLogs,
            invoices,
            activityLogs,
            exportedAt: new Date().toISOString()
        };

        const jsonString = JSON.stringify(dbExport, null, 2);
        
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename=servio_db_backup_${new Date().toISOString().split('T')[0]}.json`);
        return res.send(jsonString);
    } catch (error) {
        return res.status(500).json({ message: "Gagal mengekspor database", error: error.message });
    }
}

module.exports = { adminDashboard, teknisiDashboard, teknisiList, exportActivities, exportDatabase };
