const prisma = require("../config/database");

// Default initial suppliers if table is fresh/empty
const DEFAULT_SUPPLIERS = [
    {
        nama: "PT Synnex Metrodata Indonesia",
        kategori: "Distributor Resmi",
        kontak_person: "Budi Santoso (RMA Desk)",
        telepon: "0812-8899-7700",
        email: "rma.laptop@synnexmetrodata.co.id",
        alamat: "APL Tower Lt. 42, Jl. Letjen S. Parman Kav. 28, Jakarta Barat",
        link_toko: "https://synnexmetrodata.com",
        kebijakan_klaim: "Wajib sertakan nota faktur pembelian toko. Segel distributor SMI pada unit RAM/SSD/Motherboard wajib utuh tanpa sobek. Proses swap unit 3-7 hari kerja."
    },
    {
        nama: "PT Nusantara Jaya Teknologi (NJT)",
        kategori: "Distributor Resmi",
        kontak_person: "Lina (Customer Care NJT)",
        telepon: "0811-9876-5432",
        email: "support@njt.co.id",
        alamat: "Ruko Harco Mangga Dua Blok I No. 25-27, Jakarta Pusat",
        link_toko: "https://njt.co.id",
        kebijakan_klaim: "Garansi Lifetime untuk memori RAM Kingston & Corsair (selama segel NJT ada dan pin tidak hangus/gosong). Ganti baru langsung jika stok tersedia."
    },
    {
        nama: "Astrindo Senayasa",
        kategori: "Distributor Resmi",
        kontak_person: "Hendro (Sales & RMA Support)",
        telepon: "0813-1122-3344",
        email: "service@astrindo.co.id",
        alamat: "Jl. Gunung Sahari Raya No. 18, Jakarta Utara",
        link_toko: "https://astrindo-senayasa.co.id",
        kebijakan_klaim: "Distributor resmi komponen ASUS & Kingston. Garansi berlaku sesuai tanggal nota end-user yang dilampirkan toko."
    },
    {
        nama: "Toko LCD & Sparepart Bandung (Marketplace)",
        kategori: "Supplier Komponen",
        kontak_person: "Kang Asep",
        telepon: "0857-2233-4455",
        email: "lcdsparepart.bdg@gmail.com",
        alamat: "BEC Lt. 2 Blok F-08, Bandung",
        link_toko: "https://tokopedia.com/lcdpart-bdg",
        kebijakan_klaim: "Garansi tes 7 hari sejak barang diterima toko. Plastik pelindung LCD jangan dibuka dan fleksibel tidak boleh tertekuk patah saat retur."
    }
];

// Seed default suppliers if DB table has 0 rows
async function ensureSeedSuppliers() {
    try {
        const count = await prisma.supplier.count();
        if (count === 0) {
            for (const s of DEFAULT_SUPPLIERS) {
                await prisma.supplier.create({ data: s });
            }
        }
    } catch (err) {
        // Table might not be pushed yet in some dev states
        console.warn("Could not check/seed Supplier in DB:", err.message);
    }
}

ensureSeedSuppliers();

// GET all suppliers
async function getAll(req, res) {
    try {
        const { search, kategori } = req.query;

        const where = {};
        if (search) {
            where.OR = [
                { nama: { contains: search } },
                { kontak_person: { contains: search } },
                { telepon: { contains: search } },
                { email: { contains: search } }
            ];
        }
        if (kategori && kategori !== "all") {
            where.kategori = kategori;
        }

        const suppliers = await prisma.supplier.findMany({
            where,
            include: {
                _count: {
                    select: {
                        spareparts: true,
                        supplier_rma: true
                    }
                }
            },
            orderBy: { nama: "asc" }
        });

        res.json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        res.status(500).json({ success: false, message: "Gagal memuat daftar distributor/supplier" });
    }
}

// GET single supplier by ID
async function getById(req, res) {
    try {
        const id = parseInt(req.params.id);
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                spareparts: {
                    include: { brand: true },
                    take: 50
                },
                supplier_rma: {
                    orderBy: { created_at: "desc" },
                    take: 20
                },
                _count: {
                    select: {
                        spareparts: true,
                        supplier_rma: true
                    }
                }
            }
        });

        if (!supplier) {
            return res.status(404).json({ success: false, message: "Supplier tidak ditemukan" });
        }

        res.json({
            success: true,
            data: supplier
        });
    } catch (error) {
        console.error("Error fetching supplier detail:", error);
        res.status(500).json({ success: false, message: "Gagal memuat detail distributor" });
    }
}

// CREATE supplier
async function create(req, res) {
    try {
        const {
            nama,
            kategori,
            kontak_person,
            telepon,
            email,
            alamat,
            link_toko,
            kebijakan_klaim,
            catatan
        } = req.body;

        if (!nama || !nama.trim()) {
            return res.status(400).json({ success: false, message: "Nama distributor/supplier wajib diisi" });
        }

        const newSupplier = await prisma.supplier.create({
            data: {
                nama: nama.trim(),
                kategori: kategori?.trim() || "Distributor Resmi",
                kontak_person: kontak_person?.trim() || null,
                telepon: telepon?.trim() || null,
                email: email?.trim() || null,
                alamat: alamat?.trim() || null,
                link_toko: link_toko?.trim() || null,
                kebijakan_klaim: kebijakan_klaim?.trim() || null,
                catatan: catatan?.trim() || null
            }
        });

        res.status(201).json({
            success: true,
            message: "Distributor/supplier berhasil ditambahkan",
            data: newSupplier
        });
    } catch (error) {
        console.error("Error creating supplier:", error);
        res.status(500).json({ success: false, message: "Gagal menambahkan distributor baru" });
    }
}

// UPDATE supplier
async function update(req, res) {
    try {
        const id = parseInt(req.params.id);
        const {
            nama,
            kategori,
            kontak_person,
            telepon,
            email,
            alamat,
            link_toko,
            kebijakan_klaim,
            catatan,
            is_active
        } = req.body;

        const updated = await prisma.supplier.update({
            where: { id },
            data: {
                ...(nama && { nama: nama.trim() }),
                ...(kategori !== undefined && { kategori: kategori?.trim() || null }),
                ...(kontak_person !== undefined && { kontak_person: kontak_person?.trim() || null }),
                ...(telepon !== undefined && { telepon: telepon?.trim() || null }),
                ...(email !== undefined && { email: email?.trim() || null }),
                ...(alamat !== undefined && { alamat: alamat?.trim() || null }),
                ...(link_toko !== undefined && { link_toko: link_toko?.trim() || null }),
                ...(kebijakan_klaim !== undefined && { kebijakan_klaim: kebijakan_klaim?.trim() || null }),
                ...(catatan !== undefined && { catatan: catatan?.trim() || null }),
                ...(is_active !== undefined && { is_active: Boolean(is_active) })
            }
        });

        res.json({
            success: true,
            message: "Data distributor/supplier berhasil diperbarui",
            data: updated
        });
    } catch (error) {
        console.error("Error updating supplier:", error);
        res.status(500).json({ success: false, message: "Gagal memperbarui data distributor" });
    }
}

// DELETE supplier
async function deleteSupplier(req, res) {
    try {
        const id = parseInt(req.params.id);

        // Check if supplier has spareparts or RMAs
        const countUsage = await prisma.sparepart.count({ where: { supplier_id: id } });
        const countRma = await prisma.supplierRma.count({ where: { supplier_id: id } });

        if (countUsage > 0 || countRma > 0) {
            // Soft deactivate instead of hard delete to preserve historical warranty trails
            await prisma.supplier.update({
                where: { id },
                data: { is_active: false }
            });
            return res.json({
                success: true,
                message: "Supplier memiliki riwayat sparepart/klaim RMA, status dialihkan menjadi nonaktif."
            });
        }

        await prisma.supplier.delete({ where: { id } });
        res.json({ success: true, message: "Supplier berhasil dihapus" });
    } catch (error) {
        console.error("Error deleting supplier:", error);
        res.status(500).json({ success: false, message: "Gagal menghapus supplier" });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    deleteSupplier
};

