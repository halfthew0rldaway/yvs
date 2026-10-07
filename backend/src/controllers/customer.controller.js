const prisma = require("../config/database");

// Mengambil seluruh data customer dengan pencarian
async function getAll(req, res) {
    try {
        const { search } = req.query;
        const where = search
            ? {
                OR: [
                    { nama: { contains: search } },
                    { nomor_telepon: { contains: search } },
                ],
            }
            : {};

        const customers = await prisma.customer.findMany({
            where,
            include: { perangkat: true },
            orderBy: { created_at: "desc" },
        });

        return res.json(customers);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil data customer berdasarkan ID
async function getById(req, res) {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: Number(req.params.id) },
            include: { perangkat: true },
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        return res.json(customer);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menambahkan customer baru
async function create(req, res) {
    try {
        const { nama, nomor_telepon, alamat } = req.body;

        const customer = await prisma.customer.create({
            data: { nama, nomor_telepon, alamat },
        });

        return res.status(201).json({ message: "Customer berhasil ditambahkan", data: customer });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Memperbarui data customer
async function update(req, res) {
    try {
        const { nama, nomor_telepon, alamat } = req.body;
        const id = Number(req.params.id);

        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Customer tidak ditemukan" });
        }

        const customer = await prisma.customer.update({
            where: { id },
            data: { nama, nomor_telepon, alamat },
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

        await prisma.customer.delete({ where: { id } });

        return res.json({ message: "Customer berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { getAll, getById, create, update, remove };
