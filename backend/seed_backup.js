require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    console.log("Memulai proses seeding data realistis...");

    // Clear existing data (optional, but good for fresh seed)
    await prisma.activityLog.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.penggunaanSparepart.deleteMany();
    await prisma.logPerbaikan.deleteMany();
    await prisma.diagnosis.deleteMany();
    await prisma.tiketServis.deleteMany();
    await prisma.perangkat.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.sparepart.deleteMany();
    await prisma.user.deleteMany();

    const password = await bcrypt.hash("password123", 10);

    console.log("1. Membuat Users...");
    const admin = await prisma.user.create({
        data: { nama: "Admin Utama", email: "411231088@mahasiswa.undira.ac.id", password, role: "admin" }
    });
    
    const teknisis = await Promise.all([
        prisma.user.create({ data: { nama: "Budi Santoso", email: "teknisi1@workshop.com", password, role: "teknisi" } }),
        prisma.user.create({ data: { nama: "Andi Wijaya", email: "teknisi2@workshop.com", password, role: "teknisi" } }),
        prisma.user.create({ data: { nama: "Reza Rahadian", email: "teknisi3@workshop.com", password, role: "teknisi" } }),
    ]);

    console.log("2. Membuat Customers...");
    const customerData = [
        { nama: "Rizky Pratama", nomor_telepon: "08123456789", alamat: "Jl. Sudirman No. 10, Jakarta" },
        { nama: "Siti Nurhaliza", nomor_telepon: "08567890123", alamat: "Jl. Thamrin No. 25, Bandung" },
        { nama: "Dewi Lestari", nomor_telepon: "08789012345", alamat: "Jl. Gatot Subroto No. 5, Surabaya" },
        { nama: "Ahmad Dahlan", nomor_telepon: "08112233445", alamat: "Jl. Merdeka No. 11, Yogyakarta" },
        { nama: "Kevin Sanjaya", nomor_telepon: "08223344556", alamat: "Jl. Pahlawan No. 4, Semarang" },
        { nama: "Agnes Monica", nomor_telepon: "08334455667", alamat: "Jl. Asia Afrika No. 9, Bandung" },
        { nama: "Deddy Corbuzier", nomor_telepon: "08445566778", alamat: "Jl. Bintaro Utama No. 7, Tangsel" },
        { nama: "Raisa Andriana", nomor_telepon: "08556677889", alamat: "Jl. Kemang Raya No. 12, Jakarta" }
    ];
    
    const customers = [];
    for (const data of customerData) {
        customers.push(await prisma.customer.create({ data }));
    }

    console.log("3. Membuat Perangkat...");
    const perangkatData = [
        { c: 0, jenis: "Laptop", merk: "ASUS", mod: "ROG Zephyrus G14", sn: "ASUS-2024-001" },
        { c: 0, jenis: "Laptop", merk: "Apple", mod: "MacBook Pro M2", sn: "MAC-2023-992" },
        { c: 1, jenis: "Desktop PC", merk: "HP", mod: "Pavilion Desktop", sn: "HP-2024-002" },
        { c: 2, jenis: "Laptop", merk: "Lenovo", mod: "ThinkPad X1 Carbon", sn: "LEN-2024-003" },
        { c: 3, jenis: "Desktop PC", merk: "Lenovo", mod: "ThinkCentre M70s", sn: "LEN-1122-334" },
        { c: 4, jenis: "Laptop", merk: "Acer", mod: "Predator Helios 300", sn: "ACR-2021-004" },
        { c: 4, jenis: "Desktop PC", merk: "ASUS", mod: "ROG Strix GT15", sn: "ROG-5544-332" },
        { c: 5, jenis: "Laptop", merk: "Dell", mod: "XPS 15", sn: "DEL-2023-005" },
        { c: 6, jenis: "Desktop PC", merk: "Custom Build", mod: "PC Gaming Rakitan", sn: "-" },
        { c: 7, jenis: "Laptop", merk: "MSI", mod: "Modern 14", sn: "MSI-2022-006" }
    ];

    const perangkats = [];
    for (const p of perangkatData) {
        perangkats.push(await prisma.perangkat.create({
            data: {
                customer_id: customers[p.c].id,
                jenis_perangkat: p.jenis,
                merek: p.merk,
                model: p.mod,
                serial_number: p.sn,
            }
        }));
    }

    console.log("4. Membuat Spareparts...");
        const sparepartData = [
        // Memory
        { kategori: "Laptop, AIO", nama: "Kingston SO-DIMM DDR4 8GB 3200MHz", stok: 24, harga: 320000 },
        { kategori: "Laptop, AIO", nama: "Crucial SO-DIMM DDR4 16GB 3200MHz", stok: 12, harga: 650000 },
        { kategori: "Laptop, AIO", nama: "Samsung SO-DIMM DDR3L 8GB", stok: 8, harga: 210000 },
        { kategori: "Desktop", nama: "Kingston DIMM DDR4 8GB 3200MHz", stok: 18, harga: 310000 },
        { kategori: "Desktop", nama: "Corsair Vengeance LPX DDR4 16GB", stok: 10, harga: 720000 },
        { kategori: "Desktop", nama: "Team Elite DIMM DDR3 8GB", stok: 6, harga: 195000 },
        { kategori: "Laptop, AIO", nama: "ADATA SO-DIMM DDR4 8GB 2666MHz", stok: 15, harga: 300000 },
        { kategori: "Laptop, AIO", nama: "SK Hynix SO-DIMM DDR4 16GB 3200MHz", stok: 9, harga: 630000 },
        
        // SSD
        { kategori: "Laptop, Desktop, AIO", nama: "Kingston A400 240GB SATA", stok: 35, harga: 280000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Kingston A400 480GB SATA", stok: 20, harga: 450000 },
        { kategori: "Laptop, Desktop, AIO", nama: "WD Green 240GB SATA", stok: 28, harga: 295000 },
        { kategori: "Laptop, Desktop, AIO", nama: "WD Blue 500GB SATA", stok: 14, harga: 580000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Samsung 870 EVO 500GB", stok: 10, harga: 850000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Crucial BX500 240GB", stok: 22, harga: 275000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Team CX2 512GB", stok: 15, harga: 430000 },
        { kategori: "Laptop, Desktop", nama: "Kingston NV3 500GB NVMe", stok: 18, harga: 590000 },
        { kategori: "Laptop, Desktop", nama: "WD SN580 1TB NVMe", stok: 8, harga: 1100000 },
        { kategori: "Laptop, Desktop", nama: "Lexar NM620 512GB", stok: 12, harga: 550000 },
        
        // HDD
        { kategori: "Desktop", nama: "WD Blue 1TB", stok: 10, harga: 680000 },
        { kategori: "Desktop", nama: "WD Blue 2TB", stok: 6, harga: 950000 },
        { kategori: "Desktop", nama: "Seagate Barracuda 1TB", stok: 15, harga: 670000 },
        { kategori: "Desktop", nama: "Seagate Barracuda 2TB", stok: 8, harga: 930000 },
        { kategori: "Desktop", nama: "Toshiba P300 1TB", stok: 5, harga: 650000 },
        
        // Motherboard
        { kategori: "Desktop", nama: "ASUS H61M-K", stok: 4, harga: 450000 },
        { kategori: "Desktop", nama: "Gigabyte H61M-S1", stok: 3, harga: 430000 },
        { kategori: "Desktop", nama: "ASUS H81M-K", stok: 5, harga: 550000 },
        { kategori: "Desktop", nama: "Gigabyte H81M-DS2", stok: 4, harga: 540000 },
        { kategori: "Desktop", nama: "ASUS B85M-G", stok: 3, harga: 650000 },
        { kategori: "Desktop", nama: "MSI H110M PRO-VH", stok: 6, harga: 750000 },
        { kategori: "Desktop", nama: "ASUS H110M-K", stok: 5, harga: 770000 },
        { kategori: "Desktop", nama: "ASUS H310M-K", stok: 7, harga: 850000 },
        { kategori: "Desktop", nama: "Gigabyte H410M", stok: 8, harga: 950000 },
        { kategori: "Desktop", nama: "ASUS PRIME H510M-E", stok: 6, harga: 1150000 },
        { kategori: "Desktop", nama: "ASUS A320M-K", stok: 5, harga: 720000 },
        { kategori: "Desktop", nama: "MSI A320M PRO", stok: 4, harga: 700000 },
        { kategori: "Desktop", nama: "Gigabyte B450M DS3H", stok: 6, harga: 1150000 },
        { kategori: "Desktop", nama: "ASUS PRIME B450M-A II", stok: 5, harga: 1250000 },
        { kategori: "Desktop", nama: "MSI B550M PRO-VDH", stok: 3, harga: 1650000 },
        
        // Processor
        { kategori: "Desktop", nama: "Intel Core i3-3220", stok: 5, harga: 150000 },
        { kategori: "Desktop", nama: "Intel Core i5-3470", stok: 6, harga: 250000 },
        { kategori: "Desktop", nama: "Intel Core i5-4570", stok: 4, harga: 350000 },
        { kategori: "Desktop", nama: "Intel Core i7-3770", stok: 3, harga: 650000 },
        { kategori: "Desktop", nama: "Intel Core i3-10100F", stok: 8, harga: 1050000 },
        { kategori: "Desktop", nama: "Intel Core i5-10400F", stok: 6, harga: 1450000 },
        { kategori: "Desktop", nama: "Intel Core i5-12400F", stok: 5, harga: 2150000 },
        { kategori: "Desktop", nama: "AMD Ryzen 3 3200G", stok: 4, harga: 1100000 },
        { kategori: "Desktop", nama: "AMD Ryzen 5 3400G", stok: 3, harga: 1400000 },
        { kategori: "Desktop", nama: "AMD Ryzen 5 5600G", stok: 5, harga: 2050000 },
        { kategori: "Desktop", nama: "AMD Ryzen 5 5600", stok: 6, harga: 2150000 },
        
        // Laptop Battery
        { kategori: "Laptop", nama: "ASUS X441 Battery", stok: 8, harga: 350000 },
        { kategori: "Laptop", nama: "ASUS A456 Battery", stok: 6, harga: 380000 },
        { kategori: "Laptop", nama: "Acer Aspire E5 Battery", stok: 7, harga: 320000 },
        { kategori: "Laptop", nama: "Acer ES1 Battery", stok: 5, harga: 300000 },
        { kategori: "Laptop", nama: "Lenovo IdeaPad 320 Battery", stok: 10, harga: 350000 },
        { kategori: "Laptop", nama: "Lenovo G40 Battery", stok: 4, harga: 280000 },
        { kategori: "Laptop", nama: "HP 14 Series Battery", stok: 8, harga: 360000 },
        { kategori: "Laptop", nama: "Dell Inspiron 3467 Battery", stok: 3, harga: 420000 },
        
        // Laptop Charger
        { kategori: "Laptop", nama: "ASUS 19V 3.42A Original", stok: 12, harga: 250000 },
        { kategori: "Laptop", nama: "ASUS 19V 2.37A", stok: 15, harga: 220000 },
        { kategori: "Laptop", nama: "Lenovo Slim Tip 65W", stok: 18, harga: 230000 },
        { kategori: "Laptop", nama: "HP Blue Tip 65W", stok: 14, harga: 240000 },
        { kategori: "Laptop", nama: "Dell 65W", stok: 6, harga: 260000 },
        { kategori: "Laptop", nama: "Acer 65W", stok: 10, harga: 210000 },
        
        // Keyboard Laptop
        { kategori: "Laptop", nama: "Keyboard ASUS X441", stok: 12, harga: 150000 },
        { kategori: "Laptop", nama: "Keyboard Acer Aspire E5", stok: 8, harga: 160000 },
        { kategori: "Laptop", nama: "Keyboard Lenovo IdeaPad 320", stok: 15, harga: 145000 },
        { kategori: "Laptop", nama: "Keyboard HP 14", stok: 10, harga: 170000 },
        { kategori: "Laptop", nama: "Keyboard Dell Inspiron 3467", stok: 5, harga: 190000 },
        
        // LCD Laptop
        { kategori: "Laptop", nama: "LCD 14\" Slim 30 Pin", stok: 15, harga: 750000 },
        { kategori: "Laptop", nama: "LCD 15.6\" Slim 30 Pin", stok: 8, harga: 950000 },
        { kategori: "Laptop", nama: "LCD IPS 15.6\" FHD", stok: 5, harga: 1250000 },
        
        // Cooling
        { kategori: "Desktop", nama: "DeepCool GAMMAXX 400 V2", stok: 12, harga: 280000 },
        { kategori: "Desktop", nama: "Intel Stock Cooler LGA115x", stok: 20, harga: 50000 },
        { kategori: "Desktop", nama: "AMD Wraith Stealth", stok: 15, harga: 85000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Thermal Paste GD900", stok: 40, harga: 35000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Arctic MX-4 4g", stok: 25, harga: 125000 },
        
        // PSU
        { kategori: "Desktop", nama: "FSP HV PRO 550W", stok: 8, harga: 680000 },
        { kategori: "Desktop", nama: "Cooler Master MWE 550 Bronze", stok: 6, harga: 750000 },
        { kategori: "Desktop", nama: "Corsair CV550", stok: 5, harga: 820000 },
        { kategori: "Desktop", nama: "Corsair CV650", stok: 4, harga: 980000 },
        { kategori: "Desktop", nama: "DeepCool PK550D", stok: 7, harga: 690000 },
        { kategori: "Desktop", nama: "MSI MAG A550BN", stok: 5, harga: 720000 },
        { kategori: "Desktop", nama: "VenomRX 500W", stok: 12, harga: 350000 },
        { kategori: "Desktop", nama: "Digital Alliance 450W", stok: 10, harga: 450000 },
        
        // VGA
        { kategori: "Desktop", nama: "GTX 1050 Ti 4GB", stok: 3, harga: 1250000 },
        { kategori: "Desktop", nama: "GTX 1650 4GB", stok: 5, harga: 1850000 },
        { kategori: "Desktop", nama: "RX 570 4GB", stok: 4, harga: 1100000 },
        { kategori: "Desktop", nama: "RX 580 8GB", stok: 6, harga: 1450000 },
        
        // WiFi
        { kategori: "Desktop", nama: "TP-Link TL-WN781ND", stok: 15, harga: 125000 },
        { kategori: "Desktop", nama: "TP-Link Archer T4E", stok: 8, harga: 350000 },
        { kategori: "Laptop, Desktop", nama: "Intel AX200 M.2", stok: 10, harga: 280000 },
        { kategori: "Laptop, Desktop", nama: "Intel AX210 M.2", stok: 6, harga: 350000 },
        { kategori: "Laptop, Desktop, AIO", nama: "USB WiFi TP-Link T2U Nano", stok: 20, harga: 145000 },
        
        // Networking
        { kategori: "Laptop, Desktop, AIO", nama: "RJ45 Connector CAT6", stok: 100, harga: 2000 },
        { kategori: "Laptop, Desktop, AIO", nama: "LAN Cable CAT6 10m", stok: 15, harga: 85000 },
        { kategori: "Laptop, Desktop, AIO", nama: "LAN Cable CAT6 20m", stok: 10, harga: 150000 },
        { kategori: "Desktop", nama: "Gigabit PCIe LAN Card", stok: 8, harga: 120000 },
        
        // Printer
        { kategori: "Printer", nama: "Epson L3110 Roller Kit", stok: 12, harga: 85000 },
        { kategori: "Printer", nama: "Epson L120 Roller", stok: 15, harga: 75000 },
        { kategori: "Printer", nama: "Canon G2010 Printhead", stok: 3, harga: 550000 },
        { kategori: "Printer", nama: "Canon MP287 Cartridge PG-810", stok: 8, harga: 280000 },
        { kategori: "Printer", nama: "Canon MP287 Cartridge CL-811", stok: 6, harga: 320000 },
        { kategori: "Printer", nama: "Epson L3110 Waste Ink Pad", stok: 20, harga: 45000 },
        { kategori: "Printer", nama: "Epson L3110 Encoder Strip", stok: 10, harga: 55000 },
        
        // Accessories
        { kategori: "Aksesoris", nama: "Logitech B100 USB Mouse", stok: 30, harga: 65000 },
        { kategori: "Aksesoris", nama: "Logitech M171 Wireless Mouse", stok: 25, harga: 145000 },
        { kategori: "Aksesoris", nama: "Logitech K120 Keyboard", stok: 20, harga: 115000 },
        { kategori: "Aksesoris", nama: "Fantech K511 Keyboard", stok: 15, harga: 185000 },
        { kategori: "Aksesoris", nama: "Fantech WG9 Wireless Mouse", stok: 18, harga: 165000 },
        { kategori: "Aksesoris", nama: "UGREEN SATA to USB Adapter", stok: 10, harga: 125000 },
        { kategori: "Aksesoris", nama: "ORICO HDD Enclosure 2.5\"", stok: 14, harga: 95000 },
        { kategori: "Aksesoris", nama: "USB Hub 4 Port", stok: 22, harga: 45000 },
        { kategori: "Aksesoris", nama: "HDMI Cable 2 Meter", stok: 28, harga: 35000 },
        { kategori: "Aksesoris", nama: "DisplayPort Cable", stok: 12, harga: 75000 },
        { kategori: "Aksesoris", nama: "VGA Cable", stok: 15, harga: 30000 },
        { kategori: "Aksesoris", nama: "Mouse Pad", stok: 40, harga: 20000 },
        { kategori: "Aksesoris", nama: "Laptop Cooling Pad", stok: 16, harga: 125000 },
        { kategori: "Aksesoris", nama: "External DVD Drive", stok: 5, harga: 220000 },
        { kategori: "Aksesoris", nama: "Flashdisk SanDisk 64GB", stok: 25, harga: 85000 },
        { kategori: "Aksesoris", nama: "Flashdisk Kingston 128GB", stok: 15, harga: 145000 }
    ];

    const spareparts = [];
    for (const sp of sparepartData) {
        spareparts.push(await prisma.sparepart.create({ data: sp }));
    }

    console.log("5. Membuat Tiket Servis, Diagnosis, Log Perbaikan, Penggunaan Sparepart, dan Invoice...");
    
    // Helper for numbering
    let count = 0;
    const generateNomorTiket = () => {
        count++;
        return `SRV-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // tickets from past 30 days

    // Tiket 1: Diterima (Baru masuk, belum ditugaskan/diambil)
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[0].id,
            teknisi_id: null,
            keluhan: "Laptop mati total terkena tumpahan air kopi.",
            status: "diterima",
            created_at: randomDate(new Date(Date.now() - 1 * 86400000), new Date())
        }
    });

    // Tiket 2: Didiagnosis (Menunggu estimasi dari admin)
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[4].id, // Lenovo Desktop
            teknisi_id: teknisis[1].id,
            keluhan: "Sering mati sendiri saat digunakan lebih dari 1 jam.",
            status: "didiagnosis",
            created_at: randomDate(new Date(Date.now() - 4 * 86400000), new Date(Date.now() - 3 * 86400000)),
            diagnosis: {
                create: {
                    masalah: "Thermal paste prosesor kering dan kipas kotor parah (Overheating).",
                    solusi: "Pembersihan total, ganti thermal paste, dan ganti kipas pendingin CPU.",
                    estimasi_biaya: 350000
                }
            }
        }
    });

    // Tiket 3: Menunggu Persetujuan (Sudah didiagnosis, nunggu konfirmasi user)
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[1].id, // MacBook Pro
            teknisi_id: teknisis[2].id,
            keluhan: "Baterai bocor parah, tahan cuma 30 menit kalau cabut charger.",
            status: "menunggu_persetujuan",
            created_at: randomDate(new Date(Date.now() - 5 * 86400000), new Date(Date.now() - 4 * 86400000)),
            diagnosis: {
                create: {
                    masalah: "Cycle count baterai sudah melebihi 1000, sel baterai menggembung.",
                    solusi: "Ganti baterai original MacBook Pro M2.",
                    estimasi_biaya: 2800000
                }
            }
        }
    });

    // Tiket 4: Disetujui (User setuju, siap dikerjakan)
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[8].id, // PC Rakitan
            teknisi_id: teknisis[0].id,
            keluhan: "PC sering bluescreen saat booting Windows.",
            status: "disetujui",
            created_at: randomDate(new Date(Date.now() - 6 * 86400000), new Date(Date.now() - 5 * 86400000)),
            diagnosis: {
                create: {
                    masalah: "SSD Bad sector dan health sisa 10%.",
                    solusi: "Ganti SSD NVMe baru 512GB dan instalasi ulang Windows.",
                    estimasi_biaya: 850000
                }
            }
        }
    });

    // Tiket 5: Dalam Perbaikan
    const t5 = await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[7].id, // Dell XPS
            teknisi_id: teknisis[1].id,
            keluhan: "Engsel layar patah sebelah kanan.",
            status: "dalam_perbaikan",
            created_at: randomDate(new Date(Date.now() - 10 * 86400000), new Date(Date.now() - 8 * 86400000)),
            diagnosis: {
                create: {
                    masalah: "Dudukan engsel pada casing LCD pecah.",
                    solusi: "Repair dudukan engsel dengan lem khusus dan resin.",
                    estimasi_biaya: 350000
                }
            }
        }
    });
    
    // Log perbaikan untuk Tiket 5
    await prisma.logPerbaikan.createMany({
        data: [
            { tiket_id: t5.id, catatan: "Membongkar casing layar Dell XPS.", created_at: randomDate(new Date(Date.now() - 3 * 86400000), new Date(Date.now() - 2 * 86400000)) },
            { tiket_id: t5.id, catatan: "Membersihkan serpihan plastik patah dan mulai mengecor resin pada dudukan baut engsel.", created_at: randomDate(new Date(Date.now() - 2 * 86400000), new Date(Date.now() - 1 * 86400000)) }
        ]
    });

    // Tiket 6: Selesai
    const t6 = await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[5].id, // Acer Predator
            teknisi_id: teknisis[2].id,
            keluhan: "Keyboard beberapa tombol tidak fungsi (W, A, S, D).",
            status: "selesai",
            created_at: randomDate(new Date(Date.now() - 15 * 86400000), new Date(Date.now() - 12 * 86400000)),
            diagnosis: {
                create: {
                    masalah: "Jalur matriks keyboard putus karena indikasi pernah kena air ringan.",
                    solusi: "Ganti modul keyboard Acer Predator.",
                    estimasi_biaya: 650000
                }
            }
        }
    });

    // Log perbaikan untuk Tiket 6
    await prisma.logPerbaikan.create({
        data: { tiket_id: t6.id, catatan: "Bongkar total karena keyboard tanam dengan palmrest.", created_at: randomDate(new Date(Date.now() - 10 * 86400000), new Date(Date.now() - 9 * 86400000)) }
    });
    await prisma.logPerbaikan.create({
        data: { tiket_id: t6.id, catatan: "Keyboard baru berhasil dipasang dan di-solder ulang rivet plastiknya.", created_at: randomDate(new Date(Date.now() - 9 * 86400000), new Date(Date.now() - 8 * 86400000)) }
    });
    await prisma.logPerbaikan.create({
        data: { tiket_id: t6.id, catatan: "Testing seluruh tombol OK, perbaikan selesai.", created_at: randomDate(new Date(Date.now() - 8 * 86400000), new Date(Date.now() - 7 * 86400000)) }
    });

    // Invoice Tiket 6
    await prisma.invoice.create({
        data: {
            tiket_id: t6.id,
            biaya_jasa: 250000,
            biaya_sparepart: 400000, // asumsikan keyboard harga 400rb, walau di db ga dicatat usage nya
            total_biaya: 650000,
            created_at: new Date()
        }
    });

    // Tiket 7: Diambil
    const t7 = await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[2].id, // HP Desktop
            teknisi_id: teknisis[0].id,
            keluhan: "Mati total. Tidak ada tanda kehidupan saat tombol power ditekan.",
            status: "diambil",
            created_at: randomDate(new Date(Date.now() - 25 * 86400000), new Date(Date.now() - 22 * 86400000)),
            diagnosis: {
                create: {
                    masalah: "Power Supply rusak/short akibat lonjakan tegangan.",
                    solusi: "Ganti Power Supply Unit dengan kapasitas yang setara (550W).",
                    estimasi_biaya: 900000
                }
            }
        }
    });

    // Penggunaan Sparepart Tiket 7
    await prisma.penggunaanSparepart.create({
        data: {
            tiket_id: t7.id,
            sparepart_id: spareparts.find(s => s.nama.includes("550W") && s.kategori.includes("Desktop")).id,
            jumlah: 1
        }
    });

    // Log perbaikan Tiket 7
    await prisma.logPerbaikan.create({
        data: { tiket_id: t7.id, catatan: "Membongkar casing PC dan melepas PSU lama yang rusak.", created_at: randomDate(new Date(Date.now() - 20 * 86400000), new Date(Date.now() - 19 * 86400000)) }
    });
    await prisma.logPerbaikan.create({
        data: { tiket_id: t7.id, catatan: "Memasang PSU baru dan merapikan kabel (cable management). PC berhasil booting.", created_at: randomDate(new Date(Date.now() - 19 * 86400000), new Date(Date.now() - 18 * 86400000)) }
    });

    // Invoice Tiket 7
    await prisma.invoice.create({
        data: {
            tiket_id: t7.id,
            biaya_jasa: 150000,
            biaya_sparepart: 750000,
            total_biaya: 900000,
            created_at: randomDate(new Date(Date.now() - 18 * 86400000), new Date(Date.now() - 15 * 86400000))
        }
    });

    // Tiket 8: Dibatalkan
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[6].id, // ASUS Desktop
            teknisi_id: teknisis[1].id,
            keluhan: "VGA Card tidak terbaca, artefak saat render 3D.",
            status: "dibatalkan",
            created_at: randomDate(new Date(Date.now() - 14 * 86400000), new Date(Date.now() - 12 * 86400000)),
            diagnosis: {
                create: {
                    masalah: "VRAM pada VGA Card rusak parah, tidak bisa diperbaiki.",
                    solusi: "Perlu ganti unit VGA Card baru.",
                    estimasi_biaya: 4500000
                }
            }
        }
    });

    // Tiket 9: Diterima (Belum Ditugaskan - Untuk Ambil Alih)
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[4].id,
            teknisi_id: null,
            keluhan: "Printer tidak bisa menarik kertas, selalu paper jam.",
            status: "diterima",
            created_at: new Date()
        }
    });

    // Tiket 10: Dalam Perbaikan
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[7].id, // Laptop MSI
            teknisi_id: teknisis[2].id,
            keluhan: "Baterai kembung hingga casing bawah terbuka.",
            status: "dalam_perbaikan",
            created_at: randomDate(new Date(Date.now() - 5 * 86400000), new Date(Date.now() - 3 * 86400000)),
            diagnosis: {
                create: {
                    masalah: "Baterai lithium-ion kembung (swollen) dan berisiko meledak.",
                    solusi: "Segera lepas baterai lama dan pasang baterai original baru.",
                    estimasi_biaya: 750000
                }
            }
        }
    });

    // Tiket 11: Menunggu Persetujuan
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: generateNomorTiket(),
            perangkat_id: perangkats[1].id,
            teknisi_id: teknisis[0].id,
            keluhan: "Layar blank putih tapi suara startup ada.",
            status: "menunggu_persetujuan",
            created_at: randomDate(new Date(Date.now() - 2 * 86400000), new Date(Date.now() - 1 * 86400000)),
            diagnosis: {
                create: {
                    masalah: "Kabel fleksibel LCD putus di bagian engsel.",
                    solusi: "Ganti kabel fleksibel LCD (Cable Flex).",
                    estimasi_biaya: 400000
                }
            }
        }
    });

    console.log("Seeding selesai dengan suskes!");
    console.log("\n--- Akun Login ---");
    console.log("Admin  : 411231088@mahasiswa.undira.ac.id / password123");
    console.log("Teknisi 1: teknisi1@workshop.com / password123");
    console.log("Teknisi 2: teknisi2@workshop.com / password123");
    console.log("Teknisi 3: teknisi3@workshop.com / password123");
}

main()
    .catch((e) => {
        console.error("Error saat seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
