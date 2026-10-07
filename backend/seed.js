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
        data: { nama: "Admin Utama", email: "admin@workshop.com", password, role: "admin" }
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
        
        // Accessories & Peripherals Parts
        { kategori: "Aksesoris", nama: "Logitech B100 USB Mouse", stok: 30, harga: 65000 },
        { kategori: "Aksesoris", nama: "Logitech M171 Wireless Mouse", stok: 25, harga: 145000 },
        { kategori: "Aksesoris", nama: "Logitech K120 Keyboard", stok: 20, harga: 115000 },
        { kategori: "Aksesoris", nama: "Fantech K511 Keyboard", stok: 15, harga: 185000 },
        { kategori: "Aksesoris", nama: "Fantech WG9 Wireless Mouse", stok: 18, harga: 165000 },
        { kategori: "Aksesoris", nama: "UGREEN SATA to USB Adapter", stok: 10, harga: 125000 },
        { kategori: "Aksesoris", nama: "ORICO HDD Enclosure 2.5\"", stok: 14, harga: 95000 },
        { kategori: "Aksesoris", nama: "ORICO HDD Enclosure 3.5\" with Power", stok: 8, harga: 250000 },
        { kategori: "Aksesoris", nama: "USB Hub 4 Port", stok: 22, harga: 45000 },
        { kategori: "Aksesoris", nama: "HDMI Cable 2 Meter", stok: 28, harga: 35000 },
        { kategori: "Aksesoris", nama: "DisplayPort Cable", stok: 12, harga: 75000 },
        { kategori: "Aksesoris", nama: "VGA Cable", stok: 15, harga: 30000 },
        { kategori: "Aksesoris", nama: "Mouse Pad", stok: 40, harga: 20000 },
        { kategori: "Aksesoris", nama: "Laptop Cooling Pad", stok: 16, harga: 125000 },
        { kategori: "Aksesoris", nama: "External DVD Drive", stok: 5, harga: 220000 },
        { kategori: "Aksesoris", nama: "Flashdisk SanDisk 64GB", stok: 25, harga: 85000 },
        { kategori: "Aksesoris", nama: "Flashdisk Kingston 128GB", stok: 15, harga: 145000 },

        // Peripheral Repair Parts
        { kategori: "Aksesoris", nama: "Omron D2FC-F-7N Mouse Micro Switch", stok: 50, harga: 15000 },
        { kategori: "Aksesoris", nama: "Kailh GM 8.0 Mouse Micro Switch", stok: 30, harga: 25000 },
        { kategori: "Aksesoris", nama: "Huano Blue Shell White Dot Switch", stok: 40, harga: 12000 },
        { kategori: "Aksesoris", nama: "TTC Gold Encoder Mouse Wheel", stok: 20, harga: 35000 },
        { kategori: "Aksesoris", nama: "Outemu Red Mechanical Switch (10 pcs)", stok: 15, harga: 45000 },
        { kategori: "Aksesoris", nama: "Cherry MX Blue Switch (10 pcs)", stok: 10, harga: 85000 },
        { kategori: "Aksesoris", nama: "Gateron Brown Switch (10 pcs)", stok: 12, harga: 60000 },
        { kategori: "Aksesoris", nama: "Keycaps PBT Double Shot 104 Keys", stok: 5, harga: 180000 },
        
        // Cables
        { kategori: "Aksesoris", nama: "Kabel Data USB to Type-C Braided", stok: 30, harga: 45000 },
        { kategori: "Aksesoris", nama: "Kabel Data Type-C to Type-C 100W", stok: 20, harga: 85000 },
        { kategori: "Aksesoris", nama: "Kabel Data HDD External Micro-B", stok: 25, harga: 35000 },
        { kategori: "Aksesoris", nama: "Kabel Power PC/Monitor", stok: 50, harga: 25000 },
        { kategori: "Aksesoris", nama: "Kabel Adaptor Laptop Cloverleaf", stok: 40, harga: 25000 }
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

    const statusList = ["diterima", "didiagnosis", "menunggu_persetujuan", "disetujui", "dalam_perbaikan", "selesai", "diambil", "dibatalkan"];
    
    const keluhanList = [
        "Laptop mati total terkena tumpahan air kopi.",
        "Sering mati sendiri saat digunakan lebih dari 1 jam.",
        "Baterai bocor parah, tahan cuma 30 menit kalau cabut charger.",
        "PC sering bluescreen saat booting Windows.",
        "Engsel layar patah sebelah kanan.",
        "Keyboard beberapa tombol tidak fungsi (W, A, S, D).",
        "Mati total. Tidak ada tanda kehidupan saat tombol power ditekan.",
        "VGA Card tidak terbaca, artefak saat render 3D.",
        "Suara speaker pecah dan sember di volume tinggi.",
        "Touchpad tidak merespon sama sekali.",
        "Layar berkedip-kedip saat membuka aplikasi berat.",
        "Kipas sangat berisik seperti mesin gergaji.",
        "Tidak bisa connect ke WiFi, driver error.",
        "Port USB sebelah kiri tidak mendeteksi flashdisk.",
        "Laptop sangat lambat saat startup, memakan waktu 10 menit."
    ];

    const kelengkapanList = [
        "Membawa adaptor original, tas hitam bawaan, dus tidak ada.",
        "Hanya unit laptop saja.",
        "Lengkap dengan dus, charger, dan kartu garansi mati.",
        "Unit PC Desktop beserta kabel power hitam.",
        "Laptop, charger replacement, softcase abu-abu.",
        "Unit dan charger original, kabel sedikit terkelupas di ujung.",
        "PC Desktop lengkap dengan dus (baru dibeli 2 tahun lalu).",
        "Laptop, charger, dan mouse wireless (dongle menancap)."
    ];

    // Buat 15 Tiket secara dinamis
    for (let i = 0; i < 15; i++) {
        const statusIdx = Math.floor(Math.random() * statusList.length);
        const status = statusList[statusIdx];
        
        // Diterima bisa tidak ada teknisi
        let teknisi_id = null;
        if (status !== "diterima") {
            teknisi_id = teknisis[Math.floor(Math.random() * teknisis.length)].id;
        }

        const perangkat = perangkats[i % perangkats.length];
        
        // Dummy photos using Picsum with random seeds
        const foto_kondisi = JSON.stringify([
            `https://picsum.photos/seed/servio_ticket_${i}_1/800/600`,
            `https://picsum.photos/seed/servio_ticket_${i}_2/800/600`
        ]);

        const tiket = await prisma.tiketServis.create({
            data: {
                nomor_tiket: generateNomorTiket(),
                perangkat_id: perangkat.id,
                teknisi_id: teknisi_id,
                keluhan: keluhanList[i % keluhanList.length],
                kelengkapan: kelengkapanList[i % kelengkapanList.length],
                foto_kondisi: foto_kondisi,
                status: status,
                created_at: randomDate(new Date(Date.now() - 30 * 86400000), new Date(Date.now() - 2 * 86400000))
            }
        });

        // Add Diagnosis if past 'diterima'
        if (status !== "diterima") {
            await prisma.diagnosis.create({
                data: {
                    tiket_id: tiket.id,
                    masalah: "Analisis teknis: Ditemukan komponen bermasalah yang menyebabkan kendala sesuai keluhan pelanggan.",
                    solusi: "Melakukan penggantian komponen dan pembersihan menyeluruh pada perangkat.",
                    estimasi_biaya: 250000 + (Math.floor(Math.random() * 10) * 50000)
                }
            });
        }

        // Add Log Perbaikan if in progress or further
        if (["dalam_perbaikan", "selesai", "diambil"].includes(status)) {
            await prisma.logPerbaikan.createMany({
                data: [
                    { tiket_id: tiket.id, catatan: "Membongkar casing dan mengecek jalur kelistrikan utama.", created_at: randomDate(new Date(Date.now() - 10 * 86400000), new Date(Date.now() - 8 * 86400000)) },
                    { tiket_id: tiket.id, catatan: "Melakukan penggantian part yang rusak dan menguji fungsi dasar.", created_at: randomDate(new Date(Date.now() - 7 * 86400000), new Date(Date.now() - 5 * 86400000)) }
                ]
            });
        }

        // Add Invoice if completed
        if (["selesai", "diambil"].includes(status)) {
            await prisma.invoice.create({
                data: {
                    tiket_id: tiket.id,
                    biaya_jasa: 150000,
                    biaya_sparepart: 300000,
                    total_biaya: 450000,
                    created_at: new Date()
                }
            });
        }
    }

    console.log("6. Membuat Activity Logs...");
    const actions = ["Login sistem", "Membuat Tiket Baru", "Update Status Tiket", "Menambahkan Diagnosis", "Menambahkan Log Perbaikan", "Membuat Invoice", "Logout sistem"];
    const entities = ["User Auth", "TiketServis", "Diagnosis", "LogPerbaikan", "Invoice"];
    
    for (let i = 0; i < 30; i++) {
        const user = i % 2 === 0 ? admin : teknisis[Math.floor(Math.random() * teknisis.length)];
        const actionIdx = Math.floor(Math.random() * actions.length);
        const entityIdx = Math.floor(Math.random() * entities.length);
        
        await prisma.activityLog.create({
            data: {
                user_id: user.id,
                user_nama: user.nama,
                action: actions[actionIdx],
                entity: entities[entityIdx],
                created_at: randomDate(new Date(Date.now() - 30 * 86400000), new Date())
            }
        });
    }

    console.log("Seeding data realistis berhasil diselesaikan! 🚀");
}

main()
    .catch((e) => {
        console.error("Gagal melakukan seeding data:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
