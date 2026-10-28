require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { calculateWarrantyExpiry } = require("./src/utils/tiket");

const prisma = new PrismaClient();

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    console.log("[SEED] ==========================================================================");
    console.log("[SEED] Memulai proses seeding data komprehensif, terintegrasi, dan sinkron...");
    console.log("[SEED] Mencakup seluruh modul baru: Supplier, RMA, SOP, Rekrutmen, Loaner, dll.");
    console.log("[SEED] ==========================================================================\n");

    // 1. Bersihkan seluruh data lama secara berurutan agar bebas duplikasi dan aman foreign key
    console.log("[SEED] 1. Membersihkan seluruh data lama (Zero Collision / Clean Slate)...");
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.staffSignature.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.loanerRecord.deleteMany();
    await prisma.loanerDevice.deleteMany();
    await prisma.supplierRma.deleteMany();
    await prisma.applicant.deleteMany();
    await prisma.jobPosting.deleteMany();
    await prisma.sopDocument.deleteMany();
    await prisma.penggunaanSparepart.deleteMany();
    await prisma.logPerbaikan.deleteMany();
    await prisma.diagnosis.deleteMany();
    await prisma.restockLog.deleteMany();
    await prisma.repairWiki.deleteMany();
    
    // Putuskan relasi klaim anak sebelum menghapus tiket servis
    await prisma.tiketServis.updateMany({ data: { parent_tiket_id: null } });
    await prisma.tiketServis.deleteMany();
    await prisma.perangkat.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.sparepart.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.user.deleteMany();
    console.log("[SEED] -> Seluruh tabel berhasil dikosongkan secara bersih.\n");

    const defaultPassword = await bcrypt.hash("password123", 10);

    // 2. Buat Staf, Admin, Pimpinan, dan Teknisi Berpengalaman
    console.log("[SEED] 2. Membuat Akun Staf, Service Advisor, Pimpinan & Teknisi...");
    const admin = await prisma.user.create({
        data: { nama: "Admin Utama", email: "admin@workshop.com", password: defaultPassword, role: "admin" }
    });
    const admin2 = await prisma.user.create({
        data: { nama: "Siti Rahmawati (Service Advisor)", email: "siti.admin@workshop.com", password: defaultPassword, role: "admin" }
    });
    const pimpinan = await prisma.user.create({
        data: { nama: "H. Bambang Yangversa (Pimpinan)", email: "pimpinan@workshop.com", password: defaultPassword, role: "pimpinan" }
    });

    const teknisis = await Promise.all([
        prisma.user.create({ data: { nama: "Budi Santoso (Senior Specialist)", email: "teknisi1@workshop.com", password: defaultPassword, role: "teknisi" } }),
        prisma.user.create({ data: { nama: "Andi Wijaya (PC Gaming)", email: "teknisi2@workshop.com", password: defaultPassword, role: "teknisi" } }),
        prisma.user.create({ data: { nama: "Reza Rahadian (MacBook Specialist)", email: "teknisi3@workshop.com", password: defaultPassword, role: "teknisi" } }),
        prisma.user.create({ data: { nama: "Dedi Kurniawan (Hardware & Display)", email: "teknisi4@workshop.com", password: defaultPassword, role: "teknisi" } }),
        prisma.user.create({ data: { nama: "Fikri Ardiansyah (Software & OS)", email: "teknisi5@workshop.com", password: defaultPassword, role: "teknisi" } }),
        prisma.user.create({ data: { nama: "Maya Putri (Motherboard Tech)", email: "teknisi6@workshop.com", password: defaultPassword, role: "teknisi" } }),
    ]);

    // 3. Master Brand Perangkat & Komponen
    console.log("[SEED] 3. Membuat Master Brand...");
    const brandNames = [
        "ASUS", "Acer", "Lenovo", "HP", "Dell", "Apple", "MSI", "Gigabyte", 
        "Kingston", "Samsung", "Corsair", "Western Digital", "Seagate", "Logitech", "Epson", "Canon", "Lainnya"
    ];
    const brandMap = {};
    for (const name of brandNames) {
        const b = await prisma.brand.create({ data: { nama: name } });
        brandMap[name] = b.id;
    }

    // 4. Master Supplier & Distributor Resmi Komponen (6 Distributor Realistis Indonesia)
    console.log("[SEED] 4. Membuat Master Distributor & Supplier Terdaftar...");
    const supplierDefs = [
        {
            nama: "PT Synnex Metrodata Indonesia",
            kategori: "Distributor Resmi",
            kontak_person: "Hendra Gunawan (Key Account Manager)",
            telepon: "081288991122",
            email: "rma.support@synnexmetrodata.co.id",
            alamat: "Kawasan Industri Pulo Gadung, Jl. Rawa Gelam IV No. 3, Jakarta Timur 13930",
            link_toko: "https://www.synnexmetrodata.com/support/warranty",
            kebijakan_klaim: "Garansi resmi berlaku sejak tanggal faktur/nota pembelian end-user (grace period rak toko 60 hari). Wajib menyertakan stiker segel hologram SMI utuh dan kemasan asli. Bebas biaya pengerjaan RMA jika dalam masa garansi.",
            catatan: "Distributor resmi untuk Kingston, ASUS Component, HP, dan Dell spareparts."
        },
        {
            nama: "PT Nusantara Jaya Teknologi (NJT)",
            kategori: "Distributor Resmi",
            kontak_person: "Budi Wicaksono (RMA Coordinator)",
            telepon: "08119876543",
            email: "service.center@njt.co.id",
            alamat: "Ruko Harco Mangga Dua Blok G No. 18-19, Jl. Arteri Mangga Dua Raya, Jakarta Pusat",
            link_toko: "https://njt.co.id/rma-center",
            kebijakan_klaim: "Garansi Lifetime untuk memory RAM Corsair/Kingston dan 3-5 tahun untuk PSU & SSD WD. Penggantian unit 1-on-1 langsung bila stok replacement ready. Wajib kemasan blister & stiker garansi NJT.",
            catatan: "Distributor resmi Corsair, Western Digital, Gigabyte, dan ECS."
        },
        {
            nama: "PT Astrindo Senayasa",
            kategori: "Distributor Resmi",
            kontak_person: "Denny Saputra (Service Operations)",
            telepon: "081322334455",
            email: "rma.claim@astrindo.com",
            alamat: "Mangga Dua Mall Lantai 4 No. 25, Jl. Mangga Dua Raya, Sawah Besar, Jakarta Pusat",
            link_toko: "https://astrindo-senayasa.co.id/rma",
            kebijakan_klaim: "Garansi resmi ASUS Motherboard, Peripheral & Adaptor 1-3 tahun. Unit tidak boleh cacat fisik, terbakar, pin soket patah, atau korosi cairan. Estimasi pengerjaan RMA 7-14 hari kerja.",
            catatan: "Mitra resmi komponen ASUS & peripheral Logitech."
        },
        {
            nama: "CV Bintang Komputer Glodok",
            kategori: "Distributor Paralel",
            kontak_person: "Koh Ricky (Head of Wholesale)",
            telepon: "085711223344",
            email: "sales.bintangglodok@gmail.com",
            alamat: "Harco Glodok Lantai Dasar Blok B No. 12-14, Jl. Hayam Wuruk, Jakarta Barat",
            link_toko: "https://www.tokopedia.com/bintang-glodok-sparepart",
            kebijakan_klaim: "Garansi mengikuti tanggal stiker segel distributor (3 sampai 6 bulan). Jika stok toko mengendap lebih dari 3 bulan di rak, klaim garansi dihitung sejak tanggal segel distri. Fisik segel tidak boleh rusak atau ditimpa stiker lain.",
            catatan: "Grosir spesialis baterai laptop, keyboard internal, dan DC charger adaptor."
        },
        {
            nama: "Toko LCD Bandung Sparepart",
            kategori: "Supplier Komponen",
            kontak_person: "Asep Mulyana",
            telepon: "087822998811",
            email: "cs.lcdbandung@gmail.com",
            alamat: "BEC (Bandung Electronic Center) Lantai 2 Blok F-08, Jl. Purnawarman No. 13-15, Bandung",
            link_toko: "https://shopee.co.id/tokolcdbandung",
            kebijakan_klaim: "Garansi tes display 14 hari sampai 1 bulan sejak barang diterima toko. Wajib video unboxing & tes display sebelum dipasang permanen. Plastik pelindung depan LCD dan fleksibel tidak boleh tertekuk/robek.",
            catatan: "Supplier panel layar LCD LED slim 30/40 pin FHD, touchscreen, dan fleksibel EDP."
        },
        {
            nama: "Master Printer Solution Mangga Dua",
            kategori: "Supplier Komponen",
            kontak_person: "Iwan Setiawan",
            telepon: "081988776655",
            email: "masterprinter.jkt@gmail.com",
            alamat: "Harco Mangga Dua Plaza Lantai 2 Blok A No. 44, Jakarta Pusat",
            link_toko: "https://www.tokopedia.com/master-printer-solution",
            kebijakan_klaim: "Sparepart mekanik (roller, sponge pad) garansi 14 hari tes fungsi. Cartridge original garansi segel resmi pabrik Epson/Canon.",
            catatan: "Spesialis print head, roller kit, waste ink pad, dan cartridge printer Epson, Canon, HP."
        }
    ];

    const supplierMap = {};
    const createdSuppliers = [];
    for (const s of supplierDefs) {
        const item = await prisma.supplier.create({ data: s });
        supplierMap[s.nama] = item.id;
        createdSuppliers.push(item);
    }

    // 5. Data Pelanggan Realistis (35 Orang dengan profil kepribadian beragam)
    console.log("[SEED] 5. Membuat Data Pelanggan dan Profil Kepribadian Komunikasi...");
    const customerDefs = [
        // Koleris (Tegas, Cepat, Butuh Kepastian Waktu)
        { nama: "Dewi Lestari, S.T.", nomor_telepon: "081234567890", alamat: "Jl. Gatot Subroto No. 5, Jakarta Selatan", tipe_kepribadian: "Koleris", catatan_khusus: "Project Manager IT - Butuh unit cepat selesai, mobilitas tinggi, tolong estimasi waktu akurat." },
        { nama: "Kevin Sanjaya", nomor_telepon: "082133445566", alamat: "Jl. Pahlawan No. 4, Semarang", tipe_kepribadian: "Koleris", catatan_khusus: "Gamer Kompetitif - Tolong catat suhu pasta termal sebelum dan sesudah servis." },
        { nama: "Deddy Corbuzier", nomor_telepon: "081199887711", alamat: "Jl. Bintaro Utama No. 7, Tangerang Selatan", tipe_kepribadian: "Koleris", catatan_khusus: "Minta sparepart kualitas terbaik original, simpan komponen rusak untuk bukti penggantian." },
        { nama: "Taufik Hidayat", nomor_telepon: "087788990011", alamat: "Jl. Malioboro No. 100, Yogyakarta", tipe_kepribadian: "Koleris", catatan_khusus: "Pengusaha kuliner - PC kasir toko mati, butuh penanganan prioritas hari ini." },
        { nama: "Rian Ardianto", nomor_telepon: "085699887711", alamat: "Jl. Margonda Raya No. 50, Depok", tipe_kepribadian: "Koleris", catatan_khusus: "Selalu konfirmasi biaya sebelum ada part yang dibeli atau diganti." },
        { nama: "Agus Pratama", nomor_telepon: "081211223388", alamat: "Jl. Veteran No. 12, Malang", tipe_kepribadian: "Koleris", catatan_khusus: "Bila unit selesai mohon infokan via WA agar langsung bisa diambil kurir kantor." },
        { nama: "Bambang Soedirman", nomor_telepon: "081344556677", alamat: "Jl. Pemuda No. 45, Surabaya", tipe_kepribadian: "Koleris", catatan_khusus: "Minta pengerjaan rapi dan baut casing jangan sampai ada yang hilang." },

        // Sanguinis (Ramah, Ceria, Senang Disapa & Diberi Foto Progres)
        { nama: "Siti Nurhaliza", nomor_telepon: "085678901234", alamat: "Jl. Thamrin No. 25, Bandung", tipe_kepribadian: "Sanguinis", catatan_khusus: "Ramah, ceria. Laptop dipakai jualan online dan desain Canva harian." },
        { nama: "Agnes Monica", nomor_telepon: "083344556677", alamat: "Jl. Asia Afrika No. 9, Bandung", tipe_kepribadian: "Sanguinis", catatan_khusus: "Kreator konten video - Minta layar dibersihkan kinclong dan engsel dikencangkan." },
        { nama: "Fitri Carlina", nomor_telepon: "081822334411", alamat: "Jl. Cikini Raya No. 45, Jakarta Pusat", tipe_kepribadian: "Sanguinis", catatan_khusus: "Senang berkomunikasi via WhatsApp, minta dikirimkan foto proses pengerjaan." },
        { nama: "Maya Indriati", nomor_telepon: "088822334455", alamat: "Jl. Gejayan No. 22, Sleman, DIY", tipe_kepribadian: "Sanguinis", catatan_khusus: "Mahasiswi kedokteran - Laptop untuk tugas modul dan presentasi klinik." },
        { nama: "Nadya Hutagalung", nomor_telepon: "087811224488", alamat: "Jl. Tebet Barat No. 8, Jakarta Selatan", tipe_kepribadian: "Sanguinis", catatan_khusus: "Sangat memperhatikan kebersihan fisik bodi laptop." },
        { nama: "Rina Nose", nomor_telepon: "081955667788", alamat: "Jl. Sukajadi No. 15, Bandung", tipe_kepribadian: "Sanguinis", catatan_khusus: "Pelanggan langganan keluarga, suka promo diskon perawatan berkala." },
        { nama: "Jessica Mila", nomor_telepon: "085744332211", alamat: "Jl. Dharmawangsa No. 30, Jakarta Selatan", tipe_kepribadian: "Sanguinis", catatan_khusus: "Laptop sering dibawa traveling, minta baterai dicek kestabilannya." },

        // Melankolis (Rinci, Teliti, Data Sensitif, Minta Laporan Formal)
        { nama: "Rizky Pratama, M.Kom", nomor_telepon: "081298765432", alamat: "Jl. Sudirman No. 10, Jakarta Pusat", tipe_kepribadian: "Melankolis", catatan_khusus: "Dosen Informatika - Laptop berisi materi kuliah dan skripsi mahasiswa. Data sensitif, jangan diformat!" },
        { nama: "Hendra Setiawan, IAI", nomor_telepon: "081900112233", alamat: "Jl. Solo-Yogya Km. 10, Sleman", tipe_kepribadian: "Melankolis", catatan_khusus: "Arsitek - Membutuhkan akurasi warna monitor IPS dan kestabilan rendering AutoCAD." },
        { nama: "Sri Mulyani, S.E., Ak.", nomor_telepon: "081299001122", alamat: "Jl. Menteng No. 1, Jakarta Pusat", tipe_kepribadian: "Melankolis", catatan_khusus: "Akuntan Publik - Minta nota dan faktur resmi berstempel untuk reimbursement kantor." },
        { nama: "Chandra Liow", nomor_telepon: "082133445577", alamat: "Jl. Danau Sunter No. 12, Jakarta Utara", tipe_kepribadian: "Melankolis", catatan_khusus: "Editor film - PC Workstation butuh repaste thermal grizzly dan cleaning radiator." },
        { nama: "Prof. Ir. Bambang Riyanto", nomor_telepon: "081177889900", alamat: "Jl. Ganesha No. 10, Bandung", tipe_kepribadian: "Melankolis", catatan_khusus: "Peneliti Lab - Data simulasi riset jangan sampai terhapus." },
        { nama: "Dian Sastrowardoyo", nomor_telepon: "081311224466", alamat: "Jl. Senopati No. 18, Jakarta Selatan", tipe_kepribadian: "Melankolis", catatan_khusus: "Minta rincian spesifikasi suku cadang yang dipasang secara tertulis." },
        { nama: "Gunawan Wibisono", nomor_telepon: "085288990022", alamat: "Jl. Ahmad Yani No. 88, Solo", tipe_kepribadian: "Melankolis", catatan_khusus: "Memeriksa detail kondisi fisik sebelum dan sesudah pengerjaan." },

        // Plegmatis (Kalem, Sopan, Percaya Penuh pada Rekomendasi Teknisi)
        { nama: "Dr. Ahmad Dahlan, Sp.PD", nomor_telepon: "081122334455", alamat: "Jl. Merdeka No. 11, Yogyakarta", tipe_kepribadian: "Plegmatis", catatan_khusus: "Dokter RS - Tidak terburu-buru asal unit awet, rapi, dan garansi terpercaya." },
        { nama: "Raisa Andriana", nomor_telepon: "085566778899", alamat: "Jl. Kemang Raya No. 12, Jakarta Selatan", tipe_kepribadian: "Plegmatis", catatan_khusus: "Pelanggan langganan keluarga. Selalu minta saran perawatan berkala." },
        { nama: "Greysia Polii", nomor_telepon: "085211223344", alamat: "Jl. Diponegoro No. 18, Surabaya", tipe_kepribadian: "Plegmatis", catatan_khusus: "Guru SMA - Laptop untuk administrasi rapor dan ujian online." },
        { nama: "Fajar Alfian", nomor_telepon: "081277665544", alamat: "Jl. Pajajaran No. 14, Bogor", tipe_kepribadian: "Plegmatis", catatan_khusus: "Minta charger dites voltasenya sebelum dibawa pulang." },
        { nama: "Siti Badriah", nomor_telepon: "081899001122", alamat: "Jl. Cendrawasih No. 20, Bekasi", tipe_kepribadian: "Plegmatis", catatan_khusus: "Sangat sabar menunggu part inden jika stok sedang kosong." },
        { nama: "Lukman Hakim", nomor_telepon: "085611335577", alamat: "Jl. Kaliurang Km. 5, Sleman", tipe_kepribadian: "Plegmatis", catatan_khusus: "Pasrahkan perbaikan pada teknisi, yang penting laptop normal kembali." },
        { nama: "Nurul Hidayati", nomor_telepon: "087722446688", alamat: "Jl. Sisingamangaraja No. 9, Medan", tipe_kepribadian: "Plegmatis", catatan_khusus: "Meminta penjelasan tips perawatan santai saat pengambilan barang." },

        // Netral (Standar Komersil / Bisnis)
        { nama: "Bambang Pamungkas", nomor_telepon: "081399887766", alamat: "Jl. Dago Atas No. 88, Bandung", tipe_kepribadian: "Netral", catatan_khusus: "Pelanggan reguler servis pembersihan debu tahunan." },
        { nama: "Eko Prasetyo", nomor_telepon: "085711229988", alamat: "Jl. Pemuda No. 70, Semarang", tipe_kepribadian: "Netral", catatan_khusus: "Servis laptop kantor inventaris divisi logistik." },
        { nama: "Wahyu Setiawan", nomor_telepon: "081244556699", alamat: "Jl. Basuki Rahmat No. 10, Palembang", tipe_kepribadian: "Netral", catatan_khusus: "Perangkat inventaris cabang perusahaan ekspedisi." },
        { nama: "Indah Permatasari", nomor_telepon: "082266778899", alamat: "Jl. Fatmawati No. 34, Jakarta Selatan", tipe_kepribadian: "Netral", catatan_khusus: "Servis standar penggantian keyboard laptop kantor." },
        { nama: "Bayu Skak", nomor_telepon: "085911223344", alamat: "Jl. Ijen No. 15, Malang", tipe_kepribadian: "Netral", catatan_khusus: "Unit workstation editor kantor studio produksi." },
        { nama: "Kusuma Wardani", nomor_telepon: "087855667711", alamat: "Jl. Pandanaran No. 55, Semarang", tipe_kepribadian: "Netral", catatan_khusus: "Laptop backup kantor untuk data entry mingguan." },
        { nama: "Hadi Purnomo", nomor_telepon: "081377889911", alamat: "Jl. Riau No. 40, Pekanbaru", tipe_kepribadian: "Netral", catatan_khusus: "Pelanggan umum servis adaptor laptop putus kabel." }
    ];

    const customers = [];
    for (const c of customerDefs) {
        customers.push(await prisma.customer.create({ data: c }));
    }

    // 6. Data Perangkat Realistis (62 Unit dengan Serial Number Unik Bebas Duplikasi)
    console.log("[SEED] 6. Membuat Data Perangkat dan Riwayat Multi-Unit...");
    const perangkatDefs = [
        { cIdx: 0, jenis: "Laptop", merk: "Lenovo", mod: "ThinkPad X1 Carbon Gen 10", sn: "LENOVO-X1C-G10-001" },
        { cIdx: 0, jenis: "Desktop PC", merk: "Dell", mod: "OptiPlex 7080 Micro", sn: "DELL-OPT7080-002" },
        { cIdx: 0, jenis: "Laptop", merk: "ASUS", mod: "ZenBook 13 OLED UM325", sn: "ASUS-ZB13-UM325-003" },
        { cIdx: 1, jenis: "Laptop", merk: "Acer", mod: "Predator Helios 300 PH315", sn: "ACER-HL300-2023-004" },
        { cIdx: 1, jenis: "Desktop PC", merk: "ASUS", mod: "ROG Strix GT15 G15CF Gaming", sn: "ASUS-GT15-GAMING-005" },
        { cIdx: 2, jenis: "Laptop", merk: "Dell", mod: "XPS 15 9520 OLED", sn: "DELL-XPS15-9520-006" },
        { cIdx: 2, jenis: "Desktop PC", merk: "Custom Build", mod: "PC Workstation Threadripper 3960X", sn: "CUST-TRIPPER-007" },
        { cIdx: 3, jenis: "Desktop PC", merk: "HP", mod: "ProDesk 400 G7 SFF Kasir", sn: "HP-PD400-KASIR-008" },
        { cIdx: 3, jenis: "Printer", merk: "Epson", mod: "EcoTank L3210 All-in-One", sn: "EPSON-L3210-009" },
        { cIdx: 4, jenis: "Laptop", merk: "ASUS", mod: "ZenBook 14 OLED UX3402", sn: "ASUS-ZEN14-UX3402-010" },
        { cIdx: 4, jenis: "Laptop", merk: "HP", mod: "Pavilion Aero 13-be0001AU", sn: "HP-AERO13-2022-011" },
        { cIdx: 5, jenis: "Laptop", merk: "Lenovo", mod: "ThinkPad T480 Core i5", sn: "LENOVO-T480-2019-012" },
        { cIdx: 6, jenis: "Laptop", merk: "Dell", mod: "Latitude 5420 Rugged", sn: "DELL-LAT5420-013" },
        { cIdx: 7, jenis: "Desktop PC", merk: "HP", mod: "Pavilion Gaming Desktop TG01", sn: "HP-TG01-2024-014" },
        { cIdx: 7, jenis: "Printer", merk: "Canon", mod: "Pixma G2010 Ink Tank", sn: "CANON-G2010-015" },
        { cIdx: 7, jenis: "Laptop", merk: "ASUS", mod: "Vivobook 14 A416MA", sn: "ASUS-VB14-A416-016" },
        { cIdx: 8, jenis: "Laptop", merk: "Apple", mod: "MacBook Pro 16 M1 Max", sn: "APPLE-MBP16-MAX-017" },
        { cIdx: 8, jenis: "Laptop", merk: "ASUS", mod: "ROG Zephyrus M16 GU603", sn: "ASUS-ZEPH-M16-018" },
        { cIdx: 9, jenis: "Laptop", merk: "Apple", mod: "MacBook Air M2 13.6-inch", sn: "APPLE-MBA-M2-2022-019" },
        { cIdx: 10, jenis: "Laptop", merk: "Acer", mod: "Swift 3 SF314 EVO", sn: "ACER-SWIFT3-EVO-020" },
        { cIdx: 11, jenis: "Laptop", merk: "Lenovo", mod: "Yoga Slim 7 Pro 14ACH5", sn: "LENOVO-YOGA7P-021" },
        { cIdx: 12, jenis: "Laptop", merk: "Dell", mod: "Inspiron 14 5410 2-in-1", sn: "DELL-INS14-5410-022" },
        { cIdx: 13, jenis: "Laptop", merk: "ASUS", mod: "ZenBook Duo UX482", sn: "ASUS-DUO-UX482-023" },
        { cIdx: 14, jenis: "Laptop", merk: "ASUS", mod: "ROG Zephyrus G14 GA402", sn: "ASUS-ROG-Z14-2024-024" },
        { cIdx: 14, jenis: "Laptop", merk: "Apple", mod: "MacBook Pro 14 M2 Pro", sn: "APPLE-MBP14-M2-025" },
        { cIdx: 15, jenis: "Desktop PC", merk: "Custom Build", mod: "Editing Rig Core i9-12900K + RTX 4070", sn: "CUST-EDIT-4070-026" },
        { cIdx: 15, jenis: "Laptop", merk: "Dell", mod: "Precision 3561 Mobile Workstation", sn: "DELL-PREC3561-027" },
        { cIdx: 16, jenis: "Laptop", merk: "Lenovo", mod: "ThinkPad L14 Gen 2", sn: "LENOVO-L14-G2-028" },
        { cIdx: 16, jenis: "Printer", merk: "HP", mod: "LaserJet Pro M404dn", sn: "HP-LJ-M404-029" },
        { cIdx: 17, jenis: "Desktop PC", merk: "Gigabyte", mod: "AORUS Model S Gaming Desktop", sn: "GIGA-AORUS-MODELS-030" },
        { cIdx: 17, jenis: "Desktop PC", merk: "Apple", mod: "Mac Studio M1 Ultra", sn: "APPLE-STUDIO-M1U-031" },
        { cIdx: 18, jenis: "Desktop PC", merk: "Dell", mod: "OptiPlex 5090 Tower", sn: "DELL-OPT5090-032" },
        { cIdx: 18, jenis: "Laptop", merk: "Lenovo", mod: "ThinkPad P1 Gen 4", sn: "LENOVO-P1-G4-033" },
        { cIdx: 19, jenis: "Laptop", merk: "Apple", mod: "MacBook Air M1 2020", sn: "APPLE-MBA-M1-2020-034" },
        { cIdx: 20, jenis: "Laptop", merk: "MSI", mod: "Katana GF66 11UC", sn: "MSI-KATANA-GF66-035" },
        { cIdx: 21, jenis: "Desktop PC", merk: "Lenovo", mod: "ThinkCentre M70s Gen 3", sn: "LENOVO-M70S-036" },
        { cIdx: 21, jenis: "Laptop", merk: "Dell", mod: "Latitude 7420 Carbon", sn: "DELL-LAT7420-037" },
        { cIdx: 22, jenis: "Desktop PC", merk: "Apple", mod: "iMac 24 M1 4.5K Retina Pink", sn: "APPLE-IMAC24-038" },
        { cIdx: 22, jenis: "Laptop", merk: "HP", mod: "Envy x360 13-bd0062TU", sn: "HP-ENVY13-039" },
        { cIdx: 23, jenis: "Laptop", merk: "Acer", mod: "Aspire 5 A514-54G", sn: "ACER-ASP5-A514-040" },
        { cIdx: 24, jenis: "Laptop", merk: "ASUS", mod: "TUF Gaming A15 FA506", sn: "ASUS-TUF-A15-041" },
        { cIdx: 25, jenis: "Laptop", merk: "Lenovo", mod: "IdeaPad 3 14ITL05", sn: "LENOVO-IP3-14ITL-042" },
        { cIdx: 25, jenis: "Printer", merk: "Epson", mod: "EcoTank L3110 All-in-One", sn: "EPSON-L3110-043" },
        { cIdx: 26, jenis: "Laptop", merk: "Acer", mod: "Nitro 5 AN515-57", sn: "ACER-NITRO5-044" },
        { cIdx: 27, jenis: "Laptop", merk: "HP", mod: "14s-cf2017TU Celeron", sn: "HP-14S-CF2017-045" },
        { cIdx: 28, jenis: "Laptop", merk: "Lenovo", mod: "Legion 5 Pro 16ACH6H", sn: "LENOVO-L5PRO-046" },
        { cIdx: 29, jenis: "Laptop", merk: "HP", mod: "Victus Gaming 15-fb0011AX", sn: "HP-VICTUS15-047" },
        { cIdx: 30, jenis: "Desktop PC", merk: "Custom Build", mod: "PC Kasir dan Server POS Core i3", sn: "CUST-POS-048" },
        { cIdx: 31, jenis: "Laptop", merk: "Dell", mod: "Vostro 3400 Intel i3", sn: "DELL-VOS3400-049" },
        { cIdx: 32, jenis: "Laptop", merk: "MSI", mod: "Modern 14 B11MOU", sn: "MSI-MOD14-050" },
        { cIdx: 33, jenis: "Desktop PC", merk: "ASUS", mod: "ExpertCenter D5 SFF D500SC", sn: "ASUS-EXPD5-051" },
        { cIdx: 34, jenis: "Desktop PC", merk: "Lenovo", mod: "IdeaCentre 3 07IAB7", sn: "LENOVO-IC3-052" },
        { cIdx: 0, jenis: "Laptop", merk: "ASUS", mod: "X441BA Dual Core", sn: "ASUS-X441BA-2021-053" },
        { cIdx: 1, jenis: "Laptop", merk: "Lenovo", mod: "IdeaPad 330-14AST", sn: "LENOVO-IP330-2020-054" },
        { cIdx: 2, jenis: "Laptop", merk: "Acer", mod: "Aspire 3 A314-32", sn: "ACER-A314-2021-055" },
        { cIdx: 3, jenis: "Desktop PC", merk: "HP", mod: "Slim Desktop S01-aF0012d", sn: "HP-SLIM-S01-056" },
        { cIdx: 7, jenis: "Laptop", merk: "Dell", mod: "Inspiron 14 3467", sn: "DELL-INS3467-2019-057" },
        { cIdx: 8, jenis: "Laptop", merk: "ASUS", mod: "A409FJ GeForce MX230", sn: "ASUS-A409FJ-2020-058" },
        { cIdx: 14, jenis: "Laptop", merk: "Apple", mod: "MacBook Pro 13 2019 Touch Bar", sn: "APPLE-MBP13-2019-059" },
        { cIdx: 15, jenis: "Laptop", merk: "MSI", mod: "GL63 8RC Gaming", sn: "MSI-GL63-2019-060" },
        { cIdx: 21, jenis: "Desktop PC", merk: "Custom Build", mod: "PC Rendering Core i7-10700K", sn: "CUST-REND10700-061" }
    ];

    const perangkats = [];
    for (const p of perangkatDefs) {
        perangkats.push(await prisma.perangkat.create({
            data: {
                customer_id: customers[p.cIdx].id,
                jenis_perangkat: p.jenis,
                merek: p.merk,
                model: p.mod,
                serial_number: p.sn
            }
        }));
    }

    // 7. Data Sparepart Lengkap dengan Garansi Distributor & Skenario Perhitungan
    console.log("[SEED] 7. Membuat Katalog Sparepart dengan Kaitan Supplier & Skenario Garansi...");
    const synnexId = supplierMap["PT Synnex Metrodata Indonesia"];
    const njtId = supplierMap["PT Nusantara Jaya Teknologi (NJT)"];
    const astrindoId = supplierMap["PT Astrindo Senayasa"];
    const bintangId = supplierMap["CV Bintang Komputer Glodok"];
    const lcdId = supplierMap["Toko LCD Bandung Sparepart"];
    const printerSuppId = supplierMap["Master Printer Solution Mangga Dua"];

    const rawSpareparts = [
        // RAM SO-DIMM (Laptop) - Garansi Lifetime Distributor Resmi
        { b: "Kingston", k: "Laptop, AIO", n: "Kingston SO-DIMM DDR4 8GB 3200MHz", stok: 24, hpp: 240000, jual: 320000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "Lifetime", skenario: "lifetime", kontak: "081288991122" },
        { b: "Kingston", k: "Laptop, AIO", n: "Kingston SO-DIMM DDR4 16GB 3200MHz", stok: 18, hpp: 490000, jual: 650000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "Lifetime", skenario: "lifetime", kontak: "081288991122" },
        { b: "Corsair", k: "Laptop, AIO", n: "Corsair Vengeance SO-DIMM DDR4 16GB 3200MHz", stok: 2, hpp: 520000, jual: 690000, suppId: njtId, suppNama: "PT Nusantara Jaya Teknologi (NJT)", garansi: "Lifetime", skenario: "lifetime", kontak: "08119876543" },
        { b: "Samsung", k: "Laptop, AIO", n: "Samsung SO-DIMM DDR5 16GB 4800MHz", stok: 1, hpp: 620000, jual: 820000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "3 Tahun", skenario: "sejak_nota_customer", kontak: "081288991122" },
        { b: "Samsung", k: "Laptop, AIO", n: "Samsung SO-DIMM DDR3L 8GB 1600MHz", stok: 10, hpp: 150000, jual: 210000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "1 Tahun", skenario: "sejak_segel_distri", kontak: "085711223344" },

        // RAM DIMM (Desktop)
        { b: "Kingston", k: "Desktop", n: "Kingston FURY Beast DDR4 8GB 3200MHz", stok: 20, hpp: 235000, jual: 310000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "Lifetime", skenario: "lifetime", kontak: "081288991122" },
        { b: "Kingston", k: "Desktop", n: "Kingston FURY Beast DDR4 16GB 3200MHz", stok: 15, hpp: 480000, jual: 640000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "Lifetime", skenario: "lifetime", kontak: "081288991122" },
        { b: "Corsair", k: "Desktop", n: "Corsair Vengeance LPX DDR4 16GB (2x8GB) 3200MHz", stok: 0, hpp: 550000, jual: 740000, suppId: njtId, suppNama: "PT Nusantara Jaya Teknologi (NJT)", garansi: "Lifetime", skenario: "lifetime", kontak: "08119876543" },
        { b: "Corsair", k: "Desktop", n: "Corsair Vengeance DDR5 32GB (2x16GB) 5600MHz", stok: 6, hpp: 1350000, jual: 1750000, suppId: njtId, suppNama: "PT Nusantara Jaya Teknologi (NJT)", garansi: "Lifetime", skenario: "lifetime", kontak: "08119876543" },

        // SSD SATA & NVMe - Garansi 3 Tahun sejak Nota Customer
        { b: "Kingston", k: "Laptop, Desktop, AIO", n: "Kingston A400 SATA 240GB 2.5\"", stok: 35, hpp: 210000, jual: 280000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "3 Tahun", skenario: "sejak_nota_customer", kontak: "081288991122" },
        { b: "Kingston", k: "Laptop, Desktop, AIO", n: "Kingston A400 SATA 480GB 2.5\"", stok: 25, hpp: 340000, jual: 450000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "3 Tahun", skenario: "sejak_nota_customer", kontak: "081288991122" },
        { b: "Western Digital", k: "Laptop, Desktop, AIO", n: "WD Green SATA 240GB 2.5\"", stok: 28, hpp: 220000, jual: 295000, suppId: njtId, suppNama: "PT Nusantara Jaya Teknologi (NJT)", garansi: "3 Tahun", skenario: "sejak_nota_customer", kontak: "08119876543" },
        { b: "Western Digital", k: "Laptop, Desktop, AIO", n: "WD Blue SATA 500GB 2.5\"", stok: 14, hpp: 450000, jual: 580000, suppId: njtId, suppNama: "PT Nusantara Jaya Teknologi (NJT)", garansi: "5 Tahun", skenario: "sejak_nota_customer", kontak: "08119876543" },
        { b: "Samsung", k: "Laptop, Desktop, AIO", n: "Samsung 870 EVO SATA 500GB", stok: 10, hpp: 680000, jual: 850000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "5 Tahun", skenario: "sejak_nota_customer", kontak: "081288991122" },
        { b: "Kingston", k: "Laptop, Desktop", n: "Kingston NV3 PCIe 4.0 NVMe 500GB", stok: 22, hpp: 450000, jual: 590000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "3 Tahun", skenario: "sejak_nota_customer", kontak: "081288991122" },
        { b: "Kingston", k: "Laptop, Desktop", n: "Kingston NV3 PCIe 4.0 NVMe 1TB", stok: 16, hpp: 820000, jual: 1050000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "3 Tahun", skenario: "sejak_nota_customer", kontak: "081288991122" },
        { b: "Western Digital", k: "Laptop, Desktop", n: "WD Blue SN580 PCIe 4.0 NVMe 1TB", stok: 12, hpp: 860000, jual: 1100000, suppId: njtId, suppNama: "PT Nusantara Jaya Teknologi (NJT)", garansi: "5 Tahun", skenario: "sejak_nota_customer", kontak: "08119876543" },
        { b: "Samsung", k: "Laptop, Desktop", n: "Samsung 980 NVMe M.2 500GB", stok: 8, hpp: 620000, jual: 790000, suppId: synnexId, suppNama: "PT Synnex Metrodata Indonesia", garansi: "5 Tahun", skenario: "sejak_nota_customer", kontak: "081288991122" },

        // Laptop Battery - Garansi 6 Bulan sejak Segel Distributor Glodok
        { b: "ASUS", k: "Laptop", n: "Baterai ASUS X441 Original (A31N1601)", stok: 8, hpp: 260000, jual: 350000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "6 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "ASUS", k: "Laptop", n: "Baterai ASUS TUF Gaming FX505 (B31N1726)", stok: 2, hpp: 320000, jual: 440000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "6 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "Lenovo", k: "Laptop", n: "Baterai Lenovo IdeaPad 320 / 330 (L16M2PB1)", stok: 10, hpp: 270000, jual: 360000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "6 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "Lenovo", k: "Laptop", n: "Baterai Lenovo ThinkPad T480 / T470 External", stok: 5, hpp: 340000, jual: 460000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "6 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "Acer", k: "Laptop", n: "Baterai Acer Aspire 3 / 5 (AP16M5J)", stok: 7, hpp: 250000, jual: 330000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "6 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "HP", k: "Laptop", n: "Baterai HP 14s / 15s (HT03XL Original)", stok: 9, hpp: 280000, jual: 380000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "6 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "Dell", k: "Laptop", n: "Baterai Dell Inspiron 14 5400 / 5410", stok: 1, hpp: 310000, jual: 420000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "6 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },

        // Laptop Charger / Adaptor
        { b: "ASUS", k: "Laptop", n: "Charger ASUS 19V 3.42A 65W Original (4.5x3.0mm)", stok: 15, hpp: 180000, jual: 250000, suppId: astrindoId, suppNama: "PT Astrindo Senayasa", garansi: "1 Tahun", skenario: "sejak_nota_customer", kontak: "081322334455" },
        { b: "Lenovo", k: "Laptop", n: "Charger Lenovo 20V 3.25A 65W Slim Tip", stok: 18, hpp: 175000, jual: 240000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "6 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "HP", k: "Laptop", n: "Charger HP 19.5V 3.33A 65W Blue Tip", stok: 14, hpp: 175000, jual: 240000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "6 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "Dell", k: "Laptop", n: "Charger Dell 19.5V 3.34A 65W Small Pin", stok: 8, hpp: 190000, jual: 260000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "6 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "Lainnya", k: "Laptop", n: "Universal USB Type-C GaN Charger 65W PD Fast Charging", stok: 0, hpp: 210000, jual: 295000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "3 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },

        // Keyboard & Touchpad - Garansi Segel 3 Bulan
        { b: "ASUS", k: "Laptop", n: "Keyboard ASUS Vivobook A416 / A516 US Layout", stok: 12, hpp: 120000, jual: 175000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "3 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "Lenovo", k: "Laptop", n: "Keyboard Lenovo IdeaPad 3 14ITL05 Backlight", stok: 10, hpp: 140000, jual: 200000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "3 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },
        { b: "Acer", k: "Laptop", n: "Keyboard Acer Aspire 3 A314", stok: 8, hpp: 110000, jual: 160000, suppId: bintangId, suppNama: "CV Bintang Komputer Glodok", garansi: "3 Bulan", skenario: "sejak_segel_distri", kontak: "085711223344" },

        // LCD Panel - Garansi Tes 1 Bulan dari Toko LCD Bandung
        { b: "Lainnya", k: "Laptop", n: "LCD 14.0\" Slim 30 Pin HD (1366x768)", stok: 12, hpp: 580000, jual: 750000, suppId: lcdId, suppNama: "Toko LCD Bandung Sparepart", garansi: "1 Bulan", skenario: "sejak_segel_distri", kontak: "087822998811" },
        { b: "Lainnya", k: "Laptop", n: "LCD 14.0\" Slim 30 Pin FHD IPS (1920x1080)", stok: 10, hpp: 720000, jual: 920000, suppId: lcdId, suppNama: "Toko LCD Bandung Sparepart", garansi: "1 Bulan", skenario: "sejak_segel_distri", kontak: "087822998811" },
        { b: "Lainnya", k: "Laptop", n: "LCD 15.6\" Slim 30 Pin FHD IPS 144Hz Gaming", stok: 6, hpp: 950000, jual: 1250000, suppId: lcdId, suppNama: "Toko LCD Bandung Sparepart", garansi: "1 Bulan", skenario: "sejak_segel_distri", kontak: "087822998811" },

        // Thermal Paste & Cooling - Non-garansi elektrik
        { b: "Lainnya", k: "Laptop, Desktop, AIO", n: "Thermal Paste Arctic MX-4 4g High Performance", stok: 30, hpp: 85000, jual: 125000, suppId: null, suppNama: null, garansi: null, skenario: "tidak_ada", kontak: null },
        { b: "Lainnya", k: "Laptop, Desktop, AIO", n: "Thermal Grizzly Kryonaut 1g Extreme Paste", stok: 3, hpp: 110000, jual: 160000, suppId: null, suppNama: null, garansi: null, skenario: "tidak_ada", kontak: null },
        { b: "Lainnya", k: "Laptop, Desktop, AIO", n: "DeepCool GAMMAXX 400 V2 Tower Cooler", stok: 8, hpp: 210000, jual: 285000, suppId: njtId, suppNama: "PT Nusantara Jaya Teknologi (NJT)", garansi: "1 Tahun", skenario: "sejak_nota_customer", kontak: "08119876543" },

        // PSU Desktop - Garansi 3 Tahun NJT
        { b: "Corsair", k: "Desktop", n: "Power Supply Corsair CV550 550W 80+ Bronze", stok: 7, hpp: 620000, jual: 790000, suppId: njtId, suppNama: "PT Nusantara Jaya Teknologi (NJT)", garansi: "3 Tahun", skenario: "sejak_nota_customer", kontak: "08119876543" },
        { b: "Corsair", k: "Desktop", n: "Power Supply Corsair CV650 650W 80+ Bronze", stok: 5, hpp: 760000, jual: 950000, suppId: njtId, suppNama: "PT Nusantara Jaya Teknologi (NJT)", garansi: "3 Tahun", skenario: "sejak_nota_customer", kontak: "08119876543" },

        // Printer Parts
        { b: "Epson", k: "Printer", n: "Pickup Roller Kit Epson L3110 / L3210 Original", stok: 15, hpp: 55000, jual: 85000, suppId: printerSuppId, suppNama: "Master Printer Solution Mangga Dua", garansi: "14 Hari", skenario: "sejak_segel_distri", kontak: "081988776655" },
        { b: "Epson", k: "Printer", n: "Waste Ink Pad Sponge Epson L3110 / L3210", stok: 25, hpp: 25000, jual: 45000, suppId: printerSuppId, suppNama: "Master Printer Solution Mangga Dua", garansi: "14 Hari", skenario: "sejak_segel_distri", kontak: "081988776655" },
        { b: "Canon", k: "Printer", n: "Cartridge Canon PG-810 Black Original", stok: 10, hpp: 215000, jual: 275000, suppId: printerSuppId, suppNama: "Master Printer Solution Mangga Dua", garansi: "Segel Utuh", skenario: "sejak_nota_customer", kontak: "081988776655" },
        { b: "Canon", k: "Printer", n: "Cartridge Canon CL-811 Color Original", stok: 8, hpp: 245000, jual: 315000, suppId: printerSuppId, suppNama: "Master Printer Solution Mangga Dua", garansi: "Segel Utuh", skenario: "sejak_nota_customer", kontak: "081988776655" },

        // Accessories & Peripherals - Garansi 1 Tahun Astrindo / Logitech
        { b: "Logitech", k: "Aksesoris", n: "Logitech B100 USB Optical Mouse", stok: 30, hpp: 45000, jual: 65000, suppId: astrindoId, suppNama: "PT Astrindo Senayasa", garansi: "1 Tahun", skenario: "sejak_nota_customer", kontak: "081322334455" },
        { b: "Logitech", k: "Aksesoris", n: "Logitech M170 Wireless Mouse", stok: 20, hpp: 105000, jual: 145000, suppId: astrindoId, suppNama: "PT Astrindo Senayasa", garansi: "1 Tahun", skenario: "sejak_nota_customer", kontak: "081322334455" },
        { b: "Logitech", k: "Aksesoris", n: "Logitech K120 USB Keyboard", stok: 18, hpp: 85000, jual: 115000, suppId: astrindoId, suppNama: "PT Astrindo Senayasa", garansi: "1 Tahun", skenario: "sejak_nota_customer", kontak: "081322334455" }
    ];

    const spareparts = [];
    for (const sp of rawSpareparts) {
        const item = await prisma.sparepart.create({
            data: {
                brand_id: brandMap[sp.b] || null,
                supplier_id: sp.suppId || null,
                kategori: sp.k,
                nama: sp.n,
                stok: sp.stok,
                harga_beli: sp.hpp,
                harga: sp.jual,
                has_garansi_distri: !!sp.garansi,
                tipe_garansi_distri: sp.garansi,
                sistem_perhitungan_garansi: sp.skenario,
                distributor_nama: sp.suppNama,
                distributor_kontak: sp.kontak,
                kebijakan_klaim: sp.garansi ? `Ketentuan garansi resmi distributor (${sp.garansi}): ${sp.skenario === 'lifetime' ? 'Berlaku seumur hidup selama diproduksi pabrikan' : (sp.skenario === 'sejak_nota_customer' ? 'Masa berlaku mulai tanggal nota penjualan ke end-user' : 'Masa berlaku dihitung sejak stiker segel distributor keluar dari gudang')} - Wajib menyertakan kemasan dan segel utuh.` : null
            }
        });
        spareparts.push(item);
    }

    // 8. Log Riwayat Restok Suku Cadang (45 Catatan Terkait Supplier)
    console.log("[SEED] 8. Membuat Log Riwayat Pengadaan dan Restok Suku Cadang...");
    const invoicePrefixes = ["INV-SMI-2026-", "NJT-PO-2026-", "AST-INV-2026-", "FAK-BEG-44", "FAK-LCDBDG-", "MPS-NOTA-2026-"];

    for (let i = 0; i < 45; i++) {
        const targetPart = spareparts[i % spareparts.length];
        const supplierObj = createdSuppliers[i % createdSuppliers.length];
        const noFaktur = `${invoicePrefixes[i % invoicePrefixes.length]}${String(100 + i).padStart(4, "0")}`;
        const qty = 5 + (i % 15);
        const tgl = randomDate(new Date(Date.now() - 120 * 86400000), new Date(Date.now() - 2 * 86400000));
        const adminUser = i % 2 === 0 ? admin : admin2;

        await prisma.restockLog.create({
            data: {
                sparepart_id: targetPart.id,
                supplier_nama: supplierObj.nama,
                jumlah_masuk: qty,
                harga_beli_pcs: targetPart.harga_beli,
                nomor_faktur: noFaktur,
                tanggal_beli: tgl,
                catatan: `Restok ${qty} pcs ${targetPart.nama} dari ${supplierObj.nama}. Kondisi baru segel utuh, garansi ${targetPart.tipe_garansi_distri || "distributor"}.`,
                user_id: adminUser.id,
                user_nama: adminUser.nama,
                created_at: tgl
            }
        });
    }

    // 9. Standard Operating Procedures (SOP Center - 5 Dokumen Inti Workshop)
    console.log("[SEED] 9. Membuat Dokumen SOP Center & Panduan Mutu Workshop...");
    const sopDefs = [
        {
            kode: "SOP-CS-001",
            judul: "Standar Pelayanan Intake & Komunikasi Service Advisor",
            kategori: "Frontliner & CS",
            target_role: "Frontliner",
            versi: "1.2",
            ringkasan: "Panduan standar keramahan penyambutan, registrasi keluhan, pendataan kelengkapan fisik, penandaan defect map, dan etika komunikasi berdasarkan tipe kepribadian pelanggan (Koleris, Sanguinis, Plegmatis, Melankolis).",
            poin_kunci: "- Sambut pelanggan dalam 5 detik pertama dengan senyum, salam, dan sapa ramah.\n- Tanyakan detail kronologi kerusakan dan tawarkan opsi backup data mandiri.\n- Cek kondisi fisik menyeluruh bersama pelanggan (catat baret/dent di visual Defect Map).\n- Berikan estimasi waktu transparan sesuai tier SLA (Express, Reguler, Kompleks).\n- Kirim update foto & link live tracking via WhatsApp resmi Serv.io.",
            konten: `### 1. Tujuan Pelayanan
Memberikan pengalaman servis yang transparan, menenangkan, dan profesional bagi pelanggan sejak langkah awal memasuki workshop Serv.io.

### 2. Prosedur Penerimaan Unit (Intake)
1. **Penyambutan Hangat**:
   - Berikan salam pembuka standar: *"Selamat pagi/siang Kak, selamat datang di Serv.io. Ada kendala perangkat yang bisa kami bantu periksa hari ini?"*
2. **Pencatatan Kronologi & Keluhan**:
   - Dengarkan penjelasan pelanggan tanpa memotong pembicaraan.
   - Catat keluhan spesifik (misal: "Layar berkedip saat digerakkan 45 derajat" bukan hanya "Layar rusak").
3. **Pemeriksaan Kelengkapan & Fisik**:
   - Periksa adaptor/charger (cek apakah kabel terkelupas), tas laptop, dus box.
   - Gunakan fitur **Defect Map 2D** pada sistem untuk menandai titik lecet atau dent awal agar tidak timbul kesalahpahaman saat unit selesai.
4. **Perjanjian Privasi & Data**:
   - Jelaskan komitmen privasi Serv.io: *"Data pribadi pelanggan dijamin kerahasiaannya dan teknisi dilarang membuka file pribadi tanpa izin perbaikan."*
   - Catat PIN/Password atau sarankan pelanggan membuat user guest/menonaktifkan kunci sementara.
5. **Cetak & Kirim Bukti Intake**:
   - Cetak Tanda Terima Servis dan kirimkan notifikasi live tracking ke WhatsApp pelanggan.`
        },
        {
            kode: "SOP-QC-002",
            judul: "Prosedur Quality Control (QC) 8 Poin WOW Service",
            kategori: "Teknisi & QC",
            target_role: "Teknisi",
            versi: "1.1",
            ringkasan: "Protokol pengujian menyeluruh 8 parameter wajib sebelum unit dinyatakan selesai dan siap diserahterimakan kepada pelanggan.",
            poin_kunci: "- Power & Booting Test: Uji restart 3x berturut-turut.\n- Display Panel: Uji solid color test (RGBW) bebas dead-pixel.\n- Input Devices: Uji 100% tuts keyboard tester dan gesture trackpad.\n- Audio & Port I/O: Uji speaker stereo, mic, webcam, dan seluruh port USB.\n- Thermal Stress Test: Uji kestabilan suhu 15 menit di bawah beban kerja.\n- WOW Clean: Pembersihan fisik bodi kinclong bebas noda jari.",
            konten: `### 1. Filosofi WOW Service QC
Setiap unit yang keluar dari meja kerja teknisi harus berada dalam kondisi terbaik, lebih bersih dan lebih optimal daripada saat pertama kali masuk ke workshop.

### 2. Checklist 8 Parameter Pengujian Wajib
1. **Power & Booting Test**: Unit wajib di-restart 3 kali untuk memastikan tidak ada delay booting atau freeze.
2. **Display & Touch Panel**: Buka solid color background (Putih, Merah, Hijau, Biru, Hitam) untuk memastikan 0 dead pixel dan tidak ada backlight bleeding parah.
3. **Keyboard & Trackpad**: Jalankan software Keyboard Tester untuk memastikan seluruh tuts merespons lembut.
4. **Audio & Microphone**: Rekam suara microphone selama 5 detik dan putar kembali pada volume speaker 80% tanpa distorsi pecah.
5. **Port I/O & Konektivitas**: Colok flashdisk ke seluruh port USB. Hubungkan ke jaringan WiFi 2.4GHz dan 5GHz, tes speedtest stabil.
6. **Thermal & Stability Stress Test**: Jalankan Cinebench / FurMark selama 15 menit. Suhu CPU maksimal 85°C dan GPU maksimal 80°C.
7. **Pembersihan Fisik Total (WOW Clean)**: Bersihkan sela keyboard dengan kuas antistatik, bersihkan layar dengan cairan microfiber khusus, dan lap bodi bebas sidik jari.
8. **Kelengkapan Serah Terima**: Masukkan adaptor dan aksesoris ke kantong pelindung bertuliskan nomor tiket.`
        },
        {
            kode: "SOP-K3-003",
            judul: "Keselamatan Kerja & Penanganan Listrik Statis (ESD)",
            kategori: "Keselamatan & K3",
            target_role: "Semua",
            versi: "1.0",
            ringkasan: "Standar keselamatan teknisi di workbench, penggunaan anti-static wrist strap, penanganan baterai lithium membengkak, dan pembuangan limbah elektronik (e-waste).",
            poin_kunci: "- Wajib gunakan gelang ESD (Anti-Static Wrist Strap) sebelum menyentuh logic board.\n- Cabut baterai dan tekan tombol power 10 detik sebelum melepas komponen apapun.\n- Baterai kembung wajib ditempatkan di wadah tahan api berpasir kering.\n- Gunakan exhaust fan / solder fume extractor saat pengerjaan soldering.",
            konten: `### 1. Prinsip Utama K3 Workshop
Mencegah kecelakaan kerja teknisi dan menghindari kerusakan komponen sensitif akibat pelepasan muatan listrik statis (ESD).

### 2. Prosedur Wajib Meja Kerja
1. Selalu pasang ESD wrist strap yang terhubung ke grounding fisik meja kerja sebelum menyentuh PCB Motherboard atau keping RAM.
2. Saat melepas casing laptop, langkah pertama tanpa pengecualian adalah melepaskan konektor baterai internal.
3. Selalu tekan dan tahan tombol power selama 10-15 detik setelah baterai dicabut untuk membuang sisa muatan listrik pada kapasitor motherboard.
4. Baterai lithium yang mengalami deformasi kembung (swollen) dilarang keras ditekan, ditusuk, atau dipanaskan. Segera masukkan ke dalam ember pelindung berpasir tahan api.`
        },
        {
            kode: "SOP-RMA-004",
            judul: "Tata Kelola Klaim Garansi Sparepart & RMA Distributor",
            kategori: "Operasional Toko",
            target_role: "Admin",
            versi: "1.2",
            ringkasan: "Prosedur operasional klaim suku cadang rusak ke distributor resmi atau grosir, pencatatan serial number, verifikasi segel, dan pelacakan resi kurir logistik.",
            poin_kunci: "- Klasifikasikan sumber RMA: Tiket Servis, Pembelian Retail Konsumen, atau Cacat Stok Toko (DOA).\n- Cek skenario perhitungan garansi distributor (Nota Pembelian vs Segel Keluar Pabrik vs Lifetime).\n- Periksa fisik: segel utuh, tidak retak, pin tidak bengkok, bebas korosi cairan.\n- Wajib simpan resi ekspedisi dan cantumkan nomor tiket RMA di kemasan luar.\n- Catat Serial Number (SN) pengganti baru ke database inventaris.",
            konten: `### 1. Latar Belakang & Skema Garansi
Distributor memiliki kebijakan berbeda:
- **Distributor Resmi**: Garansi dihitung sejak nota penjualan ke end-user atau memiliki grace period rak 60 hari.
- **Distributor Paralel**: Garansi dihitung ketat berdasarkan stiker segel bulan/tahun yang tertempel pada fisik part.
- **Garansi Lifetime**: Berlaku selama produk masih diproduksi oleh manufaktur (misal: RAM Corsair, Kingston).

### 2. Langkah Klaim RMA
1. Verifikasi kelayakan fisik sparepart: segel distributor tidak robek, pin tidak bengkok, tidak ada tanda terbakar.
2. Input pengajuan di modul **RMA Distributor** Serv.io. Sistem otomatis mendeteksi riwayat nota dan distributor terkait.
3. Kemas part menggunakan kardus tebal dan minimal 3 lapis bubble wrap.
4. Kirim menggunakan ekspedisi rekanan (JNE / SiCepat) dan cantumkan nomor tiket RMA di luar kardus.
5. Input nomor resi ke sistem agar terpantau secara real-time oleh tim logistik.
6. Saat barang pengganti datang, periksa fungsi dan input Serial Number (SN) baru ke sistem.`
        },
        {
            kode: "SOP-OPS-005",
            judul: "Prosedur Peminjaman dan Pengembalian Laptop Cadangan (Loaner Unit)",
            kategori: "Operasional Toko",
            target_role: "Frontliner",
            versi: "1.0",
            ringkasan: "Standar operasional fasilitas unit laptop pinjaman gratis untuk pelanggan servis dengan durasi pengerjaan perbaikan lebih dari 3 hari kerja.",
            poin_kunci: "- Berlaku untuk pelanggan dengan pengerjaan kompleks atau sparepart inden > 3 hari.\n- Terbitkan form peminjaman unit cadangan dan tanda tangan serah terima.\n- Cek kondisi fisik dan kelengkapan adaptor bersama pelanggan sebelum serah terima.\n- Saat unit kembali, lakukan data wipe menyeluruh demi menjaga privasi pelanggan.",
            konten: `### 1. Kebijakan Fasilitas Unit Cadangan
Untuk menjaga kepuasan dan kelancaran produktivitas pelanggan prioritas, Serv.io menyediakan pool unit laptop pinjaman (Loaner Laptop) secara cuma-cuma.

### 2. Prosedur Serah Terima
1. Konfirmasi kelayakan pelanggan: unit servis sedang dalam penanganan motherboard atau inden sparepart minimal 3 hari kerja.
2. Buat surat peminjaman di sistem Serv.io dengan mencatat nomor seri loaner dan deposit jaminan (jika ada).
3. Inspeksi bersama kondisi fisik dan kelengkapan adaptor charger.
4. Saat pengembalian: periksa kondisi fisik, kembalikan deposit utuh, dan lakukan factory reset / format partisi data pengguna.`
        }
    ];

    for (const s of sopDefs) {
        await prisma.sopDocument.create({ data: s });
    }

    // 10. Konfigurasi 110+ Tiket Servis Komprehensif
    console.log("[SEED] 10. Membuat 110+ Tiket Servis, Rekam Medis, Diagnosis, QC dan CRM Terpadu...");

    const keluhanSamples = [
        "Laptop mati total setelah ketumpahan cairan kopi, indikator charging tidak merespons.",
        "Sering mengalami freeze dan blue screen (BSOD) kode CRITICAL_PROCESS_DIED saat gaming berat.",
        "Baterai drop drastis dari 80% ke 10% dalam 10 menit, laptop mati mendadak jika kabel dicabut.",
        "Engsel layar sebelah kanan patah, bodi casing palmrest terangkat saat layar dibuka.",
        "Keyboard beberapa tuts tidak merespons (spasi, huruf A, dan tombol Shift kiri mati).",
        "Layar berkedip-kedip (flicker) garis horizontal muncul terutama saat sudut layar digerakkan.",
        "Kipas pendingin sangat berisik dan bergetar, bodi bawah laptop sangat panas sampai mati sendiri.",
        "Tidak bisa mendeteksi sinyal WiFi kantor, ikon WiFi hilang dari taskbar (driver Code 10).",
        "Port USB 3.0 sebelah kiri longgar dan sering putus koneksi saat transfer data harddisk eksternal.",
        "Kinerja laptop sangat lambat saat startup, butuh 8 menit untuk masuk ke desktop Windows.",
        "PC Desktop tidak menampilkan gambar ke monitor (No Display), kipas VGA dan processor berputar kencang.",
        "Printer Epson hasil cetak teks bergaris-garis, warna magenta tidak keluar sama sekali.",
        "Printer Canon lampu indikator error blinking 5 kali (Paper Jam / Roller macet).",
        "Upgrade SSD dari HDD lama 1TB ke NVMe 500GB serta cloning sistem operasi Windows 11 dan data kantor."
    ];

    const kelengkapanDetailList = [
        { charger: true, tas: true, kabel_power: false, dus: false, mouse: true, catatan_lain: "Charger original 65W, tas punggung hitam, mouse wireless Logitech" },
        { charger: true, tas: false, kabel_power: false, dus: false, mouse: false, catatan_lain: "Unit laptop dan adaptor original 19V" },
        { charger: false, tas: false, kabel_power: true, dus: true, mouse: false, catatan_lain: "Unit PC Desktop, kabel power bawaan, kardus rakitan" },
        { charger: true, tas: true, kabel_power: false, dus: true, mouse: false, catatan_lain: "Unit MacBook, charger Type-C 67W, kardus box original" },
        { charger: false, tas: false, kabel_power: true, dus: false, mouse: false, catatan_lain: "Printer, kabel power, kabel USB printer 1.5m" }
    ];

    let ticketSeq2025 = 0;
    let ticketSeq2026 = 0;

    const generateNomorTiketYear = (year) => {
        if (year === 2025) {
            ticketSeq2025++;
            return `SRV-2025-${String(ticketSeq2025).padStart(3, "0")}`;
        } else {
            ticketSeq2026++;
            return `SRV-2026-${String(ticketSeq2026).padStart(3, "0")}`;
        }
    };

    const ticketConfigs = [
        // KELOMPOK 1: TAB 1 RETENSI CRM - PERAWATAN BERKALA (6-11 BULAN LALU) (15 TIKET)
        { status: "diambil", pIdx: 0, tIdx: 0, year: 2025, takenMonthsAgo: 7, katTips: "Pembersihan & Thermal Paste", prioritas: "Standar", isMaintFollowUp: false, keluhan: "Suhu laptop cepat panas saat buka banyak tab browser dan aplikasi kantor." },
        { status: "diambil", pIdx: 4, tIdx: 1, year: 2025, takenMonthsAgo: 8, katTips: "Pembersihan & Thermal Paste", prioritas: "Cepat Selesai", isMaintFollowUp: false, keluhan: "Kipas laptop berisik saat rendering video editing pendek." },
        { status: "diambil", pIdx: 6, tIdx: 2, year: 2025, takenMonthsAgo: 11, katTips: "SSD / Storage", prioritas: "Data Aman", isMaintFollowUp: true, keluhan: "Kapasitas drive C hampir penuh, butuh upgrade SSD M.2 500GB." },
        { status: "diambil", pIdx: 10, tIdx: 3, year: 2025, takenMonthsAgo: 9, katTips: "Baterai", prioritas: "Biaya Hemat", isMaintFollowUp: false, keluhan: "Baterai drop cepat dari 100 persen ke 20 persen dalam pemakaian 45 menit." },
        { status: "diambil", pIdx: 12, tIdx: 4, year: 2025, takenMonthsAgo: 10, katTips: "Engsel & Casing", prioritas: "Standar", isMaintFollowUp: false, keluhan: "Engsel layar sebelah kiri agak longgar dan bunyi berderit saat dibuka." },
        { status: "diambil", pIdx: 16, tIdx: 5, year: 2025, takenMonthsAgo: 8, katTips: "Pembersihan & Thermal Paste", prioritas: "Data Aman", isMaintFollowUp: true, keluhan: "Perawatan berkala rutin dan repaste pasta termal Arctic MX-4." },
        { status: "diambil", pIdx: 19, tIdx: 0, year: 2025, takenMonthsAgo: 6, katTips: "Pembersihan & Thermal Paste", prioritas: "Standar", isMaintFollowUp: false, keluhan: "Laptop terasa hangat di bagian palmrest dan ventilasi berdebu tebal." },
        { status: "diambil", pIdx: 20, tIdx: 1, year: 2025, takenMonthsAgo: 7, katTips: "Hardware & Motherboard", prioritas: "Cepat Selesai", isMaintFollowUp: false, keluhan: "Keyboard beberapa tombol kadang macet dan debu menumpuk di sela tuts." },
        { status: "diambil", pIdx: 21, tIdx: 2, year: 2025, takenMonthsAgo: 9, katTips: "Pembersihan & Thermal Paste", prioritas: "Biaya Hemat", isMaintFollowUp: false, keluhan: "Pembersihan heatsink dan kipas pendingin laptop tugas kuliah." },
        { status: "diambil", pIdx: 22, tIdx: 3, year: 2025, takenMonthsAgo: 6, katTips: "SSD / Storage", prioritas: "Data Aman", isMaintFollowUp: false, keluhan: "Pengecekan kesehatan SSD dan backup file dokumen penting." },
        { status: "diambil", pIdx: 24, tIdx: 4, year: 2025, takenMonthsAgo: 10, katTips: "Pembersihan & Thermal Paste", prioritas: "Standar", isMaintFollowUp: true, keluhan: "Sirkulasi kipas pendingin tersumbat debu, suhu CPU melonjak hingga 85 derajat." },
        { status: "diambil", pIdx: 28, tIdx: 5, year: 2025, takenMonthsAgo: 8, katTips: "Pembersihan & Thermal Paste", prioritas: "Cepat Selesai", isMaintFollowUp: false, keluhan: "Pembersihan kipas dan penggantian pasta termal untuk kebutuhan kerja desain grafis." },
        { status: "diambil", pIdx: 37, tIdx: 0, year: 2025, takenMonthsAgo: 7, katTips: "Baterai", prioritas: "Standar", isMaintFollowUp: false, keluhan: "Penggantian baterai laptop dan kalibrasi pengisian daya baterai baru." },
        { status: "diambil", pIdx: 39, tIdx: 1, year: 2025, takenMonthsAgo: 11, katTips: "Pembersihan & Thermal Paste", prioritas: "Data Aman", isMaintFollowUp: false, keluhan: "Bodi bawah laptop panas dan fan pendingin berputar pada kecepatan maksimal terus-menerus." },
        { status: "diambil", pIdx: 40, tIdx: 2, year: 2025, takenMonthsAgo: 6, katTips: "Engsel & Casing", prioritas: "Biaya Hemat", isMaintFollowUp: false, keluhan: "Pelumasan engsel layar laptop dan pembersihan debu internal berkala." },

        // KELOMPOK 2: TAB 1 RETENSI CRM - PERAWATAN BERKALA KRITIS (≥ 12 BULAN) (15 TIKET)
        { status: "diambil", pIdx: 1, tIdx: 3, year: 2025, takenMonthsAgo: 14, katTips: "Pembersihan & Thermal Paste", prioritas: "Standar", isMaintFollowUp: false, keluhan: "Sudah 1 tahun lebih tidak pernah dibersihkan, pasta termal mengering total." },
        { status: "diambil", pIdx: 3, tIdx: 4, year: 2025, takenMonthsAgo: 18, katTips: "Pembersihan & Thermal Paste", prioritas: "Cepat Selesai", isMaintFollowUp: true, keluhan: "Laptop gaming performa ngedrop parah (thermal throttling) setelah 15 menit bermain game." },
        { status: "diambil", pIdx: 5, tIdx: 5, year: 2025, takenMonthsAgo: 16, katTips: "SSD / Storage", prioritas: "Data Aman", isMaintFollowUp: false, keluhan: "Harddisk bawaan lemot, ingin upgrade ke SSD dan pembersihan sirkulasi udara." },
        { status: "diambil", pIdx: 7, tIdx: 0, year: 2025, takenMonthsAgo: 13, katTips: "Pembersihan & Thermal Paste", prioritas: "Biaya Hemat", isMaintFollowUp: false, keluhan: "PC kasir toko kotor berdebu tebal di bagian kipas power supply dan processor." },
        { status: "diambil", pIdx: 11, tIdx: 1, year: 2025, takenMonthsAgo: 15, katTips: "Baterai", prioritas: "Standar", isMaintFollowUp: false, keluhan: "Baterai kembung ringan menekan touchpad, butuh penanganan segera." },
        { status: "diambil", pIdx: 13, tIdx: 2, year: 2025, takenMonthsAgo: 12, katTips: "Pembersihan & Thermal Paste", prioritas: "Standar", isMaintFollowUp: false, keluhan: "Servis pembersihan berkala tahunan laptop untuk persiapan skripsi." },
        { status: "diambil", pIdx: 17, tIdx: 3, year: 2025, takenMonthsAgo: 20, katTips: "Pembersihan & Thermal Paste", prioritas: "Cepat Selesai", isMaintFollowUp: true, keluhan: "MacBook bersuara mendengung kencang dan suhu hangat saat editing video 4K." },
        { status: "diambil", pIdx: 25, tIdx: 4, year: 2025, takenMonthsAgo: 17, katTips: "Engsel & Casing", prioritas: "Data Aman", isMaintFollowUp: false, keluhan: "Dudukan baut engsel plastik retak, casing bawah sedikit menganga." },
        { status: "diambil", pIdx: 27, tIdx: 5, year: 2025, takenMonthsAgo: 22, katTips: "Pembersihan & Thermal Paste", prioritas: "Biaya Hemat", isMaintFollowUp: false, keluhan: "Laptop kantor inventaris divisi gudang, debu gudang sangat tebal di heatsink." },
        { status: "diambil", pIdx: 30, tIdx: 0, year: 2025, takenMonthsAgo: 24, katTips: "Hardware & Motherboard", prioritas: "Standar", isMaintFollowUp: false, keluhan: "Sudah 2 tahun tidak diservis, ganti pasta termal dan bersihkan kipas casing." },
        { status: "diambil", pIdx: 34, tIdx: 1, year: 2025, takenMonthsAgo: 16, katTips: "Pembersihan & Thermal Paste", prioritas: "Standar", isMaintFollowUp: true, keluhan: "PC Desktop ruang praktik dokter, kipas processor berisik dan berdebu." },
        { status: "diambil", pIdx: 36, tIdx: 2, year: 2025, takenMonthsAgo: 14, katTips: "SSD / Storage", prioritas: "Data Aman", isMaintFollowUp: false, keluhan: "Pembersihan sistem dan optimalisasi partisi storage harddisk kantor." },
        { status: "diambil", pIdx: 45, tIdx: 3, year: 2025, takenMonthsAgo: 19, katTips: "Pembersihan & Thermal Paste", prioritas: "Cepat Selesai", isMaintFollowUp: false, keluhan: "Perawatan komprehensif tahunan laptop kerja lapangan dan ganti pasta pendingin." },
        { status: "diambil", pIdx: 48, tIdx: 4, year: 2025, takenMonthsAgo: 21, katTips: "Pembersihan & Thermal Paste", prioritas: "Biaya Hemat", isMaintFollowUp: false, keluhan: "PC workstation studio animasi, kipas radiator pendingin berdebu pekat." },
        { status: "diambil", pIdx: 50, tIdx: 5, year: 2025, takenMonthsAgo: 26, katTips: "Pembersihan & Thermal Paste", prioritas: "Standar", isMaintFollowUp: false, keluhan: "Servis total setelah pemakaian lebih dari 2 tahun tanpa perawatan." },

        // KELOMPOK 3: TAB 2 RETENSI CRM - UNIT SELESAI BELUM DIAMBIL (18 TIKET)
        { status: "selesai", pIdx: 2, tIdx: 0, year: 2026, unclaimedDaysAgo: 3, prioritas: "Standar", qcPassed: true, remSent: 0, katTips: "SSD / Storage", keluhan: "Ganti SSD SATA 480GB dan instalasi ulang Windows 11 Home original." },
        { status: "selesai", pIdx: 8, tIdx: 1, year: 2026, unclaimedDaysAgo: 5, prioritas: "Cepat Selesai", qcPassed: true, remSent: 0, katTips: "Baterai", keluhan: "Penggantian baterai original ASUS TUF Gaming dan kalibrasi daya." },
        { status: "selesai", pIdx: 14, tIdx: 2, year: 2026, unclaimedDaysAgo: 7, prioritas: "Data Aman", qcPassed: true, remSent: 0, katTips: "Pembersihan & Thermal Paste", keluhan: "Deep cleaning kipas ganda dan repaste Thermal Grizzly Kryonaut." },
        { status: "selesai", pIdx: 18, tIdx: 3, year: 2026, unclaimedDaysAgo: 10, prioritas: "Biaya Hemat", qcPassed: true, remSent: 0, katTips: "Software / OS", keluhan: "Perbaikan sistem boot Windows yang loop recovery dan update driver." },
        { status: "selesai", pIdx: 9, tIdx: 4, year: 2026, unclaimedDaysAgo: 16, prioritas: "Cepat Selesai", qcPassed: true, remSent: 1, katTips: "Layar / LCD", keluhan: "Penggantian panel LCD 14.0 inch FHD IPS karena retak terbentur." },
        { status: "selesai", pIdx: 15, tIdx: 5, year: 2026, unclaimedDaysAgo: 18, prioritas: "Standar", qcPassed: true, remSent: 1, katTips: "Printer", keluhan: "Penggantian pickup roller kit Canon G2010 dan pembersihan head printer." },
        { status: "selesai", pIdx: 23, tIdx: 0, year: 2026, unclaimedDaysAgo: 21, prioritas: "Data Aman", qcPassed: true, remSent: 0, katTips: "Keyboard & Touchpad", keluhan: "Penggantian modul keyboard tanam ASUS Vivobook A416 akibat tuts spasi macet." },
        { status: "selesai", pIdx: 26, tIdx: 1, year: 2026, unclaimedDaysAgo: 25, prioritas: "Biaya Hemat", qcPassed: true, remSent: 1, katTips: "Baterai", keluhan: "Ganti baterai Lenovo ThinkPad internal dan uji ketahanan baterai 3 jam." },
        { status: "selesai", pIdx: 5, tIdx: 2, year: 2026, unclaimedDaysAgo: 34, prioritas: "Standar", qcPassed: true, remSent: 1, katTips: "SSD / Storage", keluhan: "Upgrade SSD NVMe Kingston 1TB dan migrasi data skripsi mahasiswa." },
        { status: "selesai", pIdx: 29, tIdx: 3, year: 2026, unclaimedDaysAgo: 40, prioritas: "Cepat Selesai", qcPassed: true, remSent: 1, katTips: "Hardware & Motherboard", keluhan: "Perbaikan jalur charging Type-C MacBook Air M1 yang longgar." },
        { status: "selesai", pIdx: 31, tIdx: 4, year: 2026, unclaimedDaysAgo: 46, prioritas: "Biaya Hemat", qcPassed: true, remSent: 2, katTips: "Power Supply", keluhan: "Ganti power supply Corsair CV550 550W Bronze pada PC Desktop editing." },
        { status: "selesai", pIdx: 33, tIdx: 5, year: 2026, unclaimedDaysAgo: 52, prioritas: "Data Aman", qcPassed: true, remSent: 1, katTips: "Pembersihan & Thermal Paste", keluhan: "Overhaul sistem pendingin dan pembersihan debu casing workstation studio." },
        { status: "selesai", pIdx: 35, tIdx: 0, year: 2026, unclaimedDaysAgo: 64, prioritas: "Standar", qcPassed: true, remSent: 2, katTips: "Engsel & Casing", keluhan: "Rekonstruksi engsel bodi kanan Lenovo ThinkPad dengan resin epoxy." },
        { status: "selesai", pIdx: 38, tIdx: 1, year: 2026, unclaimedDaysAgo: 73, prioritas: "Biaya Hemat", qcPassed: true, remSent: 2, katTips: "Charger / Adaptor", keluhan: "Ganti kabel DC power jack laptop Dell Inspiron yang putus di bagian pangkal." },
        { status: "selesai", pIdx: 41, tIdx: 2, year: 2026, unclaimedDaysAgo: 82, prioritas: "Cepat Selesai", qcPassed: true, remSent: 2, katTips: "Hardware & Motherboard", keluhan: "Servis jalur 19V short circuit akibat cairan kopi dan pembersihan motherboard." },
        { status: "selesai", pIdx: 43, tIdx: 3, year: 2026, unclaimedDaysAgo: 96, prioritas: "Biaya Hemat", qcPassed: true, remSent: 3, katTips: "Printer", keluhan: "Servis waste ink pad sponge penuh pada Epson L3210 dan reset counter." },
        { status: "selesai", pIdx: 46, tIdx: 4, year: 2026, unclaimedDaysAgo: 112, prioritas: "Standar", qcPassed: true, remSent: 3, katTips: "PC Kasir", keluhan: "Ganti RAM DDR4 8GB dan cleaning PC kasir toko ritel." },
        { status: "selesai", pIdx: 49, tIdx: 5, year: 2026, unclaimedDaysAgo: 135, prioritas: "Data Aman", qcPassed: true, remSent: 3, katTips: "Software / OS", keluhan: "Instalasi ulang sistem operasi POS kasir dan setting printer thermal." },

        // KELOMPOK 4: TAB 3 RETENSI CRM - EVALUASI GARANSI H-7 EXPIRING (12 TIKET)
        { status: "diambil", pIdx: 8, tIdx: 0, year: 2026, warrantyDaysLeft: 1, durasiGaransi: "1 Bulan", katTips: "SSD / Storage", prioritas: "Standar", remSent: 0, keluhan: "Pemasangan SSD NVMe 500GB untuk laptop kerja mobile harian." },
        { status: "diambil", pIdx: 36, tIdx: 1, year: 2026, warrantyDaysLeft: 1, durasiGaransi: "1 Bulan", katTips: "Pembersihan & Thermal Paste", prioritas: "Data Aman", remSent: 1, keluhan: "Servis berkala deep clean dan ganti thermal paste laptop dokter RS." },
        { status: "diambil", pIdx: 15, tIdx: 2, year: 2026, warrantyDaysLeft: 2, durasiGaransi: "1 Bulan", katTips: "Keyboard & Touchpad", prioritas: "Cepat Selesai", remSent: 0, keluhan: "Ganti keyboard laptop Dell Precision workstation arsitektur." },
        { status: "diambil", pIdx: 32, tIdx: 3, year: 2026, warrantyDaysLeft: 2, durasiGaransi: "3 Bulan", katTips: "Baterai", prioritas: "Standar", remSent: 1, keluhan: "Ganti baterai Lenovo ThinkPad P1 Gen 4 dan tes siklus daya." },
        { status: "diambil", pIdx: 19, tIdx: 4, year: 2026, warrantyDaysLeft: 3, durasiGaransi: "1 Bulan", katTips: "Layar / LCD", prioritas: "Data Aman", remSent: 0, keluhan: "Ganti LCD MacBook Air M1 yang bergaris vertikal di pojok kanan." },
        { status: "diambil", pIdx: 44, tIdx: 5, year: 2026, warrantyDaysLeft: 3, durasiGaransi: "1 Bulan", katTips: "Hardware & Motherboard", prioritas: "Biaya Hemat", remSent: 1, keluhan: "Servis power button laptop HP 14s yang patah dan re-solder switch." },
        { status: "diambil", pIdx: 21, tIdx: 0, year: 2026, warrantyDaysLeft: 4, durasiGaransi: "1 Bulan", katTips: "Pembersihan & Thermal Paste", prioritas: "Cepat Selesai", remSent: 0, keluhan: "Overheat dan kipas berisik pada laptop Dell Latitude dokter." },
        { status: "diambil", pIdx: 47, tIdx: 1, year: 2026, warrantyDaysLeft: 5, durasiGaransi: "1 Bulan", katTips: "SSD / Storage", prioritas: "Standar", remSent: 0, keluhan: "Upgrade SSD SATA 240GB pada PC kasir cabang Palembang." },
        { status: "diambil", pIdx: 23, tIdx: 2, year: 2026, warrantyDaysLeft: 6, durasiGaransi: "1 Bulan", katTips: "Engsel & Casing", prioritas: "Biaya Hemat", remSent: 0, keluhan: "Servis engsel bodi kiri Acer Aspire 5 yang patah dudukan bautnya." },
        { status: "diambil", pIdx: 51, tIdx: 3, year: 2026, warrantyDaysLeft: 6, durasiGaransi: "3 Bulan", katTips: "Power Supply", prioritas: "Data Aman", remSent: 0, keluhan: "Ganti PSU Corsair CV650 pada PC rendering studio animasi." },
        { status: "diambil", pIdx: 24, tIdx: 4, year: 2026, warrantyDaysLeft: 7, durasiGaransi: "1 Bulan", katTips: "Pembersihan & Thermal Paste", prioritas: "Cepat Selesai", remSent: 0, keluhan: "Repaste Thermal Grizzly pada laptop ASUS TUF Gaming atlet bulutangkis." },
        { status: "diambil", pIdx: 38, tIdx: 5, year: 2026, warrantyDaysLeft: 7, durasiGaransi: "1 Bulan", katTips: "Charger / Adaptor", prioritas: "Standar", remSent: 0, keluhan: "Ganti adaptor original HP 65W Blue Tip dan kalibrasi pengisian daya." },

        // KELOMPOK 5: TIKET OPERASIONAL AKTIF & WORKFLOW SEHARI-HARI (30+ TIKET)
        { status: "diterima", pIdx: 0, tIdx: 0, sla: "express", isOverdue: true, clean: "Kotor", kunci: "PIN", pin: "1234", prioritas: "Cepat Selesai", keluhan: "Laptop ThinkPad tiba-tiba mati total saat rapat penting direksi." },
        { status: "diterima", pIdx: 1, tIdx: 1, sla: "express", slaWarning: true, clean: "Ada yang Rusak", kunci: "Password", pin: "gamer2026", prioritas: "Standar", keluhan: "Layar blank hitam setelah update BIOS Predator Helios." },
        { status: "diterima", pIdx: 2, tIdx: 2, sla: "reguler", clean: "Bersih", kunci: "Tidak Ada", prioritas: "Data Aman", keluhan: "Upgrade RAM DDR4 16GB dan migrasi data skripsi mahasiswa IT." },
        { status: "diterima", pIdx: 3, tIdx: 3, sla: "kompleks", clean: "Kotor", kunci: "PIN", pin: "0987", prioritas: "Biaya Hemat", keluhan: "PC kasir toko bau gosong dan tidak mau menyala sama sekali." },
        { status: "diterima", pIdx: 4, tIdx: 4, sla: "reguler", clean: "Bersih", kunci: "Password", pin: "rahasia123", prioritas: "Cepat Selesai", keluhan: "Engsel layar ZenBook retak dan suara berderak saat dibuka." },

        { status: "didiagnosis", pIdx: 6, tIdx: 0, sla: "express", isOverdue: true, clean: "Bersih", prioritas: "Standar", keluhan: "Kipas pendingin Dell Latitude berputar maksimal terus menerus." },
        { status: "didiagnosis", pIdx: 7, tIdx: 1, sla: "express", slaWarning: true, clean: "Kotor", prioritas: "Data Aman", keluhan: "Printer Canon G2010 error 5B00 waste ink counter penuh." },
        { status: "didiagnosis", pIdx: 8, tIdx: 2, sla: "reguler", clean: "Bersih", prioritas: "Cepat Selesai", keluhan: "MacBook Pro 16 M1 Max tidak bisa charge lewat MagSafe 3." },
        { status: "didiagnosis", pIdx: 10, tIdx: 3, sla: "kompleks", clean: "Ada yang Rusak", prioritas: "Biaya Hemat", keluhan: "Acer Swift 3 touchpad loncat-loncat dan baterai kembung." },
        { status: "didiagnosis", pIdx: 11, tIdx: 4, sla: "reguler", clean: "Bersih", prioritas: "Standar", keluhan: "Lenovo Yoga Slim 7 layar touchscreen tidak merespons sentuhan." },

        { status: "menunggu_persetujuan", pIdx: 12, tIdx: 0, sla: "reguler", clean: "Bersih", prioritas: "Standar", keluhan: "Dell Inspiron 14 engsel patah butuh ganti casing palmrest satu set." },
        { status: "menunggu_persetujuan", pIdx: 13, tIdx: 1, sla: "express", clean: "Bersih", prioritas: "Cepat Selesai", keluhan: "Layar kedua ZenBook Duo mati, estimasi penggantian kabel fleksibel." },
        { status: "menunggu_persetujuan", pIdx: 14, tIdx: 2, sla: "kompleks", clean: "Bersih", prioritas: "Data Aman", keluhan: "MacBook Pro 14 M2 Pro short di jalur 3.3V audio codec IC." },
        { status: "menunggu_persetujuan", pIdx: 16, tIdx: 3, sla: "reguler", clean: "Kotor", prioritas: "Biaya Hemat", keluhan: "Printer LaserJet HP M404 roller penarik kertas aus paper jam." },
        { status: "menunggu_persetujuan", pIdx: 17, tIdx: 4, sla: "reguler", clean: "Bersih", prioritas: "Standar", keluhan: "Mac Studio M1 Ultra port HDMI belakang tidak keluar sinyal monitor." },

        { status: "disetujui", pIdx: 18, tIdx: 0, sla: "express", clean: "Bersih", prioritas: "Cepat Selesai", keluhan: "Customer menyetujui penawaran ganti motherboard ThinkPad P1 Gen 4." },
        { status: "disetujui", pIdx: 20, tIdx: 1, sla: "reguler", clean: "Bersih", prioritas: "Standar", keluhan: "Customer menyetujui ganti baterai original MSI Katana GF66." },
        { status: "disetujui", pIdx: 22, tIdx: 2, sla: "kompleks", clean: "Bersih", prioritas: "Data Aman", keluhan: "Customer menyetujui servis IC power iMac 24 M1 Pink." },
        { status: "disetujui", pIdx: 25, tIdx: 3, sla: "reguler", clean: "Bersih", prioritas: "Biaya Hemat", keluhan: "Customer menyetujui ganti keyboard IdeaPad 3 14ITL05." },

        { status: "dalam_perbaikan", pIdx: 27, tIdx: 0, sla: "express", isOverdue: true, clean: "Kotor", prioritas: "Cepat Selesai", keluhan: "Proses reballing IC charging controller laptop HP 14s." },
        { status: "dalam_perbaikan", pIdx: 28, tIdx: 1, sla: "express", slaWarning: true, clean: "Bersih", prioritas: "Standar", keluhan: "Pembersihan liquid metal dan repaste Lenovo Legion 5 Pro." },
        { status: "dalam_perbaikan", pIdx: 29, tIdx: 2, sla: "reguler", clean: "Bersih", prioritas: "Cepat Selesai", keluhan: "Perakitan kipas ganda HP Victus Gaming 15." },
        { status: "dalam_perbaikan", pIdx: 30, tIdx: 3, sla: "kompleks", clean: "Kotor", prioritas: "Data Aman", keluhan: "Cloning SSD NVMe dan pemulihan database POS kasir toko." },
        { status: "dalam_perbaikan", pIdx: 31, tIdx: 4, sla: "reguler", clean: "Bersih", prioritas: "Biaya Hemat", keluhan: "Pemasangan SSD SATA 240GB pada Dell Vostro 3400." },
        { status: "dalam_perbaikan", pIdx: 33, tIdx: 5, sla: "reguler", clean: "Bersih", prioritas: "Standar", keluhan: "Penggantian modul RAM DDR4 8GB pada PC ASUS ExpertCenter." },

        // KELOMPOK 6: TIKET DIBATALKAN (CANCELLED TICKETS DENGAN ALASAN SISTEMATIS) (5 TIKET)
        { status: "dibatalkan", pIdx: 2, tIdx: 0, year: 2026, alasanBatal: "Biaya servis melebihi anggaran (Overbudget)", catatanBatal: "Customer memutuskan menunda perbaikan karena estimasi ganti logic board Rp 4.500.000 mendekati harga unit second.", biayaBatal: 50000, keluhan: "MacBook Pro Touch Bar mati total tidak ada respon charging." },
        { status: "dibatalkan", pIdx: 15, tIdx: 1, year: 2026, alasanBatal: "Suku cadang langka / tidak tersedia di distributor", catatanBatal: "Chipset motherboard seri lama sudah discontinued dari seluruh supplier resmi maupun paralel.", biayaBatal: 0, keluhan: "Motherboard PC rakitan Core i7 generasi 4 short di southbridge." },
        { status: "dibatalkan", pIdx: 20, tIdx: 2, year: 2026, alasanBatal: "Kerusakan terlalu parah (Mati Total Jalur PCB Korosi)", catatanBatal: "Jalur multi-layer PCB terbakar dan korosi parah akibat terendam air banjir selama 2 hari.", biayaBatal: 50000, keluhan: "Laptop MSI Katana terendam banjir dan sempat dinyalakan paksa." },
        { status: "dibatalkan", pIdx: 26, tIdx: 3, year: 2026, alasanBatal: "Customer butuh unit segera (Waktu Pengerjaan Terlalu Lama)", catatanBatal: "Konsumen harus segera dinas ke luar kota dan tidak sempat menunggu pengiriman part inden 4 hari.", biayaBatal: 0, keluhan: "Layar Acer Nitro 5 berkedip, part LCD 144Hz harus inden dari Jakarta." },
        { status: "dibatalkan", pIdx: 34, tIdx: 4, year: 2026, alasanBatal: "Keputusan sewa / beli perangkat baru", catatanBatal: "Kantor memutuskan mengganti PC kasir lama dengan all-in-one touch baru.", biayaBatal: 50000, keluhan: "PC kasir Lenovo IdeaCentre lemot dan harddisk mengalami bad sector 80%." }
    ];

    const createdTickets = [];

    for (let i = 0; i < ticketConfigs.length; i++) {
        const cfg = ticketConfigs[i];
        const perangkat = perangkats[cfg.pIdx % perangkats.length];
        const teknisi = teknisis[cfg.tIdx % teknisis.length];

        let createdAt = new Date(Date.now() - 5 * 86400000);
        let completedAt = null;
        let tglDiambil = null;
        let garansiBerakhirAt = null;

        if (cfg.takenMonthsAgo) {
            createdAt = new Date(Date.now() - (cfg.takenMonthsAgo * 30 + 5) * 86400000);
            completedAt = new Date(Date.now() - (cfg.takenMonthsAgo * 30 + 2) * 86400000);
            tglDiambil = new Date(Date.now() - (cfg.takenMonthsAgo * 30) * 86400000);
            garansiBerakhirAt = calculateWarrantyExpiry(tglDiambil, cfg.durasiGaransi || "1 Bulan");
        } else if (cfg.unclaimedDaysAgo) {
            createdAt = new Date(Date.now() - (cfg.unclaimedDaysAgo + 3) * 86400000);
            completedAt = new Date(Date.now() - cfg.unclaimedDaysAgo * 86400000);
            tglDiambil = null;
            garansiBerakhirAt = null;
        } else if (cfg.warrantyDaysLeft !== undefined) {
            createdAt = new Date(Date.now() - 35 * 86400000);
            completedAt = new Date(Date.now() - 32 * 86400000);
            tglDiambil = new Date(Date.now() - (30 - cfg.warrantyDaysLeft) * 86400000);
            garansiBerakhirAt = new Date(Date.now() + cfg.warrantyDaysLeft * 86400000);
        } else if (cfg.status === "selesai") {
            createdAt = new Date(Date.now() - 4 * 86400000);
            completedAt = new Date(Date.now() - 1 * 86400000);
        } else if (cfg.status === "diambil") {
            createdAt = new Date(Date.now() - 15 * 86400000);
            completedAt = new Date(Date.now() - 12 * 86400000);
            tglDiambil = new Date(Date.now() - 10 * 86400000);
            garansiBerakhirAt = calculateWarrantyExpiry(tglDiambil, cfg.durasiGaransi || "1 Bulan");
        } else if (cfg.status === "dibatalkan") {
            createdAt = new Date(Date.now() - 10 * 86400000);
            completedAt = new Date(Date.now() - 8 * 86400000);
            tglDiambil = new Date(Date.now() - 7 * 86400000);
        }

        const checklist_intake = {
            casing: cfg.clean || "Bersih",
            layar: Math.random() > 0.1,
            engsel: Math.random() > 0.2,
            touchpad: Math.random() > 0.15,
            software: Math.random() > 0.2,
            license_office_os: true,
            keyboard: Math.random() > 0.2,
            baterai: Math.random() > 0.25,
            usb_port: Math.random() > 0.1,
            sound: Math.random() > 0.15,
            audio_jack: true,
            wifi_lan: Math.random() > 0.1,
            webcam: Math.random() > 0.1,
            optical_drive: false,
            kebersihan: cfg.clean === "Bersih",
            program_khusus: false,
            os_status: true,
            request_customer: true
        };

        let checklist_qc = null;
        if (cfg.qcPassed || cfg.status === "diambil") {
            checklist_qc = {
                power_test: true,
                display_test: true,
                keyboard_touchpad: true,
                audio_multimedia: true,
                port_io_connectivity: true,
                os_thermal_performance: true,
                clean_wow: true,
                accessories_handover: true,
                passed_qc: true,
                qc_by: teknisi ? teknisi.nama : "Budi Santoso (Senior Specialist)",
                qc_at: completedAt ? completedAt.toISOString() : new Date().toISOString(),
                catatan_qc: "Semua pengujian 8 poin normal. Suhu idle 41C, full load 67C. Bodi dilap kinclong bebas debu standar WOW Service."
            };
        } else if (cfg.status === "dalam_perbaikan" || cfg.status === "selesai") {
            checklist_qc = {
                power_test: true,
                display_test: true,
                keyboard_touchpad: true,
                audio_multimedia: false,
                port_io_connectivity: false,
                os_thermal_performance: false,
                clean_wow: false,
                accessories_handover: false,
                passed_qc: false,
                catatan_qc: "Sedang dalam tahap perakitan dan pengetesan port."
            };
        }

        let defectMap = null;
        if (i % 6 === 0) {
            defectMap = {
                items: [
                    { id: 1, surface: "top", x: 28, y: 35, type: "scratch", severity: "minor", note: "Baret halus pemakaian pada cover atas" },
                    { id: 2, surface: "bottom", x: 74, y: 62, type: "dent", severity: "medium", note: "Penyok kecil di dekat ventilasi bawah" }
                ]
            };
        } else if (i % 8 === 0) {
            defectMap = {
                items: [
                    { id: 1, surface: "screen", x: 50, y: 15, type: "bezel", severity: "minor", note: "Karet pelindung bezel atas agak mengelupas" }
                ]
            };
        }

        let slaPaket = cfg.sla || "reguler";
        let targetPengecekanAt = null;
        let disetujuiAt = null;
        let targetSelesaiAt = null;

        if (cfg.status === "diterima" || cfg.status === "didiagnosis") {
            if (cfg.sla === "express" && cfg.isOverdue) {
                targetPengecekanAt = new Date(Date.now() - 2 * 3600000);
            } else if (cfg.sla === "express" && cfg.slaWarning) {
                targetPengecekanAt = new Date(Date.now() + 1 * 3600000);
            } else if (cfg.sla === "express") {
                targetPengecekanAt = new Date(createdAt.getTime() + 4 * 3600000);
            } else {
                targetPengecekanAt = new Date(createdAt.getTime() + 24 * 3600000);
            }
        } else if (cfg.status === "menunggu_persetujuan") {
            targetPengecekanAt = new Date(createdAt.getTime() + (cfg.sla === "express" ? 3 : 16) * 3600000);
        } else if (cfg.status === "disetujui" || cfg.status === "dalam_perbaikan") {
            targetPengecekanAt = new Date(createdAt.getTime() + (cfg.sla === "express" ? 3 : 16) * 3600000);
            disetujuiAt = new Date(Date.now() - (cfg.daysAgo ? cfg.daysAgo * 0.4 * 86400000 : 12 * 3600000));
            if (cfg.sla === "express" && cfg.isOverdue) {
                targetSelesaiAt = new Date(Date.now() - 3 * 3600000);
            } else if (cfg.sla === "express" && cfg.slaWarning) {
                targetSelesaiAt = new Date(Date.now() + 2 * 3600000);
            } else if (cfg.sla === "express") {
                targetSelesaiAt = new Date(disetujuiAt.getTime() + 6 * 3600000);
            } else {
                targetSelesaiAt = new Date(disetujuiAt.getTime() + 48 * 3600000);
            }
        } else if (cfg.status === "selesai" || cfg.status === "diambil") {
            targetPengecekanAt = new Date(createdAt.getTime() + (cfg.sla === "express" ? 3 : 18) * 3600000);
            disetujuiAt = new Date(createdAt.getTime() + (cfg.sla === "express" ? 4 : 24) * 3600000);
            targetSelesaiAt = new Date(disetujuiAt.getTime() + (cfg.sla === "express" ? 6 : 48) * 3600000);
        }

        const kelDetail = kelengkapanDetailList[i % kelengkapanDetailList.length];
        const keluhan = cfg.keluhan || keluhanSamples[i % keluhanSamples.length];

        const tiket = await prisma.tiketServis.create({
            data: {
                nomor_tiket: generateNomorTiketYear(cfg.year || 2026),
                perangkat_id: perangkat.id,
                teknisi_id: teknisi ? teknisi.id : null,
                keluhan: keluhan,
                kelengkapan: kelDetail.catatan_lain,
                kelengkapan_detail: kelDetail,
                foto_kondisi: JSON.stringify([
                    `https://picsum.photos/seed/yvs_t_${i}_1/800/600`,
                    `https://picsum.photos/seed/yvs_t_${i}_2/800/600`
                ]),
                status: cfg.status,
                created_at: createdAt,
                completed_at: completedAt,
                tgl_diambil: tglDiambil,
                kategori_perbaikan: cfg.katTips || "Umum",
                durasi_garansi: cfg.durasiGaransi || "1 Bulan",
                garansi_berakhir_at: garansiBerakhirAt,
                last_reminder_sent: cfg.remSent || 0,
                tips_perawatan: cfg.katTips ? `1. Selalu bersihkan ventilasi udara secara berkala.\n2. Hindari mengisi daya baterai berlebih saat 100 persen.\n3. Jangan matikan unit secara paksa saat booting.` : null,
                checklist_intake: checklist_intake,
                checklist_qc: checklist_qc,
                tipe_kunci: cfg.kunci || "Tidak Ada",
                password_perangkat: cfg.pin || null,
                izin_bongkar: true,
                izin_akses_os: true,
                izin_backup_mandiri: true,
                batasan_izin: cfg.prioritas === "Data Aman" ? "Jangan sentuh partisi data D: / Dokumen pribadi" : null,
                kondisi_fisik: cfg.clean || "Bersih",
                spesifikasi_awal: "RAM 8GB / 16GB, SSD NVMe, OS Windows 11 / macOS",
                prioritas_pelanggan: cfg.prioritas || "Standar",
                defect_map: defectMap,
                sla_paket: slaPaket,
                target_pengecekan_at: targetPengecekanAt,
                disetujui_at: disetujuiAt,
                target_selesai_at: targetSelesaiAt,
                alasan_batal: cfg.alasanBatal || null,
                catatan_batal: cfg.catatanBatal || null,
                biaya_pembatalan: cfg.biayaBatal || 0
            }
        });

        createdTickets.push(tiket);

        // Tambah Diagnosis untuk tiket non-diterima
        if (cfg.status !== "diterima" && cfg.status !== "dibatalkan") {
            const estimasiBiaya = 200000 + (Math.floor(Math.random() * 8) * 75000);
            await prisma.diagnosis.create({
                data: {
                    tiket_id: tiket.id,
                    masalah: `Kerusakan komponen internal sesuai gejala keluhan (${keluhan.substring(0, 45)}...).`,
                    solusi: "Penggantian modul yang bermasalah, repaste pendingin, dan pengujian stabilitas menyeluruh.",
                    estimasi_biaya: estimasiBiaya,
                    created_at: new Date(createdAt.getTime() + 86400000)
                }
            });
        }

        // Tambah Log Perbaikan Timeline
        if (["dalam_perbaikan", "selesai", "diambil"].includes(cfg.status)) {
            const log1Time = new Date(createdAt.getTime() + 2 * 86400000);
            const log2Time = completedAt || new Date(createdAt.getTime() + 4 * 86400000);

            await prisma.logPerbaikan.createMany({
                data: [
                    {
                        tiket_id: tiket.id,
                        fase: "Diagnosis",
                        catatan: "Bongkar casing dan pengecekan jalur tegangan 19V / 5V / 3.3V dengan multimeter.",
                        foto_url: `https://picsum.photos/seed/yvs_log_${i}_1/800/600`,
                        created_at: log1Time
                    },
                    {
                        tiket_id: tiket.id,
                        fase: "Perbaikan",
                        catatan: "Pemasangan part baru, aplikasi thermal paste Arctic MX-4, dan pengetesan beban selama 30 menit.",
                        foto_url: `https://picsum.photos/seed/yvs_log_${i}_2/800/600`,
                        created_at: log2Time
                    }
                ]
            });

            if (cfg.status === "selesai" && cfg.remSent > 0) {
                await prisma.logPerbaikan.create({
                    data: {
                        tiket_id: tiket.id,
                        fase: "Pengingat Pengambilan",
                        catatan: `[CRM Pengambilan Unit] Pengingat pengambilan tahap ${cfg.remSent} terkirim via WhatsApp (${perangkat.customer?.tipe_kepribadian || "Netral"})`,
                        created_at: new Date(Date.now() - 2 * 86400000)
                    }
                });
            }

            if (cfg.status === "diambil" && cfg.warrantyDaysLeft !== undefined && cfg.remSent > 0) {
                await prisma.logPerbaikan.create({
                    data: {
                        tiket_id: tiket.id,
                        fase: "Follow-Up Garansi",
                        catatan: `[CRM Garansi] Follow-up pengingat evaluasi garansi terkirim via WhatsApp (${perangkat.customer?.tipe_kepribadian || "Netral"})`,
                        created_at: new Date(Date.now() - 1 * 86400000)
                    }
                });
            }

            if (cfg.isMaintFollowUp) {
                await prisma.logPerbaikan.create({
                    data: {
                        tiket_id: tiket.id,
                        fase: "Follow-Up Servis Berkala",
                        catatan: `[CRM Servis Berkala] Pengingat perawatan berkala telah terkirim via WhatsApp (${cfg.takenMonthsAgo >= 12 ? 'Siklus Mendesak >= 1 Tahun' : 'Siklus Rutin 6-11 Bulan'})`,
                        created_at: new Date(Date.now() - 5 * 86400000)
                    }
                });
            }
        }

        // Tambah Penggunaan Sparepart dengan Serial Number Realistis & Invoices
        if (["selesai", "diambil"].includes(cfg.status)) {
            const part1 = spareparts[(i * 2) % spareparts.length];
            const part2 = spareparts[(i * 2 + 1) % spareparts.length];
            const snPart1 = `SN-${part1.nama.substring(0, 3).toUpperCase()}-${String(100000 + i * 17).padStart(6, "0")}`;
            const snPart2 = `SN-${part2.nama.substring(0, 3).toUpperCase()}-${String(200000 + i * 19).padStart(6, "0")}`;

            await prisma.penggunaanSparepart.create({
                data: {
                    tiket_id: tiket.id,
                    sparepart_id: part1.id,
                    jumlah: 1,
                    serial_number: snPart1
                }
            });

            let biayaPart = part1.harga;
            if (i % 2 === 0) {
                await prisma.penggunaanSparepart.create({
                    data: {
                        tiket_id: tiket.id,
                        sparepart_id: part2.id,
                        jumlah: 1,
                        serial_number: snPart2
                    }
                });
                biayaPart += part2.harga;
            }

            const biayaJasa = 150000 + (Math.floor(Math.random() * 4) * 50000);
            const totalBiaya = biayaJasa + biayaPart;

            await prisma.invoice.create({
                data: {
                    tiket_id: tiket.id,
                    biaya_jasa: biayaJasa,
                    biaya_sparepart: biayaPart,
                    total_biaya: totalBiaya,
                    ttd_admin_nama: admin2.nama,
                    ttd_customer_nama: customers[cfg.pIdx % customers.length].nama,
                    created_at: completedAt || new Date()
                }
            });
        }
    }

    // 11. Tiket Klaim Garansi Berantai (Parent-Child Link)
    console.log("[SEED] 11. Membuat Tiket Klaim Garansi Resmi (Parent-Child Warranty Link)...");
    const parentTiketForClaim = createdTickets[createdTickets.length - 10] || createdTickets[0];
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiketYear(2026),
            perangkat_id: parentTiketForClaim.perangkat_id,
            teknisi_id: teknisis[0].id,
            keluhan: `[KLAIM GARANSI SERVIS] Retur perbaikan dari Tiket #${parentTiketForClaim.nomor_tiket}. Sampaikan kendala: SSD kedua kadang tidak terbaca setelah restart ulang.`,
            kelengkapan: "Unit laptop dan adaptor",
            status: "dalam_perbaikan",
            is_garansi_claim: true,
            parent_tiket_id: parentTiketForClaim.id,
            durasi_garansi: parentTiketForClaim.durasi_garansi,
            created_at: new Date(Date.now() - 1 * 86400000),
            prioritas_pelanggan: "Cepat Selesai",
            kondisi_fisik: "Bersih",
            izin_bongkar: true,
            izin_akses_os: true,
            izin_backup_mandiri: true
        }
    });

    // 12. Unit Pinjaman / Loaner Device & Peminjaman Aktif (Loaner Pool)
    console.log("[SEED] 12. Membuat Pool Unit Pinjaman (Loaner Device) dan Catatan Peminjaman...");
    const loanerDefs = [
        {
            kode_unit: "LOAN-01",
            nama: "Lenovo ThinkPad T480 (Core i5 / 16GB / SSD 256GB)",
            kategori: "Laptop",
            serial_number: "LOAN-TP-T480-001",
            spesifikasi: "Intel Core i5-8350U, RAM 16GB DDR4, SSD 256GB NVMe, Windows 11 Pro, Office 2021",
            kelengkapan: "Unit Laptop, Adaptor Type-C 65W Original, Tas Slempang Hitam",
            kondisi_fisik: "Mulus 95%, baret halus pemakaian kantor",
            status: "dipinjam",
            catatan: "Unit laptop cadangan andalan untuk klien corporate dan mahasiswa tingkat akhir skripsi."
        },
        {
            kode_unit: "LOAN-02",
            nama: "Dell Latitude 5490 (Core i5 / 8GB / SSD 256GB)",
            kategori: "Laptop",
            serial_number: "LOAN-DELL-5490-002",
            spesifikasi: "Intel Core i5-8250U, RAM 8GB DDR4, SSD 256GB SATA, Windows 10 Pro",
            kelengkapan: "Unit Laptop + Charger Dell 65W + Mouse Optik USB",
            kondisi_fisik: "Normal terawat, baterai tahan 3-4 jam",
            status: "tersedia",
            catatan: "Unit siap pakai untuk pelanggan servis reguler pekerjaan kantor & admin."
        },
        {
            kode_unit: "LOAN-03",
            nama: "Apple MacBook Air 13 M1 (8GB / 256GB SSD)",
            kategori: "Laptop",
            serial_number: "LOAN-MBA-M1-003",
            spesifikasi: "Apple Silicon M1 8-Core, 8GB Unified Memory, SSD 256GB, macOS Sonoma",
            kelengkapan: "Unit MacBook Air, Charger Type-C 30W Original, Kabel USB-C, Sleeve Case Kulit",
            kondisi_fisik: "Sangat mulus 98%, battery health 94%",
            status: "dipinjam",
            catatan: "Fasilitas khusus untuk pelanggan ekosistem Apple / desainer / video editor."
        },
        {
            kode_unit: "LOAN-04",
            nama: "HP ProBook 440 G7 (Core i7 / 16GB / SSD 512GB)",
            kategori: "Laptop",
            serial_number: "LOAN-HP-440G7-004",
            spesifikasi: "Intel Core i7-10510U, RAM 16GB DDR4, SSD 512GB NVMe, Windows 11 Pro",
            kelengkapan: "Unit Laptop + Charger HP Blue Pin 65W",
            kondisi_fisik: "Kipas agak berisik, sedang dijadwalkan cleaning",
            status: "dalam_perawatan",
            catatan: "Unit sedang dalam tahap perawatan berkala dan pembersihan thermal paste heatsink."
        }
    ];

    const loaners = [];
    for (const ld of loanerDefs) {
        loaners.push(await prisma.loanerDevice.create({ data: ld }));
    }

    // Buat Catatan Peminjaman Loaner Realistis (Aktif & Riwayat)
    const activeTicket1 = createdTickets.find(t => t.status === "dalam_perbaikan") || createdTickets[0];
    const activeTicket2 = createdTickets.find(t => t.status === "disetujui") || createdTickets[1];

    await prisma.loanerRecord.create({
        data: {
            loaner_device_id: loaners[0].id, // LOAN-01 ThinkPad
            tiket_id: activeTicket1.id,
            customer_id: customers[0].id,
            nomor_peminjaman: "LNR-2026-0001",
            tanggal_pinjam: new Date(Date.now() - 3 * 86400000),
            estimasi_kembali: new Date(Date.now() + 4 * 86400000),
            status: "aktif",
            deposit_uang: 250000,
            deposit_dikembalikan: false,
            catatan_kondisi_pinjam: "Fisik unit dipinjamkan dalam kondisi bersih, baterai terisi 90%, charger lengkap.",
            syarat_ketentuan_acc: true,
            created_by_nama: "Siti Rahmawati (Service Advisor)"
        }
    });

    await prisma.loanerRecord.create({
        data: {
            loaner_device_id: loaners[2].id, // LOAN-03 MacBook Air M1
            tiket_id: activeTicket2.id,
            customer_id: customers[8].id,
            nomor_peminjaman: "LNR-2026-0002",
            tanggal_pinjam: new Date(Date.now() - 2 * 86400000),
            estimasi_kembali: new Date(Date.now() + 3 * 86400000),
            status: "aktif",
            deposit_uang: 500000,
            deposit_dikembalikan: false,
            catatan_kondisi_pinjam: "MacBook Air M1 dipinjamkan bersih tanpa goresan, akun iCloud sudah logout, sleeve case lengkap.",
            syarat_ketentuan_acc: true,
            created_by_nama: "Admin Utama"
        }
    });

    // Peminjaman Selesai (Riwayat)
    await prisma.loanerRecord.create({
        data: {
            loaner_device_id: loaners[1].id, // LOAN-02 Dell
            tiket_id: createdTickets[10].id,
            customer_id: customers[2].id,
            nomor_peminjaman: "LNR-2026-0003",
            tanggal_pinjam: new Date(Date.now() - 20 * 86400000),
            estimasi_kembali: new Date(Date.now() - 15 * 86400000),
            tanggal_kembali: new Date(Date.now() - 14 * 86400000),
            status: "dikembalikan",
            deposit_uang: 250000,
            deposit_dikembalikan: true,
            catatan_kondisi_pinjam: "Unit Dell Latitude dalam kondisi prima dan tas laptop lengkap.",
            catatan_kondisi_kembali: "Unit dikembalikan dalam keadaan normal dan bersih. Data pengguna telah diformat ulang, uang deposit dikembalikan tunai.",
            syarat_ketentuan_acc: true,
            created_by_nama: "Siti Rahmawati (Service Advisor)",
            diterima_kembali_nama: "Budi Santoso (Senior Specialist)"
        }
    });

    // 13. Klaim Garansi Sparepart ke Distributor (Supplier RMA Tracker - 3 Kategori Sumber Realistis)
    console.log("[SEED] 13. Membuat Klaim Garansi Distributor (RMA Tracker: Tiket Servis, Retail & Stok Toko)...");
    
    // Temukan tiket servis yang memasang RAM dan SSD
    const tiketUserRma1 = createdTickets[15] || createdTickets[0];
    const tiketUserRma2 = createdTickets[16] || createdTickets[1];

    const rmaClaims = [
        // KATEGORI 1: TIKET_USER (Part dipasang pada unit servis pelanggan dan mengalami defek masa garansi)
        {
            nomor_rma: "RMA-2026-0001",
            sparepart_id: spareparts[1].id, // Kingston SO-DIMM DDR4 16GB
            supplier_id: synnexId,
            tipe_sumber: "tiket_user",
            customer_nama: "Kevin Sanjaya",
            customer_kontak: "082133445566",
            perangkat_nama: "Predator Helios 300 PH315",
            supplier_nama: "PT Synnex Metrodata Indonesia",
            nomor_faktur: "INV-SMI-2026-0918",
            serial_number_lama: "KNG-RAM-DDR4-884192",
            serial_number_baru: "KNG-RAM-DDR4-991044",
            kebijakan_garansi: "sejak_nota_customer",
            tgl_pembelian_distri: new Date(Date.now() - 40 * 86400000),
            tgl_penjualan_customer: new Date(Date.now() - 12 * 86400000),
            kondisi_fisik_valid: true,
            bantuan_klaim_toko: true,
            biaya_ongkir_ditanggung: "toko",
            jumlah: 1,
            alasan_rusak: "Keping memory mengalami BSOD berulang (kode MEMORY_MANAGEMENT) setelah 30 menit pemakaian pada laptop customer. Hasil diagnosa MemTest86 menunjukkan ribuan error pada block memori 0x4F00.",
            status: "disetujui_ganti",
            resi_pengiriman: "JNE-SOC-8829102938",
            kurir_pengiriman: "JNE Express",
            ongkir: 18000,
            solusi_distributor: "Ganti Unit Baru",
            catatan_distributor: "Klaim garansi resmi disetujui Synnex Metrodata Center. Unit replacement baru dengan SN KNG-RAM-DDR4-991044 telah dikirim kembali ke bengkel.",
            tgl_pengajuan: new Date(Date.now() - 8 * 86400000),
            tgl_selesai: new Date(Date.now() - 2 * 86400000),
            tiket_id: tiketUserRma1.id,
            created_by_nama: "Admin Utama"
        },
        {
            nomor_rma: "RMA-2026-0002",
            sparepart_id: spareparts[16].id, // WD Blue SN580 PCIe 4.0 NVMe 1TB
            supplier_id: njtId,
            tipe_sumber: "tiket_user",
            customer_nama: "Rizky Pratama, M.Kom",
            customer_kontak: "081298765432",
            perangkat_nama: "ROG Zephyrus G14 GA402",
            supplier_nama: "PT Nusantara Jaya Teknologi (NJT)",
            nomor_faktur: "NJT-PO-2026-0419",
            serial_number_lama: "WDC-SN580-091827",
            serial_number_baru: null,
            kebijakan_garansi: "sejak_nota_customer",
            tgl_pembelian_distri: new Date(Date.now() - 30 * 86400000),
            tgl_penjualan_customer: new Date(Date.now() - 7 * 86400000),
            kondisi_fisik_valid: true,
            bantuan_klaim_toko: true,
            biaya_ongkir_ditanggung: "toko",
            jumlah: 1,
            alasan_rusak: "SSD tiba-tiba terkunci write-protection (read-only mode), file Windows freeze saat boot dan SMART diagnostic status menunjukkan 100% media wearout error.",
            status: "dikirim",
            resi_pengiriman: "SiCepat-002918274615",
            kurir_pengiriman: "SiCepat Cargo",
            ongkir: 22000,
            solusi_distributor: null,
            catatan_distributor: "Paket sedang dalam perjalanan menuju NJT Service Center Harco Mangga Dua Blok G.",
            tgl_pengajuan: new Date(Date.now() - 3 * 86400000),
            tiket_id: tiketUserRma2.id,
            created_by_nama: "Budi Santoso (Senior Specialist)"
        },

        // KATEGORI 2: RETAIL_CUSTOMER (Konsumen beli part langsung di kasir toko dan klaim dibantu oleh toko)
        {
            nomor_rma: "RMA-2026-0003",
            sparepart_id: spareparts[8].id, // Corsair Vengeance DDR5 32GB
            supplier_id: njtId,
            tipe_sumber: "retail_customer",
            customer_nama: "Chandra Liow",
            customer_kontak: "082133445577",
            perangkat_nama: "PC Gaming Rig Rakitan Mandiri",
            supplier_nama: "PT Nusantara Jaya Teknologi (NJT)",
            nomor_faktur: "NOTA-RETAIL-2026-0312",
            serial_number_lama: "COR-DDR5-5600-88192",
            serial_number_baru: null,
            kebijakan_garansi: "lifetime",
            tgl_pembelian_distri: new Date(Date.now() - 60 * 86400000),
            tgl_penjualan_customer: new Date(Date.now() - 25 * 86400000),
            kondisi_fisik_valid: true,
            bantuan_klaim_toko: true,
            biaya_ongkir_ditanggung: "customer",
            jumlah: 1,
            alasan_rusak: "Konsumen beli part memory kit eceran di toko dengan nota resmi. Saat dipasang di motherboard ASUS ROG, 1 keping tidak terdeteksi (LED DRAM menyala merah). Box asli dan stiker NJT lengkap.",
            status: "diajukan",
            resi_pengiriman: null,
            kurir_pengiriman: null,
            ongkir: 0,
            tgl_pengajuan: new Date(Date.now() - 1 * 86400000),
            tiket_id: null,
            created_by_nama: "Siti Rahmawati (Service Advisor)"
        },
        {
            nomor_rma: "RMA-2026-0004",
            sparepart_id: spareparts[40].id, // Power Supply Corsair CV650 650W
            supplier_id: njtId,
            tipe_sumber: "retail_customer",
            customer_nama: "Bayu Skak",
            customer_kontak: "085911223344",
            perangkat_nama: "PC Studio Editing",
            supplier_nama: "PT Nusantara Jaya Teknologi (NJT)",
            nomor_faktur: "NOTA-RETAIL-2025-1102",
            serial_number_lama: "COR-PSU-CV650-77182",
            serial_number_baru: null,
            kebijakan_garansi: "sejak_nota_customer",
            tgl_pembelian_distri: new Date(Date.now() - 180 * 86400000),
            tgl_penjualan_customer: new Date(Date.now() - 120 * 86400000),
            kondisi_fisik_valid: false,
            bantuan_klaim_toko: true,
            biaya_ongkir_ditanggung: "customer",
            jumlah: 1,
            alasan_rusak: "PSU mati total setelah korsleting listrik padam mendadak di studio. Tercium bau hangus pada ventilasi belakang PSU.",
            status: "ditolak",
            solusi_distributor: "Ditolak / Void",
            catatan_distributor: "Hasil inspeksi teknisi NJT Service Center menemukan varistor dan kapasitor utama meledak hangus akibat sambaran petir/lonjakan tegangan ekstrem (surge voltage). Kerusakan di luar garansi resmi manufaktur.",
            tgl_pengajuan: new Date(Date.now() - 15 * 86400000),
            tgl_selesai: new Date(Date.now() - 10 * 86400000),
            tiket_id: null,
            created_by_nama: "Admin Utama"
        },

        // KATEGORI 3: STOK_TOKO (Cacat Dead on Arrival / DOA saat pre-test inventaris gudang)
        {
            nomor_rma: "RMA-2026-0005",
            sparepart_id: spareparts[34].id, // LCD 14.0" Slim 30 Pin FHD IPS
            supplier_id: lcdId,
            tipe_sumber: "stok_toko",
            customer_nama: null,
            customer_kontak: null,
            perangkat_nama: "Stok Inventaris Toko",
            supplier_nama: "Toko LCD Bandung Sparepart",
            nomor_faktur: "FAK-LCDBDG-9921",
            serial_number_lama: "LCD-140-IPS-99410",
            serial_number_baru: null,
            kebijakan_garansi: "sejak_segel_distri",
            tgl_pembelian_distri: new Date(Date.now() - 12 * 86400000),
            kondisi_fisik_valid: true,
            bantuan_klaim_toko: false,
            biaya_ongkir_ditanggung: "distributor",
            jumlah: 1,
            alasan_rusak: "Dead on Arrival (DOA) pada saat pre-test barang masuk. Layar panel menunjukkan garis vertikal ungu selebar 1 pixel di sisi kanan layar. Plastik pelindung belum dilepas.",
            status: "disetujui_refund",
            resi_pengiriman: "J&T-JP9928172635",
            kurir_pengiriman: "J&T Express",
            ongkir: 15000,
            solusi_distributor: "Refund Dana",
            catatan_distributor: "Barang telah diterima kembali oleh Toko LCD Bandung. Sesuai kesepakatan garansi tes display 14 hari, dana refund sebesar Rp 720.000 telah ditransfer ke rekening toko Serv.io.",
            tgl_pengajuan: new Date(Date.now() - 9 * 86400000),
            tgl_selesai: new Date(Date.now() - 4 * 86400000),
            tiket_id: null,
            created_by_nama: "Admin Utama"
        },
        {
            nomor_rma: "RMA-2026-0006",
            sparepart_id: spareparts[19].id, // Baterai ASUS TUF Gaming FX505
            supplier_id: bintangId,
            tipe_sumber: "stok_toko",
            customer_nama: null,
            customer_kontak: null,
            perangkat_nama: "Stok Inventaris Toko",
            supplier_nama: "CV Bintang Komputer Glodok",
            nomor_faktur: "FAK-BEG-4421",
            serial_number_lama: "BAT-TUF-FX505-00819",
            serial_number_baru: null,
            kebijakan_garansi: "sejak_segel_distri",
            tgl_pembelian_distri: new Date(Date.now() - 75 * 86400000),
            kondisi_fisik_valid: true,
            bantuan_klaim_toko: false,
            biaya_ongkir_ditanggung: "toko",
            jumlah: 1,
            alasan_rusak: "Stok gudang toko mengendap 2.5 bulan (segel distri 6 bulan). Saat dites pada unit servis, baterai tidak bisa di-charge di atas 40% dan lampu charging berkedip orange menandakan sel drop.",
            status: "diajukan",
            resi_pengiriman: null,
            kurir_pengiriman: null,
            ongkir: 0,
            tgl_pengajuan: new Date(Date.now() - 2 * 86400000),
            tiket_id: null,
            created_by_nama: "Admin Utama"
        }
    ];

    for (const rma of rmaClaims) {
        await prisma.supplierRma.create({ data: rma });
    }

    // 14. Recruitment Center & Talent Acquisition (Job Postings & Applicants dengan Rubrik KEOS)
    console.log("[SEED] 14. Membuat Lowongan Karir & Bank Pelamar Terintegrasi Rubrik KEOS...");
    const jobPostingDefs = [
        {
            judul_posisi: "Senior Laptop & Hardware Technician",
            departemen: "Teknisi",
            tipe_kerja: "Full Time",
            lokasi: "Workshop Pusat (Jl. Kemang Raya No. 12)",
            nomor_kontak: "081299887700",
            status: "Aktif",
            deskripsi: "Bertanggung jawab atas penanganan troubleshooting motherboard tingkat lanjut, micro-soldering IC charging / power controller, reballing chipset, analisa skematik tegangan (boardview), serta supervisi teknisi junior dalam standar QC WOW Service.",
            kualifikasi: "1. Pengalaman minimal 3 tahun sebagai teknisi hardware laptop/PC.\n2. Mahir membaca skematik boardview dan menggunakan oscilloscope/multimeter.\n3. Mahir teknik micro-soldering SMD & reballing IC.\n4. Memiliki komitmen tinggi terhadap kerapihan pengerjaan dan K3.",
            gaji_min: 4500000,
            gaji_max: 7500000,
            external_links: [
                { platform: "Glints", url: "https://glints.com/id/opportunities/jobs/senior-hardware-technician-servio" },
                { platform: "Jobstreet", url: "https://www.jobstreet.co.id/job/senior-technician-laptop-servio" },
                { platform: "LinkedIn", url: "https://linkedin.com/jobs/view/servio-senior-tech" }
            ],
            iklan_template: "🔥 WE ARE HIRING: SENIOR HARDWARE TECHNICIAN 🔥\n\nServ.io Workshop sedang membuka kesempatan bagi Teknisi Laptop berpengalaman untuk bergabung bersama tim spesialis kami!\n\n🏢 Lokasi: Workshop Pusat Kemang\n💰 Gaji: Rp 4.500.000 - Rp 7.500.000 + Bonus Insentif QC\n💼 Fasilitas: Meja kerja mikroskop trinokuler, thermal camera, tools lengkap & BPJS\n\nKualifikasi:\n- Mahir micro-soldering & analisa boardview motherboard\n- Pengalaman min. 3 tahun di bidang servis laptop/PC\n\nKirimkan CV & Portofolio pengerjaan Anda via WhatsApp ke 081299887700 atau apply langsung di website Serv.io!"
        },
        {
            judul_posisi: "Junior Technician / Magang SMK TKJ",
            departemen: "Teknisi",
            tipe_kerja: "Full Time",
            lokasi: "Workshop Pusat",
            nomor_kontak: "081299887700",
            status: "Aktif",
            deskripsi: "Membantu proses perawatan rutin (cleaning heatsink & repaste thermal), perakitan PC Desktop gaming, upgrade modul RAM/SSD, instalasi sistem operasi Windows/Linux, serta menjalankan prosedur pengujian QC 8 poin.",
            kualifikasi: "1. Lulusan SMK jurusan TKJ / Rekayasa Perangkat Keras atau pemula antusias.\n2. Memahami komponen dasar PC & Laptop.\n3. Teliti, jujur, dan memiliki rasa ingin tahu yang tinggi.\n4. Bersedia belajar teknik diagnosis di bawah bimbingan teknisi senior.",
            gaji_min: 2800000,
            gaji_max: 3800000,
            external_links: [
                { platform: "Instagram", url: "https://instagram.com/p/lowongan-teknisi-junior-servio" }
            ],
            iklan_template: "🌟 LOWONGAN KERJA: JUNIOR TECHNICIAN (FRESH GRADUATE WELCOME) 🌟\n\nKamu lulusan SMK TKJ atau hobi rakit PC & otak-atik laptop? Serv.io membuka pintu untuk kamu belajar langsung dari master teknisi kami!\n\nBenefit:\n- Gaji Rp 2.800.000 - Rp 3.800.000\n- Pelatihan intensif soldering & hardware troubleshooting\n- Lingkungan kerja suportif & modern\n\nHubungi WhatsApp HR: 081299887700"
        },
        {
            judul_posisi: "Service Advisor & Customer Care (Frontliner)",
            departemen: "Frontliner",
            tipe_kerja: "Full Time",
            lokasi: "Front Office Serv.io",
            nomor_kontak: "081299887700",
            status: "Aktif",
            deskripsi: "Menjadi garda terdepan dalam menyambut pelanggan, mendengarkan keluhan kerusakan, melakukan registrasi intake tiket servis, menjelaskan estimasi biaya & penawaran teknis dengan bahasa yang ramah dan mudah dipahami, serta mengelola follow-up retensi CRM garansi dan servis berkala.",
            kualifikasi: "1. Pendidikan min. SMA/SMK/D3 segala jurusan.\n2. Komunikatif, berpenampilan rapi, ramah, dan empatik.\n3. Mampu mengoperasikan komputer dan aplikasi web dengan cepat.\n4. Mampu beradaptasi dengan beragam tipe karakter kepribadian pelanggan.",
            gaji_min: 3200000,
            gaji_max: 4500000,
            external_links: [
                { platform: "Jobstreet", url: "https://jobstreet.co.id/job/frontliner-service-advisor" }
            ],
            iklan_template: "✨ LOWONGAN SERVICE ADVISOR / FRONTLINER ✨\n\nJadilah wajah ramah workshop kami! Hubungi WA 081299887700."
        },
        {
            judul_posisi: "Staff Administrasi Logistik & Sparepart",
            departemen: "Operasional",
            tipe_kerja: "Full Time",
            lokasi: "Gudang Logistik Serv.io",
            nomor_kontak: "081299887700",
            status: "Ditutup",
            deskripsi: "Mengelola pencatatan stok suku cadang, log restok dari supplier, pengajuan klaim garansi RMA distributor, serta stock opname mingguan.",
            kualifikasi: "1. Pengalaman minimal 1 tahun di bidang inventaris logistik / gudang.\n2. Rapi, teliti dalam pencatatan faktur dan serial number suku cadang.",
            gaji_min: 3000000,
            gaji_max: 4000000,
            external_links: []
        }
    ];

    const jobPostings = [];
    for (const jp of jobPostingDefs) {
        jobPostings.push(await prisma.jobPosting.create({ data: jp }));
    }

    // Buat Pelamar Realistis di Seluruh Pipeline Tahapan
    const applicantDefs = [
        // Pelamar Posisi 1: Senior Technician
        {
            jpIdx: 0,
            nama: "Bagus Tri Wicaksono, A.Md.T.",
            email: "bagus.wicaksono@gmail.com",
            telepon: "081233441199",
            alamat: "Jl. Margonda Raya No. 40, Depok",
            pendidikan: "D3 Teknik Komputer",
            pengalaman_thn: 4,
            status: "Wawancara / Trial",
            skor_logika: 88,
            skor_teknis: 92,
            skor_attitude: 85,
            skor_sop: 90,
            catatan: "Pengalaman 4 tahun di authorized service center ASUS. Sangat rapi dalam membaca boardview dan soldering IC charging TPS65988.",
            userHiredId: null
        },
        {
            jpIdx: 0,
            nama: "Rahmat Hidayat",
            email: "rahmat.tekno@yahoo.com",
            telepon: "085699112233",
            alamat: "Jl. Tebet Barat No. 15, Jakarta Selatan",
            pendidikan: "SMK TKJ",
            pengalaman_thn: 5,
            status: "Diterima",
            skor_logika: 90,
            skor_teknis: 95,
            skor_attitude: 92,
            skor_sop: 94,
            catatan: "Paling unggul dalam trial reballing chip audio dan penggantian socket CPU. Attitude sangat sopan dan tenang.",
            userHiredId: teknisis[0].id
        },
        {
            jpIdx: 0,
            nama: "Dimas Anggara",
            email: "dimas.techie@gmail.com",
            telepon: "087811992244",
            alamat: "Jl. Duren Sawit No. 8, Jakarta Timur",
            pendidikan: "S1 Teknik Elektro",
            pengalaman_thn: 2,
            status: "Tes Logika & Teknis",
            skor_logika: 82,
            skor_teknis: 78,
            skor_attitude: 80,
            skor_sop: 75,
            catatan: "Dasar teori kelistrikan sangat kuat, sedang dijadwalkan tes praktik penelusuran jalur 19V short.",
            userHiredId: null
        },
        {
            jpIdx: 0,
            nama: "Bayu Nugroho",
            email: "bayu.nugroho99@gmail.com",
            telepon: "081922334455",
            alamat: "Jl. Ciledug Raya No. 12, Tangerang",
            pendidikan: "SMA IPA",
            pengalaman_thn: 1,
            status: "Ditolak",
            skor_logika: 55,
            skor_teknis: 50,
            skor_attitude: 60,
            skor_sop: 50,
            catatan: "Belum menguasai teknik micro-soldering dan kurang teliti dalam pencatatan baut casing.",
            userHiredId: null
        },

        // Pelamar Posisi 2: Junior Technician
        {
            jpIdx: 1,
            nama: "Aldi Ramadhan",
            email: "aldi.ramadhan@gmail.com",
            telepon: "081399881122",
            alamat: "Jl. Otista No. 25, Jakarta Timur",
            pendidikan: "SMK TKJ",
            pengalaman_thn: 1,
            status: "Screening",
            skor_logika: 75,
            skor_teknis: 70,
            skor_attitude: 85,
            skor_sop: 80,
            catatan: "Portofolio rakit PC rapi dan pernah magang 6 bulan di toko komputer.",
            userHiredId: null
        },
        {
            jpIdx: 1,
            nama: "Ilham Pratama",
            email: "ilham.tkj@gmail.com",
            telepon: "085711883344",
            alamat: "Jl. Raya Bogor Km. 28, Cibubur",
            pendidikan: "SMK TKJ",
            pengalaman_thn: 0,
            status: "Tes Logika & Teknis",
            skor_logika: 85,
            skor_teknis: 80,
            skor_attitude: 90,
            skor_sop: 85,
            catatan: "Fresh graduate penuh semangat, cepat tanggap saat dijelaskan urutan checklist QC 8 poin.",
            userHiredId: null
        },
        {
            jpIdx: 1,
            nama: "Rendi Kurnia",
            email: "rendi.kurnia@gmail.com",
            telepon: "082211994455",
            alamat: "Jl. Fatmawati No. 10, Jakarta Selatan",
            pendidikan: "SMK Rekayasa Perangkat Lunak",
            pengalaman_thn: 0,
            status: "Baru Masuk",
            skor_logika: 0,
            skor_teknis: 0,
            skor_attitude: 0,
            skor_sop: 0,
            catatan: "Berkas baru masuk via formulir website.",
            userHiredId: null
        },
        {
            jpIdx: 1,
            nama: "Eka Prasetya",
            email: "eka.prasetya@gmail.com",
            telepon: "081122998877",
            alamat: "Jl. Kalimalang No. 70, Bekasi",
            pendidikan: "SMK TKJ",
            pengalaman_thn: 1,
            status: "Diterima",
            skor_logika: 88,
            skor_teknis: 86,
            skor_attitude: 94,
            skor_sop: 90,
            catatan: "Lolos trial perakitan 5 unit PC tanpa cacat kabel manajemen. Sangat disiplin.",
            userHiredId: teknisis[1].id
        },

        // Pelamar Posisi 3: Frontliner / Service Advisor
        {
            jpIdx: 2,
            nama: "Nadira Ayu Kusuma",
            email: "nadira.ayuk@gmail.com",
            telepon: "081288114422",
            alamat: "Jl. Bintaro Sektor 9, Tangerang Selatan",
            pendidikan: "S1 Ilmu Komunikasi",
            pengalaman_thn: 2,
            status: "Wawancara / Trial",
            skor_logika: 85,
            skor_teknis: 75,
            skor_attitude: 96,
            skor_sop: 92,
            catatan: "Kemampuan komunikasi verbal luar biasa, ramah, dan mampu meredakan komplain pelanggan dengan empati.",
            userHiredId: null
        },
        {
            jpIdx: 2,
            nama: "Cindy Claudia",
            email: "cindy.claudia@gmail.com",
            telepon: "087799223311",
            alamat: "Jl. Palmerah Barat No. 18, Jakarta Barat",
            pendidikan: "D3 Manajemen Informatika",
            pengalaman_thn: 1,
            status: "Baru Masuk",
            skor_logika: 0,
            skor_teknis: 0,
            skor_attitude: 0,
            skor_sop: 0,
            catatan: "Pengalaman kasir retail gadget selama 1 tahun di mal.",
            userHiredId: null
        },
        {
            jpIdx: 2,
            nama: "Dina Marlina",
            email: "dina.marlina@gmail.com",
            telepon: "085811223344",
            alamat: "Jl. Kemandoran No. 5, Jakarta Selatan",
            pendidikan: "SMA",
            pengalaman_thn: 0,
            status: "Ditolak",
            skor_logika: 60,
            skor_teknis: 50,
            skor_attitude: 65,
            skor_sop: 60,
            catatan: "Kurang percaya diri saat simulasi roleplay penawaran biaya servis ke customer.",
            userHiredId: null
        },

        // Pelamar Posisi 4: Admin Logistik
        {
            jpIdx: 3,
            nama: "Fajar Nugraha",
            email: "fajar.nugraha@gmail.com",
            telepon: "081388442211",
            alamat: "Jl. Kebon Jeruk No. 30, Jakarta Barat",
            pendidikan: "D3 Akuntansi",
            pengalaman_thn: 3,
            status: "Diterima",
            skor_logika: 90,
            skor_teknis: 85,
            skor_attitude: 92,
            skor_sop: 95,
            catatan: "Sangat teliti dalam audit stok dan pencocokan faktur supplier. Diterima untuk mengelola gudang sparepart.",
            userHiredId: null
        }
    ];

    for (const a of applicantDefs) {
        await prisma.applicant.create({
            data: {
                job_posting_id: jobPostings[a.jpIdx].id,
                nama_lengkap: a.nama,
                email: a.email,
                nomor_telepon: a.telepon,
                alamat: a.alamat,
                pendidikan: a.pendidikan,
                pengalaman_thn: a.pengalaman_thn,
                status: a.status,
                skor_logika: a.skor_logika,
                skor_teknis: a.skor_teknis,
                skor_attitude: a.skor_attitude,
                skor_sop: a.skor_sop,
                catatan_evaluasi: a.catatan,
                user_id_hired: a.userHiredId
            }
        });
    }

    // 15. Notifikasi Sistem & Kolaborasi Tim
    console.log("[SEED] 15. Membuat Notifikasi Sistem & Memo Tim...");
    const notifDefs = [
        {
            recipient_role: "admin",
            sender_id: null,
            sender_nama: "Sistem Logistik",
            tipe: "rma",
            judul: "Klaim RMA Disetujui Distributor",
            pesan: "Klaim RMA-2026-0001 (Kingston RAM 16GB) telah disetujui oleh PT Synnex Metrodata Indonesia. Unit pengganti baru sedang dalam pengiriman dengan resi JNE-SOC-8829102938.",
            link: "/rma",
            is_read: false
        },
        {
            recipient_role: "admin",
            sender_id: null,
            sender_nama: "Sistem Inventaris",
            tipe: "restock_sparepart",
            judul: "Peringatan Stok Suku Cadang Kritis",
            pesan: "Stok Corsair Vengeance SO-DIMM DDR4 16GB tersisa 2 unit dan Samsung DDR5 tersisa 1 unit. Segera buat purchase order restok ke NJT / Synnex.",
            link: "/sparepart",
            is_read: false
        },
        {
            recipient_role: "admin",
            sender_id: null,
            sender_nama: "Sistem Loaner Pool",
            tipe: "loaner",
            judul: "Jadwal Pengembalian Unit Pinjaman (H-1)",
            pesan: "Unit pinjaman ThinkPad T480 (LOAN-01) yang dipinjam oleh Kevin Sanjaya dijadwalkan kembali besok.",
            link: "/loaner",
            is_read: false
        },
        {
            recipient_role: "admin",
            sender_id: null,
            sender_nama: "CRM Engine",
            tipe: "crm",
            judul: "Evaluasi Garansi Servis (H-1 Expiring)",
            pesan: "Tiket servis SRV-2026-055 milik Dewi Lestari akan berakhir masa garansi besok. Kirim pesan evaluasi kepuasan.",
            link: "/retensi-crm",
            is_read: false
        },
        {
            recipient_role: "teknisi",
            sender_id: admin.id,
            sender_nama: "Admin Utama",
            tipe: "sop",
            judul: "Pembaruan SOP Quality Control 8 Poin",
            pesan: "SOP-QC-002: Prosedur QC 8 Poin WOW Service telah diperbarui ke versi 1.1. Harap dipelajari dan dipraktikkan oleh seluruh teknisi.",
            link: "/sop",
            is_read: false
        },
        {
            recipient_role: "admin",
            sender_id: null,
            sender_nama: "Recruitment Portal",
            tipe: "recruitment",
            judul: "Pelamar Baru Masuk untuk Posisi Teknisi",
            pesan: "Pelamar baru (Rendi Kurnia & Cindy Claudia) telah mengirimkan berkas lamaran. Mohon lakukan screening awal.",
            link: "/recruitment",
            is_read: false
        }
    ];

    for (const n of notifDefs) {
        await prisma.notification.create({ data: n });
    }

    // 16. Tanda Tangan Staf Digital (Staff Signature)
    console.log("[SEED] 16. Membuat Master Tanda Tangan Digital Staf Kasir...");
    await prisma.staffSignature.createMany({
        data: [
            {
                nama: "Admin Utama",
                role: "Admin Kasir & Logistik",
                signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            },
            {
                nama: "Siti Rahmawati",
                role: "Service Advisor",
                signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            }
        ]
    });

    // 17. Pustaka Wiki & Hardware Knowledge Base (10 Artikel Penanganan Kasus)
    console.log("[SEED] 17. Membuat Data Pustaka Wiki dan Hardware Knowledge Base...");
    const wikiArticles = [
        {
            brand: "ASUS",
            model: "ROG Zephyrus / TUF Gaming Series",
            kategori: "Kipas & Thermal",
            judul: "Solusi Overheat & Throttling Parah Saat Gaming",
            gejala: "Suhu CPU menyentuh 95C dan FPS drop drastis setelah 10 menit gameplay.",
            penyebab: "Thermal paste kering mengeras dan debu menghalangi sirip radiator heatsink tembaga.",
            solusi: "1. Bersihkan sirip heatsink dengan kuas antistatik dan blower.\n2. Bersihkan sisa pasta termal lama dengan alkohol isopropil 99%.\n3. Aplikasikan pasta termal berefisiensi tinggi (Thermal Grizzly Kryonaut atau Arctic MX-4).\n4. Pasang kembali heatsink dengan urutan baut menyilang sesuai nomor cetakan pabrik.",
            komponen: "Thermal Paste Arctic MX-4, Fan Cleaner Kit",
            kesulitan: "Menengah",
            waktu: "45 Menit",
            sukses: 95
        },
        {
            brand: "Lenovo",
            model: "ThinkPad X1 / T-Series",
            kategori: "Motherboard / Power",
            judul: "Penanganan Port USB-C Thunderbolt Tidak Mengisi Daya",
            gejala: "Laptop tidak dapat di-charge melalui port Thunderbolt 1, lampu indikator mati.",
            penyebab: "Firmware controller Thunderbolt korup atau controller IC TPS65988 short.",
            solusi: "1. Lakukan emergency pinhole reset pada bagian bawah bodi laptop.\n2. Cek tegangan VBUS 5V/20V pada pinout Type-C menggunakan multimeter.\n3. Bila short, lakukan reballing/penggantian IC charging controller.\n4. Segera perbarui firmware Thunderbolt ke versi patch terbaru Lenovo.",
            komponen: "IC Controller Thunderbolt, Multimeter",
            kesulitan: "Spesialis",
            waktu: "2-3 Jam",
            sukses: 88
        },
        {
            brand: "Apple",
            model: "MacBook Air & Pro M1/M2",
            kategori: "Layar / Display",
            judul: "Layar Blank Hitam tetapi Suara Chime Booting Masih Terdengar",
            gejala: "Layar gelap total, namun suara chime 'Dong' dan lampu trackpad haptic masih aktif.",
            penyebab: "Jalur tegangan backlight 40V pada flex cable display putus atau IC backlight driver short.",
            solusi: "1. Arahkan lampu senter ke logo Apple di layar untuk memastikan ada bayangan gambar (indikasi backlight mati).\n2. Cek sekering (fuse) backlight pada logic board di dekat konektor display.\n3. Sambung kembali jalur jumper micro-soldering jika ada retakan pada flex cable.",
            komponen: "Kabel Jumper 0.02mm, Fuse Backlight 0402",
            kesulitan: "Mahir",
            waktu: "1-2 Jam",
            sukses: 90
        },
        {
            brand: "Dell",
            model: "Inspiron & Latitude 14 Series",
            kategori: "Motherboard / Power",
            judul: "Pesan Peringatan 'AC Power Adapter Wattage Cannot be Determined'",
            gejala: "Baterai tidak mengisi daya (Plugged in, not charging) dan performa CPU terkunci di clock terendah.",
            penyebab: "Jalur data center pin adaptor (jarum tengah) putus atau DC jack konektor laptop longgar.",
            solusi: "1. Tes adaptor pada laptop lain untuk memastikan jarum sinyal 1-Wire berfungsi.\n2. Ganti modul DC Power Jack kabel internal motherboard.\n3. Periksa resistor 33 ohm di jalur ID pin pada motherboard.",
            komponen: "DC Jack Dell Inspiron, Adaptor Original",
            kesulitan: "Mudah",
            waktu: "30 Menit",
            sukses: 98
        },
        {
            brand: "Acer",
            model: "Aspire 3 & 5 Series",
            kategori: "Layar / Display",
            judul: "Engsel Kanan Retak dan Mengangkat Bezel Layar",
            gejala: "Casing bawah LCD terbuka saat laptop dibuka-tutup, risiko layar panel retak.",
            penyebab: "Dudukan baut kuningan (brass nut inserts) lepas dari bodi plastik casing belakang.",
            solusi: "1. Buka bezel depan secara hati-hati menggunakan pry tool tipis.\n2. Lepaskan panel LCD untuk mengamankan dari tekanan perekat.\n3. Pasang kembali dudukan baut kuningan dengan lem resin epoxy dua komponen.\n4. Kendurkan mur engsel baja 1/4 putaran agar buka-tutup tidak terlalu keras.",
            komponen: "Resin Epoxy, Baut Casing M2.5",
            kesulitan: "Menengah",
            waktu: "1 Jam",
            sukses: 92
        },
        {
            brand: "HP",
            model: "Pavilion & Victus Series",
            kategori: "Keyboard & Touchpad",
            judul: "Tombol Keyboard Acak Mengetik Sendiri (Ghost Typing)",
            gejala: "Karakter tertulis berulang tanpa ditekan, sering terjadi pada tombol Backspace dan Enter.",
            penyebab: "Lapisan membran karbon keyboard lembap atau mengalami korosi akibat kelembapan tinggi.",
            solusi: "1. Buka motherboard dan lepaskan pelat paku keling plastik keyboard.\n2. Ganti modul keyboard tanam dengan modul baru yang kompatibel.\n3. Kunci kembali menggunakan solder plastik atau hot glue berkekuatan tinggi.",
            komponen: "Keyboard Tanam HP Pavilion, Soldering Iron Tip Datar",
            kesulitan: "Mahir",
            waktu: "1.5 Jam",
            sukses: 94
        },
        {
            brand: "MSI",
            model: "Katana & Modern Series",
            kategori: "Motherboard / Power",
            judul: "Laptop Mati Total Akibat Short di Jalur Tegangan 19V Utama",
            gejala: "Adaptor langsung mati proteksi (lampu adaptor redup/mati) saat dicolokkan ke laptop.",
            penyebab: "Kapasitor keramik SMD (MLCC) 19V di dekat IC charger mengalami breakdown dan short ke ground.",
            solusi: "1. Gunakan mode thermal camera atau alkohol isopropil untuk melokalisir komponen yang panas saat diinjeksi 1V 2A.\n2. Lepaskan kapasitor keramik yang short menggunakan solder uap panas.\n3. Ganti dengan kapasitor baru bernilai sama (10uF 25V 0805).\n4. Ukur resistansi jalur VIN ke ground pastikan di atas 100 k-ohm.",
            komponen: "Kapasitor SMD 10uF 25V, Solder Uap, DC Power Supply",
            kesulitan: "Spesialis",
            waktu: "2 Jam",
            sukses: 91
        },
        {
            brand: "Epson",
            model: "EcoTank L3110 / L3210 Series",
            kategori: "Lainnya",
            judul: "Hasil Cetak Bergaris dan Tinta Warna Tidak Mengalir",
            gejala: "Teks terputus-putus dan warna kuning/merah tidak keluar pada saat print test pattern.",
            penyebab: "Gelembung udara terjebak di dalam damper cartridge dan nozzle head kering karena jarang digunakan.",
            solusi: "1. Buka cover atas dan gunakan spuit penyedot tinta untuk menarik udara dari damper hingga tinta penuh.\n2. Lakukan Power Ink Flushing melalui software utility komputer satu kali.\n3. Jika masih tersumbat, lakukan manual flush nozzle menggunakan cairan head cleaner khusus.",
            komponen: "Spuit Damper, Cairan Head Cleaner Epson",
            kesulitan: "Menengah",
            waktu: "40 Menit",
            sukses: 96
        }
    ];

    for (const w of wikiArticles) {
        await prisma.repairWiki.create({
            data: {
                brand_id: brandMap[w.brand] || null,
                merek: w.brand,
                model_seri: w.model,
                kategori: w.kategori,
                judul: w.judul,
                gejala: w.gejala,
                penyebab: w.penyebab,
                solusi_langkah: w.solusi,
                komponen_terkait: w.komponen,
                tingkat_kesulitan: w.kesulitan,
                estimasi_waktu: w.waktu,
                tingkat_sukses: w.sukses,
                user_id: teknisis[0].id
            }
        });
    }

    // 18. Activity Logs (80 Log Aktivitas Realistis Audit Sistem)
    console.log("[SEED] 18. Membuat Log Jejak Audit Aktivitas Pengguna...");
    const actions = [
        "Login sistem admin",
        "Membuat Tiket Servis Baru",
        "Menugaskan Teknisi Spesialis",
        "Menambahkan Hasil Diagnosis Kerusakan",
        "Menambahkan Log Perbaikan dan Foto Dokumentasi",
        "Menambahkan Penggunaan Suku Cadang",
        "Melakukan Restok Suku Cadang dari Supplier",
        "Verifikasi Checklist QC WOW Service 8 Poin",
        "Pembaruan Status Tiket ke Selesai",
        "Pencetakan Faktur Invoice Resmi",
        "Pengajuan Klaim RMA Sparepart ke Distributor",
        "Peminjaman Unit Laptop Cadangan (Loaner)",
        "Penerimaan Pelamar Baru & Input Penilaian KEOS",
        "Kirim WhatsApp Follow-Up CRM Garansi H-3",
        "Kirim WhatsApp Pengingat Perawatan Berkala 6-12 Bulan",
        "Kirim WhatsApp Pengingat Pengambilan Unit Selesai di Rak",
        "Serah Terima Unit ke Pelanggan",
        "Logout sistem"
    ];

    const entities = [
        "Auth", "TiketServis", "Diagnosis", "LogPerbaikan", 
        "Sparepart", "Supplier", "SupplierRma", "LoanerDevice", 
        "Recruitment", "ChecklistQC", "Invoice", "RetensiCRM"
    ];

    for (let i = 0; i < 80; i++) {
        const u = i % 3 === 0 ? admin : (i % 3 === 1 ? admin2 : teknisis[i % teknisis.length]);
        const act = actions[i % actions.length];
        const ent = entities[i % entities.length];
        const logDate = randomDate(new Date(Date.now() - 60 * 86400000), new Date());

        await prisma.activityLog.create({
            data: {
                user_id: u.id,
                user_nama: u.nama,
                action: act,
                entity: ent,
                created_at: logDate
            }
        });
    }

    console.log("\n==========================================================================");
    console.log("[SEED] SEEDING DATA REALISTIS DAN BEBAS DUPLIKASI BERHASIL 100%!");
    console.log(`- Staf / User         : ${await prisma.user.count()} akun`);
    console.log(`- Master Brand        : ${await prisma.brand.count()} merek`);
    console.log(`- Master Supplier     : ${await prisma.supplier.count()} distributor terdaftar`);
    console.log(`- Data Pelanggan      : ${await prisma.customer.count()} orang (lengkap 5 kepribadian)`);
    console.log(`- Perangkat Unit      : ${await prisma.perangkat.count()} unit (laptop, PC, printer)`);
    console.log(`- Katalog Sparepart   : ${await prisma.sparepart.count()} item (lengkap skenario garansi & HPP)`);
    console.log(`- Log Pengadaan Restok: ${await prisma.restockLog.count()} faktur pengadaan`);
    console.log(`- Dokumen SOP Center  : ${await prisma.sopDocument.count()} dokumen SOP standar mutu`);
    console.log(`- Tiket Servis Total  : ${await prisma.tiketServis.count()} tiket`);
    console.log(`  * Aktif/Berjalan    : ${await prisma.tiketServis.count({ where: { status: { notIn: ['selesai', 'diambil', 'dibatalkan'] } } })} tiket`);
    console.log(`  * Selesai di Rak    : ${await prisma.tiketServis.count({ where: { status: 'selesai' } })} tiket (siap uji unclaimed)`);
    console.log(`  * Diambil / Riwayat : ${await prisma.tiketServis.count({ where: { status: 'diambil' } })} tiket (siap uji recall dan garansi)`);
    console.log(`- Unit Loaner Pool    : ${await prisma.loanerDevice.count()} perangkat pinjaman`);
    console.log(`- Peminjaman Loaner   : ${await prisma.loanerRecord.count()} catatan peminjaman`);
    console.log(`- Klaim RMA Distri    : ${await prisma.supplierRma.count()} klaim (tiket, retail & stok toko)`);
    console.log(`- Lowongan Karir      : ${await prisma.jobPosting.count()} posisi rekrutmen`);
    console.log(`- Bank Pelamar        : ${await prisma.applicant.count()} pelamar (rubrik skor KEOS)`);
    console.log(`- Notifikasi & Memo   : ${await prisma.notification.count()} notifikasi`);
    console.log(`- Tanda Tangan Staf   : ${await prisma.staffSignature.count()} tanda tangan digital`);
    console.log(`- Rekam Diagnosis     : ${await prisma.diagnosis.count()} rekam`);
    console.log(`- Log Timeline Servis : ${await prisma.logPerbaikan.count()} timeline`);
    console.log(`- Faktur Invoice      : ${await prisma.invoice.count()} invoice`);
    console.log(`- Pustaka Wiki        : ${await prisma.repairWiki.count()} panduan perbaikan`);
    console.log(`- Jejak Audit Log     : ${await prisma.activityLog.count()} catatan aktivitas`);
    console.log("==========================================================================\n");
}

main()
    .catch((e) => {
        console.error("[SEED] Gagal melakukan seeding data:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
