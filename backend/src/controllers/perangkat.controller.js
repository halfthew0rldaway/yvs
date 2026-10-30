const prisma = require("../config/database");
const { getWarrantyStatus } = require("../utils/tiket");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { normalizeBrand, normalizeDeviceType, normalizeSerialNumber, normalizeText } = require("../utils/normalize");

// Mengambil seluruh data perangkat
async function getAll(req, res) {
    try {
        const { customer_id, jenis_perangkat, search, exclude_ongoing } = req.query;
        const { isPaginated, page, limit, skip } = parsePagination(req.query);

        const where = {};
        if (customer_id) where.customer_id = Number(customer_id);
        if (jenis_perangkat) where.jenis_perangkat = jenis_perangkat;
        if (search) {
            where.OR = [
                { merek: { contains: search } },
                { model: { contains: search } },
                { serial_number: { contains: search } },
                { customer: { nama: { contains: search } } },
            ];
        }

        // Filter: kecualikan perangkat yang sedang memiliki tiket servis aktif/ongoing
        if (exclude_ongoing === "true") {
            where.NOT = {
                tiket_servis: {
                    some: {
                        status: {
                            in: ["diterima", "didiagnosis", "menunggu_persetujuan", "disetujui", "dalam_perbaikan", "selesai"]
                        }
                    }
                }
            };
        }

        const include = { 
            customer: true,
            _count: {
                select: { tiket_servis: true }
            },
            tiket_servis: {
                select: { id: true, nomor_tiket: true, status: true, created_at: true },
                orderBy: { id: "desc" },
                take: 5
            }
        };

        if (!isPaginated) {
            const perangkats = await prisma.perangkat.findMany({
                where,
                include,
                orderBy: [{ created_at: "desc" }, { id: "desc" }],
            });
            return res.json(perangkats);
        }

        const [total, perangkats] = await Promise.all([
            prisma.perangkat.count({ where }),
            prisma.perangkat.findMany({
                where,
                include,
                orderBy: [{ created_at: "desc" }, { id: "desc" }],
                skip,
                take: limit,
            }),
        ]);

        return res.json(buildPaginationResponse(perangkats, total, page, limit));
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil data perangkat berdasarkan ID (beserta rekam jejak servis lengkap)
async function getById(req, res) {
    try {
        const id = Number(req.params.id);
        const perangkat = await prisma.perangkat.findUnique({
            where: { id },
            include: { 
                customer: {
                    include: {
                        perangkat: {
                            select: { id: true, merek: true, model: true, jenis_perangkat: true, serial_number: true },
                            where: { id: { not: id } }
                        },
                        _count: {
                            select: { perangkat: true }
                        }
                    }
                }, 
                tiket_servis: {
                    include: {
                        teknisi: { select: { id: true, nama: true } },
                        diagnosis: true,
                        penggunaan_sparepart: { include: { sparepart: true } },
                        invoice: true
                    },
                    orderBy: { created_at: "desc" }
                }
            },
        });

        if (!perangkat) {
            return res.status(404).json({ message: "Perangkat tidak ditemukan" });
        }

        const tiketWithWarranty = perangkat.tiket_servis.map(t => ({
            ...t,
            warranty_status: getWarrantyStatus(t)
        }));

        return res.json({
            ...perangkat,
            tiket_servis: tiketWithWarranty
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menambahkan perangkat baru (dengan proteksi duplikasi & normalisasi)
async function create(req, res) {
    try {
        const { customer_id, jenis_perangkat, merek, model, serial_number, allow_existing } = req.body;

        const custId = Number(customer_id);
        const customer = await prisma.customer.findUnique({ where: { id: custId } });
        if (!customer) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        const cleanMerek = normalizeBrand(merek);
        const cleanJenis = normalizeDeviceType(jenis_perangkat);
        const cleanModel = normalizeText(model);
        const cleanSN = normalizeSerialNumber(serial_number);

        // Proteksi Duplikasi Perangkat untuk Customer yang Sama:
        // 1. Jika ada Serial Number: Cek apakah customer sudah memiliki perangkat dengan Serial Number tersebut
        // 2. Jika tanpa Serial Number: Cek apakah customer sudah memiliki perangkat dengan jenis, merek, model yang sama
        let existingPerangkat = null;

        if (cleanSN) {
            existingPerangkat = await prisma.perangkat.findFirst({
                where: {
                    customer_id: custId,
                    serial_number: cleanSN
                },
                include: { customer: true }
            });
        }

        if (!existingPerangkat) {
            existingPerangkat = await prisma.perangkat.findFirst({
                where: {
                    customer_id: custId,
                    jenis_perangkat: cleanJenis,
                    merek: cleanMerek,
                    model: cleanModel,
                    serial_number: cleanSN || null
                },
                include: { customer: true }
            });
        }

        if (existingPerangkat) {
            // Jika allow_existing = true (seperti pada alur Quick-Add Intake Tiket Servis),
            // jangan buat perangkat baru, melainkan gunakan kembali profil perangkat yang ada agar riwayat servis tetap menyatu!
            if (allow_existing) {
                return res.status(200).json({
                    message: `Perangkat ${cleanMerek} ${cleanModel} milik customer ini sudah terdaftar. Riwayat servis dikaitkan ke unit yang sama.`,
                    data: existingPerangkat,
                    isExisting: true
                });
            }

            // Jika form manual Tambah Perangkat, beri notifikasi 409 agar admin menyadari unit ini sudah ada
            return res.status(409).json({
                message: `Perangkat ${cleanMerek} ${cleanModel} ${cleanSN ? `(SN: ${cleanSN})` : ''} sudah terdaftar untuk customer ini (ID Perangkat: #${existingPerangkat.id}). Silakan gunakan data perangkat yang sudah ada.`,
                data: existingPerangkat,
                isExisting: true
            });
        }

        const perangkat = await prisma.perangkat.create({
            data: {
                customer_id: custId,
                jenis_perangkat: cleanJenis,
                merek: cleanMerek,
                model: cleanModel,
                serial_number: cleanSN,
            },
            include: { customer: true }
        });

        return res.status(201).json({ message: "Perangkat berhasil ditambahkan", data: perangkat, isExisting: false });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui data perangkat
async function update(req, res) {
    try {
        const { customer_id, jenis_perangkat, merek, model, serial_number } = req.body;
        const id = Number(req.params.id);

        const existing = await prisma.perangkat.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Perangkat tidak ditemukan" });
        }

        const cleanMerek = merek ? normalizeBrand(merek) : undefined;
        const cleanJenis = jenis_perangkat ? normalizeDeviceType(jenis_perangkat) : undefined;
        const cleanModel = model ? normalizeText(model) : undefined;
        const cleanSN = serial_number !== undefined ? normalizeSerialNumber(serial_number) : undefined;

        const perangkat = await prisma.perangkat.update({
            where: { id },
            data: {
                customer_id: customer_id ? Number(customer_id) : undefined,
                jenis_perangkat: cleanJenis,
                merek: cleanMerek,
                model: cleanModel,
                serial_number: cleanSN,
            },
            include: { customer: true }
        });

        return res.json({ message: "Perangkat berhasil diperbarui", data: perangkat });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menghapus perangkat
async function remove(req, res) {
    try {
        const id = Number(req.params.id);

        const existing = await prisma.perangkat.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Perangkat tidak ditemukan" });
        }

        // Proteksi integritas: Cegah penghapusan jika perangkat memiliki riwayat tiket servis
        const existingTiket = await prisma.tiketServis.findFirst({
            where: {
                perangkat_id: id
            }
        });
        if (existingTiket) {
            return res.status(400).json({
                message: "Perangkat tidak dapat dihapus karena memiliki riwayat tiket servis dan perbaikan pada sistem."
            });
        }

        await prisma.perangkat.delete({ where: { id } });

        return res.json({ message: "Perangkat berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { getAll, getById, create, update, remove };
