const prisma = require("../config/database");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");

// Mengambil seluruh data customer dengan pencarian dan paginasi
async function getAll(req, res) {
    try {
        const { search } = req.query;
        const { isPaginated, page, limit, skip } = parsePagination(req.query);

        const where = search
            ? {
                OR: [
                    { nama: { contains: search } },
                    { nomor_telepon: { contains: search } },
                ],
            }
            : {};

        if (!isPaginated) {
            const customers = await prisma.customer.findMany({
                where,
                include: { perangkat: true },
                orderBy: [{ created_at: "desc" }, { id: "desc" }],
            });
            return res.json(customers);
        }

        const [total, customers] = await Promise.all([
            prisma.customer.count({ where }),
            prisma.customer.findMany({
                where,
                include: { perangkat: true },
                orderBy: [{ created_at: "desc" }, { id: "desc" }],
                skip,
                take: limit,
            }),
        ]);

        return res.json(buildPaginationResponse(customers, total, page, limit));
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil data customer berdasarkan ID
async function getById(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID customer tidak valid" });
        }

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                perangkat: {
                    include: {
                        tiket_servis: {
                            include: {
                                teknisi: { select: { id: true, nama: true } },
                                invoice: { select: { id: true, total_biaya: true } }
                            },
                            orderBy: { created_at: "desc" }
                        },
                        _count: {
                            select: { tiket_servis: true }
                        }
                    },
                    orderBy: { created_at: "desc" }
                },
            },
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        // Hitung ringkasan statistik
        let totalTiket = 0;
        let totalBelanja = 0;
        const allTikets = [];

        (customer.perangkat || []).forEach(p => {
            totalTiket += p._count?.tiket_servis || 0;
            (p.tiket_servis || []).forEach(t => {
                allTikets.push({
                    ...t,
                    perangkat_id: p.id,
                    perangkat_merek: p.merek,
                    perangkat_model: p.model,
                    perangkat_sn: p.serial_number,
                    jenis_perangkat: p.jenis_perangkat
                });
                if (t.invoice?.total_biaya) {
                    totalBelanja += t.invoice.total_biaya;
                }
            });
        });

        allTikets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return res.json({
            ...customer,
            stats: {
                total_perangkat: (customer.perangkat || []).length,
                total_tiket: totalTiket,
                total_belanja: totalBelanja
            },
            riwayat_servis: allTikets
        });
    } catch (error) {
        console.error("Error getById customer:", error);
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menambahkan customer baru
async function create(req, res) {
    try {
        const { nama, nomor_telepon, alamat, tipe_kepribadian, catatan_khusus } = req.body;

        const customer = await prisma.customer.create({
            data: { 
                nama, 
                nomor_telepon, 
                alamat,
                tipe_kepribadian: tipe_kepribadian || "Netral",
                catatan_khusus: catatan_khusus || null
            },
        });

        return res.status(201).json({ message: "Customer berhasil ditambahkan", data: customer });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui data customer
async function update(req, res) {
    try {
        const { nama, nomor_telepon, alamat, tipe_kepribadian, catatan_khusus } = req.body;
        const id = Number(req.params.id);

        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        const customer = await prisma.customer.update({
            where: { id },
            data: { 
                nama, 
                nomor_telepon, 
                alamat,
                tipe_kepribadian: tipe_kepribadian !== undefined ? tipe_kepribadian : undefined,
                catatan_khusus: catatan_khusus !== undefined ? catatan_khusus : undefined
            },
        });

        return res.json({ message: "Customer berhasil diperbarui", data: customer });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menghapus customer
async function remove(req, res) {
    try {
        const id = Number(req.params.id);

        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        // Proteksi integritas: Cegah penghapusan jika customer memiliki tiket servis
        const existingTiket = await prisma.tiketServis.findFirst({
            where: {
                perangkat: { customer_id: id }
            }
        });
        if (existingTiket) {
            return res.status(400).json({
                message: "Customer tidak dapat dihapus karena memiliki riwayat tiket servis dan perbaikan pada sistem demi integritas audit dan data keuangan."
            });
        }

        await prisma.customer.delete({ where: { id } });

        return res.json({ message: "Customer berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { getAll, getById, create, update, remove };
