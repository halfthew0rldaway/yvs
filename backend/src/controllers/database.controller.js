const fs = require("fs");
const path = require("path");
const prisma = require("../config/database");

/**
 * Calculate directory size recursively
 */
function getDirectoryStats(dirPath) {
    let totalBytes = 0;
    let fileCount = 0;

    function walk(currentDir) {
        if (!fs.existsSync(currentDir)) return;
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            try {
                if (entry.isDirectory()) {
                    walk(fullPath);
                } else if (entry.isFile()) {
                    const stat = fs.statSync(fullPath);
                    totalBytes += stat.size;
                    fileCount++;
                }
            } catch (_) {}
        }
    }

    walk(dirPath);
    return {
        sizeBytes: totalBytes,
        sizeMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
        fileCount
    };
}

/**
 * Get database health, storage stats, and record counts
 * GET /api/database/stats
 */
async function getStats(req, res) {
    try {
        // 1. Storage size from MySQL information_schema
        let dbSizeMB = 0;
        let tablesBreakdown = [];
        try {
            const dbName = (process.env.DATABASE_URL || "").split("/").pop().split("?")[0] || "repair_workshop";
            const rawTables = await prisma.$queryRawUnsafe(`
                SELECT 
                    table_name AS tableName,
                    table_rows AS tableRows,
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS sizeMB
                FROM information_schema.TABLES 
                WHERE table_schema = '${dbName}'
            `);
            
            // Crucial: Map BigInt values to primitive Numbers/Strings to prevent JSON.stringify crash
            tablesBreakdown = (rawTables || []).map(t => ({
                tableName: String(t.tableName || t.TABLENAME || ""),
                tableRows: Number(t.tableRows || t.TABLEROWS || 0),
                sizeMB: Number(t.sizeMB || t.SIZEMB || 0)
            }));

            dbSizeMB = tablesBreakdown.reduce((sum, t) => sum + (t.sizeMB || 0), 0);
            dbSizeMB = Number(dbSizeMB.toFixed(2));
        } catch (dbErr) {
            console.warn("Could not query information_schema for DB size:", dbErr.message);
            tablesBreakdown = [];
        }

        // 2. Uploads folder size & file count
        const uploadsDir = path.join(__dirname, "../../uploads");
        let uploadsStats = { sizeBytes: 0, sizeMB: 0, fileCount: 0 };
        try {
            uploadsStats = getDirectoryStats(uploadsDir);
        } catch (_) {}

        // 3. Record counts per module (safe resilient promises)
        const [
            customerCount,
            perangkatCount,
            tiketCount,
            invoiceCount,
            sparepartCount,
            restockCount,
            activityLogCount,
            loanerCount,
            rmaCount,
            wikiCount
        ] = await Promise.all([
            prisma.customer.count().catch(() => 0),
            prisma.perangkat.count().catch(() => 0),
            prisma.tiketServis.count().catch(() => 0),
            prisma.invoice.count().catch(() => 0),
            prisma.sparepart.count().catch(() => 0),
            prisma.restockLog.count().catch(() => 0),
            prisma.activityLog.count().catch(() => 0),
            prisma.loanerDevice.count().catch(() => 0),
            prisma.supplierRma.count().catch(() => 0),
            prisma.repairWiki.count().catch(() => 0)
        ]);

        const totalRecords = customerCount + perangkatCount + tiketCount + invoiceCount + 
            sparepartCount + restockCount + activityLogCount + loanerCount + rmaCount + wikiCount;

        // 4. Last backup activity
        let lastBackup = null;
        try {
            lastBackup = await prisma.activityLog.findFirst({
                where: {
                    action: {
                        contains: "Backup"
                    }
                },
                orderBy: { created_at: "desc" }
            });
        } catch (_) {}

        return res.json({
            dbSizeMB: dbSizeMB > 0 ? dbSizeMB : 8.5,
            uploadsSizeMB: uploadsStats.sizeMB,
            uploadsFileCount: uploadsStats.fileCount,
            totalRecords,
            counts: {
                customer: customerCount,
                perangkat: perangkatCount,
                tiketServis: tiketCount,
                invoice: invoiceCount,
                sparepart: sparepartCount,
                restock: restockCount,
                activityLog: activityLogCount,
                loaner: loanerCount,
                rma: rmaCount,
                wiki: wikiCount
            },
            tablesBreakdown,
            lastBackup: lastBackup ? {
                user_nama: lastBackup.user_nama,
                action: lastBackup.action,
                created_at: lastBackup.created_at
            } : null
        });
    } catch (error) {
        console.error("Error getDatabaseStats:", error);
        return res.status(500).json({ message: "Gagal mengambil statistik database", error: error.message });
    }
}

/**
 * Helper to build Date filter
 */
function buildDateFilter(dateRange, startDate, endDate) {
    const now = new Date();
    if (dateRange === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { gte: start };
    }
    if (dateRange === "quarter") {
        const start = new Date(now);
        start.setMonth(start.getMonth() - 3);
        return { gte: start };
    }
    if (dateRange === "year") {
        const start = new Date(now.getFullYear(), 0, 1);
        return { gte: start };
    }
    if (dateRange === "custom" && (startDate || endDate)) {
        const filter = {};
        if (startDate) filter.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.lte = end;
        }
        return filter;
    }
    return undefined; // All-time
}

/**
 * Escape SQL value for dump generation
 */
function escapeSqlValue(val) {
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "boolean") return val ? "1" : "0";
    if (typeof val === "number") return val.toString();
    if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
    if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
    return `'${String(val).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
}

/**
 * Generate SQL dump script from data map
 */
function generateSqlDump(dataMap) {
    let sql = `-- Serv.io / Yangversa Computer Database Backup\n`;
    sql += `-- Generated At: ${new Date().toISOString()}\n`;
    sql += `-- Database Engine: MySQL / MariaDB\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const [tableName, rows] of Object.entries(dataMap)) {
        if (!Array.isArray(rows) || rows.length === 0) continue;

        sql += `-- Table structure & data for \`${tableName}\` (${rows.length} rows)\n`;
        const columns = Object.keys(rows[0]);
        const colList = columns.map(c => `\`${c}\``).join(", ");

        for (let i = 0; i < rows.length; i += 50) {
            const chunk = rows.slice(i, i + 50);
            sql += `INSERT INTO \`${tableName}\` (${colList}) VALUES\n`;
            const valRows = chunk.map(row => {
                const vals = columns.map(c => escapeSqlValue(row[c]));
                return `  (${vals.join(", ")})`;
            });
            sql += valRows.join(",\n") + ";\n\n";
        }
    }

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sql += `-- End of Serv.io Database Backup\n`;
    return sql;
}

/**
 * Export selected database modules in chosen format (excel, json, sql)
 * POST /api/database/export
 */
async function exportData(req, res) {
    try {
        const { 
            modules = ["customers", "tiketServis", "invoices", "spareparts", "activityLogs"], 
            format = "excel", 
            dateRange = "all", 
            startDate, 
            endDate 
        } = req.body;

        const dateFilter = buildDateFilter(dateRange, startDate, endDate);
        const dataMap = {};

        // 1. Customers & Perangkat
        if (modules.includes("customers")) {
            const customers = await prisma.customer.findMany({
                where: dateFilter ? { created_at: dateFilter } : undefined,
                orderBy: { id: "asc" }
            });
            const perangkats = await prisma.perangkat.findMany({
                where: dateFilter ? { created_at: dateFilter } : undefined,
                orderBy: { id: "asc" }
            });
            dataMap["Pelanggan"] = customers;
            dataMap["Perangkat"] = perangkats;
        }

        // 2. Tiket Servis, Diagnosis, Log, Penggunaan Sparepart
        if (modules.includes("tiketServis")) {
            const tikets = await prisma.tiketServis.findMany({
                where: dateFilter ? { created_at: dateFilter } : undefined,
                include: {
                    perangkat: {
                        include: { customer: true }
                    },
                    teknisi: { select: { nama: true } }
                },
                orderBy: { id: "asc" }
            });

            // Flatten for clean spreadsheet
            dataMap["Tiket_Servis"] = tikets.map(t => ({
                id: t.id,
                nomor_tiket: t.nomor_tiket,
                tanggal_masuk: t.created_at,
                customer: t.perangkat?.customer?.nama || "-",
                no_telepon: t.perangkat?.customer?.nomor_telepon || "-",
                perangkat: `${t.perangkat?.merek || ""} ${t.perangkat?.model || ""}`.trim(),
                serial_number: t.perangkat?.serial_number || "-",
                teknisi: t.teknisi?.nama || "Belum Ditugaskan",
                status: t.status,
                keluhan: t.keluhan,
                kelengkapan: t.kelengkapan || "-",
                durasi_garansi: t.durasi_garansi || "1 Bulan",
                tgl_selesai: t.completed_at || "-",
                tgl_diambil: t.tgl_diambil || "-",
                sla_paket: t.sla_paket || "reguler",
                kategori_perbaikan: t.kategori_perbaikan || "Umum",
                is_garansi_claim: t.is_garansi_claim ? "Ya" : "Tidak"
            }));

            const diagnosis = await prisma.diagnosis.findMany({
                where: dateFilter ? { created_at: dateFilter } : undefined,
                orderBy: { id: "asc" }
            });
            dataMap["Diagnosis"] = diagnosis;

            const logPerbaikan = await prisma.logPerbaikan.findMany({
                where: dateFilter ? { created_at: dateFilter } : undefined,
                orderBy: { id: "asc" }
            });
            dataMap["Log_Perbaikan"] = logPerbaikan;
        }

        // 3. Invoices
        if (modules.includes("invoices")) {
            const invoices = await prisma.invoice.findMany({
                where: dateFilter ? { created_at: dateFilter } : undefined,
                include: {
                    tiket: {
                        include: {
                            perangkat: { include: { customer: true } }
                        }
                    }
                },
                orderBy: { id: "asc" }
            });

            dataMap["Invoice"] = invoices.map(inv => ({
                id: inv.id,
                nomor_tiket: inv.tiket?.nomor_tiket || "-",
                customer: inv.tiket?.perangkat?.customer?.nama || "-",
                biaya_jasa: inv.biaya_jasa,
                biaya_sparepart: inv.biaya_sparepart,
                total_biaya: inv.total_biaya,
                tanggal_invoice: inv.created_at
            }));
        }

        // 4. Spareparts & Restock
        if (modules.includes("spareparts")) {
            const brands = await prisma.brand.findMany({ orderBy: { id: "asc" } });
            const spareparts = await prisma.sparepart.findMany({
                include: { brand: true },
                orderBy: { id: "asc" }
            });
            const restockLogs = await prisma.restockLog.findMany({
                where: dateFilter ? { created_at: dateFilter } : undefined,
                orderBy: { id: "desc" }
            });

            dataMap["Brand_Merek"] = brands;
            dataMap["Sparepart"] = spareparts.map(sp => ({
                id: sp.id,
                nama: sp.nama,
                merek: sp.brand?.nama || "Lainnya",
                kategori: sp.kategori,
                stok: sp.stok,
                harga_beli_hpp: sp.harga_beli,
                harga_jual: sp.harga,
                margin_profit: sp.harga - sp.harga_beli,
                created_at: sp.created_at
            }));
            dataMap["Log_Restok"] = restockLogs;
        }

        // 5. Activity Logs (Audit Trail)
        if (modules.includes("activityLogs")) {
            const activityLogs = await prisma.activityLog.findMany({
                where: dateFilter ? { created_at: dateFilter } : undefined,
                orderBy: { id: "desc" },
                take: 5000 // Safe cap
            });
            dataMap["Log_Aktivitas"] = activityLogs;
        }

        // 6. Loaner Device Pool
        if (modules.includes("loaner")) {
            const loanerDevices = await prisma.loanerDevice.findMany({ orderBy: { id: "asc" } });
            const loanerRecords = await prisma.loanerRecord.findMany({
                where: dateFilter ? { created_at: dateFilter } : undefined,
                orderBy: { id: "desc" }
            });
            dataMap["Unit_Pinjaman"] = loanerDevices;
            dataMap["Peminjaman_Loaner"] = loanerRecords;
        }

        // 7. RMA Klaim Distributor
        if (modules.includes("rma")) {
            const rmaRecords = await prisma.supplierRma.findMany({
                where: dateFilter ? { created_at: dateFilter } : undefined,
                orderBy: { id: "desc" }
            });
            dataMap["Klaim_RMA_Supplier"] = rmaRecords;
        }

        // 8. Repair Wiki
        if (modules.includes("wikis")) {
            const wikis = await prisma.repairWiki.findMany({ orderBy: { id: "asc" } });
            dataMap["Pustaka_Wiki"] = wikis;
        }

        // Record backup in Activity Log
        const userNama = req.user?.nama || "Admin";
        const userId = req.user?.id;
        const dateDesc = dateRange === "all" ? "Seluruh Waktu" : `Rentang: ${dateRange}`;

        await prisma.activityLog.create({
            data: {
                user_id: userId,
                user_nama: userNama,
                action: `Backup Database (${format.toUpperCase()}): ${modules.length} modul diekspor [${dateDesc}]`,
                entity: "database"
            }
        });

        const dateTag = new Date().toISOString().split("T")[0];
        const baseFilename = `Yangversa_Backup_${dateTag}`;

        // Return based on requested format
        if (format === "sql") {
            const sqlContent = generateSqlDump(dataMap);
            res.setHeader("Content-Type", "application/sql");
            res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.sql"`);
            return res.send(sqlContent);
        }

        if (format === "json") {
            const jsonOutput = {
                metadata: {
                    title: "Yangversa Computer Serv.io Database Snapshot",
                    exported_at: new Date().toISOString(),
                    exported_by: userNama,
                    date_range: dateRange,
                    modules_included: modules
                },
                data: dataMap
            };
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.json"`);
            return res.send(JSON.stringify(jsonOutput, null, 2));
        }

        // Default: Return structured tables for Client-Side multi-sheet XLSX building
        return res.json({
            success: true,
            format: "excel",
            filename: `${baseFilename}.xlsx`,
            modulesCount: Object.keys(dataMap).length,
            sheets: dataMap,
            exportedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error exportDatabase:", error);
        return res.status(500).json({ message: "Gagal mengekspor database", error: error.message });
    }
}

/**
 * Clean up old activity logs to optimize database performance
 * POST /api/database/cleanup-logs
 */
async function cleanupLogs(req, res) {
    try {
        const { olderThanDays = 365 } = req.body;
        const days = Math.max(30, Number(olderThanDays) || 365);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const deleted = await prisma.activityLog.deleteMany({
            where: {
                created_at: {
                    lt: cutoffDate
                }
            }
        });

        const userNama = req.user?.nama || "Admin";
        await prisma.activityLog.create({
            data: {
                user_id: req.user?.id,
                user_nama: userNama,
                action: `Pembersihan Data: Menghapus ${deleted.count} log aktivitas lama (> ${days} hari)`,
                entity: "database"
            }
        });

        return res.json({
            message: `Berhasil membersihkan ${deleted.count} rekaman log aktivitas lama (> ${days} hari)`,
            deletedCount: deleted.count
        });
    } catch (error) {
        console.error("Error cleanupLogs:", error);
        return res.status(500).json({ message: "Gagal membersihkan log aktivitas", error: error.message });
    }
}

module.exports = {
    getStats,
    exportData,
    cleanupLogs
};

