const prisma = require("../config/database");
const { 
    generateNomorTiket, 
    getNextNomorTiket, 
    calculateWarrantyExpiry, 
    getWarrantyStatus,
    calculateSlaPengecekanTarget,
    calculateSlaPengerjaanTarget,
    calculateSlaTarget,
    getSlaStatus
} = require("../utils/tiket");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");

// Validasi transisi status yang diizinkan
const STATUS_TRANSITIONS = {
    diterima: ["didiagnosis", "dibatalkan"],
    didiagnosis: ["menunggu_persetujuan", "dibatalkan"],
    menunggu_persetujuan: ["disetujui", "dibatalkan"],
    disetujui: ["dalam_perbaikan", "dibatalkan"],
    dalam_perbaikan: ["selesai"],
    selesai: ["diambil"],
    diambil: [],
    dibatalkan: [],
};

// Mengambil seluruh tiket servis
async function getAll(req, res) {
    try {
        const { status, teknisi_id, search, sortOrder, sla_paket, sla_urgency } = req.query;
        const { isPaginated, page, limit, skip } = parsePagination(req.query);
        const where = {};

        if (status && status !== "garansi_expiring" && status !== "aktif") {
            where.status = status;
        } else if (status === "aktif") {
            where.status = {
                notIn: ["selesai", "diambil", "dibatalkan"],
            };
        } else if (status === "garansi_expiring") {
            const now = new Date();
            const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            where.garansi_berakhir_at = {
                gte: now,
                lte: in7days,
            };
        }

        if (sla_paket && sla_paket !== "all") {
            where.sla_paket = sla_paket;
        }

        if (sla_urgency === "overdue") {
            // SLA Overdue membedakan 2 fase:
            // 1. Fase Pengecekan: status diterima/didiagnosis & target_pengecekan_at < now
            // 2. Fase Pengerjaan: status disetujui/dalam_perbaikan & target_selesai_at < now
            // PENTING: Status 'menunggu_persetujuan' bersifat IDLE/PAUSED (tidak dikenakan penalti overdue)
            const now = new Date();
            where.OR = [
                {
                    status: { in: ["diterima", "didiagnosis"] },
                    target_pengecekan_at: { lt: now }
                },
                {
                    status: { in: ["disetujui", "dalam_perbaikan"] },
                    target_selesai_at: { lt: now }
                }
            ];
        } else if (sla_urgency === "warning") {
            const now = new Date();
            const in12hours = new Date(Date.now() + 12 * 60 * 60 * 1000);
            where.OR = [
                {
                    status: { in: ["diterima", "didiagnosis"] },
                    target_pengecekan_at: { gte: now, lte: in12hours }
                },
                {
                    status: { in: ["disetujui", "dalam_perbaikan"] },
                    target_selesai_at: { gte: now, lte: in12hours }
                }
            ];
        }

        if (teknisi_id) {
            where.teknisi_id = Number(teknisi_id);
        }

        if (search) {
            where.OR = [
                { nomor_tiket: { contains: search } },
                { keluhan: { contains: search } },
                { perangkat: { customer: { nama: { contains: search } } } },
                { perangkat: { merek: { contains: search } } },
                { perangkat: { model: { contains: search } } },
                { teknisi: { nama: { contains: search } } },
            ];
        }

        const orderDirection = sortOrder === "asc" ? "asc" : "desc";
        const orderBy = [{ created_at: orderDirection }, { id: orderDirection }];

        const include = {
            perangkat: { include: { customer: true } },
            teknisi: { select: { id: true, nama: true } },
            invoice: { select: { id: true, total_biaya: true } },
        };

        if (!isPaginated) {
            const tikets = await prisma.tiketServis.findMany({
                where,
                include,
                orderBy,
            });

            const enrichedTikets = tikets.map(t => ({
                ...t,
                warranty_status: getWarrantyStatus(t),
                sla_status: getSlaStatus(t)
            }));

            return res.json(enrichedTikets);
        }

        const now = new Date();
        const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [total, tikets, unassignedCount, expiringWarrantyCount, expressCount, overdueCount] = await Promise.all([
            prisma.tiketServis.count({ where }),
            prisma.tiketServis.findMany({
                where,
                include,
                orderBy,
                skip,
                take: limit,
            }),
            prisma.tiketServis.count({ where: { status: "diterima", teknisi_id: null } }),
            prisma.tiketServis.count({
                where: {
                    garansi_berakhir_at: {
                        gte: now,
                        lte: in7days,
                    }
                }
            }),
            prisma.tiketServis.count({
                where: {
                    status: { notIn: ["selesai", "diambil", "dibatalkan"] },
                    sla_paket: "express"
                }
            }),
            prisma.tiketServis.count({
                where: {
                    OR: [
                        {
                            status: { in: ["diterima", "didiagnosis"] },
                            target_pengecekan_at: { lt: now }
                        },
                        {
                            status: { in: ["disetujui", "dalam_perbaikan"] },
                            target_selesai_at: { lt: now }
                        }
                    ]
                }
            })
        ]);

        const enrichedTikets = tikets.map(t => ({
            ...t,
            warranty_status: getWarrantyStatus(t),
            sla_status: getSlaStatus(t)
        }));

        return res.json(buildPaginationResponse(enrichedTikets, total, page, limit, {
            counts: {
                unassigned: unassignedCount,
                expiringWarranty: expiringWarrantyCount,
                express: expressCount,
                overdue: overdueCount,
            }
        }));
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil tiket servis berdasarkan ID (termasuk Riwayat Medis Perangkat / Device History)
async function getById(req, res) {
    try {
        const id = Number(req.params.id);
        const tiket = await prisma.tiketServis.findUnique({
            where: { id },
            include: {
                perangkat: {
                    include: {
                        customer: true,
                        tiket_servis: {
                            where: { id: { not: id } },
                            include: {
                                teknisi: { select: { id: true, nama: true } },
                                diagnosis: true,
                                penggunaan_sparepart: { include: { sparepart: true } },
                                invoice: true
                            },
                            orderBy: { created_at: "desc" }
                        }
                    }
                },
                teknisi: { select: { id: true, nama: true } },
                diagnosis: true,
                log_perbaikan: { orderBy: { created_at: "desc" } },
                penggunaan_sparepart: { include: { sparepart: { include: { brand: true } } } },
                invoice: true,
            },
        });

        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        return res.json({
            ...tiket,
            warranty_status: getWarrantyStatus(tiket),
            sla_status: getSlaStatus(tiket)
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Membuat tiket servis baru (termasuk Kredensial Perangkat, SOP Checklist, Permission, SLA & Defect Map)
async function create(req, res) {
    try {
        const { 
            perangkat_id, 
            teknisi_id, 
            keluhan, 
            kelengkapan, 
            kelengkapan_detail, 
            checklist_intake, 
            tipe_kunci, 
            password_perangkat,
            izin_bongkar,
            izin_akses_os,
            izin_backup_mandiri,
            batasan_izin,
            kondisi_fisik,
            spesifikasi_awal,
            prioritas_pelanggan,
            defect_map,
            sla_paket,
            target_selesai_at
        } = req.body;

        const perangkat = await prisma.perangkat.findUnique({ where: { id: Number(perangkat_id) } });
        if (!perangkat) {
            return res.status(404).json({ message: "Perangkat tidak ditemukan" });
        }

        // Process uploaded files if any
        let foto_kondisi = null;
        if (req.files && req.files.length > 0) {
            foto_kondisi = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Parse intake checklist if stringified
        let parsedIntake = null;
        if (checklist_intake) {
            parsedIntake = typeof checklist_intake === 'string' ? JSON.parse(checklist_intake) : checklist_intake;
        }

        let parsedKelengkapanDetail = null;
        if (kelengkapan_detail) {
            parsedKelengkapanDetail = typeof kelengkapan_detail === 'string' ? JSON.parse(kelengkapan_detail) : kelengkapan_detail;
        }

        let parsedDefectMap = null;
        if (defect_map) {
            parsedDefectMap = typeof defect_map === 'string' ? JSON.parse(defect_map) : defect_map;
        }

        // Parse boolean permission flags from form-data
        const parsedIzinBongkar = izin_bongkar !== undefined ? (izin_bongkar === true || izin_bongkar === 'true' || izin_bongkar === '1') : true;
        const parsedIzinAksesOs = izin_akses_os !== undefined ? (izin_akses_os === true || izin_akses_os === 'true' || izin_akses_os === '1') : true;
        const parsedIzinBackup = izin_backup_mandiri !== undefined ? (izin_backup_mandiri === true || izin_backup_mandiri === 'true' || izin_backup_mandiri === '1') : true;

        const selectedSlaPaket = (sla_paket || "reguler").toLowerCase();
        const calculatedTargetPengecekan = calculateSlaPengecekanTarget(new Date(), selectedSlaPaket);
        const calculatedTargetSelesai = target_selesai_at 
            ? new Date(target_selesai_at) 
            : calculateSlaPengerjaanTarget(new Date(), selectedSlaPaket);

        let tiket = null;
        let retries = 3;
        let offset = 0;

        while (retries > 0) {
            try {
                const nomor_tiket = await getNextNomorTiket(prisma, offset);
                tiket = await prisma.tiketServis.create({
                    data: {
                        nomor_tiket,
                        perangkat_id: Number(perangkat_id),
                        teknisi_id: teknisi_id ? Number(teknisi_id) : null,
                        keluhan,
                        kelengkapan,
                        kelengkapan_detail: parsedKelengkapanDetail,
                        foto_kondisi: foto_kondisi ? JSON.stringify(foto_kondisi) : null,
                        checklist_intake: parsedIntake,
                        tipe_kunci: tipe_kunci || "Tidak Ada",
                        password_perangkat: password_perangkat || null,
                        izin_bongkar: parsedIzinBongkar,
                        izin_akses_os: parsedIzinAksesOs,
                        izin_backup_mandiri: parsedIzinBackup,
                        batasan_izin: batasan_izin || null,
                        kondisi_fisik: kondisi_fisik || "Bersih",
                        spesifikasi_awal: spesifikasi_awal || null,
                        prioritas_pelanggan: prioritas_pelanggan || "Standar",
                        defect_map: parsedDefectMap,
                        sla_paket: selectedSlaPaket,
                        target_pengecekan_at: calculatedTargetPengecekan,
                        target_selesai_at: calculatedTargetSelesai,
                        status: "diterima",
                    },
                    include: {
                        perangkat: { include: { customer: true } },
                        teknisi: { select: { id: true, nama: true } },
                    },
                });
                break;
            } catch (err) {
                if (err.code === 'P2002' && err.meta?.target?.includes('nomor_tiket')) {
                    retries--;
                    offset++;
                    if (retries === 0) throw err;
                } else {
                    throw err;
                }
            }
        }

        return res.status(201).json({ 
            message: "Tiket servis berhasil dibuat", 
            data: {
                ...tiket,
                warranty_status: getWarrantyStatus(tiket),
                sla_status: getSlaStatus(tiket)
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui tiket servis (status, teknisi, checklist, kredensial, garansi, izin SOP, SLA & Defect Map)
async function update(req, res) {
    try {
        const { 
            status, 
            teknisi_id, 
            keluhan, 
            catatan_admin, 
            kategori_perbaikan, 
            durasi_garansi, 
            checklist_intake, 
            checklist_qc, 
            tips_perawatan, 
            kelengkapan_detail, 
            tipe_kunci, 
            password_perangkat,
            izin_bongkar,
            izin_akses_os,
            izin_backup_mandiri,
            batasan_izin,
            kondisi_fisik,
            spesifikasi_awal,
            prioritas_pelanggan,
            defect_map,
            sla_paket,
            target_pengecekan_at,
            target_selesai_at,
            disetujui_at
        } = req.body;
        const id = Number(req.params.id);

        const tiket = await prisma.tiketServis.findUnique({ where: { id } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        // Validasi transisi status
        if (status && status !== tiket.status) {
            const allowed = STATUS_TRANSITIONS[tiket.status] || [];
            if (!allowed.includes(status)) {
                return res.status(400).json({
                    message: `Transisi status tidak valid: ${tiket.status} → ${status}`,
                });
            }

            // RBAC: Teknisi hanya bisa mengubah status menjadi 'selesai' dari 'dalam_perbaikan'
            if (req.user.role === "teknisi") {
                if (status !== "selesai") {
                    return res.status(403).json({
                        message: "Akses ditolak: Teknisi hanya diizinkan memperbarui status ke 'selesai'. Tahap 'dalam_perbaikan' harus dimulai oleh Admin.",
                    });
                }
                if (tiket.status !== "dalam_perbaikan") {
                    return res.status(403).json({
                        message: "Akses ditolak: Tiket harus dalam status 'dalam perbaikan' untuk diselesaikan.",
                    });
                }

                // Proteksi: Pastikan teknisi sudah mengisi log perbaikan sebelum menyelesaikan
                const logPerbaikan = await prisma.logPerbaikan.findFirst({
                    where: { tiket_id: id, fase: "Perbaikan" }
                });
                if (!logPerbaikan) {
                    return res.status(400).json({
                        message: "Proteksi: Anda harus menambahkan minimal satu Log Perbaikan sebelum dapat menyelesaikan tiket ini.",
                    });
                }
            }
        }

        // RBAC: Teknisi hanya boleh ambil alih jika kosong, dan hanya boleh edit tiket sendiri
        if (req.user.role === "teknisi") {
            if (teknisi_id && teknisi_id !== req.user.id) {
                return res.status(403).json({ message: "Akses ditolak: Anda tidak bisa menugaskan tiket ke teknisi lain." });
            }
            if (tiket.teknisi_id && tiket.teknisi_id !== req.user.id) {
                return res.status(403).json({ message: "Akses ditolak: Ini bukan tiket Anda." });
            }
        }

        const updateData = {
            status: status || undefined,
            teknisi_id: teknisi_id !== undefined ? (teknisi_id ? Number(teknisi_id) : null) : undefined,
            keluhan: keluhan || undefined,
            kategori_perbaikan: kategori_perbaikan !== undefined ? kategori_perbaikan : undefined,
            durasi_garansi: durasi_garansi !== undefined ? durasi_garansi : undefined,
            checklist_intake: checklist_intake !== undefined ? (typeof checklist_intake === 'string' ? JSON.parse(checklist_intake) : checklist_intake) : undefined,
            checklist_qc: checklist_qc !== undefined ? (typeof checklist_qc === 'string' ? JSON.parse(checklist_qc) : checklist_qc) : undefined,
            tips_perawatan: tips_perawatan !== undefined ? tips_perawatan : undefined,
            kelengkapan_detail: kelengkapan_detail !== undefined ? (typeof kelengkapan_detail === 'string' ? JSON.parse(kelengkapan_detail) : kelengkapan_detail) : undefined,
            tipe_kunci: tipe_kunci !== undefined ? tipe_kunci : undefined,
            password_perangkat: password_perangkat !== undefined ? password_perangkat : undefined,
            izin_bongkar: izin_bongkar !== undefined ? (izin_bongkar === true || izin_bongkar === 'true' || izin_bongkar === '1') : undefined,
            izin_akses_os: izin_akses_os !== undefined ? (izin_akses_os === true || izin_akses_os === 'true' || izin_akses_os === '1') : undefined,
            izin_backup_mandiri: izin_backup_mandiri !== undefined ? (izin_backup_mandiri === true || izin_backup_mandiri === 'true' || izin_backup_mandiri === '1') : undefined,
            batasan_izin: batasan_izin !== undefined ? batasan_izin : undefined,
            kondisi_fisik: kondisi_fisik !== undefined ? kondisi_fisik : undefined,
            spesifikasi_awal: spesifikasi_awal !== undefined ? spesifikasi_awal : undefined,
            prioritas_pelanggan: prioritas_pelanggan !== undefined ? prioritas_pelanggan : undefined,
        };

        if (defect_map !== undefined) {
            updateData.defect_map = typeof defect_map === 'string' ? JSON.parse(defect_map) : defect_map;
        }

        const effectiveSlaPaket = sla_paket || tiket.sla_paket || "reguler";

        if (sla_paket !== undefined) {
            updateData.sla_paket = sla_paket;
            if (!target_pengecekan_at && ["diterima", "didiagnosis"].includes(status || tiket.status)) {
                updateData.target_pengecekan_at = calculateSlaPengecekanTarget(tiket.created_at, sla_paket);
            }
            if (!target_selesai_at && ["disetujui", "dalam_perbaikan"].includes(status || tiket.status)) {
                updateData.target_selesai_at = calculateSlaPengerjaanTarget(tiket.disetujui_at || new Date(), sla_paket);
            }
        }

        if (target_pengecekan_at !== undefined) {
            updateData.target_pengecekan_at = target_pengecekan_at ? new Date(target_pengecekan_at) : null;
        }

        if (target_selesai_at !== undefined) {
            updateData.target_selesai_at = target_selesai_at ? new Date(target_selesai_at) : null;
        }

        if (disetujui_at !== undefined) {
            updateData.disetujui_at = disetujui_at ? new Date(disetujui_at) : null;
        }

        // Transisi status operasional SLA:
        // 1. Masuk ke 'disetujui' atau 'dalam_perbaikan': ACC dari pelanggan telah diterima
        //    SLA Pengerjaan Servis dimulai dari waktu persetujuan
        if ((status === "disetujui" || status === "dalam_perbaikan") && !["disetujui", "dalam_perbaikan", "selesai", "diambil"].includes(tiket.status)) {
            const approvalDate = updateData.disetujui_at || new Date();
            updateData.disetujui_at = approvalDate;
            if (!target_selesai_at) {
                updateData.target_selesai_at = calculateSlaPengerjaanTarget(approvalDate, effectiveSlaPaket);
            }
        } else if (status === "menunggu_persetujuan" && tiket.status !== "menunggu_persetujuan") {
            // Unit masuk idle menunggu customer: SLA Pengerjaan belum dimulai
            updateData.disetujui_at = null;
        }

        // Jika status diubah menjadi selesai dan sebelumnya bukan selesai, set completed_at
        if (status === "selesai" && tiket.status !== "selesai") {
            updateData.completed_at = new Date();
        } else if (status && status !== "selesai" && tiket.status === "selesai") {
            // Jika dikembalikan ke status sebelum selesai
            updateData.completed_at = null;
            updateData.last_reminder_sent = 0;
        }

        // Proteksi QC: Status diambil wajib lolos uji QC Pra-Penyerahan (passed_qc: true)
        if (status === "diambil") {
            const incomingQc = checklist_qc !== undefined 
                ? (typeof checklist_qc === 'string' ? JSON.parse(checklist_qc) : checklist_qc)
                : null;
            const existingQc = tiket.checklist_qc 
                ? (typeof tiket.checklist_qc === 'string' ? JSON.parse(tiket.checklist_qc) : tiket.checklist_qc)
                : null;
            const passedQc = Boolean(incomingQc?.passed_qc ?? existingQc?.passed_qc);

            if (!passedQc) {
                return res.status(400).json({
                    message: "Proteksi QC: Unit wajib melewati Checklist QC Pra-Penyerahan (passed_qc: true) sebelum status dapat diubah menjadi 'diambil'.",
                });
            }
        }

        // Jika status diubah menjadi diambil atau durasi_garansi diubah saat sudah diambil
        if (status === "diambil") {
            const pickupDate = tiket.tgl_diambil || new Date();
            updateData.tgl_diambil = pickupDate;
            updateData.garansi_berakhir_at = calculateWarrantyExpiry(pickupDate, durasi_garansi || tiket.durasi_garansi);
        } else if (durasi_garansi && (tiket.status === "diambil" || status === "diambil")) {
            const pickupDate = tiket.tgl_diambil || new Date();
            updateData.garansi_berakhir_at = calculateWarrantyExpiry(pickupDate, durasi_garansi);
        }

        const updated = await prisma.tiketServis.update({
            where: { id },
            data: updateData,
            include: {
                perangkat: { include: { customer: true } },
                teknisi: { select: { id: true, nama: true } },
            },
        });

        // Insert log catatan admin if provided
        if (catatan_admin && req.user.role === "admin") {
            await prisma.logPerbaikan.create({
                data: {
                    tiket_id: id,
                    fase: "Catatan Admin",
                    catatan: catatan_admin,
                },
            });
        }

        return res.json({ 
            message: "Tiket servis berhasil diperbarui", 
            data: {
                ...updated,
                warranty_status: getWarrantyStatus(updated),
                sla_status: getSlaStatus(updated)
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui visual defect map / goresan fisik tiket secara cepat
async function updateDefectMap(req, res) {
    try {
        const id = Number(req.params.id);
        const { defect_map } = req.body;

        const tiket = await prisma.tiketServis.findUnique({ where: { id } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        const parsedDefectMap = typeof defect_map === 'string' ? JSON.parse(defect_map) : defect_map;

        const updated = await prisma.tiketServis.update({
            where: { id },
            data: { defect_map: parsedDefectMap },
            select: { id: true, nomor_tiket: true, defect_map: true }
        });

        return res.json({ message: "Peta visual cacat fisik berhasil disimpan", data: updated });
    } catch (error) {
        return res.status(500).json({ message: "Gagal menyimpan peta cacat fisik", error: error.message });
    }
}

// Memperbarui status pengingat pengambilan barang
async function updateReminder(req, res) {
    try {
        const { last_reminder_sent } = req.body;
        const id = Number(req.params.id);

        const tiket = await prisma.tiketServis.findUnique({ where: { id } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        const updated = await prisma.tiketServis.update({
            where: { id },
            data: {
                last_reminder_sent: Number(last_reminder_sent),
            },
        });

        return res.json({ message: "Status pengingat berhasil diperbarui", data: updated });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Membuat tiket klaim garansi dari tiket lama yang sudah selesai/diambil
async function createWarrantyClaim(req, res) {
    try {
        const id = Number(req.params.id);
        const parentTiket = await prisma.tiketServis.findUnique({
            where: { id },
            include: { perangkat: true }
        });

        if (!parentTiket) {
            return res.status(404).json({ message: "Tiket asal tidak ditemukan" });
        }

        if (!["selesai", "diambil"].includes(parentTiket.status)) {
            return res.status(400).json({ message: "Klaim garansi hanya dapat dibuat dari tiket yang telah selesai atau diambil." });
        }

        const warrantyInfo = getWarrantyStatus(parentTiket);
        const statusNote = warrantyInfo?.isExpired 
            ? `[Klaim Luar Garansi / Kebijakan Toko: Masa garansi telah berakhir ${warrantyInfo.garansi_berakhir_at ? new Date(warrantyInfo.garansi_berakhir_at).toLocaleDateString('id-ID') : ''}]` 
            : `[Klaim Dalam Garansi Resmi: Sisa garansi ${warrantyInfo?.sisaHari} hari]`;

        let claimTiket = null;
        let retries = 3;
        let offset = 0;

        while (retries > 0) {
            try {
                const nomor_tiket = await getNextNomorTiket(prisma, offset);
                claimTiket = await prisma.tiketServis.create({
                    data: {
                        nomor_tiket,
                        perangkat_id: parentTiket.perangkat_id,
                        teknisi_id: parentTiket.teknisi_id,
                        keluhan: `[KLAIM GARANSI] Retur perbaikan dari Tiket #${parentTiket.nomor_tiket}. Sampaikan kendala: ${req.body.alasan || 'Kerusakan kembali terjadi.'}`,
                        kelengkapan: parentTiket.kelengkapan,
                        status: "diterima",
                        is_garansi_claim: true,
                        parent_tiket_id: parentTiket.id,
                        durasi_garansi: parentTiket.durasi_garansi
                    },
                    include: {
                        perangkat: { include: { customer: true } },
                        teknisi: { select: { id: true, nama: true } }
                    }
                });
                break;
            } catch (err) {
                if (err.code === 'P2002' && err.meta?.target?.includes('nomor_tiket')) {
                    retries--;
                    offset++;
                    if (retries === 0) throw err;
                } else {
                    throw err;
                }
            }
        }

        // Insert log item
        await prisma.logPerbaikan.create({
            data: {
                tiket_id: claimTiket.id,
                fase: "Klaim Garansi",
                catatan: `Tiket klaim garansi diterbitkan berdasarkan tiket terdahulu #${parentTiket.nomor_tiket}. ${statusNote}`
            }
        });

        return res.status(201).json({ message: "Tiket klaim garansi berhasil diterbitkan", data: claimTiket });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil tiket servis yang masa garansinya hampir berakhir (H-7 s/d H-0) untuk follow-up CRM
async function getExpiringWarranties(req, res) {
    try {
        const tikets = await prisma.tiketServis.findMany({
            where: {
                status: "diambil",
                tgl_diambil: { not: null }
            },
            include: {
                perangkat: { include: { customer: true } },
                teknisi: { select: { id: true, nama: true } },
                invoice: { select: { id: true, total_biaya: true } }
            },
            orderBy: { garansi_berakhir_at: "asc" }
        });

        const expiringTikets = tikets
            .map(t => ({
                ...t,
                warranty_status: getWarrantyStatus(t)
            }))
            .filter(t => {
                return t.warranty_status && t.warranty_status.status === "aktif" && t.warranty_status.sisaHari <= 7 && t.warranty_status.sisaHari >= 0;
            })
            .sort((a, b) => (a.warranty_status.sisaHari - b.warranty_status.sisaHari));

        return res.json(expiringTikets);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menandai follow-up pengingat garansi telah dikirim
async function markWarrantyFollowUp(req, res) {
    try {
        const id = Number(req.params.id);
        const { catatan } = req.body;

        const tiket = await prisma.tiketServis.findUnique({ where: { id } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        // Catat follow-up ke ActivityLog dan LogPerbaikan tanpa merusak counter pengingat pengambilan barang
        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama || "User",
                action: `Mengirim Follow-Up CRM Pengingat Garansi (H-3/H-7) ke pelanggan`,
                entity: `Tiket #${tiket.nomor_tiket}`
            }
        });

        const followUpLog = await prisma.logPerbaikan.create({
            data: {
                tiket_id: id,
                fase: "Follow-Up Garansi",
                catatan: `[CRM Garansi] ${catatan || 'Follow-up pengingat garansi terkirim via WhatsApp'}`
            }
        });

        return res.json({ 
            message: "Status follow-up garansi berhasil dicatat", 
            data: { ...tiket, follow_up_log: followUpLog } 
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Feature 5: Mengambil daftar tiket yang telah diambil >= 6 bulan (180 hari) s/d 1+ tahun untuk jadwal servis berkala (Periodic Maintenance Recall)
async function getMaintenanceDue(req, res) {
    try {
        const { minMonths } = req.query;
        const thresholdMonths = Number(minMonths) || 6; // default 6 bulan (180 hari)

        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - (thresholdMonths * 30));

        const tikets = await prisma.tiketServis.findMany({
            where: {
                status: "diambil",
                tgl_diambil: {
                    not: null,
                    lte: cutoffDate
                }
            },
            include: {
                perangkat: {
                    include: { customer: true }
                },
                teknisi: {
                    select: { id: true, nama: true }
                },
                invoice: {
                    select: { id: true, total_biaya: true }
                },
                log_perbaikan: {
                    where: {
                        fase: "Follow-Up Servis Berkala"
                    },
                    orderBy: { created_at: "desc" },
                    take: 1
                }
            },
            orderBy: { tgl_diambil: "asc" }
        });

        const formatted = tikets.map(t => {
            const tglDiambil = new Date(t.tgl_diambil);
            const diffTime = Math.abs(now - tglDiambil);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffMonths = Math.floor(diffDays / 30);
            const isOverOneYear = diffMonths >= 12;

            // Tentukan rekomendasi layanan berkala berdasarkan kategori perbaikan sebelumnya
            let recommendedService = "Pembersihan Debu Kipas & Penggantian Pasta Termal (Deep Clean & Repaste)";
            const kat = (t.kategori_perbaikan || "").toLowerCase();
            if (kat.includes("thermal") || kat.includes("overheat") || kat.includes("kipas") || kat.includes("clean")) {
                recommendedService = "Ganti Pasta Termal & Pembersihan Sirkulasi Kipas (Cegah Overheat)";
            } else if (kat.includes("upgrade") || kat.includes("ssd") || kat.includes("ram") || kat.includes("storage")) {
                recommendedService = "Pemeriksaan Kesehatan S.M.A.R.T SSD/Storage & Optimalisasi Sistem";
            } else if (kat.includes("engsel") || kat.includes("casing") || kat.includes("body")) {
                recommendedService = "Pengecekan Kekencangan Baut Casing & Pelumasan Engsel Layar";
            }

            const lastLog = t.log_perbaikan?.[0] || null;

            return {
                id: t.id,
                nomor_tiket: t.nomor_tiket,
                perangkat_id: t.perangkat_id,
                merek: t.perangkat?.merek,
                model: t.perangkat?.model,
                jenis_perangkat: t.perangkat?.jenis_perangkat,
                serial_number: t.perangkat?.serial_number,
                customer_id: t.perangkat?.customer?.id,
                customer_nama: t.perangkat?.customer?.nama,
                customer_phone: t.perangkat?.customer?.nomor_telepon,
                customer_personality: t.perangkat?.customer?.tipe_kepribadian || "Netral",
                kategori_perbaikan: t.kategori_perbaikan || "Umum",
                keluhan_lama: t.keluhan,
                teknisi_nama: t.teknisi?.nama || "Teknisi Toko",
                tgl_diambil: t.tgl_diambil,
                diff_days: diffDays,
                diff_months: diffMonths,
                urgency: isOverOneYear ? "urgent_1y" : "routine_6m", // >= 12 bulan (Kritis/Mendesak) vs 6-11 bulan (Rutin)
                recommended_service: recommendedService,
                is_follow_up_sent: Boolean(lastLog),
                last_follow_up_at: lastLog?.created_at || null,
                last_follow_up_note: lastLog?.catatan || null
            };
        });

        return res.json({
            items: formatted,
            total_due: formatted.length,
            urgent_count: formatted.filter(f => f.urgency === "urgent_1y").length,
            routine_count: formatted.filter(f => f.urgency === "routine_6m").length
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan saat memuat jadwal servis berkala", error: error.message });
    }
}

// Menandai pengingat servis berkala telah dikirim
async function markMaintenanceFollowUp(req, res) {
    try {
        const id = Number(req.params.id);
        const { catatan } = req.body;

        const tiket = await prisma.tiketServis.findUnique({
            where: { id },
            include: { perangkat: { include: { customer: true } } }
        });

        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama || "User",
                action: `Mengirim Pengingat Servis Berkala ke ${tiket.perangkat?.customer?.nama || 'Pelanggan'} (${tiket.perangkat?.merek} ${tiket.perangkat?.model})`,
                entity: `Tiket #${tiket.nomor_tiket}`
            }
        });

        const followUpLog = await prisma.logPerbaikan.create({
            data: {
                tiket_id: id,
                fase: "Follow-Up Servis Berkala",
                catatan: `[CRM Servis Berkala] ${catatan || 'Pengingat perawatan berkala terkirim via WhatsApp'}`
            }
        });

        return res.json({
            message: "Status pengingat servis berkala berhasil dicatat",
            data: { ...tiket, follow_up_log: followUpLog }
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Feature: Mengambil daftar tiket selesai yang belum diambil (Unclaimed Devices)
async function getUnclaimedDue(req, res) {
    try {
        const now = new Date();
        const tikets = await prisma.tiketServis.findMany({
            where: {
                status: "selesai"
            },
            include: {
                perangkat: {
                    include: { customer: true }
                },
                teknisi: {
                    select: { id: true, nama: true }
                },
                invoice: {
                    select: { id: true, total_biaya: true }
                },
                log_perbaikan: {
                    where: {
                        fase: { in: ["Pengingat Pengambilan", "Follow-Up Pengambilan"] }
                    },
                    orderBy: { created_at: "desc" },
                    take: 1
                }
            },
            orderBy: { completed_at: "asc" }
        });

        const formatted = tikets.map(t => {
            const completedDate = t.completed_at ? new Date(t.completed_at) : new Date(t.created_at);
            const diffTime = Math.abs(now - completedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let stage = "routine";
            let stageLabel = "Siap Diambil (< 14 Hari)";
            let recommendedReminder = 0;
            if (diffDays >= 90) {
                stage = "critical_3m";
                stageLabel = "Kritis (≥ 3 Bulan)";
                recommendedReminder = 3;
            } else if (diffDays >= 60) {
                stage = "warning_2m";
                stageLabel = "Peringatan (≥ 2 Bulan)";
                recommendedReminder = 2;
            } else if (diffDays >= 30) {
                stage = "notice_1m";
                stageLabel = "Perhatian (≥ 1 Bulan)";
                recommendedReminder = 1;
            } else if (diffDays >= 14) {
                stage = "notice_14d";
                stageLabel = "Menumpuk (≥ 14 Hari)";
                recommendedReminder = 1;
            }

            const lastLog = t.log_perbaikan?.[0] || null;

            return {
                id: t.id,
                nomor_tiket: t.nomor_tiket,
                perangkat_id: t.perangkat_id,
                merek: t.perangkat?.merek,
                model: t.perangkat?.model,
                jenis_perangkat: t.perangkat?.jenis_perangkat,
                customer_id: t.perangkat?.customer?.id,
                customer_nama: t.perangkat?.customer?.nama,
                customer_phone: t.perangkat?.customer?.nomor_telepon,
                customer_personality: t.perangkat?.customer?.tipe_kepribadian || "Netral",
                completed_at: t.completed_at || t.created_at,
                diff_days: diffDays,
                stage,
                stage_label: stageLabel,
                last_reminder_sent: t.last_reminder_sent || 0,
                recommended_reminder: recommendedReminder,
                total_biaya: t.invoice?.total_biaya || 0,
                status_pembayaran: "Belum Diambil",
                is_follow_up_sent: Boolean(lastLog),
                last_follow_up_at: lastLog?.created_at || null,
                last_follow_up_note: lastLog?.catatan || null
            };
        });

        return res.json({
            items: formatted,
            total_unclaimed: formatted.length,
            aging_count: formatted.filter(f => f.diff_days >= 14).length,
            critical_count: formatted.filter(f => f.diff_days >= 30).length
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan saat memuat data unit belum diambil", error: error.message });
    }
}

// Menandai pengingat pengambilan unit telah dikirim
async function markUnclaimedFollowUp(req, res) {
    try {
        const id = Number(req.params.id);
        const { reminder_level, catatan } = req.body;

        const tiket = await prisma.tiketServis.findUnique({
            where: { id },
            include: { perangkat: { include: { customer: true } } }
        });

        if (!tiket) {
            return res.status(404).json({ message: "Tiket tidak ditemukan" });
        }

        const newReminderLevel = Number(reminder_level) || ((tiket.last_reminder_sent || 0) + 1);

        const updated = await prisma.tiketServis.update({
            where: { id },
            data: {
                last_reminder_sent: newReminderLevel
            }
        });

        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama || "User",
                action: `Mengirim Pengingat Pengambilan Unit ke ${tiket.perangkat?.customer?.nama || 'Pelanggan'} (${tiket.perangkat?.merek} ${tiket.perangkat?.model})`,
                entity: `Tiket #${tiket.nomor_tiket}`
            }
        });

        const followUpLog = await prisma.logPerbaikan.create({
            data: {
                tiket_id: id,
                fase: "Pengingat Pengambilan",
                catatan: `[CRM Pengambilan Unit] ${catatan || `Pengingat pengambilan tahap ${newReminderLevel} terkirim via WhatsApp`}`
            }
        });

        return res.json({
            message: "Pengingat pengambilan unit berhasil dicatat",
            data: { ...updated, follow_up_log: followUpLog }
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { 
    getAll, 
    getById, 
    create, 
    update, 
    updateDefectMap,
    updateReminder, 
    createWarrantyClaim,
    getExpiringWarranties,
    markWarrantyFollowUp,
    getMaintenanceDue,
    markMaintenanceFollowUp,
    getUnclaimedDue,
    markUnclaimedFollowUp
};
