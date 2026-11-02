const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const prisma = require("../src/config/database");
const {
    normalizePhone,
    normalizeName,
    normalizeText,
    normalizeBrand,
    normalizeSerialNumber,
    normalizeDeviceType,
    normalizeSparepartCategory,
    normalizeLoanerCategory,
    normalizeWikiCategory,
    normalizeSupplierCategory,
    normalizeCourier,
    normalizeApplicantSource,
    normalizeEmail
} = require("../src/utils/normalize");

/**
 * Script & function to safely normalize and standardize all existing database records.
 * Non-destructive: preserves all relations, and smartly merges duplicate records (like duplicate brands).
 */
async function runNormalization() {
    console.log("=== MEMULAI PROSES NORMALISASI DATA WORKSHOP KOMPREHENSIF ===");

    let customersUpdated = 0;
    let perangkatsUpdated = 0;
    let brandsUpdated = 0;
    let brandsMerged = 0;
    let sparepartsUpdated = 0;
    let loanersUpdated = 0;
    let wikisUpdated = 0;
    let suppliersUpdated = 0;
    let rmaUpdated = 0;
    let usersUpdated = 0;
    let applicantsUpdated = 0;

    // 1. Normalisasi Master Brand & Deduplikasi (e.g. "asus" & "ASUS" di-merge ke "ASUS")
    const brands = await prisma.brand.findMany();
    console.log(`Memeriksa ${brands.length} master brand...`);

    for (const b of brands) {
        const cleanBrandName = normalizeBrand(b.nama);
        if (b.nama !== cleanBrandName) {
            // Cek apakah entri dengan nama kanonikal sudah ada di DB
            const existingCanonical = await prisma.brand.findUnique({
                where: { nama: cleanBrandName }
            });

            if (existingCanonical && existingCanonical.id !== b.id) {
                // Merge: pindahkan semua relasi sparepart & repairWiki ke brand kanonikal
                await prisma.sparepart.updateMany({
                    where: { brand_id: b.id },
                    data: { brand_id: existingCanonical.id }
                });
                await prisma.repairWiki.updateMany({
                    where: { brand_id: b.id },
                    data: { brand_id: existingCanonical.id }
                });
                // Hapus entri brand duplikat non-kanonikal
                await prisma.brand.delete({ where: { id: b.id } });
                brandsMerged++;
                console.log(`  ↪ Brand #${b.id} ("${b.nama}") berhasil digabung (merge) ke #${existingCanonical.id} ("${cleanBrandName}").`);
            } else {
                // Update ke nama kanonikal
                await prisma.brand.update({
                    where: { id: b.id },
                    data: { nama: cleanBrandName }
                });
                brandsUpdated++;
            }
        }
    }
    console.log(`✓ Master Brand: ${brandsUpdated} diperbarui, ${brandsMerged} duplikat di-merge.`);

    // 2. Normalisasi Pelanggan (Customer)
    const customers = await prisma.customer.findMany();
    console.log(`Memeriksa ${customers.length} data customer...`);

    for (const c of customers) {
        const cleanName = normalizeName(c.nama);
        const cleanPhone = normalizePhone(c.nomor_telepon);
        const cleanAlamat = c.alamat ? normalizeText(c.alamat) : null;
        const cleanCatatan = c.catatan_khusus ? normalizeText(c.catatan_khusus) : null;

        if (
            c.nama !== cleanName ||
            c.nomor_telepon !== cleanPhone ||
            c.alamat !== cleanAlamat ||
            c.catatan_khusus !== cleanCatatan
        ) {
            await prisma.customer.update({
                where: { id: c.id },
                data: {
                    nama: cleanName,
                    nomor_telepon: cleanPhone,
                    alamat: cleanAlamat,
                    catatan_khusus: cleanCatatan
                }
            });
            customersUpdated++;
        }
    }
    console.log(`✓ Selesai normalisasi customer: ${customersUpdated} diperbarui.`);

    // 3. Normalisasi Perangkat (Perangkat)
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

    // 4. Normalisasi Suku Cadang (Sparepart)
    const spareparts = await prisma.sparepart.findMany();
    console.log(`Memeriksa ${spareparts.length} data sparepart...`);

    for (const s of spareparts) {
        const cleanName = normalizeText(s.nama);
        const cleanCat = normalizeSparepartCategory(s.kategori);
        const cleanDistriName = s.distributor_nama ? normalizeText(s.distributor_nama) : null;
        const cleanDistriPhone = s.distributor_kontak ? normalizePhone(s.distributor_kontak) : null;

        if (
            s.nama !== cleanName ||
            s.kategori !== cleanCat ||
            s.distributor_nama !== cleanDistriName ||
            s.distributor_kontak !== cleanDistriPhone
        ) {
            await prisma.sparepart.update({
                where: { id: s.id },
                data: {
                    nama: cleanName,
                    kategori: cleanCat,
                    distributor_nama: cleanDistriName,
                    distributor_kontak: cleanDistriPhone
                }
            });
            sparepartsUpdated++;
        }
    }
    console.log(`✓ Selesai normalisasi sparepart: ${sparepartsUpdated} diperbarui.`);

    // 5. Normalisasi Unit Pinjaman (LoanerDevice)
    const loaners = await prisma.loanerDevice.findMany();
    console.log(`Memeriksa ${loaners.length} unit pinjaman...`);

    for (const ld of loaners) {
        const cleanKode = ld.kode_unit.trim().toUpperCase();
        const cleanNama = normalizeText(ld.nama);
        const cleanCat = normalizeLoanerCategory(ld.kategori);
        const cleanSN = normalizeSerialNumber(ld.serial_number);

        if (
            ld.kode_unit !== cleanKode ||
            ld.nama !== cleanNama ||
            ld.kategori !== cleanCat ||
            ld.serial_number !== cleanSN
        ) {
            await prisma.loanerDevice.update({
                where: { id: ld.id },
                data: {
                    kode_unit: cleanKode,
                    nama: cleanNama,
                    kategori: cleanCat,
                    serial_number: cleanSN
                }
            });
            loanersUpdated++;
        }
    }
    console.log(`✓ Selesai normalisasi loaner device: ${loanersUpdated} diperbarui.`);

    // 6. Normalisasi Repair Wiki
    const wikis = await prisma.repairWiki.findMany();
    console.log(`Memeriksa ${wikis.length} catatan repair wiki...`);

    for (const w of wikis) {
        const cleanBrand = w.merek ? normalizeBrand(w.merek) : null;
        const cleanCat = normalizeWikiCategory(w.kategori);
        const cleanModel = w.model_seri ? normalizeText(w.model_seri) : null;
        const cleanJudul = normalizeText(w.judul);

        if (
            w.merek !== cleanBrand ||
            w.kategori !== cleanCat ||
            w.model_seri !== cleanModel ||
            w.judul !== cleanJudul
        ) {
            await prisma.repairWiki.update({
                where: { id: w.id },
                data: {
                    merek: cleanBrand,
                    kategori: cleanCat,
                    model_seri: cleanModel,
                    judul: cleanJudul
                }
            });
            wikisUpdated++;
        }
    }
    console.log(`✓ Selesai normalisasi repair wiki: ${wikisUpdated} diperbarui.`);

    // 7. Normalisasi Distributor & Supplier
    const suppliers = await prisma.supplier.findMany();
    console.log(`Memeriksa ${suppliers.length} data distributor/supplier...`);

    for (const sp of suppliers) {
        const cleanName = normalizeText(sp.nama);
        const cleanCat = normalizeSupplierCategory(sp.kategori);
        const cleanPic = sp.kontak_person ? normalizeName(sp.kontak_person) : null;
        const cleanPhone = sp.telepon ? normalizePhone(sp.telepon) : null;
        const cleanMail = sp.email ? normalizeEmail(sp.email) : null;

        if (
            sp.nama !== cleanName ||
            sp.kategori !== cleanCat ||
            sp.kontak_person !== cleanPic ||
            sp.telepon !== cleanPhone ||
            sp.email !== cleanMail
        ) {
            await prisma.supplier.update({
                where: { id: sp.id },
                data: {
                    nama: cleanName,
                    kategori: cleanCat,
                    kontak_person: cleanPic,
                    telepon: cleanPhone,
                    email: cleanMail
                }
            });
            suppliersUpdated++;
        }
    }
    console.log(`✓ Selesai normalisasi supplier: ${suppliersUpdated} diperbarui.`);

    // 8. Normalisasi Klaim Garansi Distributor (SupplierRma)
    const rmaList = await prisma.supplierRma.findMany();
    console.log(`Memeriksa ${rmaList.length} data klaim RMA...`);

    for (const rma of rmaList) {
        const cleanSupplier = normalizeText(rma.supplier_nama);
        const cleanSnLama = normalizeSerialNumber(rma.serial_number_lama);
        const cleanSnBaru = normalizeSerialNumber(rma.serial_number_baru);
        const cleanCustomerKontak = rma.customer_kontak ? normalizePhone(rma.customer_kontak) : null;
        const cleanKurir = rma.kurir_pengiriman ? normalizeCourier(rma.kurir_pengiriman) : null;
        const cleanResi = rma.resi_pengiriman ? rma.resi_pengiriman.trim().toUpperCase() : null;

        if (
            rma.supplier_nama !== cleanSupplier ||
            rma.serial_number_lama !== cleanSnLama ||
            rma.serial_number_baru !== cleanSnBaru ||
            rma.customer_kontak !== cleanCustomerKontak ||
            rma.kurir_pengiriman !== cleanKurir ||
            rma.resi_pengiriman !== cleanResi
        ) {
            await prisma.supplierRma.update({
                where: { id: rma.id },
                data: {
                    supplier_nama: cleanSupplier,
                    serial_number_lama: cleanSnLama,
                    serial_number_baru: cleanSnBaru,
                    customer_kontak: cleanCustomerKontak,
                    kurir_pengiriman: cleanKurir,
                    resi_pengiriman: cleanResi
                }
            });
            rmaUpdated++;
        }
    }
    console.log(`✓ Selesai normalisasi RMA: ${rmaUpdated} diperbarui.`);

    // 9. Normalisasi Akun User
    const users = await prisma.user.findMany();
    console.log(`Memeriksa ${users.length} data user...`);

    for (const u of users) {
        const cleanMail = normalizeEmail(u.email);
        const cleanName = normalizeName(u.nama);
        const cleanRole = u.role.trim().toLowerCase();

        if (u.email !== cleanMail || u.nama !== cleanName || u.role !== cleanRole) {
            await prisma.user.update({
                where: { id: u.id },
                data: {
                    email: cleanMail,
                    nama: cleanName,
                    role: cleanRole
                }
            });
            usersUpdated++;
        }
    }
    console.log(`✓ Selesai normalisasi user: ${usersUpdated} diperbarui.`);

    // 10. Normalisasi Pelamar Rekrutmen (Applicant)
    const applicants = await prisma.applicant.findMany();
    console.log(`Memeriksa ${applicants.length} data pelamar...`);

    for (const a of applicants) {
        const cleanName = normalizeName(a.nama_lengkap);
        const cleanMail = a.email ? normalizeEmail(a.email) : null;
        const cleanPhone = normalizePhone(a.nomor_telepon);
        const cleanSource = normalizeApplicantSource(a.sumber_lamaran);

        if (
            a.nama_lengkap !== cleanName ||
            a.email !== cleanMail ||
            a.nomor_telepon !== cleanPhone ||
            a.sumber_lamaran !== cleanSource
        ) {
            await prisma.applicant.update({
                where: { id: a.id },
                data: {
                    nama_lengkap: cleanName,
                    email: cleanMail,
                    nomor_telepon: cleanPhone,
                    sumber_lamaran: cleanSource
                }
            });
            applicantsUpdated++;
        }
    }
    console.log(`✓ Selesai normalisasi pelamar: ${applicantsUpdated} diperbarui.`);

    console.log("=== NORMALISASI DATA SELESAI DENGAN SUKSES ===");
    return {
        totalCustomersChecked: customers.length,
        customersUpdated,
        totalPerangkatsChecked: perangkats.length,
        perangkatsUpdated,
        totalBrandsChecked: brands.length,
        brandsUpdated,
        brandsMerged,
        totalSparepartsChecked: spareparts.length,
        sparepartsUpdated,
        totalLoanersChecked: loaners.length,
        loanersUpdated,
        totalWikisChecked: wikis.length,
        wikisUpdated,
        totalSuppliersChecked: suppliers.length,
        suppliersUpdated,
        totalRmaChecked: rmaList.length,
        rmaUpdated,
        totalUsersChecked: users.length,
        usersUpdated,
        totalApplicantsChecked: applicants.length,
        applicantsUpdated
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
