const prisma = require("../config/database");
const { broadcast } = require("../utils/sse");

// Mengambil seluruh klaim RMA garansi distributor
async function getAll(req, res) {
    try {
        const { status, search, supplier } = req.query;
        const where = {};

        if (status && status !== "all") {
            where.status = status;
        }

        if (supplier && supplier !== "all") {
            where.supplier_nama = { contains: supplier };
        }

        if (search && search.trim() !== "") {
            const q = search.trim();
            where.OR = [
                { nomor_rma: { contains: q } },
                { supplier_nama: { contains: q } },
                { nomor_faktur: { contains: q } },
                { resi_pengiriman: { contains: q } },
                { alasan_rusak: { contains: q } },
                { customer_nama: { contains: q } },
                { perangkat_nama: { contains: q } },
                { serial_number_lama: { contains: q } },
                { serial_number_baru: { contains: q } },
                { sparepart: { nama: { contains: q } } },
                { tiket: { nomor_tiket: { contains: q } } }
            ];
        }

        const rmaList = await prisma.supplierRma.findMany({
            where,
            include: {
                sparepart: {
                    include: { brand: true }
                },
                tiket: {
                    include: {
                        perangkat: {
                            include: { customer: true }
                        }
                    }
                }
            },
            orderBy: { created_at: "desc" }
        });

        res.json(rmaList);
    } catch (err) {
        console.error("Gagal mengambil data klaim RMA:", err);
        res.status(500).json({ message: "Gagal mengambil data klaim RMA" });
    }
}

// Statistik ringkasan RMA
async function getStats(req, res) {
    try {
        const [
            total,
            diajukan,
            dikirim,
            disetujui_ganti,
            disetujui_refund,
            ditolak
        ] = await Promise.all([
            prisma.supplierRma.count(),
            prisma.supplierRma.count({ where: { status: "diajukan" } }),
            prisma.supplierRma.count({ where: { status: "dikirim" } }),
            prisma.supplierRma.count({ where: { status: "disetujui_ganti" } }),
            prisma.supplierRma.count({ where: { status: "disetujui_refund" } }),
            prisma.supplierRma.count({ where: { status: "ditolak" } }),
        ]);

        res.json({
            total,
            diajukan,
            dikirim,
            disetujui_ganti,
            disetujui_refund,
            ditolak,
            selesai: disetujui_ganti + disetujui_refund
        });
    } catch (err) {
        console.error("Gagal mengambil statistik RMA:", err);
        res.status(500).json({ message: "Gagal mengambil statistik RMA" });
    }
}

// Ambil detail RMA spesifik
async function getById(req, res) {
    try {
        const { id } = req.params;
        const rma = await prisma.supplierRma.findUnique({
            where: { id: parseInt(id) },
            include: {
                sparepart: { include: { brand: true } },
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } },
                        teknisi: { select: { id: true, nama: true } }
                    }
                }
            }
        });

        if (!rma) {
            return res.status(404).json({ message: "Data klaim RMA tidak ditemukan" });
        }

        res.json(rma);
    } catch (err) {
        console.error("Gagal mengambil detail RMA:", err);
        res.status(500).json({ message: "Gagal mengambil detail RMA" });
    }
}

// Buat klaim RMA baru
async function create(req, res) {
    try {
        const {
            sparepart_id,
            tipe_sumber,
            customer_nama,
            customer_kontak,
            perangkat_nama,
            supplier_nama,
            nomor_faktur,
            serial_number_lama,
            kebijakan_garansi,
            tgl_pembelian_distri,
            tgl_penjualan_customer,
            kondisi_fisik_valid,
            bantuan_klaim_toko,
            biaya_ongkir_ditanggung,
            jumlah,
            alasan_rusak,
            foto_kondisi,
            resi_pengiriman,
            kurir_pengiriman,
            ongkir,
            tiket_id
        } = req.body;

        if (!sparepart_id || !supplier_nama || !alasan_rusak) {
            return res.status(400).json({
                message: "Suku cadang, nama supplier/distributor, dan alasan kerusakan wajib diisi"
            });
        }

        const sparepart = await prisma.sparepart.findUnique({
            where: { id: parseInt(sparepart_id) }
        });
        if (!sparepart) {
            return res.status(404).json({ message: "Suku cadang tidak ditemukan" });
        }

        // Jika terhubung ke tiket servis, ambil info customer dan perangkat jika belum diset manual
        let resolvedCustomer = customer_nama || null;
        let resolvedKontak = customer_kontak || null;
        let resolvedPerangkat = perangkat_nama || null;
        let resolvedTglJual = tgl_penjualan_customer ? new Date(tgl_penjualan_customer) : null;

        if (tiket_id) {
            const ticket = await prisma.tiketServis.findUnique({
                where: { id: parseInt(tiket_id) },
                include: {
                    perangkat: {
                        include: { customer: true }
                    }
                }
            });
            if (ticket) {
                if (!resolvedCustomer && ticket.perangkat?.customer?.nama) {
                    resolvedCustomer = ticket.perangkat.customer.nama;
                }
                if (!resolvedKontak && ticket.perangkat?.customer?.no_hp) {
                    resolvedKontak = ticket.perangkat.customer.no_hp;
                }
                if (!resolvedPerangkat && ticket.perangkat) {
                    resolvedPerangkat = `${ticket.perangkat.tipe || 'Unit'} ${ticket.perangkat.model || ''}`.trim();
                }
                if (!resolvedTglJual) {
                    resolvedTglJual = ticket.created_at;
                }
            }
        }

        // Generate nomor RMA unik & robust: RMA-YYYYMM-XXXX
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const latestRma = await prisma.supplierRma.findFirst({
            where: { nomor_rma: { startsWith: `RMA-${yearMonth}-` } },
            orderBy: { id: "desc" }
        });
        let nextNum = 1;
        if (latestRma && latestRma.nomor_rma) {
            const parts = latestRma.nomor_rma.split("-");
            const lastSeq = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastSeq)) nextNum = lastSeq + 1;
        }
        const nomor_rma = `RMA-${yearMonth}-${String(nextNum).padStart(4, "0")}`;

        const initialStatus = resi_pengiriman ? "dikirim" : "diajukan";
        const qtyKlaim = parseInt(jumlah) || 1;

        // Jika diajukan dari stok gudang (bukan dari tiket servis), pisahkan/kurangi part cacat dari stok aktif
        const rma = await prisma.$transaction(async (tx) => {
            if ((!tiket_id || tipe_sumber === "stok_toko") && sparepart.stok >= qtyKlaim) {
                await tx.sparepart.update({
                    where: { id: sparepart.id },
                    data: { stok: { decrement: qtyKlaim } }
                });
            }

            return await tx.supplierRma.create({
                data: {
                    nomor_rma,
                    sparepart_id: sparepart.id,
                    tipe_sumber: tipe_sumber || (tiket_id ? "tiket_user" : "stok_toko"),
                    customer_nama: resolvedCustomer,
                    customer_kontak: resolvedKontak,
                    perangkat_nama: resolvedPerangkat,
                    supplier_nama: supplier_nama.trim(),
                    nomor_faktur: nomor_faktur ? nomor_faktur.trim() : null,
                    serial_number_lama: serial_number_lama ? serial_number_lama.trim() : null,
                    kebijakan_garansi: kebijakan_garansi || sparepart.sistem_perhitungan_garansi || "sejak_nota_customer",
                    tgl_pembelian_distri: tgl_pembelian_distri ? new Date(tgl_pembelian_distri) : null,
                    tgl_penjualan_customer: resolvedTglJual,
                    kondisi_fisik_valid: kondisi_fisik_valid !== undefined ? Boolean(kondisi_fisik_valid) : true,
                    bantuan_klaim_toko: bantuan_klaim_toko !== undefined ? Boolean(bantuan_klaim_toko) : true,
                    biaya_ongkir_ditanggung: biaya_ongkir_ditanggung || "toko",
                    jumlah: qtyKlaim,
                    alasan_rusak: alasan_rusak.trim(),
                    foto_kondisi: foto_kondisi ? JSON.stringify(foto_kondisi) : null,
                    status: initialStatus,
                    resi_pengiriman: resi_pengiriman ? resi_pengiriman.trim() : null,
                    kurir_pengiriman: kurir_pengiriman ? kurir_pengiriman.trim() : null,
                    ongkir: parseFloat(ongkir || 0),
                    tiket_id: tiket_id ? parseInt(tiket_id) : null,
                    created_by_nama: req.user.nama
                },
                include: {
                    sparepart: { include: { brand: true } },
                    tiket: {
                        include: {
                            perangkat: { include: { customer: true } }
                        }
                    }
                }
            });
        });

        // Audit Log
        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama,
                action: "Pengajuan Klaim RMA Distributor",
                entity: `No: ${rma.nomor_rma} | Part: ${sparepart.nama} | Sumber: ${rma.tipe_sumber === 'tiket_user' ? 'Tiket Servis' : 'Stok Toko'} | Distri: ${rma.supplier_nama}`
            }
        });

        // Notifikasi ke role admin jika diajukan oleh teknisi
        if (req.user.role === "teknisi") {
            await prisma.notification.create({
                data: {
                    recipient_role: "admin",
                    sender_id: req.user.id,
                    sender_nama: req.user.nama,
                    tipe: "restock_sparepart",
                    judul: `Klaim RMA Sparepart Baru: ${rma.nomor_rma}`,
                    pesan: `Teknisi ${req.user.nama} mengajukan retur garansi sparepart "${sparepart.nama}" ke distributor "${rma.supplier_nama}". Alasan: ${rma.alasan_rusak}`,
                    link: "/rma"
                }
            });
        }

        res.status(201).json(rma);
    } catch (err) {
        console.error("Gagal mengajukan klaim RMA:", err);
        res.status(500).json({ message: "Gagal mengajukan klaim RMA" });
    }
}

// Update status & penyelesaian RMA
async function update(req, res) {
    try {
        const { id } = req.params;
        const {
            supplier_nama,
            nomor_faktur,
            serial_number_lama,
            serial_number_baru,
            kebijakan_garansi,
            tgl_pembelian_distri,
            tgl_penjualan_customer,
            kondisi_fisik_valid,
            bantuan_klaim_toko,
            biaya_ongkir_ditanggung,
            customer_nama,
            customer_kontak,
            perangkat_nama,
            jumlah,
            alasan_rusak,
            status,
            resi_pengiriman,
            kurir_pengiriman,
            ongkir,
            solusi_distributor,
            catatan_distributor,
            restock_otomatis
        } = req.body;

        const rma = await prisma.supplierRma.findUnique({
            where: { id: parseInt(id) },
            include: { sparepart: true }
        });

        if (!rma) {
            return res.status(404).json({ message: "Data klaim RMA tidak ditemukan" });
        }

        const isFinishing = ["disetujui_ganti", "disetujui_refund", "ditolak"].includes(status);
        const tgl_selesai = isFinishing ? (rma.tgl_selesai || new Date()) : null;

        // Jika disetujui ganti unit baru dan restock_otomatis dicentang, tambahkan stok & buat audit log
        let updateStokPromise = null;
        let createRestockLogPromise = null;

        if (status === "disetujui_ganti" && rma.status !== "disetujui_ganti" && restock_otomatis) {
            updateStokPromise = prisma.sparepart.update({
                where: { id: rma.sparepart_id },
                data: {
                    stok: { increment: rma.jumlah }
                }
            });

            createRestockLogPromise = prisma.restockLog.create({
                data: {
                    sparepart_id: rma.sparepart_id,
                    supplier_nama: supplier_nama || rma.supplier_nama,
                    jumlah_masuk: rma.jumlah,
                    harga_beli_pcs: rma.sparepart?.harga_beli || 0,
                    nomor_faktur: rma.nomor_rma,
                    catatan: `Penggantian garansi distributor (Klaim RMA: ${rma.nomor_rma}${serial_number_baru ? ` | SN Baru: ${serial_number_baru}` : ''})`,
                    user_id: req.user.id,
                    user_nama: req.user.nama
                }
            });
        }

        const updateRmaPromise = prisma.supplierRma.update({
            where: { id: parseInt(id) },
            data: {
                ...(supplier_nama && { supplier_nama: supplier_nama.trim() }),
                nomor_faktur: nomor_faktur !== undefined ? nomor_faktur : undefined,
                serial_number_lama: serial_number_lama !== undefined ? serial_number_lama : undefined,
                serial_number_baru: serial_number_baru !== undefined ? serial_number_baru : undefined,
                kebijakan_garansi: kebijakan_garansi !== undefined ? kebijakan_garansi : undefined,
                tgl_pembelian_distri: tgl_pembelian_distri !== undefined ? (tgl_pembelian_distri ? new Date(tgl_pembelian_distri) : null) : undefined,
                tgl_penjualan_customer: tgl_penjualan_customer !== undefined ? (tgl_penjualan_customer ? new Date(tgl_penjualan_customer) : null) : undefined,
                kondisi_fisik_valid: kondisi_fisik_valid !== undefined ? Boolean(kondisi_fisik_valid) : undefined,
                bantuan_klaim_toko: bantuan_klaim_toko !== undefined ? Boolean(bantuan_klaim_toko) : undefined,
                biaya_ongkir_ditanggung: biaya_ongkir_ditanggung !== undefined ? biaya_ongkir_ditanggung : undefined,
                customer_nama: customer_nama !== undefined ? customer_nama : undefined,
                customer_kontak: customer_kontak !== undefined ? customer_kontak : undefined,
                perangkat_nama: perangkat_nama !== undefined ? perangkat_nama : undefined,
                jumlah: jumlah ? parseInt(jumlah) : undefined,
                alasan_rusak: alasan_rusak !== undefined ? alasan_rusak : undefined,
                status: status !== undefined ? status : undefined,
                resi_pengiriman: resi_pengiriman !== undefined ? resi_pengiriman : undefined,
                kurir_pengiriman: kurir_pengiriman !== undefined ? kurir_pengiriman : undefined,
                ongkir: ongkir !== undefined ? parseFloat(ongkir) : undefined,
                solusi_distributor: solusi_distributor !== undefined ? solusi_distributor : undefined,
                catatan_distributor: catatan_distributor !== undefined ? catatan_distributor : undefined,
                tgl_selesai
            },
            include: {
                sparepart: { include: { brand: true } },
                tiket: {
                    include: {
                        perangkat: { include: { customer: true } }
                    }
                }
            }
        });

        const txPromises = [updateRmaPromise];
        if (updateStokPromise) txPromises.push(updateStokPromise);
        if (createRestockLogPromise) txPromises.push(createRestockLogPromise);

        const results = await prisma.$transaction(txPromises);
        const updated = results[0];

        // Audit Log
        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama,
                action: "Update Klaim RMA Distributor",
                entity: `No: ${rma.nomor_rma} | Status Baru: ${status || rma.status} | Solusi: ${solusi_distributor || "-"} | SN Pengganti: ${serial_number_baru || "-"}`
            }
        });

        res.json(updated);
    } catch (err) {
        console.error("Gagal memperbarui klaim RMA:", err);
        res.status(500).json({ message: "Gagal memperbarui klaim RMA" });
    }
}

// Hapus klaim RMA jika masih draft/diajukan
async function remove(req, res) {
    try {
        const { id } = req.params;
        const rma = await prisma.supplierRma.findUnique({
            where: { id: parseInt(id) }
        });

        if (!rma) {
            return res.status(404).json({ message: "Data klaim RMA tidak ditemukan" });
        }

        if (rma.status !== "diajukan") {
            return res.status(400).json({
                message: "Hanya klaim RMA berstatus 'diajukan' yang dapat dibatalkan/dihapus."
            });
        }

        await prisma.supplierRma.delete({ where: { id: parseInt(id) } });

        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama,
                action: "Hapus Klaim RMA",
                entity: `No: ${rma.nomor_rma}`
            }
        });

        res.json({ message: "Klaim RMA berhasil dihapus" });
    } catch (err) {
        console.error("Gagal menghapus klaim RMA:", err);
        res.status(500).json({ message: "Gagal menghapus klaim RMA" });
    }
}

module.exports = {
    getAll,
    getStats,
    getById,
    create,
    update,
    remove
};

