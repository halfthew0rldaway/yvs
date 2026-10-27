require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const prisma = require("../src/config/database");
const { getNextNomorTiket, calculateWarrantyExpiry } = require("../src/utils/tiket");

/**
 * Appends realistic dummy data across all system modules without deleting existing records.
 */
async function appendRealisticDummy() {
    console.log("🌱 [APPEND DUMMY] Memulai penambahan data dummy realistis...");

    // 1. Dapatkan atau buat Teknisi & Admin
    let admin = await prisma.user.findFirst({ where: { role: "admin" } });
    let teknisiList = await prisma.user.findMany({ where: { role: "teknisi" } });

    if (!admin) {
        const bcrypt = require("bcrypt");
        admin = await prisma.user.create({
            data: {
                nama: "Admin Utama",
                email: "admin@workshop.com",
                password: await bcrypt.hash("password123", 10),
                role: "admin"
            }
        });
    }

    if (teknisiList.length === 0) {
        const bcrypt = require("bcrypt");
        const defaultPassword = await bcrypt.hash("password123", 10);
        teknisiList = await Promise.all([
            prisma.user.create({
                data: { nama: "Budi Santoso (Senior Specialist)", email: "budi.tech@workshop.com", password: defaultPassword, role: "teknisi" }
            }),
            prisma.user.create({
                data: { nama: "Reza Rahadian (MacBook Specialist)", email: "reza.tech@workshop.com", password: defaultPassword, role: "teknisi" }
            }),
            prisma.user.create({
                data: { nama: "Andi Wijaya (PC Gaming)", email: "andi.tech@workshop.com", password: defaultPassword, role: "teknisi" }
            })
        ]);
    }

    // 2. Master Brand
    const brandsToEnsure = [
        "Apple", "ASUS", "Lenovo", "Dell", "HP", "Acer", "MSI", "Epson", "Samsung", "Kingston"
    ];
    const brandMap = {};
    for (const bName of brandsToEnsure) {
        let b = await prisma.brand.findUnique({ where: { nama: bName } });
        if (!b) {
            b = await prisma.brand.create({ data: { nama: bName } });
        }
        brandMap[bName] = b.id;
    }

    // 3. Tambah Sparepart Realistis & Restock Log
    const sparepartsSeed = [
        { nama: "SSD NVMe Samsung 980 500GB M.2 PCIe Gen 3", brand: "Samsung", kat: "Laptop", hBeli: 520000, hJual: 685000, stok: 6 },
        { nama: "RAM SODIMM DDR4 16GB 3200MHz Kingston Fury Impact", brand: "Kingston", kat: "Laptop", hBeli: 410000, hJual: 560000, stok: 8 },
        { nama: "LCD Panel 14.0 Slim FHD IPS 30-Pin Matte (1920x1080)", brand: "Lenovo", kat: "Laptop", hBeli: 650000, hJual: 890000, stok: 4 },
        { nama: "Thermal Paste Honeywell PTM7950 Phase Change Pad", brand: "Umum", kat: "Umum", hBeli: 85000, hJual: 150000, stok: 15 },
        { nama: "Keyboard Laptop ASUS TUF Gaming FX505 RGB Backlit", brand: "ASUS", kat: "Laptop", hBeli: 210000, hJual: 350000, stok: 3 },
        { nama: "Baterai Original Lenovo ThinkPad T480 / T470 (Internal 24Wh)", brand: "Lenovo", kat: "Laptop", hBeli: 340000, hJual: 495000, stok: 5 },
        { nama: "Charger Adaptor Type-C 65W GaN Power Delivery Original", brand: "Lenovo", kat: "Laptop", hBeli: 190000, hJual: 290000, stok: 7 },
        { nama: "Head Print Epson L3110 / L3210 Original Baru", brand: "Epson", kat: "Printer", hBeli: 380000, hJual: 520000, stok: 3 }
    ];

    const createdSpareparts = [];
    for (const spData of sparepartsSeed) {
        let sp = await prisma.sparepart.findFirst({ where: { nama: spData.nama } });
        if (!sp) {
            sp = await prisma.sparepart.create({
                data: {
                    nama: spData.nama,
                    brand_id: brandMap[spData.brand] || null,
                    kategori: spData.kat,
                    harga_beli: spData.hBeli,
                    harga: spData.hJual,
                    stok: spData.stok
                }
            });

            // Catat log restok awal
            await prisma.restockLog.create({
                data: {
                    sparepart_id: sp.id,
                    supplier_nama: "PT Trikomindo Pratama / Mangga Dua",
                    jumlah_masuk: spData.stok + 4,
                    harga_beli_pcs: spData.hBeli,
                    nomor_faktur: `INV-SUPP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                    catatan: "Pengadaan stok berkala suku cadang fast moving workshop",
                    user_id: admin.id,
                    user_nama: admin.nama
                }
            });
        }
        createdSpareparts.push(sp);
    }

    // 4. Tambah Pelanggan & Perangkat Realistis
    const customerSeedData = [
        {
            nama: "dr. Hendra Gunawan, Sp.A",
            nomor_telepon: "081287654321",
            alamat: "Jl. Dago Asri No. 14, Coblong, Bandung",
            tipe_kepribadian: "Koleris",
            catatan_khusus: "Mohon konfirmasi biaya sebelum eksekusi. Butuh cepat untuk data pasien rumah sakit.",
            perangkat: {
                jenis_perangkat: "Laptop",
                merek: "Apple",
                model: "MacBook Pro 14 M2 Pro (2023)",
                serial_number: "C02G87Y0MD6M"
            }
        },
        {
            nama: "Dian Sastrowardoyo, M.Ds",
            nomor_telepon: "085712349876",
            alamat: "Apartemen Grand Asia Afrika Tower B-1205, Bandung",
            tipe_kepribadian: "Melankolis",
            catatan_khusus: "Sangat teliti dengan goresan bodi laptop. Harap segel workshop dipasang rapi di pojok bawah.",
            perangkat: {
                jenis_perangkat: "Laptop",
                merek: "ASUS",
                model: "ROG Zephyrus G14 GA402 Moonlight White",
                serial_number: "N4NRKD03928189A"
            }
        },
        {
            nama: "Rizky Firmansyah",
            nomor_telepon: "081901234567",
            alamat: "Jl. Gegerkalong Hilir No. 88, Sukasari, Bandung",
            tipe_kepribadian: "Sanguinis",
            catatan_khusus: "Mahasiswa ITB, butuh laptop untuk coding TA minggu depan.",
            perangkat: {
                jenis_perangkat: "Laptop",
                merek: "Lenovo",
                model: "ThinkPad X1 Carbon Gen 10",
                serial_number: "PF3Z89X2"
            }
        },
        {
            nama: "Dewi Lestari",
            nomor_telepon: "082133445566",
            alamat: "Komplek Batununggal Indah Estate No. 23, Bandung",
            tipe_kepribadian: "Plegmatis",
            catatan_khusus: "Pelanggan setia sejak 2024. Sangat ramah, minta invoice resmi atas nama kantor.",
            perangkat: {
                jenis_perangkat: "Laptop",
                merek: "Dell",
                model: "XPS 15 9520 InfinityEdge OLED",
                serial_number: "7G8K2Y3"
            }
        },
        {
            nama: "Bayu Pratama",
            nomor_telepon: "085298761234",
            alamat: "Jl. Riau No. 45, Citarum, Bandung Wetan",
            tipe_kepribadian: "Netral",
            catatan_khusus: "Keluhan printer kantor sering paper jam dan hasil cetak garis putus-putus.",
            perangkat: {
                jenis_perangkat: "Printer",
                merek: "Epson",
                model: "EcoTank L3250 Wi-Fi All-in-One",
                serial_number: "X9K801928"
            }
        },
        {
            nama: "Jessica Tanuwijaya",
            nomor_telepon: "087822119900",
            alamat: "Jl. Pasir Kaliki No. 112, Cicendo, Bandung",
            tipe_kepribadian: "Koleris",
            catatan_khusus: "Laptop gaming anak panas sekali dan sering mati mendadak saat main Valorant.",
            perangkat: {
                jenis_perangkat: "Laptop",
                merek: "Acer",
                model: "Nitro 5 AN515-58 Core i7 RTX 3060",
                serial_number: "NHQFHAA0012398"
            }
        },
        {
            nama: "Ahmad Fauzi",
            nomor_telepon: "081377889911",
            alamat: "Jl. Buah Batu No. 201, Turangga, Lengkong",
            tipe_kepribadian: "Sanguinis",
            catatan_khusus: "Keyboard sering double-type tombol spasi dan tombol enter macet setelah terkena tetesan kopi.",
            perangkat: {
                jenis_perangkat: "Laptop",
                merek: "HP",
                model: "Pavilion Gaming 15-dk0042tx",
                serial_number: "5CD93817P0"
            }
        },
        {
            nama: "Citra Kirana",
            nomor_telepon: "085699001122",
            alamat: "Jl. Cihampelas No. 180, Cipaganti, Coblong",
            tipe_kepribadian: "Plegmatis",
            catatan_khusus: "Membutuhkan unit pinjaman (loaner) sementara karena unit utama dipakai kerja remote harian.",
            perangkat: {
                jenis_perangkat: "Laptop",
                merek: "MSI",
                model: "Modern 14 B11M Carbon Gray",
                serial_number: "K2108N0089201"
            }
        }
    ];

    const createdCustomers = [];
    const createdPerangkats = [];

    for (const cData of customerSeedData) {
        // Cek apakah nomor telepon sudah ada
        let cust = await prisma.customer.findFirst({ where: { nomor_telepon: cData.nomor_telepon } });
        if (!cust) {
            cust = await prisma.customer.create({
                data: {
                    nama: cData.nama,
                    nomor_telepon: cData.nomor_telepon,
                    alamat: cData.alamat,
                    tipe_kepribadian: cData.tipe_kepribadian,
                    catatan_khusus: cData.catatan_khusus
                }
            });
        }

        let dev = await prisma.perangkat.findFirst({
            where: {
                customer_id: cust.id,
                serial_number: cData.perangkat.serial_number
            }
        });

        if (!dev) {
            dev = await prisma.perangkat.create({
                data: {
                    customer_id: cust.id,
                    jenis_perangkat: cData.perangkat.jenis_perangkat,
                    merek: cData.perangkat.merek,
                    model: cData.perangkat.model,
                    serial_number: cData.perangkat.serial_number
                }
            });
        }

        createdCustomers.push(cust);
        createdPerangkats.push(dev);
    }

    // 5. Buat Tiket Servis Realistis dengan Ragam Status
    console.log("🎫 [APPEND DUMMY] Membuat tiket servis realistis multi-status...");

    const ticketScenarios = [
        // Skenario 1: Diterima (Antrean Baru - Intake Lengkap)
        {
            devIndex: 0,
            status: "diterima",
            teknisiIndex: null, // Unassigned
            keluhan: "Trackpad MacBook tidak bisa klik haptic, baterai ada notifikasi 'Service Recommended', cepat panas saat export video Final Cut Pro.",
            kelengkapan: "Unit MacBook, Charger MagSafe 3 96W Original, Tas Laptop Thule",
            tipe_kunci: "Password",
            password_perangkat: "mac2023pass",
            sla_paket: "express",
            kondisi_fisik: "Mulus / Normal",
            spesifikasi_awal: "Apple M2 Pro 10-Core, RAM 16GB Unified, SSD 512GB",
            kategori_perbaikan: "Baterai & Power"
        },
        // Skenario 2: Didiagnosis (Teknisi Sedang Menginspeksi)
        {
            devIndex: 1,
            status: "didiagnosis",
            teknisiIndex: 0, // Budi Santoso
            keluhan: "Layar blank hitam setelah update BIOS, lampu keyboard menyala dan kipas berputar kencang, tidak ada output ke HDMI eksternal.",
            kelengkapan: "Unit Laptop, Adaptor 240W Original Asus ROG",
            tipe_kunci: "PIN",
            password_perangkat: "1945",
            sla_paket: "kompleks",
            kondisi_fisik: "Ada yang Rusak",
            spesifikasi_awal: "AMD Ryzen 9 6900HS, RAM 32GB DDR5, SSD 1TB, Radeon RX 6800S",
            kategori_perbaikan: "Motherboard / Power",
            diagnosisData: {
                masalah: "Korupsi firmware BIOS chip Winbond 25Q128JVPQ akibat listrik padam saat flashing. Jalur 3.3V VCC BIOS normal.",
                solusi: "Flash ulang SPI BIOS chip menggunakan programmer eksternal CH341A dengan dump firmware resmi ASUS ver. 318, reprogram clean ME/PSP region.",
                estimasi_biaya: 450000
            }
        },
        // Skenario 3: Menunggu Persetujuan Customer (Estimasi Siap di-ACC)
        {
            devIndex: 2,
            status: "menunggu_persetujuan",
            teknisiIndex: 1, // Reza Rahadian
            keluhan: "Engsel layar kiri patah saat dibuka, bezel LCD retak, layar berkedip ketika digerakkan sudut kemiringannya.",
            kelengkapan: "Unit Laptop saja (Charger ditinggal di kantor)",
            tipe_kunci: "Tidak Ada",
            sla_paket: "reguler",
            kondisi_fisik: "Pecah",
            spesifikasi_awal: "Intel Core i7-1260P, RAM 16GB LPDDR5, SSD 512GB",
            kategori_perbaikan: "Casing & Engsel",
            diagnosisData: {
                masalah: "Dudukan baut hinge (brass nut insert) pada top cover magnesium patah 2 titik, kabel eDP display 40-pin tertekan engsel sehingga kadang flickering.",
                solusi: "Rekonstruksi mounting engsel dengan resin epoxy reinforced, reposisi dan insulasi kabel fleksibel eDP, kalibrasi tension baut engsel agar halus.",
                estimasi_biaya: 350000
            }
        },
        // Skenario 4: Disetujui (Pelanggan Sudah ACC, Siap Eksekusi Fisik)
        {
            devIndex: 3,
            status: "disetujui",
            teknisiIndex: 0, // Budi Santoso
            keluhan: "Sering Blue Screen (BSOD DPC_WATCHDOG_VIOLATION) setiap 30 menit, penyimpanan C: penuh padahal file sedikit.",
            kelengkapan: "Unit Laptop Dell XPS, Charger Type-C 130W",
            tipe_kunci: "Password",
            password_perangkat: "dellxps2024",
            sla_paket: "reguler",
            kondisi_fisik: "Bersih",
            spesifikasi_awal: "Intel Core i7-12700H, RAM 32GB, SSD 1TB NVMe, RTX 3050Ti",
            kategori_perbaikan: "Storage & OS",
            disetujui_at: new Date(Date.now() - 3600000 * 4), // 4 jam lalu
            diagnosisData: {
                masalah: "SSD internal Kioxia OEM mengalami bad block sektoral kritis pada area page file Windows. Health S.M.A.R.T tersisa 14%.",
                solusi: "Backup partisi data penting, ganti SSD Samsung NVMe 980 500GB, fresh install Windows 11 Pro 64-bit berlisensi digital asli.",
                estimasi_biaya: 885000 // Jasa 200k + SSD 685k
            }
        },
        // Skenario 5: Dalam Perbaikan (Teknisi Sedang Mengganti Sparepart)
        {
            devIndex: 4,
            status: "dalam_perbaikan",
            teknisiIndex: 2, // Andi Wijaya
            keluhan: "Tinta hitam tidak keluar sama sekali, blinking lampu oranye dan hijau bergantian (error waste ink pad counter full).",
            kelengkapan: "Unit Printer Epson, Kabel Power, Kabel USB Printer",
            tipe_kunci: "Tidak Ada",
            sla_paket: "reguler",
            kondisi_fisik: "Kotor",
            spesifikasi_awal: "Epson EcoTank L3250 Wi-Fi Print Scan Copy",
            kategori_perbaikan: "Printer & Scanner",
            disetujui_at: new Date(Date.now() - 3600000 * 8),
            diagnosisData: {
                masalah: "Nozzle head print hitam mampet kerak tinta kering, spon penampung buangan penuh (Waste Ink Pad 100%).",
                solusi: "Pembersihan ultrasonik print head, flushing selang infus tinta, reset counter waste ink via adjustment software, penggantian bantalan busa peredam.",
                estimasi_biaya: 250000
            }
        },
        // Skenario 6: Selesai (Lolos QC, Menunggu Pengambilan & Pelunasan)
        {
            devIndex: 5,
            status: "selesai",
            teknisiIndex: 0, // Budi Santoso
            keluhan: "Suhu GPU tembus 92°C saat gaming, thermal throttling parah hingga FPS drop tajam, kipas kanan berbunyi dengung kasar.",
            kelengkapan: "Unit Laptop Acer Nitro, Charger 180W Original",
            tipe_kunci: "PIN",
            password_perangkat: "0000",
            sla_paket: "express",
            kondisi_fisik: "Kotor",
            spesifikasi_awal: "Intel Core i7-12700H, RAM 16GB, RTX 3060 6GB",
            kategori_perbaikan: "Kipas & Thermal",
            completed_at: new Date(Date.now() - 3600000 * 2), // 2 jam lalu
            checklist_qc: {
                suhu_normal: true,
                keyboard_test: true,
                sound_test: true,
                charging_test: true,
                wifi_test: true
            },
            diagnosisData: {
                masalah: "Thermal paste pabrik mengeras kering (*pump-out effect*), kipas GPU tersumbat gumpalan serat debu tebal pada bilah radiator.",
                solusi: "Deep cleaning modul thermal dual-fan, repasting Honeywell PTM7950 phase change pad, ganti K5-Pro thermal putty pada VRAM/VRM MOSFET.",
                estimasi_biaya: 250000
            },
            invoiceData: {
                biaya_jasa: 250000,
                biaya_sparepart: 0,
                total_biaya: 250000
            }
        },
        // Skenario 7: Diambil (Lunas, Garansi Aktif, Ada Rating Bintang 5)
        {
            devIndex: 6,
            status: "diambil",
            teknisiIndex: 1, // Reza Rahadian
            keluhan: "Tombol keyboard space, enter, dan shift lengket tidak merespons setelah ketumpahan kopi susu.",
            kelengkapan: "Unit Laptop HP Pavilion, Charger 150W",
            tipe_kunci: "PIN",
            password_perangkat: "8888",
            sla_paket: "reguler",
            kondisi_fisik: "Kotor",
            spesifikasi_awal: "Intel Core i5-9300H, RAM 8GB, GTX 1050 3GB",
            kategori_perbaikan: "Keyboard & Touchpad",
            completed_at: new Date(Date.now() - 86400000 * 5), // 5 hari lalu
            tgl_diambil: new Date(Date.now() - 86400000 * 4), // 4 hari lalu
            durasi_garansi: "1 Bulan",
            tips_perawatan: "Hindari meletakkan gelas minuman di samping laptop saat mengetik. Jika terkena cairan lagi, segera matikan tombol power, lepas charger, dan posisikan keyboard terbalik menyerupai tenda.",
            rating_teknisi: 5,
            rating_submitted_at: new Date(Date.now() - 86400000 * 3),
            diagnosisData: {
                masalah: "Jalur matriks membran keyboard korosi akibat cairan kopi susu. Bodi casing palmrest kotor lengket.",
                solusi: "Penggantian modul keyboard OEM backlit HP Pavilion Gaming, pembersihan residu korosi pada mainboard menggunakan cairan contact cleaner khusus.",
                estimasi_biaya: 450000
            },
            invoiceData: {
                biaya_jasa: 150000,
                biaya_sparepart: 300000,
                total_biaya: 450000
            }
        },
        // Skenario 8: Dibatalkan (Customer Membatalkan Karena Overbudget)
        {
            devIndex: 7,
            status: "dibatalkan",
            teknisiIndex: 2, // Andi Wijaya
            keluhan: "Mati total setelah terkena petir saat badai hujan, aroma gosong keluar dari ventilasi exhaust.",
            kelengkapan: "Unit Laptop MSI Modern, Adaptor 65W",
            tipe_kunci: "Tidak Ada",
            sla_paket: "kompleks",
            kondisi_fisik: "Ada yang Rusak",
            spesifikasi_awal: "Intel Core i3 11th Gen, RAM 8GB, SSD 256GB",
            kategori_perbaikan: "Motherboard / Power",
            alasan_batal: "Biaya perbaikan melebihi anggaran kantor",
            catatan_batal: "Customer memilih untuk mengajukan pengadaan unit laptop baru ke manajemen kantor.",
            biaya_pembatalan: 50000, // Biaya cek diagnosis batal
            diagnosisData: {
                masalah: "PCH Processor short ke ground akibat tegangan kejut port LAN/Adaptor. Kerusakan merembet ke jalur VCore.",
                solusi: "Penggantian satu set motherboard utama (biaya part estimasi Rp 2.800.000).",
                estimasi_biaya: 2800000
            }
        }
    ];

    let createdTicketCount = 0;

    for (let i = 0; i < ticketScenarios.length; i++) {
        const sc = ticketScenarios[i];
        const dev = createdPerangkats[sc.devIndex];
        const assignedTech = sc.teknisiIndex !== null && teknisiList[sc.teknisiIndex] ? teknisiList[sc.teknisiIndex] : null;

        // Ambil nomor tiket unik
        const nomorTiket = await getNextNomorTiket(prisma, i);

        // Kalkulasi garansi jika diambil
        let garansiBerakhirAt = null;
        if (sc.tgl_diambil && sc.durasi_garansi) {
            garansiBerakhirAt = calculateWarrantyExpiry(sc.tgl_diambil, sc.durasi_garansi);
        }

        const tiket = await prisma.tiketServis.create({
            data: {
                nomor_tiket: nomorTiket,
                perangkat_id: dev.id,
                teknisi_id: assignedTech ? assignedTech.id : null,
                keluhan: sc.keluhan,
                kelengkapan: sc.kelengkapan,
                status: sc.status,
                tipe_kunci: sc.tipe_kunci || "Tidak Ada",
                password_perangkat: sc.password_perangkat || null,
                sla_paket: sc.sla_paket || "reguler",
                kondisi_fisik: sc.kondisi_fisik || "Bersih",
                spesifikasi_awal: sc.spesifikasi_awal || null,
                kategori_perbaikan: sc.kategori_perbaikan || "Umum",
                durasi_garansi: sc.durasi_garansi || "1 Bulan",
                disetujui_at: sc.disetujui_at || null,
                completed_at: sc.completed_at || null,
                tgl_diambil: sc.tgl_diambil || null,
                garansi_berakhir_at: garansiBerakhirAt,
                tips_perawatan: sc.tips_perawatan || null,
                rating_teknisi: sc.rating_teknisi || null,
                rating_submitted_at: sc.rating_submitted_at || null,
                alasan_batal: sc.alasan_batal || null,
                catatan_batal: sc.catatan_batal || null,
                biaya_pembatalan: sc.biaya_pembatalan || 0,
                checklist_qc: sc.checklist_qc || null,
                checklist_intake: {
                    casing_baret: sc.kondisi_fisik !== "Mulus / Normal",
                    layar_normal: sc.status !== "didiagnosis",
                    baut_lengkap: true,
                    bisa_hidup: sc.status !== "dibatalkan"
                }
            }
        });

        // 6. Buat Diagnosis jika ada
        if (sc.diagnosisData) {
            await prisma.diagnosis.create({
                data: {
                    tiket_id: tiket.id,
                    masalah: sc.diagnosisData.masalah,
                    solusi: sc.diagnosisData.solusi,
                    estimasi_biaya: sc.diagnosisData.estimasi_biaya
                }
            });

            // Log diagnosis
            await prisma.logPerbaikan.create({
                data: {
                    tiket_id: tiket.id,
                    fase: "Diagnosis",
                    catatan: `Hasil Pengecekan: ${sc.diagnosisData.masalah} Solusi: ${sc.diagnosisData.solusi}`
                }
            });
        }

        // 7. Buat Log Perbaikan Realistis
        if (sc.status === "disetujui" || sc.status === "dalam_perbaikan" || sc.status === "selesai" || sc.status === "diambil") {
            await prisma.logPerbaikan.create({
                data: {
                    tiket_id: tiket.id,
                    fase: "Persetujuan Pelanggan",
                    catatan: "Penawaran estimasi biaya telah disetujui pelanggan. Unit masuk antrean pengerjaan teknisi."
                }
            });
        }

        if (sc.status === "selesai" || sc.status === "diambil") {
            await prisma.logPerbaikan.create({
                data: {
                    tiket_id: tiket.id,
                    fase: "Pengujian & QC",
                    catatan: "Pengerjaan servis selesai. Lolos uji Quality Control 15 parameter teknisi Yangversa."
                }
            });
        }

        // 8. Buat Invoice jika ada
        if (sc.invoiceData) {
            await prisma.invoice.create({
                data: {
                    tiket_id: tiket.id,
                    biaya_jasa: sc.invoiceData.biaya_jasa,
                    biaya_sparepart: sc.invoiceData.biaya_sparepart,
                    total_biaya: sc.invoiceData.total_biaya
                }
            });
        }

        createdTicketCount++;
    }

    // 9. Tambah Unit Pinjaman (Loaner Pool)
    console.log("💻 [APPEND DUMMY] Menambah unit pinjaman (Loaner Pool)...");
    const loanerDevicesSeed = [
        { kode: "LOAN-YVS-01", nama: "Lenovo ThinkPad T480", kat: "Laptop", sn: "PF1890X4", spek: "Core i5 8th Gen, RAM 16GB, SSD 256GB NVMe", kelengkapan: "Unit + Adaptor Type-C 65W + Tas Slempang", status: "dipinjam" },
        { kode: "LOAN-YVS-02", nama: "Dell Latitude 5490", kat: "Laptop", sn: "8K9L2Y1", spek: "Core i5 8th Gen, RAM 8GB, SSD 256GB", kelengkapan: "Unit + Adaptor 65W Original", status: "tersedia" },
        { kode: "LOAN-YVS-03", nama: "HP EliteBook 840 G5", kat: "Laptop", sn: "5CD83910M", spek: "Core i7 8th Gen, RAM 16GB, SSD 512GB", kelengkapan: "Unit + Charger HP Slim", status: "tersedia" }
    ];

    for (const ld of loanerDevicesSeed) {
        let existing = await prisma.loanerDevice.findUnique({ where: { kode_unit: ld.kode } });
        if (!existing) {
            existing = await prisma.loanerDevice.create({
                data: {
                    kode_unit: ld.kode,
                    nama: ld.nama,
                    kategori: ld.kat,
                    serial_number: ld.sn,
                    spesifikasi: ld.spek,
                    kelengkapan: ld.kelengkapan,
                    status: ld.status
                }
            });

            // Jika status dipinjam, buat record peminjaman dengan Citra Kirana
            if (ld.status === "dipinjam" && createdCustomers[7]) {
                const targetTiket = await prisma.tiketServis.findFirst({
                    where: { perangkat: { customer_id: createdCustomers[7].id } }
                });

                if (targetTiket) {
                    await prisma.loanerRecord.create({
                        data: {
                            loaner_device_id: existing.id,
                            tiket_id: targetTiket.id,
                            customer_id: createdCustomers[7].id,
                            nomor_peminjaman: `LNR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                            status: "aktif",
                            deposit_uang: 500000,
                            deposit_dikembalikan: false,
                            catatan_kondisi_pinjam: "Bodi mulus 95%, baterai tahan 3-4 jam, Windows 11 siap pakai untuk WFH",
                            created_by_nama: admin.nama
                        }
                    });
                }
            }
        }
    }

    // 10. Tambah Klaim Garansi Distributor (Supplier RMA)
    console.log("🔄 [APPEND DUMMY] Menambah data klaim RMA distributor...");
    const rmaSeed = [
        {
            nomor_rma: `RMA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            supplier: "Distributor LCD Mangga Dua",
            partIndex: 2, // LCD Panel
            alasan: "Panel LCD yang baru dibuka dari bubble wrap mengalami garis vertikal tipis warna hijau di sisi kanan (cacat pabrik / dead column driver IC).",
            status: "disetujui_ganti",
            resi: "JNE-882910391234",
            kurir: "JNE Express",
            ongkir: 32000,
            solusi: "Ganti Unit Baru",
            catatan: "Distributor telah menerima unit retur dan mengirimkan replacement panel LCD baru."
        },
        {
            nomor_rma: `RMA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            supplier: "PT Trikomindo Pratama",
            partIndex: 1, // RAM Kingston
            alasan: "Kepingan RAM menyebabkan BSOD MEMORY_MANAGEMENT saat dipasang di slot 1, error saat diuji MemTest86 pada pass 2.",
            status: "dikirim",
            resi: "SICEPAT-00291048192",
            kurir: "SiCepat",
            ongkir: 18000,
            solusi: "Menunggu Pemeriksaan Distributor",
            catatan: "Resi pengiriman telah dilampirkan ke admin klaim garansi supplier."
        }
    ];

    for (const rma of rmaSeed) {
        let existingRma = await prisma.supplierRma.findUnique({ where: { nomor_rma: rma.nomor_rma } });
        if (!existingRma && createdSpareparts[rma.partIndex]) {
            await prisma.supplierRma.create({
                data: {
                    nomor_rma: rma.nomor_rma,
                    sparepart_id: createdSpareparts[rma.partIndex].id,
                    supplier_nama: rma.supplier,
                    alasan_rusak: rma.alasan,
                    status: rma.status,
                    resi_pengiriman: rma.resi,
                    kurir_pengiriman: rma.kurir,
                    ongkir: rma.ongkir,
                    solusi_distributor: rma.solusi,
                    catatan_distributor: rma.catatan,
                    created_by_nama: admin.nama
                }
            });
        }
    }

    // 11. Tambah Pustaka Solusi (Repair Wiki)
    console.log("📚 [APPEND DUMMY] Menambah pustaka panduan teknis Repair Wiki...");
    const wikiSeed = [
        {
            merek: "ASUS",
            model_seri: "ROG Strix / Zephyrus Series",
            kategori: "Motherboard / Power",
            judul: "Solusi Induk Jalur 19V Short Circuit pada Motherboard Gaming",
            gejala: "Lampu adaptor charger langsung mati atau berkedip saat dicolokkan ke DC Jack laptop. Unit mati total, tidak ada arus masuk.",
            penyebab: "Kapasitor keramik MLCC 10uF 25V pada jalur VIN / B+ mengalami breakdown insulator sehingga short penuh ke ground.",
            solusi_langkah: "1. Sambungkan DC Power Supply 1V dengan batas arus 2A ke jalur B+.\n2. Gunakan thermal camera atau alkohol isopropil untuk menemukan komponen yang memancarkan panas berlebih.\n3. Angkat kapasitor yang retak/short menggunakan hot air rework station 350°C.\n4. Bersihkan pad timah, pasang kapasitor pengganti bernilai sama, dan ukur hambatan jalur ke ground (>100k Ohm).",
            komponen_terkait: "Kapasitor MLCC 0805 10uF 25V, MOSFET AON7408",
            tingkat_kesulitan: "Mahir",
            estimasi_waktu: "1-2 Jam",
            tingkat_sukses: 95
        },
        {
            merek: "Apple",
            model_seri: "MacBook Air & Pro (M1 / M2)",
            kategori: "Storage & OS",
            judul: "Penanganan Error 'Exclamation Mark Circle' & DFU Mode Recovery",
            gejala: "MacBook tidak bisa booting ke macOS, hanya menampilkan ikon tanda seru di layar dengan tautan apple.com/restore.",
            penyebab: "Corrupt firmware Secure Enclave Processor (SEP) atau partisi APFS container rusak setelah update macOS terputus.",
            solusi_langkah: "1. Hubungkan MacBook ke Mac lain menggunakan kabel Thunderbolt/Type-C ke port DFU primer.\n2. Buka aplikasi Apple Configurator di Mac pendukung.\n3. Tahan tombol Power + Control + Option + Right Shift selama 10 detik hingga masuk DFU Mode.\n4. Pilih 'Revive Device' terlebih dahulu untuk menyelamatkan data pengguna, atau 'Restore Device' jika partisi bersih diperlukan.",
            komponen_terkait: "Apple Configurator 2, Kabel Type-C High-Speed",
            tingkat_kesulitan: "Menengah",
            estimasi_waktu: "45 Menit",
            tingkat_sukses: 90
        }
    ];

    for (const w of wikiSeed) {
        let existingWiki = await prisma.repairWiki.findFirst({ where: { judul: w.judul } });
        if (!existingWiki) {
            await prisma.repairWiki.create({
                data: {
                    merek: w.merek,
                    model_seri: w.model_seri,
                    kategori: w.kategori,
                    judul: w.judul,
                    gejala: w.gejala,
                    penyebab: w.penyebab,
                    solusi_langkah: w.solusi_langkah,
                    komponen_terkait: w.komponen_terkait,
                    tingkat_kesulitan: w.tingkat_kesulitan,
                    estimasi_waktu: w.estimasi_waktu,
                    tingkat_sukses: w.tingkat_sukses,
                    user_id: admin.id
                }
            });
        }
    }

    // 12. Notifikasi & Log Aktivitas Sistem
    await prisma.notification.create({
        data: {
            recipient_role: "admin",
            sender_nama: "Sistem Otomasi Serv.io",
            tipe: "system",
            judul: "Pencadangan & Pembaruan Data Realistis Selesai",
            pesan: `Berhasil menambahkan ${createdTicketCount} tiket servis baru, ${customerSeedData.length} data pelanggan, dan data suku cadang realistis ke sistem.`,
            link: "/dashboard"
        }
    });

    await prisma.activityLog.create({
        data: {
            user_id: admin.id,
            user_nama: admin.nama,
            action: `Injeksi Data Realistis: Berhasil menambahkan ${createdTicketCount} tiket, ${createdCustomers.length} pelanggan & perangkat tanpa menghapus data lama.`,
            entity: "system"
        }
    });

    console.log(`✅ [SELESAI] Sukses menambahkan ${createdTicketCount} tiket servis baru, ${createdCustomers.length} pelanggan, suku cadang, dan modul lainnya secara realistis!`);
    return {
        success: true,
        customersAdded: createdCustomers.length,
        ticketsAdded: createdTicketCount
    };
}

// Jika dijalankan langsung via CLI: node scripts/append_realistic_dummy.js
if (require.main === module) {
    appendRealisticDummy()
        .then(() => process.exit(0))
        .catch(err => {
            console.error("❌ Gagal menambahkan dummy data:", err);
            process.exit(1);
        });
}

module.exports = appendRealisticDummy;

