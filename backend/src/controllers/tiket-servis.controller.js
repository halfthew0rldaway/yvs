const prisma = require("../config/database");
const { generateNomorTiket } = require("../utils/tiket");

// Validasi transisi status yang diizinkan
const STATUS_TRANSITIONS = {
    diterima: ["didiagnosis"],
    didiagnosis: ["menunggu_persetujuan"],
    menunggu_persetujuan: ["disetujui", "dibatalkan"],
    disetujui: ["dalam_perbaikan"],
    dalam_perbaikan: ["selesai"],
    selesai: ["diambil"],
    diambil: [],
    dibatalkan: [],
};

// Mengambil seluruh tiket servis
async function getAll(req, res) {
    try {
        const { status, teknisi_id } = req.query;
        const where = {};

        if (status) where.status = status;
        if (teknisi_id) where.teknisi_id = Number(teknisi_id);

        // Hapus pembatasan - Teknisi sekarang bisa melihat semua tiket di list.
        // Hak akses edit/update sudah diamankan di frontend (detail) dan validasi di route.
        if (req.user.role === "teknisi") {
            if (where.teknisi_id !== undefined) delete where.teknisi_id;
        }

        const tikets = await prisma.tiketServis.findMany({
            where,
            include: {
                perangkat: { include: { customer: true } },
                teknisi: { select: { id: true, nama: true } },
            },
            orderBy: { created_at: "desc" },
        });

        return res.json(tikets);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil tiket servis berdasarkan ID
async function getById(req, res) {
    try {
        const tiket = await prisma.tiketServis.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                perangkat: { include: { customer: true } },
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

        return res.json(tiket);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Membuat tiket servis baru
async function create(req, res) {
    try {
        const { perangkat_id, teknisi_id, keluhan, kelengkapan } = req.body;

        const perangkat = await prisma.perangkat.findUnique({ where: { id: Number(perangkat_id) } });
        if (!perangkat) {
            return res.status(404).json({ message: "Perangkat tidak ditemukan" });
        }

        // Process uploaded files if any
        let foto_kondisi = null;
        if (req.files && req.files.length > 0) {
            foto_kondisi = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Generate nomor tiket
        const count = await prisma.tiketServis.count();
        const nomor_tiket = generateNomorTiket(count + 1);

        const tiket = await prisma.tiketServis.create({
            data: {
                nomor_tiket,
                perangkat_id: Number(perangkat_id),
                teknisi_id: teknisi_id ? Number(teknisi_id) : null,
                keluhan,
                kelengkapan,
                foto_kondisi: foto_kondisi ? JSON.stringify(foto_kondisi) : null,
                status: "diterima",
            },
            include: {
                perangkat: { include: { customer: true } },
                teknisi: { select: { id: true, nama: true } },
            },
        });

        return res.status(201).json({ message: "Tiket servis berhasil dibuat", data: tiket });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui tiket servis (status, teknisi)
async function update(req, res) {
    try {
        const { status, teknisi_id, keluhan, catatan_admin, kategori_perbaikan, durasi_garansi } = req.body;
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
        };

        // Jika status diubah menjadi selesai dan sebelumnya bukan selesai, set completed_at
        if (status === "selesai" && tiket.status !== "selesai") {
            updateData.completed_at = new Date();
        } else if (status && status !== "selesai" && tiket.status === "selesai") {
            // Jika dikembalikan ke status sebelum selesai
            updateData.completed_at = null;
            updateData.last_reminder_sent = 0;
        }

        // Jika status diubah menjadi diambil
        if (status === "diambil" && tiket.status !== "diambil") {
            updateData.tgl_diambil = new Date();
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

        return res.json({ message: "Tiket servis berhasil diperbarui", data: updated });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
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

module.exports = { getAll, getById, create, update, updateReminder };
