const prisma = require("../config/database");

// Dashboard Admin
async function adminDashboard(req, res) {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalCustomer,
            totalPerangkat,
            tiketAktif,
            tiketSelesai,
            sparepartHampirHabis,
            pendapatanBulanIni,
            tiketBerdasarkanStatus,
            recentActivities
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
                take: 8, // Batasi 8 item agar dashboard tidak memanjang
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
            })
        ]);

        // Transform chart data
        const chartData = tiketBerdasarkanStatus.map(item => ({
            name: item.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            value: item._count._all
        }));

        return res.json({
            totalCustomer,
            totalPerangkat,
            tiketAktif,
            tiketSelesai,
            sparepartHampirHabis,
            pendapatanBulanIni: pendapatanBulanIni._sum.total_biaya || 0,
            chartData,
            recentActivities
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Dashboard Teknisi
async function teknisiDashboard(req, res) {
    try {
        const teknisiId = req.user.id;

        const [tiketDitugaskan, tiketTersedia, menungguDiagnosis, dalamPerbaikan, tiketSelesai, tiketBerdasarkanStatus, activeTickets] =
            await Promise.all([
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
                })
            ]);

        // Transform chart data
        const chartData = tiketBerdasarkanStatus.map(item => ({
            name: item.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            value: item._count._all
        }));

        return res.json({
            tiketDitugaskan,
            tiketTersedia,
            menungguDiagnosis,
            dalamPerbaikan,
            tiketSelesai,
            chartData,
            activeTickets
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
            users, customers, perangkats, tiketServis, diagnosis, logPerbaikans,
            brands, spareparts, penggunaanSpareparts, invoices, activityLogs
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
            prisma.invoice.findMany(),
            prisma.activityLog.findMany(),
        ]);

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
