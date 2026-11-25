const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const prisma = require("../src/config/database");
const { parseWibStartDate, parseWibEndDate, calculatePromotionDiscount } = require("../src/utils/promotionMath");

function shiftDateStr(offsetDays) {
    const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
    const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    const yyyy = wib.getUTCFullYear();
    const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(wib.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

async function main() {
    console.log("🚀 Seeding contoh data Marketing & Promosi YVS Computer...");

    const samplePromotions = [
        {
            kode_promo: "LEBARAN2026",
            nama_promo: "Diskon Lebaran Servis Laptop",
            deskripsi: "Potongan 20% khusus biaya jasa servis laptop menjelang libur panjang.",
            tipe_diskon: "persen",
            nilai_diskon: 20,
            cakupan_diskon: "jasa",
            maksimal_diskon: 75000,
            minimal_transaksi: 100000,
            kategori_perangkat: "Laptop",
            tipe_tiket: "Semua",
            tanggal_mulai: parseWibStartDate(shiftDateStr(-10)),
            tanggal_selesai: parseWibEndDate(shiftDateStr(25)),
            kuota_total: 30,
            satu_kali_per_pelanggan: true,
            saluran_promosi: "Instagram",
            tanggal_promosi: parseWibStartDate(shiftDateStr(-10)),
            catatan_kampanye: "Dipublikasikan di Instagram Story & Reels @yvscomputer, dilengkapi poster promo A3 di meja penerimaan.",
            tampil_di_tracking: true,
            is_active: true,
            created_by_nama: "Admin YVS",
        },
        {
            kode_promo: "REPASTE30",
            nama_promo: "Promo Perawatan & Repaste Rutin",
            deskripsi: "Potongan langsung Rp 30.000 untuk jasa cleaning kipas & ganti thermal paste.",
            tipe_diskon: "nominal",
            nilai_diskon: 30000,
            cakupan_diskon: "jasa",
            maksimal_diskon: null,
            minimal_transaksi: 75000,
            kategori_perangkat: "Laptop, PC Desktop",
            tipe_tiket: "Semua",
            tanggal_mulai: parseWibStartDate(shiftDateStr(-15)),
            tanggal_selesai: parseWibEndDate(shiftDateStr(45)),
            kuota_total: 50,
            satu_kali_per_pelanggan: false,
            saluran_promosi: "WhatsApp",
            tanggal_promosi: parseWibStartDate(shiftDateStr(-14)),
            catatan_kampanye: "Dikirim via outreach WhatsApp ke pelanggan laptop yang terakhir servis lebih dari 6 bulan lalu.",
            tampil_di_tracking: true,
            is_active: true,
            created_by_nama: "Admin YVS",
        },
        {
            kode_promo: "PELAJAR15",
            nama_promo: "Diskon Pelajar & Mahasiswa",
            deskripsi: "Potongan 15% jasa perbaikan dengan menunjukkan kartu pelajar/KTM di kasir.",
            tipe_diskon: "persen",
            nilai_diskon: 15,
            cakupan_diskon: "jasa",
            maksimal_diskon: 50000,
            minimal_transaksi: 0,
            kategori_perangkat: "Semua",
            tipe_tiket: "reguler",
            tanggal_mulai: parseWibStartDate(shiftDateStr(-30)),
            tanggal_selesai: parseWibEndDate(shiftDateStr(60)),
            kuota_total: null,
            satu_kali_per_pelanggan: false,
            saluran_promosi: "Poster Toko",
            tanggal_promosi: parseWibStartDate(shiftDateStr(-30)),
            catatan_kampanye: "Banner berdiri di depan workshop Pekayon Jaya & stiker meja kasir.",
            tampil_di_tracking: true,
            is_active: true,
            created_by_nama: "Admin YVS",
        },
        {
            kode_promo: "GAJIAN50",
            nama_promo: "Promo Gajian Akhir Bulan",
            deskripsi: "Potongan total tagihan Rp 50.000 untuk servis dengan minimal transaksi Rp 250.000.",
            tipe_diskon: "nominal",
            nilai_diskon: 50000,
            cakupan_diskon: "total",
            maksimal_diskon: null,
            minimal_transaksi: 250000,
            kategori_perangkat: "Semua",
            tipe_tiket: "Semua",
            tanggal_mulai: parseWibStartDate(shiftDateStr(2)),
            tanggal_selesai: parseWibEndDate(shiftDateStr(10)),
            kuota_total: 15,
            satu_kali_per_pelanggan: true,
            saluran_promosi: "Multi-Channel",
            tanggal_promosi: parseWibStartDate(shiftDateStr(1)),
            catatan_kampanye: "Dijadwalkan tayang serentak di Status WA Admin, IG Story, dan Google Maps Update.",
            is_active: true,
            created_by_nama: "Admin YVS",
        },
        {
            kode_promo: "AWALBULAN",
            nama_promo: "Promo Servis Awal Bulan",
            deskripsi: "Promo periode lalu sebagai pembanding performa kampanye Google Maps.",
            tipe_diskon: "persen",
            nilai_diskon: 10,
            cakupan_diskon: "jasa",
            maksimal_diskon: 40000,
            minimal_transaksi: 0,
            kategori_perangkat: "Semua",
            tipe_tiket: "Semua",
            tanggal_mulai: parseWibStartDate(shiftDateStr(-45)),
            tanggal_selesai: parseWibEndDate(shiftDateStr(-16)),
            kuota_total: 20,
            satu_kali_per_pelanggan: false,
            saluran_promosi: "Google Maps",
            tanggal_promosi: parseWibStartDate(shiftDateStr(-45)),
            catatan_kampanye: "Dipasang di kolom Update Penawaran Profil Google Business Pekayon.",
            is_active: true,
            created_by_nama: "Admin YVS",
        },
    ];

    const seededPromos = [];
    for (const p of samplePromotions) {
        const upserted = await prisma.promotion.upsert({
            where: { kode_promo: p.kode_promo },
            update: {
                nama_promo: p.nama_promo,
                deskripsi: p.deskripsi,
                saluran_promosi: p.saluran_promosi,
                catatan_kampanye: p.catatan_kampanye,
                tampil_di_tracking: Boolean(p.tampil_di_tracking),
            },
            create: p,
        });
        seededPromos.push(upserted);
        console.log(`  ✔ Promo siap: ${upserted.kode_promo} (${upserted.nama_promo})`);
    }

    // Link beberapa invoice yang sudah ada (belum punya promotion_id) agar riwayat penukaran & laporan perbandingan langsung terisi
    const promoWithExistingRedemptions = await prisma.invoice.count({
        where: { promotion_id: { not: null } },
    });

    if (promoWithExistingRedemptions === 0) {
        const candidateInvoices = await prisma.invoice.findMany({
            where: {
                promotion_id: null,
                biaya_jasa: { gt: 0 },
                tiket: { status: { not: "dibatalkan" } },
            },
            include: {
                tiket: { include: { perangkat: true } },
            },
            orderBy: { created_at: "desc" },
            take: 8,
        });

        const assignablePromos = seededPromos.filter((p) =>
            ["LEBARAN2026", "REPASTE30", "PELAJAR15", "AWALBULAN"].includes(p.kode_promo)
        );

        let linkedCount = 0;
        for (let i = 0; i < candidateInvoices.length && assignablePromos.length > 0; i++) {
            const inv = candidateInvoices[i];
            const promo = assignablePromos[i % assignablePromos.length];
            const calc = calculatePromotionDiscount(promo, {
                biaya_jasa: inv.biaya_jasa,
                biaya_sparepart: inv.biaya_sparepart,
            });
            if (calc.discount <= 0) continue;

            await prisma.$transaction([
                prisma.invoice.update({
                    where: { id: inv.id },
                    data: {
                        promotion_id: promo.id,
                        diskon: calc.discount,
                        total_biaya: calc.totalAfterDiscount,
                        keterangan_diskon: `Promo: ${promo.nama_promo} (${promo.kode_promo})`,
                    },
                }),
                prisma.promotion.update({
                    where: { id: promo.id },
                    data: { kuota_terpakai: { increment: 1 } },
                }),
            ]);
            linkedCount++;
        }
        console.log(`  ✔ Menautkan ${linkedCount} invoice contoh ke promo untuk demo pelacakan & laporan.`);
    } else {
        console.log(`  ℹ Sudah ada ${promoWithExistingRedemptions} invoice berpromo, tidak menimpa data eksisting.`);
    }

    // Seed dedicated CampaignNote timeline examples (idempotent)
    const existingCampaignCount = await prisma.campaignNote.count();
    if (existingCampaignCount === 0) {
        const byCode = new Map(seededPromos.map((p) => [p.kode_promo, p]));
        const sampleCampaigns = [
            {
                promotion_id: byCode.get("LEBARAN2026")?.id || null,
                judul: "Publikasi Reels & Story Instagram Gelombang 1",
                saluran: "Instagram",
                tanggal_publikasi: parseWibStartDate(shiftDateStr(-10)),
                tautan_referensi: "https://instagram.com/yvscomputer",
                catatan: "Tayang Reels servis laptop + highlight Story dengan kode LEBARAN2026.",
                created_by_nama: "Admin YVS",
            },
            {
                promotion_id: byCode.get("LEBARAN2026")?.id || null,
                judul: "Pasang Poster A3 Meja Penerimaan Workshop",
                saluran: "Poster Toko",
                tanggal_publikasi: parseWibStartDate(shiftDateStr(-9)),
                tautan_referensi: "Arsip Poster Canva: Folder Promo-Lebaran-A3",
                catatan: "Dipasang di acrylic stand meja depan dekat QR registrasi mandiri.",
                created_by_nama: "Admin YVS",
            },
            {
                promotion_id: byCode.get("REPASTE30")?.id || null,
                judul: "Outreach WhatsApp Pelanggan Laptop > 6 Bulan",
                saluran: "WhatsApp",
                tanggal_publikasi: parseWibStartDate(shiftDateStr(-6)),
                tautan_referensi: null,
                catatan: "Kirim pesan personal via tab Outreach ke 25 pemilik laptop yang belum servis > 180 hari.",
                created_by_nama: "Admin YVS",
            },
            {
                promotion_id: byCode.get("PELAJAR15")?.id || null,
                judul: "Tampilkan Penawaran di Halaman Tracking Publik",
                saluran: "Website / Tracking",
                tanggal_publikasi: parseWibStartDate(shiftDateStr(-4)),
                tautan_referensi: "https://komputerawet.com/tracking#promo-aktif",
                catatan: "Opsi Tampil di Tracking diaktifkan untuk menarik pelanggan walk-in dan mahasiswa sekitar Bekasi.",
                created_by_nama: "Admin YVS",
            },
            {
                promotion_id: null,
                judul: "Update Foto Workshop & Jam Buka Google Maps",
                saluran: "Google Maps",
                tanggal_publikasi: parseWibStartDate(shiftDateStr(-3)),
                tautan_referensi: "https://maps.google.com/?q=Yangversa+Computer+Pekayon",
                catatan: "Kampanye brand awareness umum (tanpa kode diskon) untuk menaikkan trafik pencarian lokal Pekayon.",
                created_by_nama: "Admin YVS",
            },
        ];
        await prisma.campaignNote.createMany({ data: sampleCampaigns });
        console.log(`  ✔ Menambahkan ${sampleCampaigns.length} contoh Catatan Kampanye.`);
    }

    console.log("✅ Seed dummy Marketing selesai!");
}

main()
    .catch((err) => {
        console.error("❌ Gagal seed marketing:", err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
