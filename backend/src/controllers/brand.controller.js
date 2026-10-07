const prisma = require("../config/database");

async function getAll(req, res) {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { nama: "asc" }
        });
        return res.json(brands);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

async function create(req, res) {
    try {
        const { nama } = req.body;
        if (!nama) {
            return res.status(400).json({ message: "Nama brand diperlukan" });
        }

        // Validate uniqueness case-insensitive
        const existing = await prisma.brand.findFirst({
            where: {
                nama: { equals: nama }
            }
        });

        // But MySQL is usually case-insensitive by default. We'll rely on unique constraint or manual check.
        if (existing) {
            return res.status(400).json({ message: "Brand sudah ada", data: existing });
        }

        const brand = await prisma.brand.create({
            data: { nama }
        });

        return res.status(201).json({ message: "Brand berhasil ditambahkan", data: brand });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Brand sudah ada" });
        }
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { getAll, create };
