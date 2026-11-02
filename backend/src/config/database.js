const { PrismaClient } = require("@prisma/client");
const {
    normalizeBrand,
    normalizeDeviceType,
    normalizeSerialNumber,
    normalizeText,
    normalizeName,
    normalizePhone,
    normalizeEmail,
    normalizeSparepartCategory,
    normalizeLoanerCategory,
    normalizeWikiCategory,
    normalizeSupplierCategory,
    normalizeCourier,
    normalizeApplicantSource
} = require("../utils/normalize");

const basePrisma = new PrismaClient();

/**
 * Normalizer data sebelum query SQL dieksekusi oleh Prisma.
 * Menjamin 100% data tersimpan dalam bentuk kanonikal dan terstandarisasi.
 */
function normalizeModelData(modelName, data) {
    if (!data || typeof data !== "object") return data;
    if (Array.isArray(data)) {
        return data.map(item => normalizeModelData(modelName, item));
    }
    const d = { ...data };

    switch (modelName) {
        case "Perangkat":
            if (typeof d.merek === "string") d.merek = normalizeBrand(d.merek);
            if (typeof d.jenis_perangkat === "string") d.jenis_perangkat = normalizeDeviceType(d.jenis_perangkat);
            if (typeof d.model === "string") d.model = normalizeText(d.model);
            if (d.serial_number !== undefined) d.serial_number = normalizeSerialNumber(d.serial_number);
            break;

        case "Customer":
            if (typeof d.nama === "string") d.nama = normalizeName(d.nama);
            if (typeof d.nomor_telepon === "string") d.nomor_telepon = normalizePhone(d.nomor_telepon);
            if (typeof d.alamat === "string") d.alamat = normalizeText(d.alamat);
            if (typeof d.catatan_khusus === "string") d.catatan_khusus = normalizeText(d.catatan_khusus);
            break;

        case "Brand":
            if (typeof d.nama === "string") d.nama = normalizeBrand(d.nama);
            break;

        case "Sparepart":
            if (typeof d.nama === "string") d.nama = normalizeText(d.nama);
            if (typeof d.kategori === "string") d.kategori = normalizeSparepartCategory(d.kategori);
            if (typeof d.distributor_nama === "string") d.distributor_nama = normalizeText(d.distributor_nama);
            if (typeof d.distributor_kontak === "string") d.distributor_kontak = normalizePhone(d.distributor_kontak);
            break;

        case "LoanerDevice":
            if (typeof d.kode_unit === "string") d.kode_unit = d.kode_unit.trim().toUpperCase();
            if (typeof d.nama === "string") d.nama = normalizeText(d.nama);
            if (typeof d.kategori === "string") d.kategori = normalizeLoanerCategory(d.kategori);
            if (d.serial_number !== undefined) d.serial_number = normalizeSerialNumber(d.serial_number);
            break;

        case "RepairWiki":
            if (typeof d.merek === "string") d.merek = normalizeBrand(d.merek);
            if (typeof d.model_seri === "string") d.model_seri = normalizeText(d.model_seri);
            if (typeof d.kategori === "string") d.kategori = normalizeWikiCategory(d.kategori);
            if (typeof d.judul === "string") d.judul = normalizeText(d.judul);
            break;

        case "Supplier":
            if (typeof d.nama === "string") d.nama = normalizeText(d.nama);
            if (typeof d.kategori === "string") d.kategori = normalizeSupplierCategory(d.kategori);
            if (typeof d.kontak_person === "string") d.kontak_person = normalizeName(d.kontak_person);
            if (typeof d.telepon === "string") d.telepon = normalizePhone(d.telepon);
            if (typeof d.email === "string") d.email = normalizeEmail(d.email);
            break;

        case "SupplierRma":
            if (typeof d.supplier_nama === "string") d.supplier_nama = normalizeText(d.supplier_nama);
            if (d.serial_number_lama !== undefined) d.serial_number_lama = normalizeSerialNumber(d.serial_number_lama);
            if (d.serial_number_baru !== undefined) d.serial_number_baru = normalizeSerialNumber(d.serial_number_baru);
            if (typeof d.customer_nama === "string") d.customer_nama = normalizeName(d.customer_nama);
            if (typeof d.customer_kontak === "string") d.customer_kontak = normalizePhone(d.customer_kontak);
            if (typeof d.kurir_pengiriman === "string") d.kurir_pengiriman = normalizeCourier(d.kurir_pengiriman);
            if (typeof d.resi_pengiriman === "string") d.resi_pengiriman = d.resi_pengiriman.trim().toUpperCase();
            break;

        case "User":
            if (typeof d.nama === "string") d.nama = normalizeName(d.nama);
            if (typeof d.email === "string") d.email = normalizeEmail(d.email);
            if (typeof d.role === "string") d.role = d.role.trim().toLowerCase();
            break;

        case "Applicant":
            if (typeof d.nama_lengkap === "string") d.nama_lengkap = normalizeName(d.nama_lengkap);
            if (typeof d.email === "string") d.email = normalizeEmail(d.email);
            if (typeof d.nomor_telepon === "string") d.nomor_telepon = normalizePhone(d.nomor_telepon);
            if (typeof d.sumber_lamaran === "string") d.sumber_lamaran = normalizeApplicantSource(d.sumber_lamaran);
            break;

        case "TiketServis":
            if (typeof d.nomor_tiket === "string") d.nomor_tiket = d.nomor_tiket.trim().toUpperCase();
            break;
    }

    return d;
}

const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async create({ model, args, query }) {
                if (args.data) args.data = normalizeModelData(model, args.data);
                return query(args);
            },
            async createMany({ model, args, query }) {
                if (args.data) args.data = normalizeModelData(model, args.data);
                return query(args);
            },
            async update({ model, args, query }) {
                if (args.data) args.data = normalizeModelData(model, args.data);
                return query(args);
            },
            async updateMany({ model, args, query }) {
                if (args.data) args.data = normalizeModelData(model, args.data);
                return query(args);
            },
            async upsert({ model, args, query }) {
                if (args.create) args.create = normalizeModelData(model, args.create);
                if (args.update) args.update = normalizeModelData(model, args.update);
                return query(args);
            }
        }
    }
});

module.exports = prisma;
