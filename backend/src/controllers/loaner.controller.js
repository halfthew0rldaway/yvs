const prisma = require("../config/database");

// --- LOANER DEVICES (POOL UNIT CADANGAN) ---

// Mengambil seluruh unit pinjaman
async function getDevices(req, res) {
    try {
        const { status, kategori, search } = req.query;
        const where = {};

        if (status && status !== "all") {
            where.status = status;
        }

        if (kategori && kategori !== "all") {
            where.kategori = kategori;
        }

        if (search && search.trim() !== "") {
            const q = search.trim();
            where.OR = [
                { kode_unit: { contains: q } },
                { nama: { contains: q } },
                { serial_number: { contains: q } },
                { spesifikasi: { contains: q } },
            ];
        }

        const devices = await prisma.loanerDevice.findMany({
            where,
            include: {
                pinjaman: {
                    where: { status: "aktif" },
                    include: {
                        customer: { select: { id: true, nama: true, nomor_telepon: true } },
                        tiket: { select: { id: true, nomor_tiket: true, status: true } }
                    },
                    take: 1
                }
            },
            orderBy: { created_at: "desc" }
        });

        res.json(devices);
    } catch (err) {
        console.error("Gagal mengambil data unit pinjaman:", err);
        res.status(500).json({ message: "Gagal mengambil data unit pinjaman" });
    }
}

// Statistik ringkasan unit pinjaman
async function getDeviceStats(req, res) {
    try {
        const [total, tersedia, dipinjam, dalam_perawatan] = await Promise.all([
            prisma.loanerDevice.count(),
            prisma.loanerDevice.count({ where: { status: "tersedia" } }),
            prisma.loanerDevice.count({ where: { status: "dipinjam" } }),
            prisma.loanerDevice.count({ where: { status: "dalam_perawatan" } }),
        ]);

        res.json({
            total,
            tersedia,
            dipinjam,
            dalam_perawatan
        });
    } catch (err) {
        console.error("Gagal mengambil statistik unit pinjaman:", err);
        res.status(500).json({ message: "Gagal mengambil statistik unit pinjaman" });
    }
}

// Tambah unit pinjaman baru
async function createDevice(req, res) {
    try {
        const {
            kode_unit,
            nama,
            kategori,
            serial_number,
            spesifikasi,
            kelengkapan,
            kondisi_fisik,
            status,
            catatan
        } = req.body;

        if (!kode_unit || !nama) {
            return res.status(400).json({ message: "Kode unit dan nama perangkat wajib diisi" });
        }

        // Cek duplikasi kode_unit
        const existing = await prisma.loanerDevice.findUnique({
            where: { kode_unit: kode_unit.trim() }
        });
        if (existing) {
            return res.status(400).json({ message: `Kode unit "${kode_unit}" sudah digunakan` });
        }

        const device = await prisma.loanerDevice.create({
            data: {
                kode_unit: kode_unit.trim(),
                nama: nama.trim(),
                kategori: kategori || "Laptop",
                serial_number: serial_number ? serial_number.trim() : null,
                spesifikasi: spesifikasi || null,
                kelengkapan: kelengkapan || "Unit + Charger",
                kondisi_fisik: kondisi_fisik || "Mulus / Normal",
                status: status || "tersedia",
                catatan: catatan || null
            }
        });

        // Audit Log
        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama,
                action: "Tambah Unit Pinjaman",
                entity: `Unit: ${device.kode_unit} - ${device.nama}`
            }
        });

        res.status(201).json(device);
    } catch (err) {
        console.error("Gagal menambahkan unit pinjaman:", err);
        res.status(500).json({ message: "Gagal menambahkan unit pinjaman" });
    }
}

// Update unit pinjaman
async function updateDevice(req, res) {
    try {
        const { id } = req.params;
        const {
            kode_unit,
            nama,
            kategori,
            serial_number,
            spesifikasi,
            kelengkapan,
            kondisi_fisik,
            status,
            catatan
        } = req.body;

        const device = await prisma.loanerDevice.findUnique({
            where: { id: parseInt(id) }
        });
        if (!device) {
            return res.status(404).json({ message: "Unit pinjaman tidak ditemukan" });
        }

        // Jika mengubah status ke tersedia padahal masih ada pinjaman aktif
        if (status === "tersedia" && device.status === "dipinjam") {
            const activeLoan = await prisma.loanerRecord.findFirst({
                where: { loaner_device_id: device.id, status: "aktif" }
            });
            if (activeLoan) {
                return res.status(400).json({
                    message: "Unit ini sedang dipinjam oleh customer. Selesaikan proses pengembalian terlebih dahulu."
                });
            }
        }

        const updated = await prisma.loanerDevice.update({
            where: { id: parseInt(id) },
            data: {
                ...(kode_unit && { kode_unit: kode_unit.trim() }),
                ...(nama && { nama: nama.trim() }),
                ...(kategori && { kategori }),
                serial_number: serial_number !== undefined ? (serial_number ? serial_number.trim() : null) : undefined,
                spesifikasi: spesifikasi !== undefined ? spesifikasi : undefined,
                kelengkapan: kelengkapan !== undefined ? kelengkapan : undefined,
                kondisi_fisik: kondisi_fisik !== undefined ? kondisi_fisik : undefined,
                status: status !== undefined ? status : undefined,
                catatan: catatan !== undefined ? catatan : undefined
            }
        });

        res.json(updated);
    } catch (err) {
        console.error("Gagal memperbarui unit pinjaman:", err);
        res.status(500).json({ message: "Gagal memperbarui unit pinjaman" });
    }
}

// Hapus unit pinjaman
async function deleteDevice(req, res) {
    try {
        const { id } = req.params;
        const deviceId = parseInt(id);

        const device = await prisma.loanerDevice.findUnique({
            where: { id: deviceId },
            include: { pinjaman: true }
        });
        if (!device) {
            return res.status(404).json({ message: "Unit pinjaman tidak ditemukan" });
        }

        if (device.status === "dipinjam") {
            return res.status(400).json({ message: "Unit sedang dipinjam, tidak dapat dihapus." });
        }

        if (device.pinjaman.length > 0) {
            return res.status(400).json({
                message: "Unit memiliki riwayat peminjaman. Ubah status ke 'dalam_perawatan' alih-alih menghapus."
            });
        }

        await prisma.loanerDevice.delete({ where: { id: deviceId } });

        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama,
                action: "Hapus Unit Pinjaman",
                entity: `Unit: ${device.kode_unit}`
            }
        });

        res.json({ message: "Unit pinjaman berhasil dihapus" });
    } catch (err) {
        console.error("Gagal menghapus unit pinjaman:", err);
        res.status(500).json({ message: "Gagal menghapus unit pinjaman" });
    }
}

// --- LOAN RECORDS (HISTORI & AKTIFITAS PINJAMAN) ---

// Mengambil seluruh log peminjaman
async function getRecords(req, res) {
    try {
        const { status, search } = req.query;
        const where = {};

        if (status && status !== "all") {
            where.status = status;
        }

        if (search && search.trim() !== "") {
            const q = search.trim();
            where.OR = [
                { nomor_peminjaman: { contains: q } },
                { customer: { nama: { contains: q } } },
                { customer: { nomor_telepon: { contains: q } } },
                { tiket: { nomor_tiket: { contains: q } } },
                { loaner_device: { kode_unit: { contains: q } } },
                { loaner_device: { nama: { contains: q } } },
            ];
        }

        const records = await prisma.loanerRecord.findMany({
            where,
            include: {
                loaner_device: true,
                customer: true,
                tiket: {
                    include: {
                        perangkat: true,
                        teknisi: { select: { id: true, nama: true } }
                    }
                }
            },
            orderBy: { created_at: "desc" }
        });

        res.json(records);
    } catch (err) {
        console.error("Gagal mengambil daftar peminjaman unit:", err);
        res.status(500).json({ message: "Gagal mengambil daftar peminjaman unit" });
    }
}

// Ambil riwayat peminjaman untuk 1 tiket tertentu
async function getRecordsByTicket(req, res) {
    try {
        const { tiketId } = req.params;
        const records = await prisma.loanerRecord.findMany({
            where: { tiket_id: parseInt(tiketId) },
            include: {
                loaner_device: true,
                customer: true
            },
            orderBy: { created_at: "desc" }
        });

        res.json(records);
    } catch (err) {
        console.error("Gagal mengambil data pinjaman tiket:", err);
        res.status(500).json({ message: "Gagal mengambil data pinjaman tiket" });
    }
}

// Buat peminjaman unit baru untuk tiket servis
async function createRecord(req, res) {
    try {
        const {
            loaner_device_id,
            tiket_id,
            estimasi_kembali,
            deposit_uang,
            catatan_kondisi_pinjam,
            syarat_ketentuan_acc
        } = req.body;

        if (!loaner_device_id || !tiket_id) {
            return res.status(400).json({ message: "Unit pinjaman dan tiket servis wajib ditentukan" });
        }

        // Cek ketersediaan unit
        const device = await prisma.loanerDevice.findUnique({
            where: { id: parseInt(loaner_device_id) }
        });
        if (!device) {
            return res.status(404).json({ message: "Unit pinjaman tidak ditemukan" });
        }
        if (device.status !== "tersedia") {
            return res.status(400).json({ message: `Unit ${device.kode_unit} sedang ${device.status}, tidak tersedia untuk dipinjam.` });
        }

        // Cek tiket servis & customer
        const tiket = await prisma.tiketServis.findUnique({
            where: { id: parseInt(tiket_id) },
            include: { perangkat: { include: { customer: true } } }
        });
        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        // Pastikan tiket ini belum memiliki pinjaman yang masih aktif
        const activeLoan = await prisma.loanerRecord.findFirst({
            where: { tiket_id: tiket.id, status: "aktif" }
        });
        if (activeLoan) {
            return res.status(400).json({
                message: "Tiket ini sudah memiliki unit pinjaman yang masih aktif. Kembalikan unit sebelumnya terlebih dahulu."
            });
        }

        // Generate nomor peminjaman unik: LNR-YYYYMM-XXXX
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const countThisMonth = await prisma.loanerRecord.count();
        const nomor_peminjaman = `LNR-${yearMonth}-${String(countThisMonth + 1).padStart(4, "0")}`;

        // Transaksi simpan record & update status unit
        const [record] = await prisma.$transaction([
            prisma.loanerRecord.create({
                data: {
                    loaner_device_id: device.id,
                    tiket_id: tiket.id,
                    customer_id: tiket.perangkat.customer_id,
                    nomor_peminjaman,
                    tanggal_pinjam: now,
                    estimasi_kembali: estimasi_kembali ? new Date(estimasi_kembali) : null,
                    status: "aktif",
                    deposit_uang: parseFloat(deposit_uang || 0),
                    catatan_kondisi_pinjam: catatan_kondisi_pinjam || device.kondisi_fisik || "Normal / Mulus",
                    syarat_ketentuan_acc: syarat_ketentuan_acc !== false,
                    created_by_nama: req.user.nama
                },
                include: {
                    loaner_device: true,
                    customer: true,
                    tiket: true
                }
            }),
            prisma.loanerDevice.update({
                where: { id: device.id },
                data: { status: "dipinjam" }
            })
        ]);

        // Audit Log
        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama,
                action: "Peminjaman Unit Cadangan",
                entity: `No: ${record.nomor_peminjaman} | Unit: ${device.kode_unit} | Tiket: ${tiket.nomor_tiket} | Customer: ${tiket.perangkat.customer.nama}`
            }
        });

        res.status(201).json(record);
    } catch (err) {
        console.error("Gagal membuat peminjaman unit:", err);
        res.status(500).json({ message: "Gagal membuat peminjaman unit" });
    }
}

// Pengembalian unit pinjaman
async function returnRecord(req, res) {
    try {
        const { id } = req.params;
        const {
            catatan_kondisi_kembali,
            kondisi_unit_akhir, // "tersedia" atau "dalam_perawatan" (jika rusak)
            deposit_dikembalikan
        } = req.body;

        const record = await prisma.loanerRecord.findUnique({
            where: { id: parseInt(id) },
            include: {
                loaner_device: true,
                tiket: true,
                customer: true
            }
        });

        if (!record) {
            return res.status(404).json({ message: "Data peminjaman tidak ditemukan" });
        }

        if (record.status === "dikembalikan") {
            return res.status(400).json({ message: "Unit pinjaman ini sudah tercatat dikembalikan." });
        }

        const now = new Date();
        const targetDeviceStatus = kondisi_unit_akhir === "dalam_perawatan" ? "dalam_perawatan" : "tersedia";

        const [updatedRecord] = await prisma.$transaction([
            prisma.loanerRecord.update({
                where: { id: record.id },
                data: {
                    status: "dikembalikan",
                    tanggal_kembali: now,
                    catatan_kondisi_kembali: catatan_kondisi_kembali || "Dikembalikan dalam kondisi baik & lengkap",
                    diterima_kembali_nama: req.user.nama
                },
                include: {
                    loaner_device: true,
                    customer: true,
                    tiket: true
                }
            }),
            prisma.loanerDevice.update({
                where: { id: record.loaner_device_id },
                data: { status: targetDeviceStatus }
            })
        ]);

        // Audit Log
        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama,
                action: "Pengembalian Unit Pinjaman",
                entity: `No: ${record.nomor_peminjaman} | Unit: ${record.loaner_device.kode_unit} | Tiket: ${record.tiket.nomor_tiket} (Status Unit: ${targetDeviceStatus})`
            }
        });

        res.json(updatedRecord);
    } catch (err) {
        console.error("Gagal memproses pengembalian unit pinjaman:", err);
        res.status(500).json({ message: "Gagal memproses pengembalian unit pinjaman" });
    }
}

module.exports = {
    getDevices,
    getDeviceStats,
    createDevice,
    updateDevice,
    deleteDevice,
    getRecords,
    getRecordsByTicket,
    createRecord,
    returnRecord
};
