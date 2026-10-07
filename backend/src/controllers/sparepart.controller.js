const prisma = require("../config/database");

// Mengambil seluruh data sparepart
async function getAll(req, res) {
    try {
        const spareparts = await prisma.sparepart.findMany({
            include: { brand: true },
            orderBy: { created_at: "desc" },
        });

        return res.json(spareparts);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menambahkan sparepart baru
async function create(req, res) {
    try {
        const { nama, kategori, stok, harga, brand_id } = req.body;

        if (!brand_id) {
            return res.status(400).json({ message: "Brand wajib dipilih" });
        }

        const sparepart = await prisma.sparepart.create({
            data: { 
                nama, 
                brand_id: Number(brand_id),
                kategori: kategori || "Umum", 
                stok: Number(stok), 
                harga: Number(harga) 
            },
            include: { brand: true }
        });

        return res.status(201).json({ message: "Sparepart berhasil ditambahkan", data: sparepart });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui data sparepart
async function update(req, res) {
    try {
        const { nama, kategori, stok, harga, brand_id } = req.body;
        const id = Number(req.params.id);

        const existing = await prisma.sparepart.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Sparepart tidak ditemukan" });
        }

        const sparepart = await prisma.sparepart.update({
            where: { id },
            data: {
                nama: nama || undefined,
                brand_id: brand_id ? Number(brand_id) : undefined,
                kategori: kategori || undefined,
                stok: stok !== undefined ? Number(stok) : undefined,
                harga: harga !== undefined ? Number(harga) : undefined,
            },
            include: { brand: true }
        });

        return res.json({ message: "Sparepart berhasil diperbarui", data: sparepart });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menghapus sparepart
async function remove(req, res) {
    try {
        const id = Number(req.params.id);

        const existing = await prisma.sparepart.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Sparepart tidak ditemukan" });
        }

        await prisma.sparepart.delete({ where: { id } });

        return res.json({ message: "Sparepart berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menggunakan sparepart pada tiket (dengan pengurangan stok otomatis)
async function use(req, res) {
    try {
        const { tiket_id, sparepart_id, jumlah } = req.body;

        const sparepart = await prisma.sparepart.findUnique({ where: { id: Number(sparepart_id) } });
        if (!sparepart) {
            return res.status(404).json({ message: "Sparepart tidak ditemukan" });
        }

        if (sparepart.stok < Number(jumlah)) {
            return res.status(400).json({ message: "Stok sparepart tidak mencukupi" });
        }

        const tiket = await prisma.tiketServis.findUnique({ where: { id: Number(tiket_id) } });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Kurangi stok sparepart
            await tx.sparepart.update({
                where: { id: Number(sparepart_id) },
                data: { stok: { decrement: Number(jumlah) } },
            });

            // Catat penggunaan sparepart
            const penggunaan = await tx.penggunaanSparepart.create({
                data: {
                    tiket_id: Number(tiket_id),
                    sparepart_id: Number(sparepart_id),
                    jumlah: Number(jumlah),
                },
            });

            return penggunaan;
        });

        return res.status(201).json({ message: "Sparepart berhasil digunakan", data: result });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { getAll, create, update, remove, use };
