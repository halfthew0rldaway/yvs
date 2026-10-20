require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { calculateWarrantyExpiry } = require("./src/utils/tiket");

const prisma = new PrismaClient();

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    console.log("[SEED] Memulai proses seeding data komprehensif dan realistis untuk pengujian sistem...");

    // 1. Bersihkan seluruh data lama secara berurutan agar bebas duplikasi dan aman foreign key
    console.log("[SEED] 1. Membersihkan seluruh data lama (Zero Duplicate Guarantee)...");
    await prisma.activityLog.deleteMany();
    await prisma.invoice.deleteMany();
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
    await prisma.brand.deleteMany();
    await prisma.user.deleteMany();

    const defaultPassword = await bcrypt.hash("password123", 10);

    // 2. Buat Staf, Admin, Pimpinan, dan Teknisi Berpengalaman
    console.log("[SEED] 2. Membuat Staf dan Teknisi Spesialis...");
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

    // 4. Data Pelanggan Realistis (35 Orang dengan profil kepribadian beragam)
    console.log("[SEED] 4. Membuat Data Pelanggan dan Profil Kepribadian Komunikasi...");
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

    // 5. Data Perangkat Realistis (62 Unit dengan Serial Number Unik Bebas Duplikasi)
    console.log("[SEED] 5. Membuat Data Perangkat dan Riwayat Multi-Unit...");
    const perangkatDefs = [
        // Pelanggan 0 - Dewi Lestari, S.T.
        { cIdx: 0, jenis: "Laptop", merk: "Lenovo", mod: "ThinkPad X1 Carbon Gen 10", sn: "LENOVO-X1C-G10-001" },
        { cIdx: 0, jenis: "Desktop PC", merk: "Dell", mod: "OptiPlex 7080 Micro", sn: "DELL-OPT7080-002" },
        { cIdx: 0, jenis: "Laptop", merk: "ASUS", mod: "ZenBook 13 OLED UM325", sn: "ASUS-ZB13-UM325-003" },

        // Pelanggan 1 - Kevin Sanjaya
        { cIdx: 1, jenis: "Laptop", merk: "Acer", mod: "Predator Helios 300 PH315", sn: "ACER-HL300-2023-004" },
        { cIdx: 1, jenis: "Desktop PC", merk: "ASUS", mod: "ROG Strix GT15 G15CF Gaming", sn: "ASUS-GT15-GAMING-005" },

        // Pelanggan 2 - Deddy Corbuzier
        { cIdx: 2, jenis: "Laptop", merk: "Dell", mod: "XPS 15 9520 OLED", sn: "DELL-XPS15-9520-006" },
        { cIdx: 2, jenis: "Desktop PC", merk: "Custom Build", mod: "PC Workstation Threadripper 3960X", sn: "CUST-TRIPPER-007" },

        // Pelanggan 3 - Taufik Hidayat
        { cIdx: 3, jenis: "Desktop PC", merk: "HP", mod: "ProDesk 400 G7 SFF Kasir", sn: "HP-PD400-KASIR-008" },
        { cIdx: 3, jenis: "Printer", merk: "Epson", mod: "EcoTank L3210 All-in-One", sn: "EPSON-L3210-009" },

        // Pelanggan 4 - Rian Ardianto
        { cIdx: 4, jenis: "Laptop", merk: "ASUS", mod: "ZenBook 14 OLED UX3402", sn: "ASUS-ZEN14-UX3402-010" },
        { cIdx: 4, jenis: "Laptop", merk: "HP", mod: "Pavilion Aero 13-be0001AU", sn: "HP-AERO13-2022-011" },

        // Pelanggan 5 - Agus Pratama
        { cIdx: 5, jenis: "Laptop", merk: "Lenovo", mod: "ThinkPad T480 Core i5", sn: "LENOVO-T480-2019-012" },

        // Pelanggan 6 - Bambang Soedirman
        { cIdx: 6, jenis: "Laptop", merk: "Dell", mod: "Latitude 5420 Rugged", sn: "DELL-LAT5420-013" },

        // Pelanggan 7 - Siti Nurhaliza
        { cIdx: 7, jenis: "Desktop PC", merk: "HP", mod: "Pavilion Gaming Desktop TG01", sn: "HP-TG01-2024-014" },
        { cIdx: 7, jenis: "Printer", merk: "Canon", mod: "Pixma G2010 Ink Tank", sn: "CANON-G2010-015" },
        { cIdx: 7, jenis: "Laptop", merk: "ASUS", mod: "Vivobook 14 A416MA", sn: "ASUS-VB14-A416-016" },

        // Pelanggan 8 - Agnes Monica
        { cIdx: 8, jenis: "Laptop", merk: "Apple", mod: "MacBook Pro 16 M1 Max", sn: "APPLE-MBP16-MAX-017" },
        { cIdx: 8, jenis: "Laptop", merk: "ASUS", mod: "ROG Zephyrus M16 GU603", sn: "ASUS-ZEPH-M16-018" },

        // Pelanggan 9 - Fitri Carlina
        { cIdx: 9, jenis: "Laptop", merk: "Apple", mod: "MacBook Air M2 13.6-inch", sn: "APPLE-MBA-M2-2022-019" },

        // Pelanggan 10 - Maya Indriati
        { cIdx: 10, jenis: "Laptop", merk: "Acer", mod: "Swift 3 SF314 EVO", sn: "ACER-SWIFT3-EVO-020" },

        // Pelanggan 11 - Nadya Hutagalung
        { cIdx: 11, jenis: "Laptop", merk: "Lenovo", mod: "Yoga Slim 7 Pro 14ACH5", sn: "LENOVO-YOGA7P-021" },

        // Pelanggan 12 - Rina Nose
        { cIdx: 12, jenis: "Laptop", merk: "Dell", mod: "Inspiron 14 5410 2-in-1", sn: "DELL-INS14-5410-022" },

        // Pelanggan 13 - Jessica Mila
        { cIdx: 13, jenis: "Laptop", merk: "ASUS", mod: "ZenBook Duo UX482", sn: "ASUS-DUO-UX482-023" },

        // Pelanggan 14 - Rizky Pratama, M.Kom
        { cIdx: 14, jenis: "Laptop", merk: "ASUS", mod: "ROG Zephyrus G14 GA402", sn: "ASUS-ROG-Z14-2024-024" },
        { cIdx: 14, jenis: "Laptop", merk: "Apple", mod: "MacBook Pro 14 M2 Pro", sn: "APPLE-MBP14-M2-025" },

        // Pelanggan 15 - Hendra Setiawan, IAI
        { cIdx: 15, jenis: "Desktop PC", merk: "Custom Build", mod: "Editing Rig Core i9-12900K + RTX 4070", sn: "CUST-EDIT-4070-026" },
        { cIdx: 15, jenis: "Laptop", merk: "Dell", mod: "Precision 3561 Mobile Workstation", sn: "DELL-PREC3561-027" },

        // Pelanggan 16 - Sri Mulyani, S.E., Ak.
        { cIdx: 16, jenis: "Laptop", merk: "Lenovo", mod: "ThinkPad L14 Gen 2", sn: "LENOVO-L14-G2-028" },
        { cIdx: 16, jenis: "Printer", merk: "HP", mod: "LaserJet Pro M404dn", sn: "HP-LJ-M404-029" },

        // Pelanggan 17 - Chandra Liow
        { cIdx: 17, jenis: "Desktop PC", merk: "Gigabyte", mod: "AORUS Model S Gaming Desktop", sn: "GIGA-AORUS-MODELS-030" },
        { cIdx: 17, jenis: "Desktop PC", merk: "Apple", mod: "Mac Studio M1 Ultra", sn: "APPLE-STUDIO-M1U-031" },

        // Pelanggan 18 - Prof. Ir. Bambang Riyanto
        { cIdx: 18, jenis: "Desktop PC", merk: "Dell", mod: "OptiPlex 5090 Tower", sn: "DELL-OPT5090-032" },
        { cIdx: 18, jenis: "Laptop", merk: "Lenovo", mod: "ThinkPad P1 Gen 4", sn: "LENOVO-P1-G4-033" },

        // Pelanggan 19 - Dian Sastrowardoyo
        { cIdx: 19, jenis: "Laptop", merk: "Apple", mod: "MacBook Air M1 2020", sn: "APPLE-MBA-M1-2020-034" },

        // Pelanggan 20 - Gunawan Wibisono
        { cIdx: 20, jenis: "Laptop", merk: "MSI", mod: "Katana GF66 11UC", sn: "MSI-KATANA-GF66-035" },

        // Pelanggan 21 - Dr. Ahmad Dahlan, Sp.PD
        { cIdx: 21, jenis: "Desktop PC", merk: "Lenovo", mod: "ThinkCentre M70s Gen 3", sn: "LENOVO-M70S-036" },
        { cIdx: 21, jenis: "Laptop", merk: "Dell", mod: "Latitude 7420 Carbon", sn: "DELL-LAT7420-037" },

        // Pelanggan 22 - Raisa Andriana
        { cIdx: 22, jenis: "Desktop PC", merk: "Apple", mod: "iMac 24 M1 4.5K Retina Pink", sn: "APPLE-IMAC24-038" },
        { cIdx: 22, jenis: "Laptop", merk: "HP", mod: "Envy x360 13-bd0062TU", sn: "HP-ENVY13-039" },

        // Pelanggan 23 - Greysia Polii
        { cIdx: 23, jenis: "Laptop", merk: "Acer", mod: "Aspire 5 A514-54G", sn: "ACER-ASP5-A514-040" },

        // Pelanggan 24 - Fajar Alfian
        { cIdx: 24, jenis: "Laptop", merk: "ASUS", mod: "TUF Gaming A15 FA506", sn: "ASUS-TUF-A15-041" },

        // Pelanggan 25 - Siti Badriah
        { cIdx: 25, jenis: "Laptop", merk: "Lenovo", mod: "IdeaPad 3 14ITL05", sn: "LENOVO-IP3-14ITL-042" },
        { cIdx: 25, jenis: "Printer", merk: "Epson", mod: "EcoTank L3110 All-in-One", sn: "EPSON-L3110-043" },

        // Pelanggan 26 - Lukman Hakim
        { cIdx: 26, jenis: "Laptop", merk: "Acer", mod: "Nitro 5 AN515-57", sn: "ACER-NITRO5-044" },

        // Pelanggan 27 - Nurul Hidayati
        { cIdx: 27, jenis: "Laptop", merk: "HP", mod: "14s-cf2017TU Celeron", sn: "HP-14S-CF2017-045" },

        // Pelanggan 28 - Bambang Pamungkas
        { cIdx: 28, jenis: "Laptop", merk: "Lenovo", mod: "Legion 5 Pro 16ACH6H", sn: "LENOVO-L5PRO-046" },

        // Pelanggan 29 - Eko Prasetyo
        { cIdx: 29, jenis: "Laptop", merk: "HP", mod: "Victus Gaming 15-fb0011AX", sn: "HP-VICTUS15-047" },

        // Pelanggan 30 - Wahyu Setiawan
        { cIdx: 30, jenis: "Desktop PC", merk: "Custom Build", mod: "PC Kasir dan Server POS Core i3", sn: "CUST-POS-048" },

        // Pelanggan 31 - Indah Permatasari
        { cIdx: 31, jenis: "Laptop", merk: "Dell", mod: "Vostro 3400 Intel i3", sn: "DELL-VOS3400-049" },

        // Pelanggan 32 - Bayu Skak
        { cIdx: 32, jenis: "Laptop", merk: "MSI", mod: "Modern 14 B11MOU", sn: "MSI-MOD14-050" },

        // Pelanggan 33 - Kusuma Wardani
        { cIdx: 33, jenis: "Desktop PC", merk: "ASUS", mod: "ExpertCenter D5 SFF D500SC", sn: "ASUS-EXPD5-051" },

        // Pelanggan 34 - Hadi Purnomo
        { cIdx: 34, jenis: "Desktop PC", merk: "Lenovo", mod: "IdeaCentre 3 07IAB7", sn: "LENOVO-IC3-052" },

        // Perangkat Historis Tambahan untuk Pengujian Siklus Servis Lama
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

    // 6. Data Sparepart Lengkap (48 Komponen Lengkap dengan HPP & Stok Menipis/Habis untuk Uji Restok)
    console.log("[SEED] 6. Membuat Katalog Sparepart, Stok Logistik dan HPP...");
    const rawSpareparts = [
        // RAM SO-DIMM (Laptop)
        { b: "Kingston", k: "Laptop, AIO", n: "Kingston SO-DIMM DDR4 8GB 3200MHz", stok: 24, hpp: 240000, jual: 320000 },
        { b: "Kingston", k: "Laptop, AIO", n: "Kingston SO-DIMM DDR4 16GB 3200MHz", stok: 18, hpp: 490000, jual: 650000 },
        { b: "Corsair", k: "Laptop, AIO", n: "Corsair Vengeance SO-DIMM DDR4 16GB 3200MHz", stok: 2, hpp: 520000, jual: 690000 }, // Stok Menipis (2)
        { b: "Samsung", k: "Laptop, AIO", n: "Samsung SO-DIMM DDR5 16GB 4800MHz", stok: 1, hpp: 620000, jual: 820000 }, // Stok Menipis (1)
        { b: "Samsung", k: "Laptop, AIO", n: "Samsung SO-DIMM DDR3L 8GB 1600MHz", stok: 10, hpp: 150000, jual: 210000 },

        // RAM DIMM (Desktop)
        { b: "Kingston", k: "Desktop", n: "Kingston FURY Beast DDR4 8GB 3200MHz", stok: 20, hpp: 235000, jual: 310000 },
        { b: "Kingston", k: "Desktop", n: "Kingston FURY Beast DDR4 16GB 3200MHz", stok: 15, hpp: 480000, jual: 640000 },
        { b: "Corsair", k: "Desktop", n: "Corsair Vengeance LPX DDR4 16GB (2x8GB) 3200MHz", stok: 0, hpp: 550000, jual: 740000 }, // Stok Habis (0)
        { b: "Corsair", k: "Desktop", n: "Corsair Vengeance DDR5 32GB (2x16GB) 5600MHz", stok: 6, hpp: 1350000, jual: 1750000 },

        // SSD SATA & NVMe
        { b: "Kingston", k: "Laptop, Desktop, AIO", n: "Kingston A400 SATA 240GB 2.5\"", stok: 35, hpp: 210000, jual: 280000 },
        { b: "Kingston", k: "Laptop, Desktop, AIO", n: "Kingston A400 SATA 480GB 2.5\"", stok: 25, hpp: 340000, jual: 450000 },
        { b: "Western Digital", k: "Laptop, Desktop, AIO", n: "WD Green SATA 240GB 2.5\"", stok: 28, hpp: 220000, jual: 295000 },
        { b: "Western Digital", k: "Laptop, Desktop, AIO", n: "WD Blue SATA 500GB 2.5\"", stok: 14, hpp: 450000, jual: 580000 },
        { b: "Samsung", k: "Laptop, Desktop, AIO", n: "Samsung 870 EVO SATA 500GB", stok: 10, hpp: 680000, jual: 850000 },
        { b: "Kingston", k: "Laptop, Desktop", n: "Kingston NV3 PCIe 4.0 NVMe 500GB", stok: 22, hpp: 450000, jual: 590000 },
        { b: "Kingston", k: "Laptop, Desktop", n: "Kingston NV3 PCIe 4.0 NVMe 1TB", stok: 16, hpp: 820000, jual: 1050000 },
        { b: "Western Digital", k: "Laptop, Desktop", n: "WD Blue SN580 PCIe 4.0 NVMe 1TB", stok: 12, hpp: 860000, jual: 1100000 },
        { b: "Samsung", k: "Laptop, Desktop", n: "Samsung 980 NVMe M.2 500GB", stok: 8, hpp: 620000, jual: 790000 },

        // Laptop Battery
        { b: "ASUS", k: "Laptop", n: "Baterai ASUS X441 Original (A31N1601)", stok: 8, hpp: 260000, jual: 350000 },
        { b: "ASUS", k: "Laptop", n: "Baterai ASUS TUF Gaming FX505 (B31N1726)", stok: 2, hpp: 320000, jual: 440000 }, // Stok Menipis (2)
        { b: "Lenovo", k: "Laptop", n: "Baterai Lenovo IdeaPad 320 / 330 (L16M2PB1)", stok: 10, hpp: 270000, jual: 360000 },
        { b: "Lenovo", k: "Laptop", n: "Baterai Lenovo ThinkPad T480 / T470 External", stok: 5, hpp: 340000, jual: 460000 },
        { b: "Acer", k: "Laptop", n: "Baterai Acer Aspire 3 / 5 (AP16M5J)", stok: 7, hpp: 250000, jual: 330000 },
        { b: "HP", k: "Laptop", n: "Baterai HP 14s / 15s (HT03XL Original)", stok: 9, hpp: 280000, jual: 380000 },
        { b: "Dell", k: "Laptop", n: "Baterai Dell Inspiron 14 5400 / 5410", stok: 1, hpp: 310000, jual: 420000 }, // Stok Menipis (1)

        // Laptop Charger / Adaptor
        { b: "ASUS", k: "Laptop", n: "Charger ASUS 19V 3.42A 65W Original (4.5x3.0mm)", stok: 15, hpp: 180000, jual: 250000 },
        { b: "Lenovo", k: "Laptop", n: "Charger Lenovo 20V 3.25A 65W Slim Tip", stok: 18, hpp: 175000, jual: 240000 },
        { b: "HP", k: "Laptop", n: "Charger HP 19.5V 3.33A 65W Blue Tip", stok: 14, hpp: 175000, jual: 240000 },
        { b: "Dell", k: "Laptop", n: "Charger Dell 19.5V 3.34A 65W Small Pin", stok: 8, hpp: 190000, jual: 260000 },
        { b: "Lainnya", k: "Laptop", n: "Universal USB Type-C GaN Charger 65W PD Fast Charging", stok: 0, hpp: 210000, jual: 295000 }, // Stok Habis (0)

        // Keyboard & Touchpad
        { b: "ASUS", k: "Laptop", n: "Keyboard ASUS Vivobook A416 / A516 US Layout", stok: 12, hpp: 120000, jual: 175000 },
        { b: "Lenovo", k: "Laptop", n: "Keyboard Lenovo IdeaPad 3 14ITL05 Backlight", stok: 10, hpp: 140000, jual: 200000 },
        { b: "Acer", k: "Laptop", n: "Keyboard Acer Aspire 3 A314", stok: 8, hpp: 110000, jual: 160000 },

        // LCD Panel
        { b: "Lainnya", k: "Laptop", n: "LCD 14.0\" Slim 30 Pin HD (1366x768)", stok: 12, hpp: 580000, jual: 750000 },
        { b: "Lainnya", k: "Laptop", n: "LCD 14.0\" Slim 30 Pin FHD IPS (1920x1080)", stok: 10, hpp: 720000, jual: 920000 },
        { b: "Lainnya", k: "Laptop", n: "LCD 15.6\" Slim 30 Pin FHD IPS 144Hz Gaming", stok: 6, hpp: 950000, jual: 1250000 },

        // Thermal Paste & Cooling
        { b: "Lainnya", k: "Laptop, Desktop, AIO", n: "Thermal Paste Arctic MX-4 4g High Performance", stok: 30, hpp: 85000, jual: 125000 },
        { b: "Lainnya", k: "Laptop, Desktop, AIO", n: "Thermal Grizzly Kryonaut 1g Extreme Paste", stok: 3, hpp: 110000, jual: 160000 }, // Stok Menipis (3)
        { b: "Lainnya", k: "Laptop, Desktop, AIO", n: "DeepCool GAMMAXX 400 V2 Tower Cooler", stok: 8, hpp: 210000, jual: 285000 },

        // PSU Desktop
        { b: "Corsair", k: "Desktop", n: "Power Supply Corsair CV550 550W 80+ Bronze", stok: 7, hpp: 620000, jual: 790000 },
        { b: "Corsair", k: "Desktop", n: "Power Supply Corsair CV650 650W 80+ Bronze", stok: 5, hpp: 760000, jual: 950000 },

        // Printer Parts
        { b: "Epson", k: "Printer", n: "Pickup Roller Kit Epson L3110 / L3210 Original", stok: 15, hpp: 55000, jual: 85000 },
        { b: "Epson", k: "Printer", n: "Waste Ink Pad Sponge Epson L3110 / L3210", stok: 25, hpp: 25000, jual: 45000 },
        { b: "Canon", k: "Printer", n: "Cartridge Canon PG-810 Black Original", stok: 10, hpp: 215000, jual: 275000 },
        { b: "Canon", k: "Printer", n: "Cartridge Canon CL-811 Color Original", stok: 8, hpp: 245000, jual: 315000 },

        // Accessories & Peripherals
        { b: "Logitech", k: "Aksesoris", n: "Logitech B100 USB Optical Mouse", stok: 30, hpp: 45000, jual: 65000 },
        { b: "Logitech", k: "Aksesoris", n: "Logitech M170 Wireless Mouse", stok: 20, hpp: 105000, jual: 145000 },
        { b: "Logitech", k: "Aksesoris", n: "Logitech K120 USB Keyboard", stok: 18, hpp: 85000, jual: 115000 }
    ];

    const spareparts = [];
    for (const sp of rawSpareparts) {
        const item = await prisma.sparepart.create({
            data: {
                brand_id: brandMap[sp.b] || null,
                kategori: sp.k,
                nama: sp.n,
                stok: sp.stok,
                harga_beli: sp.hpp,
                harga: sp.jual
            }
        });
        spareparts.push(item);
    }

    // 7. Riwayat Log Pengadaan & Restok Suku Cadang (45 Catatan Realistis)
    console.log("[SEED] 7. Membuat Log Riwayat Pengadaan dan Restok Suku Cadang...");
    const suppliers = [
        "PT Nusantara Jaya Komputer (Glodok)",
        "CV Bintang Elektronik Mangga Dua",
        "PT Surya Mega Pratama (Surabaya)",
        "Distributor Resmi Kingston Indonesia",
        "Master Sparepart Bandung",
        "PT Prima Datindo Sentosa",
        "Gudang Komputer Mangga Dua"
    ];

    const invoiceSuppliers = [
        "INV-NJK/2026/012", "FAK-BEG-4421", "SMP-NOTA-8812", "DKI-PO-1102", 
        "MSB-FAK-9901", "PDS-INV-2026-04", "GKM-PO-3321", "INV-NJK/2026/045"
    ];

    for (let i = 0; i < 45; i++) {
        const targetPart = spareparts[i % spareparts.length];
        const supplier = suppliers[i % suppliers.length];
        const noFaktur = invoiceSuppliers[i % invoiceSuppliers.length];
        const qty = 5 + (i % 15);
        const tgl = randomDate(new Date(Date.now() - 120 * 86400000), new Date(Date.now() - 2 * 86400000));
        const adminUser = i % 2 === 0 ? admin : admin2;

        await prisma.restockLog.create({
            data: {
                sparepart_id: targetPart.id,
                supplier_nama: supplier,
                jumlah_masuk: qty,
                harga_beli_pcs: targetPart.harga_beli,
                nomor_faktur: noFaktur,
                tanggal_beli: tgl,
                catatan: `Restok ${qty} pcs ${targetPart.nama} dari ${supplier}. Barang baru, garansi distributor resmi.`,
                user_id: adminUser.id,
                user_nama: adminUser.nama,
                created_at: tgl
            }
        });
    }

    // 8. Template Data Keluhan & Kelengkapan
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

    // 9. Konfigurasi 110+ Tiket Servis Komprehensif untuk Simulasi & Uji Fitur CRM
    console.log("[SEED] 8. Membuat 110+ Tiket Servis, Rekam Medis, Diagnosis, QC dan CRM Terpadu...");

    const ticketConfigs = [
        // =========================================================================================
        // KELOMPOK 1: TAB 1 RETENSI CRM - PERAWATAN BERKALA (6-11 BULAN LALU / 185 - 340 HARI LALU) (15 TIKET)
        // =========================================================================================
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

        // =========================================================================================
        // KELOMPOK 2: TAB 1 RETENSI CRM - PERAWATAN BERKALA KRITIS (≥ 12 BULAN / 1 TAHUN - 2.5 TAHUN LALU) (15 TIKET)
        // =========================================================================================
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

        // =========================================================================================
        // KELOMPOK 3: TAB 2 RETENSI CRM - UNIT SELESAI BELUM DIAMBIL (UNCLAIMED AGING) (18 TIKET)
        // =========================================================================================
        // A. Baru Selesai (< 14 Hari)
        { status: "selesai", pIdx: 2, tIdx: 0, year: 2026, unclaimedDaysAgo: 3, prioritas: "Standar", qcPassed: true, remSent: 0, katTips: "SSD / Storage", keluhan: "Ganti SSD SATA 480GB dan instalasi ulang Windows 11 Home original." },
        { status: "selesai", pIdx: 8, tIdx: 1, year: 2026, unclaimedDaysAgo: 5, prioritas: "Cepat Selesai", qcPassed: true, remSent: 0, katTips: "Baterai", keluhan: "Penggantian baterai original ASUS TUF Gaming dan kalibrasi daya." },
        { status: "selesai", pIdx: 14, tIdx: 2, year: 2026, unclaimedDaysAgo: 7, prioritas: "Data Aman", qcPassed: true, remSent: 0, katTips: "Pembersihan & Thermal Paste", keluhan: "Deep cleaning kipas ganda dan repaste Thermal Grizzly Kryonaut." },
        { status: "selesai", pIdx: 18, tIdx: 3, year: 2026, unclaimedDaysAgo: 10, prioritas: "Biaya Hemat", qcPassed: true, remSent: 0, katTips: "Software / OS", keluhan: "Perbaikan sistem boot Windows yang loop recovery dan update driver." },

        // B. Menumpuk di Rak (≥ 14 Hari / 15 - 28 Hari Lalu)
        { status: "selesai", pIdx: 9, tIdx: 4, year: 2026, unclaimedDaysAgo: 16, prioritas: "Cepat Selesai", qcPassed: true, remSent: 1, katTips: "Layar / LCD", keluhan: "Penggantian panel LCD 14.0 inch FHD IPS karena retak terbentur." },
        { status: "selesai", pIdx: 15, tIdx: 5, year: 2026, unclaimedDaysAgo: 18, prioritas: "Standar", qcPassed: true, remSent: 1, katTips: "Printer", keluhan: "Penggantian pickup roller kit Canon G2010 dan pembersihan head printer." },
        { status: "selesai", pIdx: 23, tIdx: 0, year: 2026, unclaimedDaysAgo: 21, prioritas: "Data Aman", qcPassed: true, remSent: 0, katTips: "Keyboard & Touchpad", keluhan: "Penggantian modul keyboard tanam ASUS Vivobook A416 akibat tuts spasi macet." },
        { status: "selesai", pIdx: 26, tIdx: 1, year: 2026, unclaimedDaysAgo: 25, prioritas: "Biaya Hemat", qcPassed: true, remSent: 1, katTips: "Baterai", keluhan: "Ganti baterai Lenovo ThinkPad internal dan uji ketahanan baterai 3 jam." },

        // C. Perhatian (≥ 30 Hari / 1 Bulan Selesai: 32 - 55 Hari Lalu)
        { status: "selesai", pIdx: 5, tIdx: 2, year: 2026, unclaimedDaysAgo: 34, prioritas: "Standar", qcPassed: true, remSent: 1, katTips: "SSD / Storage", keluhan: "Upgrade SSD NVMe Kingston 1TB dan migrasi data skripsi mahasiswa." },
        { status: "selesai", pIdx: 29, tIdx: 3, year: 2026, unclaimedDaysAgo: 40, prioritas: "Cepat Selesai", qcPassed: true, remSent: 1, katTips: "Hardware & Motherboard", keluhan: "Perbaikan jalur charging Type-C MacBook Air M1 yang longgar." },
        { status: "selesai", pIdx: 31, tIdx: 4, year: 2026, unclaimedDaysAgo: 46, prioritas: "Biaya Hemat", qcPassed: true, remSent: 2, katTips: "Power Supply", keluhan: "Ganti power supply Corsair CV550 550W Bronze pada PC Desktop editing." },
        { status: "selesai", pIdx: 33, tIdx: 5, year: 2026, unclaimedDaysAgo: 52, prioritas: "Data Aman", qcPassed: true, remSent: 1, katTips: "Pembersihan & Thermal Paste", keluhan: "Overhaul sistem pendingin dan pembersihan debu casing workstation studio." },

        // D. Peringatan (≥ 60 Hari / 2 Bulan Selesai: 62 - 85 Hari Lalu)
        { status: "selesai", pIdx: 35, tIdx: 0, year: 2026, unclaimedDaysAgo: 64, prioritas: "Standar", qcPassed: true, remSent: 2, katTips: "Engsel & Casing", keluhan: "Rekonstruksi engsel bodi kanan Lenovo ThinkPad dengan resin epoxy." },
        { status: "selesai", pIdx: 38, tIdx: 1, year: 2026, unclaimedDaysAgo: 73, prioritas: "Biaya Hemat", qcPassed: true, remSent: 2, katTips: "Charger / Adaptor", keluhan: "Ganti kabel DC power jack laptop Dell Inspiron yang putus di bagian pangkal." },
        { status: "selesai", pIdx: 41, tIdx: 2, year: 2026, unclaimedDaysAgo: 82, prioritas: "Cepat Selesai", qcPassed: true, remSent: 2, katTips: "Hardware & Motherboard", keluhan: "Servis jalur 19V short circuit akibat cairan kopi dan pembersihan motherboard." },

        // E. Kritis Penyimpanan Bengkel (≥ 90 Hari / 3+ Bulan Selesai: 95 - 135 Hari Lalu)
        { status: "selesai", pIdx: 43, tIdx: 3, year: 2026, unclaimedDaysAgo: 96, prioritas: "Biaya Hemat", qcPassed: true, remSent: 3, katTips: "Printer", keluhan: "Servis waste ink pad sponge penuh pada Epson L3210 dan reset counter." },
        { status: "selesai", pIdx: 46, tIdx: 4, year: 2026, unclaimedDaysAgo: 112, prioritas: "Standar", qcPassed: true, remSent: 3, katTips: "PC Kasir", keluhan: "Ganti RAM DDR4 8GB dan cleaning PC kasir toko ritel." },
        { status: "selesai", pIdx: 49, tIdx: 5, year: 2026, unclaimedDaysAgo: 135, prioritas: "Data Aman", qcPassed: true, remSent: 3, katTips: "Software / OS", keluhan: "Instalasi ulang sistem operasi POS kasir dan setting printer thermal." },

        // =========================================================================================
        // KELOMPOK 4: TAB 3 RETENSI CRM - EVALUASI GARANSI H-7 EXPIRING (12 TIKET)
        // =========================================================================================
        // H-1 (Sisa 1 Hari)
        { status: "diambil", pIdx: 8, tIdx: 0, year: 2026, warrantyDaysLeft: 1, durasiGaransi: "1 Bulan", katTips: "SSD / Storage", prioritas: "Standar", remSent: 0, keluhan: "Pemasangan SSD NVMe 500GB untuk laptop kerja mobile harian." },
        { status: "diambil", pIdx: 36, tIdx: 1, year: 2026, warrantyDaysLeft: 1, durasiGaransi: "1 Bulan", katTips: "Pembersihan & Thermal Paste", prioritas: "Data Aman", remSent: 1, keluhan: "Servis berkala deep clean dan ganti thermal paste laptop dokter RS." },

        // H-2 (Sisa 2 Hari)
        { status: "diambil", pIdx: 1, tIdx: 2, year: 2026, warrantyDaysLeft: 2, durasiGaransi: "1 Bulan", katTips: "Pembersihan & Thermal Paste", prioritas: "Cepat Selesai", remSent: 0, keluhan: "Penggantian pasta termal pendingin CPU dan fan cleaning laptop kantor." },
        { status: "diambil", pIdx: 14, tIdx: 3, year: 2026, warrantyDaysLeft: 2, durasiGaransi: "1 Bulan", katTips: "Hardware & Motherboard", prioritas: "Standar", remSent: 1, keluhan: "Perbaikan IC charging controller dan pengecekan jalur tegangan 5V USB." },

        // H-3 (Sisa 3 Hari)
        { status: "diambil", pIdx: 3, tIdx: 4, year: 2026, warrantyDaysLeft: 3, durasiGaransi: "1 Bulan", katTips: "Baterai", prioritas: "Standar", remSent: 0, keluhan: "Penggantian baterai baru original HP Pavilion dan uji siklus pengisian." },
        { status: "diambil", pIdx: 24, tIdx: 5, year: 2026, warrantyDaysLeft: 3, durasiGaransi: "1 Bulan", katTips: "Layar / LCD", prioritas: "Data Aman", remSent: 0, keluhan: "Ganti panel layar LCD 14 inch IPS FHD anti-glare bebas dead pixel." },

        // H-4 (Sisa 4 Hari)
        { status: "diambil", pIdx: 10, tIdx: 0, year: 2026, warrantyDaysLeft: 4, durasiGaransi: "1 Bulan", katTips: "SSD / Storage", prioritas: "Biaya Hemat", remSent: 0, keluhan: "Upgrade penyimpanan SSD 256GB ke 512GB Kingston NVMe PCIe 4.0." },
        { status: "diambil", pIdx: 17, tIdx: 1, year: 2026, warrantyDaysLeft: 4, durasiGaransi: "1 Bulan", katTips: "Pembersihan & Thermal Paste", prioritas: "Cepat Selesai", remSent: 0, keluhan: "Repaste thermal pasta Arctic MX-4 dan pembersihan sirip pendingin GPU." },

        // H-5 (Sisa 5 Hari)
        { status: "diambil", pIdx: 19, tIdx: 2, year: 2026, warrantyDaysLeft: 5, durasiGaransi: "1 Bulan", katTips: "Keyboard & Touchpad", prioritas: "Standar", remSent: 0, keluhan: "Penggantian tuts keyboard yang macet dan tes fungsional semua tombol." },
        { status: "diambil", pIdx: 26, tIdx: 3, year: 2026, warrantyDaysLeft: 5, durasiGaransi: "1 Bulan", katTips: "Pembersihan & Thermal Paste", prioritas: "Data Aman", remSent: 0, keluhan: "Pembersihan debu kipas dan heatsink laptop presentasi modul klinik." },

        // H-6 (Sisa 6 Hari)
        { status: "diambil", pIdx: 27, tIdx: 4, year: 2026, warrantyDaysLeft: 6, durasiGaransi: "1 Bulan", katTips: "Baterai", prioritas: "Biaya Hemat", remSent: 0, keluhan: "Penggantian baterai laptop Acer Aspire 3 dan kalibrasi sistem operasi." },

        // H-7 (Sisa 7 Hari)
        { status: "diambil", pIdx: 38, tIdx: 5, year: 2026, warrantyDaysLeft: 7, durasiGaransi: "1 Bulan", katTips: "Printer", prioritas: "Standar", remSent: 0, keluhan: "Servis head printer Epson L3110 tersumbat dan pembersihan pipa tinta." },

        // =========================================================================================
        // KELOMPOK 5: TIKET AKTIF DALAM PROSES PENGERJAAN HARIAN (26 TIKET)
        // =========================================================================================
        // A. Diterima (6 Tiket: antrean baru masuk)
        { status: "diterima", pIdx: 0, tIdx: null, year: 2026, daysAgo: 1, prioritas: "Standar", kunci: "PIN", pin: "123456", clean: "Kotor", sla: "reguler", keluhan: "Laptop mati mendadak saat dipakai kerja spreadsheet, lampu adaptor menyala normal." },
        { status: "diterima", pIdx: 1, tIdx: null, year: 2026, daysAgo: 1, prioritas: "Cepat Selesai", kunci: "Password", pin: "admin2026", clean: "Bersih", sla: "express", keluhan: "PC Gaming tidak tampil ke layar monitor (no display), kipas casing berputar kencang." },
        { status: "diterima", pIdx: 2, tIdx: 0, year: 2026, daysAgo: 2, prioritas: "Data Aman", kunci: "Tidak Ada", pin: "", clean: "Ada yang Rusak", sla: "reguler", keluhan: "Bodi casing engsel terangkat dan baut dudukan engsel bawah terlepas." },
        { status: "diterima", pIdx: 3, tIdx: 1, year: 2026, daysAgo: 2, prioritas: "Biaya Hemat", kunci: "PIN", pin: "0852", clean: "Kotor", sla: "reguler", keluhan: "Hasil cetak printer printer Epson bergaris-garis pada warna hitam dan biru." },
        { status: "diterima", pIdx: 4, tIdx: null, year: 2026, daysAgo: 3, prioritas: "Standar", kunci: "Pola Kunci", pin: "Pola Huruf Z", clean: "Bersih", sla: "reguler", keluhan: "Laptop sangat lambat saat membuka file PDF berukuran besar dan sering not responding." },
        { status: "diterima", pIdx: 7, tIdx: 2, year: 2026, daysAgo: 1, prioritas: "Cepat Selesai", kunci: "Password", pin: "siti*123", clean: "Bersih", sla: "express", keluhan: "Adaptor laptop dicolok tidak mengisi daya, indikator baterai silang merah." },

        // B. Didiagnosis (5 Tiket: teknisi sedang menganalisa hardware)
        { status: "didiagnosis", pIdx: 11, tIdx: 3, year: 2026, daysAgo: 2, prioritas: "Cepat Selesai", kunci: "PIN", pin: "9988", clean: "Kotor", sla: "reguler", keluhan: "Touchpad tidak bisa diklik kiri dan kursor sering melompat ke sudut layar." },
        { status: "didiagnosis", pIdx: 12, tIdx: 4, year: 2026, daysAgo: 3, prioritas: "Standar", kunci: "Password", pin: "rahasia123", clean: "Bersih", sla: "reguler", keluhan: "Layar monitor berkedip jika sudut kemiringan layar diubah di atas 90 derajat." },
        { status: "didiagnosis", pIdx: 13, tIdx: 5, year: 2026, daysAgo: 3, prioritas: "Biaya Hemat", kunci: "Tidak Ada", pin: "", clean: "Bersih", sla: "reguler", keluhan: "Sering restart sendiri dengan pesan error MEMORY_MANAGEMENT saat dipakai zoom meeting." },
        { status: "didiagnosis", pIdx: 15, tIdx: 0, year: 2026, daysAgo: 4, prioritas: "Data Aman", kunci: "PIN", pin: "1122", clean: "Ada yang Rusak", sla: "reguler", keluhan: "Motherboard terindikasi korosi ringan di jalur daya setelah terkena uap ruangan lembap." },
        { status: "didiagnosis", pIdx: 17, tIdx: 1, year: 2026, daysAgo: 2, prioritas: "Cepat Selesai", kunci: "Password", pin: "gaming!7", clean: "Bersih", sla: "express", slaWarning: true, keluhan: "PC Desktop editing video mati total setelah listrik rumah padam mendadak." },

        // C. Menunggu Persetujuan (5 Tiket: proposal biaya siap diforward via WhatsApp)
        { status: "menunggu_persetujuan", pIdx: 20, tIdx: 2, year: 2026, daysAgo: 5, prioritas: "Cepat Selesai", kunci: "PIN", pin: "1945", clean: "Bersih", sla: "reguler", keluhan: "Butuh penggantian baterai original dan instalasi SSD NVMe 1TB." },
        { status: "menunggu_persetujuan", pIdx: 21, tIdx: 3, year: 2026, daysAgo: 6, prioritas: "Data Aman", kunci: "Password", pin: "bintang*", clean: "Kotor", sla: "reguler", keluhan: "Panel layar LCD MacBook retak internal, butuh persetujuan estimasi harga modul LCD." },
        { status: "menunggu_persetujuan", pIdx: 22, tIdx: 4, year: 2026, daysAgo: 4, prioritas: "Standar", kunci: "Tidak Ada", pin: "", clean: "Bersih", sla: "reguler", keluhan: "Penggantian satu set kipas CPU dan GPU laptop ASUS ROG Zephyrus." },
        { status: "menunggu_persetujuan", pIdx: 25, tIdx: 5, year: 2026, daysAgo: 6, prioritas: "Biaya Hemat", kunci: "PIN", pin: "2024", clean: "Kotor", sla: "reguler", keluhan: "Keyboard tanam tuts Enter dan Backspace mati, butuh persetujuan penggantian modul." },
        { status: "menunggu_persetujuan", pIdx: 27, tIdx: 0, year: 2026, daysAgo: 5, prioritas: "Standar", kunci: "Pola Kunci", pin: "Pola Kotak", clean: "Bersih", sla: "reguler", keluhan: "Ganti adaptor original 65W Blue Tip dan servis soket charging internal." },

        // D. Disetujui (4 Tiket: pelanggan deal, siap mulai dirakit/diperbaiki)
        { status: "disetujui", pIdx: 28, tIdx: 1, year: 2026, daysAgo: 6, prioritas: "Standar", kunci: "PIN", pin: "0000", clean: "Bersih", sla: "reguler", keluhan: "Pelanggan menyetujui penggantian SSD NVMe Kingston 500GB dan cleaning sirkulasi kipas." },
        { status: "disetujui", pIdx: 30, tIdx: 2, year: 2026, daysAgo: 7, prioritas: "Data Aman", kunci: "Password", pin: "pass!99", clean: "Bersih", sla: "reguler", keluhan: "Pelanggan setuju penggantian RAM SO-DIMM DDR4 16GB untuk laptop arsitek." },
        { status: "disetujui", pIdx: 32, tIdx: 3, year: 2026, daysAgo: 5, prioritas: "Cepat Selesai", kunci: "Tidak Ada", pin: "", clean: "Ada yang Rusak", sla: "reguler", keluhan: "Pelanggan setuju perbaikan casing engsel retak dan ganti pasta termal pendingin." },
        { status: "disetujui", pIdx: 34, tIdx: 4, year: 2026, daysAgo: 8, prioritas: "Biaya Hemat", kunci: "PIN", pin: "5566", clean: "Kotor", sla: "reguler", keluhan: "Pelanggan menyetujui paket deep clean internal dan ganti kipas pendingin processor." },

        // E. Dalam Perbaikan (6 Tiket: proses solder, perakitan, dan pengujian beban aktif)
        { status: "dalam_perbaikan", pIdx: 37, tIdx: 5, year: 2026, daysAgo: 8, prioritas: "Standar", kunci: "PIN", pin: "7788", clean: "Bersih", sla: "reguler", qcPassed: false, keluhan: "Proses pemasangan modul keyboard tanam baru dan pengetesan ketahanan jalur." },
        { status: "dalam_perbaikan", pIdx: 39, tIdx: 0, year: 2026, daysAgo: 9, prioritas: "Cepat Selesai", kunci: "Password", pin: "kantor24", clean: "Kotor", sla: "reguler", qcPassed: false, keluhan: "Pemasangan SSD baru dan transfer seluruh data dokumen kantor tanpa format ulang." },
        { status: "dalam_perbaikan", pIdx: 42, tIdx: 1, year: 2026, daysAgo: 7, prioritas: "Data Aman", kunci: "PIN", pin: "4433", clean: "Bersih", sla: "reguler", qcPassed: false, keluhan: "Sedang dilakukan re-soldering jalur power jack DC dan pengetesan tegangan charger." },
        { status: "dalam_perbaikan", pIdx: 44, tIdx: 2, year: 2026, daysAgo: 10, prioritas: "Biaya Hemat", kunci: "Tidak Ada", pin: "", clean: "Ada yang Rusak", sla: "reguler", qcPassed: false, keluhan: "Perekatan dudukan baut kuningan casing dengan lem epoxy dua komponen dan pengeringan." },
        { status: "dalam_perbaikan", pIdx: 47, tIdx: 3, year: 2026, daysAgo: 7, prioritas: "Standar", kunci: "PIN", pin: "1212", clean: "Bersih", sla: "express", isOverdue: true, qcPassed: false, keluhan: "Perakitan heatsink laptop express dan pengujian stress-test temperatur CPU selama 1 jam." },
        { status: "dalam_perbaikan", pIdx: 51, tIdx: 4, year: 2026, daysAgo: 8, prioritas: "Cepat Selesai", kunci: "Password", pin: "desain01", clean: "Kotor", sla: "express", isOverdue: true, qcPassed: false, keluhan: "Penyolderan fuse backlight layar MacBook dan pengujian tegangan output 40V." },

        // =========================================================================================
        // KELOMPOK 6: TIKET DIBATALKAN (4 TIKET)
        // =========================================================================================
        { status: "dibatalkan", pIdx: 52, tIdx: 0, year: 2026, daysAgo: 15, prioritas: "Biaya Hemat", kunci: "PIN", pin: "9900", clean: "Pecah", keluhan: "Pelanggan membatalkan perbaikan karena biaya penggantian motherboard baru melebihi anggaran unit." },
        { status: "dibatalkan", pIdx: 53, tIdx: 1, year: 2026, daysAgo: 20, prioritas: "Standar", kunci: "Tidak Ada", pin: "", clean: "Ada yang Rusak", keluhan: "Part pengganti LCD untuk model langka ini membutuhkan waktu inden lebih dari 1 bulan dari luar negeri." },
        { status: "dibatalkan", pIdx: 54, tIdx: 2, year: 2026, daysAgo: 25, prioritas: "Data Aman", kunci: "Tidak Ada", pin: "", clean: "Kotor", keluhan: "Pelanggan memutuskan untuk membeli laptop baru dan mengambil kembali unit lama tanpa pengerjaan lanjutan." },
        { status: "dibatalkan", pIdx: 55, tIdx: 3, year: 2026, daysAgo: 30, prioritas: "Biaya Hemat", kunci: "PIN", pin: "1234", clean: "Ada yang Rusak", keluhan: "Kerusakan chipset prosesor tertanam (BGA short), pelanggan memilih tidak melanjutkan perbaikan." }
    ];

    const createdTickets = [];

    for (let i = 0; i < ticketConfigs.length; i++) {
        const cfg = ticketConfigs[i];
        const perangkat = perangkats[cfg.pIdx % perangkats.length];
        const teknisi = cfg.tIdx !== null ? teknisis[cfg.tIdx % teknisis.length] : null;

        // Hitung tanggal dinamis yang realistis dan kronologis
        let createdAt, completedAt = null, tglDiambil = null, garansiBerakhirAt = null;

        if (cfg.warrantyDaysLeft !== undefined) {
            // Garansi H-X yang sedang berjalan
            garansiBerakhirAt = new Date(Date.now() + cfg.warrantyDaysLeft * 86400000);
            tglDiambil = new Date(garansiBerakhirAt.getTime() - 30 * 86400000);
            completedAt = new Date(tglDiambil.getTime() - 1 * 86400000);
            createdAt = new Date(completedAt.getTime() - 3 * 86400000);
        } else if (cfg.takenMonthsAgo !== undefined) {
            // Servis berkala lama (6-26 bulan lalu)
            tglDiambil = new Date(Date.now() - (cfg.takenMonthsAgo * 30 + 5) * 86400000);
            completedAt = new Date(tglDiambil.getTime() - 2 * 86400000);
            createdAt = new Date(completedAt.getTime() - 4 * 86400000);
            garansiBerakhirAt = calculateWarrantyExpiry(tglDiambil, cfg.durasiGaransi || "1 Bulan");
        } else if (cfg.unclaimedDaysAgo !== undefined) {
            // Unit selesai belum diambil (unclaimed aging)
            completedAt = new Date(Date.now() - cfg.unclaimedDaysAgo * 86400000);
            createdAt = new Date(completedAt.getTime() - 4 * 86400000);
            tglDiambil = null;
            garansiBerakhirAt = null;
        } else {
            // Tiket aktif atau dibatalkan
            createdAt = new Date(Date.now() - (cfg.daysAgo || 3) * 86400000);
            if (cfg.status === "selesai") {
                completedAt = new Date(Date.now() - 2 * 86400000);
            }
        }

        // Intake Inspection Checklist (15 Poin)
        const checklist_intake = {
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

        // 8-Point WOW Quality Control Handover Inspection
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

        // Visual Defect Map Sample (titik cacat baret/dent fisik pada beberapa tiket)
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

        // SLA Dual-Phase Target & Approval Calculation
        let slaPaket = cfg.sla || "reguler";
        let targetPengecekanAt = null;
        let disetujuiAt = null;
        let targetSelesaiAt = null;

        if (cfg.status === "diterima" || cfg.status === "didiagnosis") {
            // Fase 1: Pengecekan aktif
            if (cfg.sla === "express" && cfg.isOverdue) {
                targetPengecekanAt = new Date(Date.now() - 2 * 3600000); // Overdue pengecekan 2 jam lalu
            } else if (cfg.sla === "express" && cfg.slaWarning) {
                targetPengecekanAt = new Date(Date.now() + 1 * 3600000); // Warning tersisa 1 jam
            } else if (cfg.sla === "express") {
                targetPengecekanAt = new Date(createdAt.getTime() + 4 * 3600000);
            } else {
                targetPengecekanAt = new Date(createdAt.getTime() + 24 * 3600000);
            }
            disetujuiAt = null;
            targetSelesaiAt = null;
        } else if (cfg.status === "menunggu_persetujuan") {
            // Fase 2: Pengecekan selesai, unit IDLE menunggu ACC penawaran customer (SLA Servis PAUSED)
            targetPengecekanAt = new Date(createdAt.getTime() + (cfg.sla === "express" ? 3 : 16) * 3600000);
            disetujuiAt = null;
            targetSelesaiAt = null;
        } else if (cfg.status === "disetujui" || cfg.status === "dalam_perbaikan") {
            // Fase 3: Pengecekan selesai, customer ACC, pengerjaan servis fisik dimulai
            targetPengecekanAt = new Date(createdAt.getTime() + (cfg.sla === "express" ? 3 : 16) * 3600000);
            disetujuiAt = new Date(Date.now() - (cfg.daysAgo ? cfg.daysAgo * 0.4 * 86400000 : 12 * 3600000));
            if (cfg.sla === "express" && cfg.isOverdue) {
                targetSelesaiAt = new Date(Date.now() - 3 * 3600000); // Overdue pengerjaan 3 jam lalu
            } else if (cfg.sla === "express" && cfg.slaWarning) {
                targetSelesaiAt = new Date(Date.now() + 2 * 3600000); // Warning tersisa 2 jam
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
                target_selesai_at: targetSelesaiAt
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

            // Log Follow-Up Pengambilan jika remSent > 0 pada tiket selesai
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

            // Log Follow-Up Garansi jika remSent > 0 pada tiket diambil H-7
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

            // Log Follow-Up Servis Berkala jika isMaintFollowUp true
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

        // Tambah Invoice dan Penggunaan Sparepart untuk tiket selesai & diambil
        if (["selesai", "diambil"].includes(cfg.status)) {
            const part1 = spareparts[(i * 2) % spareparts.length];
            const part2 = spareparts[(i * 2 + 1) % spareparts.length];

            await prisma.penggunaanSparepart.create({
                data: {
                    tiket_id: tiket.id,
                    sparepart_id: part1.id,
                    jumlah: 1
                }
            });

            let biayaPart = part1.harga;
            if (i % 2 === 0) {
                await prisma.penggunaanSparepart.create({
                    data: {
                        tiket_id: tiket.id,
                        sparepart_id: part2.id,
                        jumlah: 1
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
                    created_at: completedAt || new Date()
                }
            });
        }
    }

    // 10. Tambah Tiket Rekam Medis Khusus pada Perangkat Multi-Servis (Device Medical History)
    console.log("[SEED] 9. Menambahkan Riwayat Rekam Medis Servis Masa Lalu pada Unit yang Sama...");
    const repeatPerangkat = perangkats[22]; // ASUS ROG Zephyrus G14 milik Rizky Pratama (Customer 14)
    
    // Riwayat 1: Servis 8 bulan lalu
    const pastTiket1 = await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiketYear(2025),
            perangkat_id: repeatPerangkat.id,
            teknisi_id: teknisis[1].id,
            keluhan: "Kipas pendingin GPU berisik dan bergetar saat gaming.",
            kelengkapan: "Unit laptop dan charger original",
            status: "diambil",
            created_at: new Date(Date.now() - 240 * 86400000),
            completed_at: new Date(Date.now() - 237 * 86400000),
            tgl_diambil: new Date(Date.now() - 236 * 86400000),
            kategori_perbaikan: "Pembersihan & Thermal Paste",
            durasi_garansi: "1 Bulan",
            garansi_berakhir_at: new Date(Date.now() - 206 * 86400000),
            checklist_qc: {
                power_test: true,
                display_test: true,
                keyboard_touchpad: true,
                audio_multimedia: true,
                port_io_connectivity: true,
                os_thermal_performance: true,
                clean_wow: true,
                accessories_handover: true,
                passed_qc: true,
                qc_by: teknisis[1].nama,
                qc_at: new Date(Date.now() - 237 * 86400000).toISOString()
            }
        }
    });

    await prisma.diagnosis.create({
        data: {
            tiket_id: pastTiket1.id,
            masalah: "Bearing kipas pendingin GPU aus dan banyak debu menggumpal.",
            solusi: "Penggantian unit fan GPU dan repaste Arctic MX-4.",
            estimasi_biaya: 350000
        }
    });

    await prisma.invoice.create({
        data: {
            tiket_id: pastTiket1.id,
            biaya_jasa: 150000,
            biaya_sparepart: 125000,
            total_biaya: 275000,
            created_at: new Date(Date.now() - 237 * 86400000)
        }
    });

    // Riwayat 2: Servis 2 bulan lalu
    const pastTiket2 = await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiketYear(2026),
            perangkat_id: repeatPerangkat.id,
            teknisi_id: teknisis[0].id,
            keluhan: "Upgrade penyimpanan SSD NVMe untuk instalasi game AAA.",
            kelengkapan: "Unit laptop",
            status: "diambil",
            created_at: new Date(Date.now() - 65 * 86400000),
            completed_at: new Date(Date.now() - 63 * 86400000),
            tgl_diambil: new Date(Date.now() - 62 * 86400000),
            kategori_perbaikan: "SSD / Storage",
            durasi_garansi: "3 Bulan",
            garansi_berakhir_at: new Date(Date.now() + 28 * 86400000),
            checklist_qc: {
                power_test: true,
                display_test: true,
                keyboard_touchpad: true,
                audio_multimedia: true,
                port_io_connectivity: true,
                os_thermal_performance: true,
                clean_wow: true,
                accessories_handover: true,
                passed_qc: true,
                qc_by: teknisis[0].nama,
                qc_at: new Date(Date.now() - 63 * 86400000).toISOString()
            }
        }
    });

    await prisma.diagnosis.create({
        data: {
            tiket_id: pastTiket2.id,
            masalah: "Kapasitas SSD bawaan 512GB penuh.",
            solusi: "Instalasi SSD Kingston NV3 PCIe 4.0 1TB secondary slot.",
            estimasi_biaya: 1250000
        }
    });

    await prisma.invoice.create({
        data: {
            tiket_id: pastTiket2.id,
            biaya_jasa: 100000,
            biaya_sparepart: 1050000,
            total_biaya: 1150000,
            created_at: new Date(Date.now() - 63 * 86400000)
        }
    });

    // 11. Tiket Klaim Garansi Berantai (Warranty Claim Linked)
    console.log("[SEED] 10. Membuat Tiket Klaim Garansi Resmi (Parent-Child Link)...");
    const parentTiketForClaim = pastTiket2;
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiketYear(2026),
            perangkat_id: repeatPerangkat.id,
            teknisi_id: teknisis[0].id,
            keluhan: `[KLAIM GARANSI] Retur perbaikan dari Tiket #${parentTiketForClaim.nomor_tiket}. Sampaikan kendala: SSD kedua kadang tidak terbaca setelah restart.`,
            kelengkapan: "Unit laptop",
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

    // 12. Pustaka Wiki & Hardware Knowledge Base (10 Artikel Penanganan Kasus)
    console.log("[SEED] 11. Membuat Data Pustaka Wiki dan Hardware Knowledge Base...");
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

    // 13. Activity Logs (80 Log Aktivitas Realistis Audit Sistem)
    console.log("[SEED] 12. Membuat Log Jejak Audit Aktivitas Pengguna...");
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
        "Kirim WhatsApp Follow-Up CRM Garansi H-3",
        "Kirim WhatsApp Pengingat Perawatan Berkala 6-12 Bulan",
        "Kirim WhatsApp Pengingat Pengambilan Unit Selesai di Rak",
        "Serah Terima Unit ke Pelanggan",
        "Logout sistem"
    ];

    const entities = [
        "Auth", "TiketServis", "Diagnosis", "LogPerbaikan", 
        "Sparepart", "RestockLog", "ChecklistQC", "Invoice", "RetensiCRM"
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
    console.log(`- Data Pelanggan      : ${await prisma.customer.count()} orang (lengkap 5 kepribadian)`);
    console.log(`- Perangkat Unit      : ${await prisma.perangkat.count()} unit (laptop, PC, printer)`);
    console.log(`- Katalog Sparepart   : ${await prisma.sparepart.count()} item (lengkap HPP dan stok menipis)`);
    console.log(`- Log Pengadaan Restok: ${await prisma.restockLog.count()} faktur supplier`);
    console.log(`- Tiket Servis Total  : ${await prisma.tiketServis.count()} tiket`);
    console.log(`  * Aktif/Berjalan    : ${await prisma.tiketServis.count({ where: { status: { notIn: ['selesai', 'diambil', 'dibatalkan'] } } })} tiket`);
    console.log(`  * Selesai di Rak    : ${await prisma.tiketServis.count({ where: { status: 'selesai' } })} tiket (siap uji unclaimed)`);
    console.log(`  * Diambil / Riwayat : ${await prisma.tiketServis.count({ where: { status: 'diambil' } })} tiket (siap uji recall dan garansi)`);
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
