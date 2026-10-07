require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Membuat tiket uji pengingat pengambilan (1, 2, dan 3 bulan)...");

    // Ambil customer & perangkat pertama atau buat baru jika tidak ada
    let customer = await prisma.customer.findFirst();
    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                nama: "Budi Test Reminder",
                nomor_telepon: "081234567890",
                alamat: "Jl. Test No. 123"
            }
        });
    }

    let perangkat = await prisma.perangkat.findFirst({ where: { customer_id: customer.id } });
    if (!perangkat) {
        perangkat = await prisma.perangkat.create({
            data: {
                customer_id: customer.id,
                jenis_perangkat: "Laptop",
                merek: "ASUS",
                model: "ROG Strix Test",
                serial_number: "TEST-REMINDER-001"
            }
        });
    }

    const teknisi = await prisma.user.findFirst({ where: { role: "teknisi" } });

    const now = new Date();

    const testTickets = [
        {
            label: "1 Bulan (35 Hari Lalu)",
            completedAgoDays: 35,
            lastReminder: 0,
            nomor: "TK-REM-1M-" + Math.floor(1000 + Math.random() * 9000),
        },
        {
            label: "2 Bulan (65 Hari Lalu)",
            completedAgoDays: 65,
            lastReminder: 0,
            nomor: "TK-REM-2M-" + Math.floor(1000 + Math.random() * 9000),
        },
        {
            label: "3 Bulan (95 Hari Lalu)",
            completedAgoDays: 95,
            lastReminder: 0,
            nomor: "TK-REM-3M-" + Math.floor(1000 + Math.random() * 9000),
        },
    ];

    for (const item of testTickets) {
        const completedDate = new Date(now.getTime() - item.completedAgoDays * 24 * 60 * 60 * 1000);
        const createdDate = new Date(completedDate.getTime() - 2 * 24 * 60 * 60 * 1000);

        const tiket = await prisma.tiketServis.create({
            data: {
                nomor_tiket: item.nomor,
                perangkat_id: perangkat.id,
                teknisi_id: teknisi ? teknisi.id : null,
                keluhan: `[TEST REMINDER] Unit selesai ${item.label} dan belum diambil customer.`,
                kelengkapan: "Unit + Charger",
                status: "selesai",
                created_at: createdDate,
                completed_at: completedDate,
                last_reminder_sent: item.lastReminder
            }
        });

        // Add diagnosis & invoice so detail view is complete
        await prisma.diagnosis.create({
            data: {
                tiket_id: tiket.id,
                masalah: "Perbaikan IC Power dan Reball GPU.",
                solusi: "Ganti IC Power baru dan pembersihan Thermal Paste.",
                estimasi_biaya: 450000
            }
        });

        await prisma.invoice.create({
            data: {
                tiket_id: tiket.id,
                biaya_jasa: 250000,
                biaya_sparepart: 200000,
                total_biaya: 450000,
                created_at: completedDate
            }
        });

        console.log(`✅ Berhasil membuat tiket test: ${tiket.nomor_tiket} (${item.label}) - ID: ${tiket.id}`);
    }

    console.log("\nSelesai menambahkan data test pengingat!");
}

main()
    .catch((e) => {
        console.error("Gagal menambahkan data test:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
