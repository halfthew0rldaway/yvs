const fs = require('fs');
const oldSeed = fs.readFileSync('seed_backup.js', 'utf8');

// We will inject a new TiketServis generation block.
let headerAndVars = oldSeed.split('console.log("5. Membuat Tiket Servis, Diagnosis, Log Perbaikan, Penggunaan Sparepart, dan Invoice...");')[0];

const newGenerationBlock = `
    console.log("5. Membuat Tiket Servis, Diagnosis, Log Perbaikan, Penggunaan Sparepart, dan Invoice...");
    
    // Helper for numbering
    let count = 0;
    const generateNomorTiket = () => {
        count++;
        return \`SRV-\${new Date().getFullYear()}-\${String(count).padStart(3, '0')}\`;
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
            \`https://picsum.photos/seed/servio_ticket_\${i}_1/800/600\`,
            \`https://picsum.photos/seed/servio_ticket_\${i}_2/800/600\`
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
`;

fs.writeFileSync('seed.js', headerAndVars + newGenerationBlock);
console.log("seed.js updated!");
