const prisma = require("../config/database");

// Mengambil seluruh data perangkat
async function getAll(req, res) {
    try {
        const { customer_id } = req.query;
        const where = customer_id ? { customer_id: Number(customer_id) } : {};

        const perangkats = await prisma.perangkat.findMany({
            where,
            include: { customer: true },
            orderBy: { created_at: "desc" },
        });

        return res.json(perangkats);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Mengambil data perangkat berdasarkan ID
async function getById(req, res) {
    try {
        const perangkat = await prisma.perangkat.findUnique({
            where: { id: Number(req.params.id) },
            include: { customer: true, tiket_servis: true },
        });

        if (!perangkat) {
            return res.status(404).json({ message: "Perangkat tidak ditemukan" });
        }

        return res.json(perangkat);
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

        await prisma.perangkat.delete({ where: { id } });

        return res.json({ message: "Perangkat berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

module.exports = { getAll, getById, create, update, remove };
