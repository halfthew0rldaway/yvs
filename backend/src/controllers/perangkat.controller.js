const prisma = require("../config/database");
const { getWarrantyStatus } = require("../utils/tiket");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");

// Mengambil seluruh data perangkat
async function getAll(req, res) {
    try {
        const { customer_id, jenis_perangkat, search } = req.query;
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

        const include = { 
            customer: true,
            _count: {
                select: { tiket_servis: true }
            },
            tiket_servis: {
                select: { id: true, nomor_tiket: true, status: true, created_at: true },
                orderBy: { id: "desc" },
                take: 1
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

// Menambahkan perangkat baru
async function create(req, res) {
    try {
        const { customer_id, jenis_perangkat, merek, model, serial_number } = req.body;

        const customer = await prisma.customer.findUnique({ where: { id: Number(customer_id) } });
        if (!customer) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        const perangkat = await prisma.perangkat.create({
            data: {
                customer_id: Number(customer_id),
                jenis_perangkat,
                merek,
                model,
                serial_number,
            },
        });

        return res.status(201).json({ message: "Perangkat berhasil ditambahkan", data: perangkat });
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

        const perangkat = await prisma.perangkat.update({
            where: { id },
            data: {
                customer_id: customer_id ? Number(customer_id) : undefined,
                jenis_perangkat,
                merek,
                model,
                serial_number,
            },
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
