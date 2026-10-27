const prisma = require("../src/config/database");
const {
    normalizePhone,
    normalizeName,
    normalizeText,
    normalizeBrand,
    normalizeSerialNumber,
    normalizeDeviceType
} = require("../src/utils/normalize");

/**
 * Script & function to safely normalize and standardize all existing database records.
 * Non-destructive: preserves all relations and foreign keys.
 */
async function runNormalization() {
    console.log("=== MEMULAI PROSES NORMALISASI DATA WORKSHOP ===");

    let customersUpdated = 0;
    let perangkatsUpdated = 0;
    let brandsUpdated = 0;

    // 1. Normalisasi Pelanggan
    const customers = await prisma.customer.findMany();
    console.log(`Memeriksa ${customers.length} data customer...`);

    for (const c of customers) {
        const cleanName = normalizeName(c.nama);
        const cleanPhone = normalizePhone(c.nomor_telepon);
        const cleanAlamat = c.alamat ? normalizeText(c.alamat) : null;

        if (c.nama !== cleanName || c.nomor_telepon !== cleanPhone || (c.alamat && c.alamat !== cleanAlamat)) {
            await prisma.customer.update({
                where: { id: c.id },
                data: {
                    nama: cleanName,
                    nomor_telepon: cleanPhone,
                    alamat: cleanAlamat
                }
            });
            customersUpdated++;
        }
    }
    console.log(`✓ Selesai normalisasi customer: ${customersUpdated} diperbarui.`);

    // 2. Normalisasi Perangkat
    const perangkats = await prisma.perangkat.findMany();
    console.log(`Memeriksa ${perangkats.length} data perangkat...`);

    for (const p of perangkats) {
        const cleanBrand = normalizeBrand(p.merek);
        const cleanJenis = normalizeDeviceType(p.jenis_perangkat);
        const cleanModel = normalizeText(p.model);
        const cleanSN = normalizeSerialNumber(p.serial_number);

        if (
            p.merek !== cleanBrand ||
            p.jenis_perangkat !== cleanJenis ||
            p.model !== cleanModel ||
            p.serial_number !== cleanSN
        ) {
            await prisma.perangkat.update({
                where: { id: p.id },
                data: {
                    merek: cleanBrand,
                    jenis_perangkat: cleanJenis,
                    model: cleanModel,
                    serial_number: cleanSN
                }
            });
            perangkatsUpdated++;
        }
    }
    console.log(`✓ Selesai normalisasi perangkat: ${perangkatsUpdated} diperbarui.`);

    // 3. Normalisasi Master Brand
    const brands = await prisma.brand.findMany();
    console.log(`Memeriksa ${brands.length} master brand...`);

    for (const b of brands) {
        const cleanBrandName = normalizeBrand(b.nama);
        if (b.nama !== cleanBrandName) {
            // Cek apakah target sudah ada untuk mencegah unique violation
            const conflict = await prisma.brand.findUnique({ where: { nama: cleanBrandName } });
            if (!conflict) {
                await prisma.brand.update({
                    where: { id: b.id },
                    data: { nama: cleanBrandName }
                });
                brandsUpdated++;
            }
        }
    }
    console.log(`✓ Selesai normalisasi master brand: ${brandsUpdated} diperbarui.`);

    console.log("=== NORMALISASI DATA SELESAI DENGAN SUKSES ===");
    return {
        totalCustomersChecked: customers.length,
        customersUpdated,
        totalPerangkatsChecked: perangkats.length,
        perangkatsUpdated,
        totalBrandsChecked: brands.length,
        brandsUpdated
    };
}

if (require.main === module) {
    runNormalization()
        .then((res) => {
            console.log("Hasil Normalisasi:", res);
            process.exit(0);
        })
        .catch((err) => {
            console.error("Gagal menjalankan normalisasi:", err);
            process.exit(1);
        });
}

module.exports = runNormalization;

