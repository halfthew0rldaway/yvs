const prisma = require("../config/database");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");

// Mengambil seluruh entri wiki reparasi (dengan filter dan pagination)
async function getAll(req, res) {
    try {
        const { search, merek, kategori, tingkat_kesulitan } = req.query;
        const { isPaginated, page, limit, skip } = parsePagination(req.query);
        const where = {};

        if (merek && merek !== "all") {
            where.merek = { equals: merek };
        }

        if (kategori && kategori !== "all") {
            where.kategori = { equals: kategori };
        }

        if (tingkat_kesulitan && tingkat_kesulitan !== "all") {
            where.tingkat_kesulitan = { equals: tingkat_kesulitan };
        }

        if (search && search.trim() !== "") {
            const q = search.trim();
            where.OR = [
                { judul: { contains: q } },
                { gejala: { contains: q } },
                { penyebab: { contains: q } },
                { solusi_langkah: { contains: q } },
                { komponen_terkait: { contains: q } },
                { model_seri: { contains: q } },
                { merek: { contains: q } },
            ];
        }

        const include = {
            user: { select: { id: true, nama: true, role: true } },
            brand: { select: { id: true, nama: true } }
        };

        const orderBy = { created_at: "desc" };

        if (!isPaginated) {
            const wikis = await prisma.repairWiki.findMany({
                where,
                include,
                orderBy
            });
            return res.json(wikis);
        }

        const [total, wikis] = await Promise.all([
            prisma.repairWiki.count({ where }),
            prisma.repairWiki.findMany({
                where,
                include,
                orderBy,
                skip,
                take: limit
            })
        ]);

        return res.json(buildPaginationResponse(wikis, total, page, limit));
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan saat memuat wiki reparasi", error: error.message });
    }
}

// Mengambil saran wiki otomatis berdasarkan merek & model perangkat tiket
async function getSuggestions(req, res) {
    try {
        const { merek, model: modelSeri, keluhan } = req.query;

        const whereConditions = [];

        if (merek && merek.trim() !== "") {
            whereConditions.push({ merek: { contains: merek.trim() } });
        }

        if (modelSeri && modelSeri.trim() !== "") {
            // Split model terms (e.g., "TUF Gaming FX505" -> ["TUF", "FX505"])
            const terms = modelSeri.trim().split(/\s+/).filter(t => t.length > 2);
            terms.forEach(term => {
                whereConditions.push({ model_seri: { contains: term } });
                whereConditions.push({ judul: { contains: term } });
            });
        }

        if (keluhan && keluhan.trim() !== "") {
            const keywords = keluhan.trim().split(/\s+/).filter(k => k.length > 3);
            keywords.slice(0, 3).forEach(kw => {
                whereConditions.push({ gejala: { contains: kw } });
            });
        }

        if (whereConditions.length === 0) {
            return res.json([]);
        }

        const wikis = await prisma.repairWiki.findMany({
            where: {
                OR: whereConditions
            },
            include: {
                user: { select: { id: true, nama: true } },
                brand: { select: { id: true, nama: true } }
            },
            orderBy: { tingkat_sukses: "desc" },
            take: 6
        });

        return res.json(wikis);
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat saran wiki", error: error.message });
    }
}

// Mengambil detail satu entri wiki
async function getById(req, res) {
    try {
        const id = Number(req.params.id);
        const wiki = await prisma.repairWiki.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, nama: true, role: true } },
                brand: { select: { id: true, nama: true } }
            }
        });

        if (!wiki) {
            return res.status(404).json({ message: "Catatan wiki reparasi tidak ditemukan" });
        }

        return res.json(wiki);
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

// Menambahkan entri wiki baru
async function create(req, res) {
    try {
        const {
            brand_id,
            merek,
            model_seri,
            kategori,
            judul,
            gejala,
            penyebab,
            solusi_langkah,
            komponen_terkait,
            tingkat_kesulitan,
            estimasi_waktu,
            tingkat_sukses,
            sumber_tiket_id
        } = req.body;

        if (!judul || !gejala || !solusi_langkah) {
            return res.status(400).json({ message: "Judul, Gejala, dan Langkah Solusi wajib diisi!" });
        }

        let resolvedBrandId = brand_id ? Number(brand_id) : null;
        if (!resolvedBrandId && merek) {
            const foundBrand = await prisma.brand.findFirst({
                where: { nama: { equals: merek.trim() } }
            });
            if (foundBrand) resolvedBrandId = foundBrand.id;
        }

        const wiki = await prisma.repairWiki.create({
            data: {
                brand_id: resolvedBrandId,
                merek: merek || null,
                model_seri: model_seri || "Umum",
                kategori: kategori || "Motherboard / Power",
                judul,
                gejala,
                penyebab: penyebab || null,
                solusi_langkah,
                komponen_terkait: komponen_terkait || null,
                tingkat_kesulitan: tingkat_kesulitan || "Menengah",
                estimasi_waktu: estimasi_waktu || "1-2 Jam",
                tingkat_sukses: tingkat_sukses ? Number(tingkat_sukses) : 90,
                sumber_tiket_id: sumber_tiket_id ? Number(sumber_tiket_id) : null,
                user_id: req.user.id
            },
            include: {
                user: { select: { id: true, nama: true } },
                brand: true
            }
        });

        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama || "User",
                action: `Menambahkan panduan wiki reparasi: "${judul}" (${merek || "Umum"} ${model_seri || ""})`,
                entity: `Wiki #${wiki.id}`
            }
        });

        return res.status(201).json({ message: "Panduan wiki berhasil disimpan", data: wiki });
    } catch (error) {
        return res.status(500).json({ message: "Gagal menyimpan panduan wiki", error: error.message });
    }
}

// Simpan solusi langsung dari tiket servis ke Wiki Reparasi Toko
async function createFromTicket(req, res) {
    try {
        const tiketId = Number(req.params.tiketId);
        const { judul, tingkat_kesulitan, komponen_terkait } = req.body;

        const tiket = await prisma.tiketServis.findUnique({
            where: { id: tiketId },
            include: {
                perangkat: { include: { customer: true } },
                diagnosis: true,
                log_perbaikan: { orderBy: { created_at: "desc" } }
            }
        });

        if (!tiket) {
            return res.status(404).json({ message: "Tiket servis tidak ditemukan" });
        }

        if (!tiket.diagnosis && (!tiket.log_perbaikan || tiket.log_perbaikan.length === 0)) {
            return res.status(400).json({ message: "Tiket ini belum memiliki catatan diagnosis atau solusi perbaikan yang dapat disalin ke wiki." });
        }

        const logSolutions = (tiket.log_perbaikan || [])
            .filter(l => l.catatan && l.catatan.trim() !== "")
            .map(l => `[${l.fase}] ${l.catatan}`)
            .join("\n\n");

        const autoJudul = judul || `Solusi ${tiket.diagnosis?.masalah || tiket.keluhan || "Kerusakan"} pada ${tiket.perangkat.merek} ${tiket.perangkat.model}`;
        const autoGejala = tiket.keluhan || tiket.diagnosis?.masalah || "Gejala awal unit bermasalah";
        const autoPenyebab = tiket.diagnosis?.masalah || "Hasil pemeriksaan teknis";
        const autoSolusi = tiket.diagnosis?.solusi 
            ? `${tiket.diagnosis.solusi}\n\nRiwayat Catatan Teknisi:\n${logSolutions}`
            : (logSolutions || "Langkah-langkah perbaikan sesuai SOP teknisi.");

        // Cari brand matching
        const foundBrand = await prisma.brand.findFirst({
            where: { nama: { equals: tiket.perangkat.merek.trim() } }
        });

        const wiki = await prisma.repairWiki.create({
            data: {
                brand_id: foundBrand ? foundBrand.id : null,
                merek: tiket.perangkat.merek,
                model_seri: tiket.perangkat.model,
                kategori: tiket.kategori_perbaikan || "Motherboard / Power",
                judul: autoJudul,
                gejala: autoGejala,
                penyebab: autoPenyebab,
                solusi_langkah: autoSolusi,
                komponen_terkait: komponen_terkait || null,
                tingkat_kesulitan: tingkat_kesulitan || "Menengah",
                estimasi_waktu: "1-2 Jam",
                tingkat_sukses: 95,
                sumber_tiket_id: tiket.id,
                user_id: req.user.id
            },
            include: {
                user: { select: { id: true, nama: true } },
                brand: true
            }
        });

        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama || "User",
                action: `Mengonversi solusi Tiket #${tiket.nomor_tiket} menjadi Pustaka Wiki: "${wiki.judul}"`,
                entity: `Wiki #${wiki.id}`
            }
        });

        return res.status(201).json({ message: "Berhasil menyimpan solusi tiket ke Pustaka Wiki Toko!", data: wiki });
    } catch (error) {
        return res.status(500).json({ message: "Gagal menyimpan solusi ke wiki", error: error.message });
    }
}

// Memperbarui entri wiki
async function update(req, res) {
    try {
        const id = Number(req.params.id);
        const {
            merek,
            model_seri,
            kategori,
            judul,
            gejala,
            penyebab,
            solusi_langkah,
            komponen_terkait,
            tingkat_kesulitan,
            estimasi_waktu,
            tingkat_sukses
        } = req.body;

        const existing = await prisma.repairWiki.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Entri wiki tidak ditemukan" });
        }

        const updated = await prisma.repairWiki.update({
            where: { id },
            data: {
                merek: merek !== undefined ? merek : undefined,
                model_seri: model_seri !== undefined ? model_seri : undefined,
                kategori: kategori !== undefined ? kategori : undefined,
                judul: judul !== undefined ? judul : undefined,
                gejala: gejala !== undefined ? gejala : undefined,
                penyebab: penyebab !== undefined ? penyebab : undefined,
                solusi_langkah: solusi_langkah !== undefined ? solusi_langkah : undefined,
                komponen_terkait: komponen_terkait !== undefined ? komponen_terkait : undefined,
                tingkat_kesulitan: tingkat_kesulitan !== undefined ? tingkat_kesulitan : undefined,
                estimasi_waktu: estimasi_waktu !== undefined ? estimasi_waktu : undefined,
                tingkat_sukses: tingkat_sukses !== undefined ? Number(tingkat_sukses) : undefined,
            },
            include: {
                user: { select: { id: true, nama: true } },
                brand: true
            }
        });

        return res.json({ message: "Panduan wiki berhasil diperbarui", data: updated });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memperbarui wiki", error: error.message });
    }
}

// Menghapus entri wiki
async function remove(req, res) {
    try {
        const id = Number(req.params.id);
        const existing = await prisma.repairWiki.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Entri wiki tidak ditemukan" });
        }

        // RBAC: Hanya admin atau pembuat yang boleh menghapus
        if (req.user.role !== "admin" && existing.user_id !== req.user.id) {
            return res.status(403).json({ message: "Akses ditolak: Anda tidak memiliki hak menghapus entri wiki ini" });
        }

        await prisma.repairWiki.delete({ where: { id } });

        await prisma.activityLog.create({
            data: {
                user_id: req.user.id,
                user_nama: req.user.nama || "User",
                action: `Menghapus panduan wiki: "${existing.judul}"`,
                entity: `Wiki #${id}`
            }
        });

        return res.json({ message: "Panduan wiki berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Gagal menghapus wiki", error: error.message });
    }
}

module.exports = {
    getAll,
    getSuggestions,
    getById,
    create,
    createFromTicket,
    update,
    remove
};

