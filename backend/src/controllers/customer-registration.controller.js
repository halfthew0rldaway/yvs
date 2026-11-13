const prisma = require("../config/database");
const { broadcast } = require("../utils/sse");
const {
    normalizePhone, normalizeName, normalizeText, normalizeBrand,
    normalizeDeviceType, normalizeSerialNumber
} = require("../utils/normalize");

function validateSubmission(body) {
    const value = {
        nama: normalizeName(body.nama),
        nomor_telepon: normalizePhone(body.nomor_telepon),
        alamat: normalizeText(body.alamat),
        jenis_perangkat: normalizeDeviceType(body.jenis_perangkat),
        merek: normalizeBrand(body.merek),
        model: normalizeText(body.model),
        keluhan: normalizeText(body.keluhan),
        harapan: normalizeText(body.harapan)
    };
    if (value.nama.length < 3 || value.nama.length > 100) return "Nama harus 3-100 karakter";
    if (!/^0[0-9]{8,13}$/.test(value.nomor_telepon)) return "Nomor telepon tidak valid";
    if (!value.alamat) return "Alamat wajib diisi";
    if (value.alamat.length > 255) return "Alamat maksimal 255 karakter";
    if (typeof body.jenis_perangkat !== "string" || !body.jenis_perangkat.trim() || value.jenis_perangkat.length > 80) return "Jenis perangkat wajib diisi";
    if (!value.merek || value.merek.length > 100) return "Merek perangkat wajib diisi (maksimal 100 karakter)";
    if (!value.model || value.model.length > 100) return "Model perangkat wajib diisi (maksimal 100 karakter)";
    if (value.keluhan.length < 10 || value.keluhan.length > 1000) return "Keluhan harus 10-1000 karakter";
    if (value.harapan.length > 1000) return "Harapan maksimal 1000 karakter";
    return value;
}

const registrationSelect = {
    id: true, status: true, submitted_at: true, nama: true,
    nomor_telepon: true, alamat: true, jenis_perangkat: true,
    merek: true, model: true, serial_number: true, keluhan: true,
    harapan: true,
    customer: { select: { id: true, nama: true, nomor_telepon: true } },
    perangkat: { select: { id: true, jenis_perangkat: true, merek: true, model: true, serial_number: true } }
};

// The poster URL is stable. A public submission only enters the review queue;
// unverified input never creates canonical customer or device records.
async function submit(req, res) {
    res.set("Cache-Control", "no-store");
    if (req.body?.website) return res.status(201).json({ message: "Data berhasil dikirim ke petugas." }); // Honeypot
    const value = validateSubmission(req.body || {});
    if (typeof value === "string") return res.status(400).json({ message: value });
    try {
        await prisma.customerRegistration.create({
            data: {
                ...value, pending_phone: value.nomor_telepon, status: "pending",
                submitted_at: new Date()
            }
        });
        broadcast("registration:updated");
        return res.status(201).json({ message: "Data berhasil dikirim. Petugas akan memeriksa data Anda sebelum menyimpannya sebagai pelanggan dan perangkat." });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({ message: "Data dengan nomor ini sudah menunggu pemeriksaan petugas. Silakan hubungi petugas jika perlu mengubahnya." });
        }
        console.error("Customer registration submission failed", error);
        return res.status(500).json({ message: "Gagal mengirim data. Silakan coba lagi atau hubungi petugas." });
    }
}

async function pending(req, res) {
    try {
        const where = { status: { in: ["pending", "accepted"] }, submitted_at: { not: null }, ticket_id: null };
        const offset = Math.max(0, Math.min(10000, Number.parseInt(req.query.offset, 10) || 0));
        const limit = Math.max(1, Math.min(500, Number.parseInt(req.query.limit, 10) || 50));
        const [rows, total] = await prisma.$transaction([
            prisma.customerRegistration.findMany({
            where,
            select: registrationSelect,
            orderBy: [{ submitted_at: "desc" }, { id: "desc" }], skip: offset, take: limit
            }),
            prisma.customerRegistration.count({ where })
        ]);
        res.set("Cache-Control", "no-store").json({ rows, total });
    } catch (error) {
        console.error("Could not list customer registrations", error);
        res.status(500).json({ message: "Gagal memuat pendaftaran" });
    }
}

async function getOne(req, res) {
    try {
        const row = await prisma.customerRegistration.findFirst({
            where: { id: Number(req.params.id), status: { in: ["pending", "accepted"] }, ticket_id: null },
            select: registrationSelect
        });
        if (!row) return res.status(404).json({ message: "Pendaftaran tidak ditemukan" });
        res.set("Cache-Control", "no-store").json(row);
    } catch (error) {
        res.status(500).json({ message: "Gagal memuat pendaftaran" });
    }
}

async function accept(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "ID pendaftaran tidak valid" });
    if (req.body?.serial_number != null && typeof req.body.serial_number !== "string") {
        return res.status(400).json({ message: "Nomor seri tidak valid" });
    }
    const serial_number = normalizeSerialNumber(req.body?.serial_number);
    if (serial_number && serial_number.length > 100) return res.status(400).json({ message: "Nomor seri maksimal 100 karakter" });
    try {
        const result = await prisma.$transaction(async (tx) => {
            const claimed = await tx.customerRegistration.updateMany({
                where: { id, status: "pending", ticket_id: null },
                data: { status: "processing", pending_phone: null }
            });
            if (claimed.count !== 1) throw Object.assign(new Error("Pendaftaran sudah diproses atau tidak ditemukan"), { status: 409 });
            const row = await tx.customerRegistration.findUnique({ where: { id } });
            if (!row.nama || !row.nomor_telepon || !row.alamat || !row.merek || !row.model || !row.keluhan) {
                throw Object.assign(new Error("Data pendaftaran tidak lengkap"), { status: 400 });
            }
            let customer = await tx.customer.findFirst({ where: { nomor_telepon: row.nomor_telepon } });
            if (!customer) {
                customer = await tx.customer.create({
                    data: { nama: row.nama, nomor_telepon: row.nomor_telepon, alamat: row.alamat }
                });
            }
            let perangkat = serial_number
                ? await tx.perangkat.findFirst({ where: { customer_id: customer.id, serial_number } })
                : null;
            if (!perangkat) {
                perangkat = await tx.perangkat.create({
                    data: {
                        customer_id: customer.id, jenis_perangkat: row.jenis_perangkat,
                        merek: row.merek, model: row.model, serial_number
                    }
                });
            }
            return tx.customerRegistration.update({
                where: { id },
                data: {
                    status: "accepted", reviewed_at: new Date(), reviewed_by: req.user.id,
                    customer_id: customer.id, perangkat_id: perangkat.id, serial_number
                },
                select: registrationSelect
            });
        });
        broadcast("registration:updated");
        return res.json(result);
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        console.error("Customer registration acceptance failed", error);
        return res.status(500).json({ message: "Gagal menyimpan pelanggan dan perangkat" });
    }
}

async function reject(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "ID pendaftaran tidak valid" });
    try {
        const result = await prisma.customerRegistration.updateMany({
            where: { id, status: "pending", ticket_id: null },
            data: { status: "rejected", pending_phone: null, reviewed_at: new Date(), reviewed_by: req.user.id }
        });
        if (!result.count) return res.status(409).json({ message: "Pendaftaran sudah diproses atau tidak ditemukan" });
        broadcast("registration:updated");
        return res.json({ message: "Pendaftaran ditolak" });
    } catch (error) {
        return res.status(500).json({ message: "Gagal menolak pendaftaran" });
    }
}

module.exports = { submit, pending, getOne, accept, reject, validateSubmission };
