const prisma = require("../utils/prisma");

async function getAll(req, res) {
    try {
        const signatures = await prisma.staffSignature.findMany({
            orderBy: { created_at: "desc" }
        });
        return res.json({ data: signatures });
    } catch (error) {
        console.error("Gagal mengambil daftar tanda tangan staff:", error);
        return res.status(500).json({ message: "Gagal memuat tanda tangan staff", error: error.message });
    }
}

async function create(req, res) {
    try {
        const { nama, role, signature } = req.body;
        if (!nama || !signature) {
            return res.status(400).json({ message: "Nama staf dan goresan tanda tangan wajib diisi." });
        }

        const newSignature = await prisma.staffSignature.create({
            data: {
                nama: String(nama).trim(),
                role: role ? String(role).trim() : "Admin Kasir",
                signature
            }
        });

        return res.status(201).json({
            message: "Tanda tangan staf berhasil disimpan",
            data: newSignature
        });
    } catch (error) {
        console.error("Gagal menyimpan tanda tangan staff:", error);
        return res.status(500).json({ message: "Gagal menyimpan tanda tangan", error: error.message });
    }
}

async function remove(req, res) {
    try {
        const id = Number(req.params.id);
        await prisma.staffSignature.delete({
            where: { id }
        });

        return res.json({ message: "Tanda tangan staf berhasil dihapus" });
    } catch (error) {
        console.error("Gagal menghapus tanda tangan staff:", error);
        return res.status(500).json({ message: "Gagal menghapus tanda tangan", error: error.message });
    }
}

module.exports = { getAll, create, remove };

