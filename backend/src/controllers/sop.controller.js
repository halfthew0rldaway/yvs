const prisma = require("../config/database");

// Master seed SOP data (KEOS Standard from Boss's Blueprint & SOP Service Excellent)
const DEFAULT_SOPS = [
    {
        kode: "SOP-OPS-004",
        judul: "SOP Grooming & Standar Penampilan Tim",
        kategori: "Operasional Toko",
        target_role: "Semua",
        ringkasan: "Standar penampilan, seragam, dan kebersihan diri untuk membangun kepercayaan pelanggan dalam 10 detik pertama penyerahan unit bernilai tinggi.",
        poin_kunci: JSON.stringify([
            "Wajib mengenakan polo resmi KomputerAwet/Yangversa rapi dan disetrika.",
            "Celana panjang kerja warna gelap (hitam/abu-abu tua) dan ikat pinggang polos.",
            "Sepatu tertutup bersol anti-slip (dilarang sandal atau celana sobek di workshop).",
            "Wajib memakai Name Tag agar mudah dikenali pelanggan.",
            "Menjaga kebersihan diri, rambut rapi, nafas segar, bebas bau badan."
        ]),
        konten: `### 1. TUJUAN
Menetapkan standar penampilan seluruh karyawan agar membangun kepercayaan pelanggan sejak 10 detik pertama, mencerminkan profesionalisme tinggi dalam menangani perangkat bernilai tinggi milik pelanggan.

### 2. PRINSIP DASAR
"Penampilan profesional adalah bentuk penghormatan kepada pelanggan, rekan kerja, dan diri sendiri." Grooming bukan untuk mewah, melainkan mencerminkan Bersih, Rapi, Aman, dan Profesional.

### 3. STANDAR SERAGAM
- **Teknisi**: Polo resmi, celana panjang kerja gelap, ikat pinggang polos, sepatu tertutup anti-slip, ID card/name tag. Dilarang memakai topi atau sandal di dalam workshop.
- **Frontliner / CS**: Kemeja/polo resmi, celana/rok sopan formal, sepatu tertutup, name tag, riasan wajah rapi dan wajar.

### 4. KEBERSIHAN & KESELAMATAN
- Tubuh bersih dan tidak berbau badan menyengat.
- Rambut tertata rapi, tidak menutupi pandangan saat menyolder atau merakit.
- Hindari perhiasan tangan/jam tangan logam longgar saat menangani motherboard aktif (mencegah short circuit).`,
        versi: "1.0",
        is_active: true
    },
    {
        kode: "SOP-OPS-007",
        judul: "SOP Kesiapan Pembukaan Workshop & Toko",
        kategori: "Operasional Toko",
        target_role: "Semua",
        ringkasan: "Prosedur checklist harian setiap pagi sebelum toko dibuka untuk memastikan kelistrikan, sistem kasir, internet, dan kebersihan siap 100%.",
        poin_kunci: JSON.stringify([
            "Hadir minimal 15-30 menit sebelum jam operasional dimulai.",
            "Cek keamanan fisik: pintu, gembok, dan kamera CCTV aktif merekam.",
            "Cek kelistrikan & grounding workshop: pastikan tegangan stabil dan MCB aman.",
            "Uji koneksi internet utama & cadangan untuk sistem tiket kasir Serv.io.",
            "Briefing pagi 10 menit (FRM-OPS-001) dipimpin Leader/Admin."
        ]),
        konten: `### 1. TUJUAN
Memastikan seluruh fasilitas fisik, infrastruktur listrik, perangkat pendukung, dan kesiapan sistem telah terverifikasi dengan aman sebelum pelanggan pertama datang.

### 2. TAHAP PEMERIKSAAN HARIAN
1. **Keamanan Fisik**: Periksa kondisi gembok, rolling door, dan pastikan seluruh kamera CCTV berfungsi merekam.
2. **Kelistrikan & Grounding**: Hidupkan saklar utama workshop, cek voltmeter stabilizer (220V ±5%), pastikan grounding stopkontak teknisi di bawah 2 Ohm.
3. **Koneksi Jaringan**: Pastikan router internet online, ping latency stabil, dan sistem kasir/tiket Serv.io siap dipakai.
4. **Area Frontdesk & Customer**: Bersihkan meja penerimaan, display aksesoris, dan siapkan alat tulis serta tanda terima BPBS.
5. **Briefing Pagi (10 Menit)**: Evaluasi unit pending kemarin, bagi tugas unit prioritas SLA hari ini, dan doa bersama.`,
        versi: "1.0",
        is_active: true
    },
    {
        kode: "SOP-QC-001",
        judul: "Standar 8-Point Quality Control (QC) Sebelum Handover",
        kategori: "Teknisi & QC",
        target_role: "Teknisi",
        ringkasan: "Prosedur pengujian ketat 8 titik fungsi perangkat wajib lolos sebelum unit diubah ke status 'Bisa Diambil / Selesai'.",
        poin_kunci: JSON.stringify([
            "Point 1-2: Fisik casing, baut lengkap, engsel kokoh, dan layar bebas flek/garis.",
            "Point 3-4: Keyboard (semua tombol), touchpad/gesture, webcam, dan mikrofon.",
            "Point 5-6: Wi-Fi, Bluetooth, port USB, HDMI/Type-C, dan audio speaker jernih.",
            "Point 7: Baterai charging lancar dan status kesehatan baterai (Battery Health).",
            "Point 8: Stress test suhu (thermal) minimal 15 menit tanpa restart/throttling abnormal."
        ]),
        konten: `### 1. TUJUAN
Mencegah terjadinya return / komplain berulang dari pelanggan dengan memastikan semua fungsi perangkat bekerja normal, bukan hanya bagian yang diperbaiki.

### 2. 8 CHECKPOINT QC WAJIB
1. **Inspeksi Fisik & Baut**: Pastikan casing rapat, tidak ada pengait patah, seluruh baut terpasang presisi dengan ukuran yang sesuai.
2. **Layar / Display**: Tes warna solid (RGB & White/Black) untuk memeriksa dead pixel, backlight bleed, atau flicker saat engsel digerakkan.
3. **Keyboard & Trackpad**: Jalankan Keyboard Tester untuk memverifikasi 100% tombol merespons. Uji multi-touch gesture trackpad.
4. **Audio, Mic & Webcam**: Putar video uji suara bass/treble tanpa sember. Rekam suara via Voice Recorder dan buka kamera uji fokus.
5. **Konektivitas & Port I/O**: Colok flashdisk ke seluruh port USB, sambungkan ke monitor eksternal via HDMI, uji sambungan Wi-Fi & Bluetooth.
6. **Baterai & Pengisian Daya**: Uji charger bawaan, amati kenaikan persentase baterai, pastikan tidak ada indikasi 'Plugged in, not charging'.
7. **Thermal & Stabilitas**: Jalankan benchmark/stres ringan minimal 15 menit. Pantau temperatur CPU/GPU agar berada pada batas aman pabrikan.
8. **Pembersihan Akhir & Kebersihan Estetika**: Bersihkan bekas sidik jari, debu, dan residu flux pada bodi perangkat sebelum dimasukkan ke kantong penyimpanan.`,
        versi: "1.1",
        is_active: true
    },
    {
        kode: "SOP-SAF-001",
        judul: "SOP Keselamatan Kerja & Proteksi Anti-Static (ESD)",
        kategori: "Keselamatan & K3",
        target_role: "Teknisi",
        ringkasan: "Protokol pencegahan kerusakan komponen mikro IC akibat muatan elektrostatik (ESD) dan prosedur keselamatan kerja alat solder.",
        poin_kunci: JSON.stringify([
            "Wajib menggunakan wrist strap ESD atau sentuh grounding sebelum memegang motherboard.",
            "Gunakan matras servis anti-statis pada meja kerja teknisi.",
            "Gunakan obeng berkualitas presisi (cegah dol/baut slek) dan wadah magnetik baut.",
            "Wajib cabut baterai & charger sebelum menyentuh konektor LCD atau kabel fleksibel.",
            "Matikan solder & hot air blower jika meja ditinggalkan lebih dari 5 menit."
        ]),
        konten: `### 1. TUJUAN
Melindungi keselamatan teknisi dari bahaya luka bakar/sengatan listrik, serta melindungi motherboard dan IC sensitif pelanggan dari lonjakan muatan listrik statis (Electrostatic Discharge).

### 2. ATURAN EMAS ANTI-STATIC (ESD)
- **Cabut Sumber Daya**: Jangan pernah melepas atau memasang kabel fleksibel layar LCD dalam keadaan baterai masih terhubung ke motherboard (risiko backlight fuse putus / short IC power).
- **Gunakan Perlindungan ESD**: Sentuh ground netral atau kenakan gelang anti-statis saat membongkar perangkat tipis modern.
- **Wadah Baut**: Gunakan mangkuk magnetik atau tray part terpisah untuk tiap unit customer agar baut tidak tertukar dan tidak masuk ke dalam casing saat perakitan.

### 3. KESELAMATAN ALAT PANAS
- Selalu letakkan solder pada dudukannya yang kokoh.
- Pasang penyedot asap solder (fume extractor) saat melakukan soldering lama.
- Pastikan kabel blower dan solder tidak melintang di area lalu lintas orang.`,
        versi: "1.0",
        is_active: true
    },
    {
        kode: "SOP-FL-001",
        judul: "SOP Pelayanan Service Excellent Frontliner (SOP-FL-001)",
        kategori: "Frontliner & CS",
        target_role: "Frontliner",
        ringkasan: "Standar 3S (Senyum, Salam, Sapa), teknik menggali keluhan pelanggan, pembuatan BPBS transparan, dan penataan ekspektasi pengerjaan.",
        poin_kunci: JSON.stringify([
            "Sambut pelanggan dalam 3 detik pertama dengan senyum ramah dan kontak mata.",
            "Dengarkan keluhan pelanggan tanpa memotong pembicaraan (Active Listening).",
            "Lakukan cek fisik awal di depan pelanggan & petakan di Defect Map sistem.",
            "Jelaskan estimasi biaya diagnosa & waktu kerja secara jujur (No False Promises).",
            "Cetak dan serahkan tanda terima BPBS resmi dengan barcode/nomor tiket."
        ]),
        konten: `### 1. MOTTO PELAYANAN
**TRANSPARENT · TRUSTED · WOW**

### 2. STANDAR INTERAKSI DEPAN
1. **Salam Pembuka**: "Selamat pagi/siang Kak, selamat datang di KomputerAwet. Ada yang bisa kami bantu periksa hari ini?"
2. **Menggali Gejala**: Tanyakan kapan kendala pertama kali muncul, apakah pernah terkena tumpahan air, jatuh, atau ada suara asing.
3. **Pemeriksaan Fisik Bersama**: Periksa kondisi fisik unit bersama pelanggan (baret, retak, karet hilang, charger bengkok). Catat langsung di modul **Visual Defect Map** Serv.io agar tidak ada salah paham saat unit selesai.
4. **Konfirmasi Data Pribadi**: Ingatkan pelanggan terkait pencadangan data penting jika penanganan membutuhkan instalasi ulang.
5. **Penyerahan Dokumen BPBS**: Pastikan pelanggan menerima struk BPBS dan jelaskan fitur tracking online lewat nomor tiket.`,
        versi: "1.0",
        is_active: true
    },
    {
        kode: "SOP-WRN-001",
        judul: "SOP Penanganan Garansi & Komplain Pelanggan (MAN-OPS-007)",
        kategori: "Frontliner & CS",
        target_role: "Semua",
        ringkasan: "Filosofi 'Our Warranty Protects Trust'. Prosedur klaim garansi tanpa debat, cepat, serta investigasi akar masalah dengan Kaizen RCA.",
        poin_kunci: JSON.stringify([
            "Sambut pelanggan klaim garansi dengan empati dan permohonan maaf atas ketidaknyamanan.",
            "Validasi masa aktif garansi melalui nomor tiket atau serial number unit.",
            "Dilarang mencari-cari alasan untuk menolak klaim jika kerusakan terkait dengan pengerjaan awal.",
            "Unit garansi otomatis masuk antrean PRIORITAS TINGGI (SLA dipercepat).",
            "Lakukan Root Cause Analysis (RCA) internal untuk mencegah kesalahan serupa berulang."
        ]),
        konten: `### 1. FILOSOFI GARANSI
"Garansi kami melindungi rasa percaya, bukan sekadar perbaikan." KomputerAwet memandang klaim garansi sebagai kesempatan emas untuk membuktikan integritas pelayanan kepada pelanggan.

### 2. PROTOKOL KLAIM GARANSI
1. **Sikap Pertama**: Dengarkan keluhan tanpa defensif. Katakan: *"Mohon maaf sekali ya Kak atas kendala ini. Unitnya langsung kami cek prioritas hari ini."*
2. **Pengecekan Sistem**: Buka riwayat tiket pada Serv.io. Periksa tanggal selesai pengerjaan dan masa garansi suku cadang/jasa.
3. **Pemberian Jalur Prioritas**: Tiket garansi diberi tag **RMA / Garansi** dan diserahkan ke teknisi senior untuk investigasi segera.
4. **Penyelesaian Tanpa Biaya Tambahan**: Jika kendala disebabkan oleh suku cadang defek atau pengerjaan awal, penggantian dilakukan 100% gratis.`,
        versi: "1.0",
        is_active: true
    }
];

// Seed default SOP documents if table is empty
async function ensureSeedSops() {
    try {
        const count = await prisma.sopDocument.count();
        if (count === 0) {
            for (const sop of DEFAULT_SOPS) {
                await prisma.sopDocument.create({ data: sop });
            }
            console.log("✅ Seeded default KEOS SOP documents into database");
        }
    } catch (err) {
        // In case DB is not pushed or available, handled gracefully
        console.warn("Could not check/seed SOPs in DB:", err.message);
    }
}

// Initialize seed check
ensureSeedSops();

// GET all SOPs with filters
async function getAll(req, res) {
    try {
        const { search, kategori, target_role } = req.query;
        const where = { is_active: true };

        if (kategori && kategori !== "all") {
            where.kategori = kategori;
        }

        if (target_role && target_role !== "all") {
            where.target_role = target_role;
        }

        if (search && search.trim() !== "") {
            const q = search.trim();
            where.OR = [
                { kode: { contains: q } },
                { judul: { contains: q } },
                { ringkasan: { contains: q } },
                { konten: { contains: q } }
            ];
        }

        let sops = [];
        try {
            sops = await prisma.sopDocument.findMany({
                where,
                orderBy: { kode: "asc" }
            });
        } catch (dbErr) {
            // Fallback to in-memory default SOPs if DB table is not yet synced
            sops = DEFAULT_SOPS.filter(sop => {
                if (kategori && kategori !== "all" && sop.kategori !== kategori) return false;
                if (target_role && target_role !== "all" && sop.target_role !== target_role && sop.target_role !== "Semua") return false;
                if (search && search.trim() !== "") {
                    const q = search.trim().toLowerCase();
                    return sop.kode.toLowerCase().includes(q) ||
                           sop.judul.toLowerCase().includes(q) ||
                           sop.ringkasan.toLowerCase().includes(q);
                }
                return true;
            });
        }

        // Parse poin_kunci if stored as JSON string
        const formatted = sops.map(s => {
            let points = [];
            if (typeof s.poin_kunci === "string") {
                try {
                    points = JSON.parse(s.poin_kunci);
                } catch {
                    points = s.poin_kunci.split("\n").filter(Boolean);
                }
            } else if (Array.isArray(s.poin_kunci)) {
                points = s.poin_kunci;
            }
            return {
                ...s,
                poin_kunci_list: points
            };
        });

        res.json({
            success: true,
            total: formatted.length,
            data: formatted
        });
    } catch (error) {
        console.error("Error fetching SOP documents:", error);
        res.status(500).json({ success: false, message: "Gagal memuat dokumen SOP" });
    }
}

// GET SOP by ID
async function getById(req, res) {
    try {
        const id = parseInt(req.params.id);
        let sop = null;

        try {
            sop = await prisma.sopDocument.findUnique({ where: { id } });
        } catch (dbErr) {
            sop = DEFAULT_SOPS.find(s => s.id === id || s.kode === req.params.id);
        }

        if (!sop) {
            return res.status(404).json({ success: false, message: "Dokumen SOP tidak ditemukan" });
        }

        let points = [];
        if (typeof sop.poin_kunci === "string") {
            try {
                points = JSON.parse(sop.poin_kunci);
            } catch {
                points = sop.poin_kunci.split("\n").filter(Boolean);
            }
        } else if (Array.isArray(sop.poin_kunci)) {
            points = sop.poin_kunci;
        }

        res.json({
            success: true,
            data: {
                ...sop,
                poin_kunci_list: points
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat detail SOP" });
    }
}

// CREATE SOP
async function create(req, res) {
    try {
        const { kode, judul, kategori, target_role, ringkasan, konten, poin_kunci, versi } = req.body;

        if (!kode || !judul || !ringkasan || !konten) {
            return res.status(400).json({ success: false, message: "Kode, judul, ringkasan, dan konten SOP wajib diisi" });
        }

        const stringifiedPoints = Array.isArray(poin_kunci) ? JSON.stringify(poin_kunci) : (poin_kunci || null);

        const newSop = await prisma.sopDocument.create({
            data: {
                kode: kode.trim().toUpperCase(),
                judul: judul.trim(),
                kategori: kategori || "Operasional Toko",
                target_role: target_role || "Semua",
                ringkasan: ringkasan.trim(),
                konten: konten.trim(),
                poin_kunci: stringifiedPoints,
                versi: versi || "1.0",
                is_active: true
            }
        });

        res.status(201).json({
            success: true,
            message: "Dokumen SOP berhasil ditambahkan",
            data: newSop
        });
    } catch (error) {
        console.error("Error creating SOP:", error);
        if (error.code === "P2002") {
            return res.status(400).json({ success: false, message: "Kode SOP sudah terdaftar, gunakan kode lain." });
        }
        res.status(500).json({ success: false, message: "Gagal menyimpan SOP baru" });
    }
}

// UPDATE SOP
async function update(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { kode, judul, kategori, target_role, ringkasan, konten, poin_kunci, versi, is_active } = req.body;

        const stringifiedPoints = Array.isArray(poin_kunci) ? JSON.stringify(poin_kunci) : (poin_kunci || undefined);

        const updated = await prisma.sopDocument.update({
            where: { id },
            data: {
                ...(kode && { kode: kode.trim().toUpperCase() }),
                ...(judul && { judul: judul.trim() }),
                ...(kategori && { kategori }),
                ...(target_role && { target_role }),
                ...(ringkasan && { ringkasan: ringkasan.trim() }),
                ...(konten && { konten: konten.trim() }),
                ...(stringifiedPoints !== undefined && { poin_kunci: stringifiedPoints }),
                ...(versi && { versi }),
                ...(is_active !== undefined && { is_active })
            }
        });

        res.json({
            success: true,
            message: "Dokumen SOP berhasil diperbarui",
            data: updated
        });
    } catch (error) {
        console.error("Error updating SOP:", error);
        res.status(500).json({ success: false, message: "Gagal memperbarui SOP" });
    }
}

// REMOVE SOP
async function remove(req, res) {
    try {
        const id = parseInt(req.params.id);
        await prisma.sopDocument.delete({ where: { id } });
        res.json({ success: true, message: "Dokumen SOP berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus SOP" });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    DEFAULT_SOPS
};

