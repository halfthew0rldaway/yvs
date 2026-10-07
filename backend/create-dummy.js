const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Mencari customer yang ada...");
    const customer = await prisma.customer.findFirst();
    if (!customer) {
        console.log("Belum ada data customer di database!");
        return;
    }

    console.log("Membuat 2 perangkat baru...");
    const p1 = await prisma.perangkat.create({
        data: {
            customer_id: customer.id,
            jenis_perangkat: "Laptop",
            merek: "Asus",
            model: "ROG Strix",
            serial_number: "ROG-" + Math.floor(Math.random() * 10000)
        }
    });

    const p2 = await prisma.perangkat.create({
        data: {
            customer_id: customer.id,
            jenis_perangkat: "Smartphone",
            merek: "Samsung",
            model: "Galaxy S23",
            serial_number: "S23-" + Math.floor(Math.random() * 10000)
        }
    });

    console.log("Membuat 2 tiket servis baru (tanpa teknisi / unassigned)...");
    await prisma.tiketServis.create({
        data: {
            nomor_tiket: "SRV-" + Date.now().toString().slice(-6) + "1",
            perangkat_id: p1.id,
            teknisi_id: null, // belum ditugaskan
            keluhan: "Layar ngeblank saat dinyalakan, padahal kipasnya nyala kenceng.",
            status: "diterima"
        }
    });

    await prisma.tiketServis.create({
        data: {
            nomor_tiket: "SRV-" + Date.now().toString().slice(-6) + "2",
            perangkat_id: p2.id,
            teknisi_id: null, // belum ditugaskan
            keluhan: "Sering restart sendiri kalau buka aplikasi berat, dan port charger longgar.",
            status: "diterima"
        }
    });

    console.log("Berhasil! Silakan cek di browser, seharusnya ada notifikasi (badge) 2 tiket baru di tab 'Diterima'.");
}

main()
    .catch((e) => {
        console.error("Terjadi error:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
