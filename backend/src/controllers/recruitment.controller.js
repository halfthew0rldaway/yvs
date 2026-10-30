const prisma = require("../config/database");
const bcrypt = require("bcrypt");

// Master seed initial positions based on Boss's Blueprint
const DEFAULT_JOBS = [
    {
        judul_posisi: "Teknisi Software & Sistem Operasi",
        departemen: "Teknisi",
        tipe_kerja: "Full Time",
        lokasi: "Workshop Utama",
        status: "Aktif",
        deskripsi: "Bertanggung jawab atas instalasi clean OS (Windows/Linux/macOS), backup & migrasi data aman, penanganan driver & BIOS update, pembersihan malware, serta optimalisasi sistem.",
        kualifikasi: "Paham troubleshooting software, partisi disk (GPT/MBR), integritas data tinggi, teliti, bersedia mematuhi 8-Point QC Checklist.",
        gaji_min: 2500000,
        gaji_max: 3800000
    },
    {
        judul_posisi: "Teknisi Hardware & Motherboard",
        departemen: "Teknisi",
        tipe_kerja: "Full Time",
        lokasi: "Workshop Utama",
        status: "Aktif",
        deskripsi: "Bertanggung jawab atas diagnosa level komponen (short circuit, VCore, 3V/5V rail), reballing/soldering, deep cleaning & repasting thermal, penggantian engsel, layar LCD, dan port I/O.",
        kualifikasi: "Mampu membaca skematik & boardview, terampil menggunakan multitester & solder station, memahami prinsip proteksi ESD.",
        gaji_min: 3000000,
        gaji_max: 5000000
    },
    {
        judul_posisi: "Frontdesk & Customer Service (Service Advisor)",
        departemen: "Frontliner",
        tipe_kerja: "Full Time",
        lokasi: "Workshop Utama",
        status: "Aktif",
        deskripsi: "Pintu gerbang pelayanan servis: menerima pelanggan dengan standar 3S, mencatat keluhan pada Defect Map, menerbitkan tanda terima BPBS, serta follow-up pengerjaan & retensi via WhatsApp.",
        kualifikasi: "Komunikasi ramah, berpenampilan rapi sesuai SOP Grooming, teliti, mampu menjelaskan kendala teknis secara sederhana kepada pelanggan awam.",
        gaji_min: 2300000,
        gaji_max: 3500000
    }
];

// Seed initial jobs if table is empty
async function ensureSeedJobs() {
    try {
        const count = await prisma.jobPosting.count();
        if (count === 0) {
            for (const job of DEFAULT_JOBS) {
                await prisma.jobPosting.create({ data: job });
            }
            console.log("✅ Seeded default KEOS Job Postings into database");
        }
    } catch (err) {
        console.warn("Could not check/seed JobPostings in DB:", err.message);
    }
}

ensureSeedJobs();

// GET recruitment overview metrics
async function getOverviewStats(req, res) {
    try {
        let totalApplicants = 0;
        let baruMasuk = 0;
        let screening = 0;
        let tesTeknis = 0;
        let trialWawancara = 0;
        let diterima = 0;
        let ditolak = 0;
        let activeJobsCount = 0;
        let sumberStats = [];

        try {
            totalApplicants = await prisma.applicant.count();
            baruMasuk = await prisma.applicant.count({ where: { status: "Baru Masuk" } });
            screening = await prisma.applicant.count({ where: { status: "Screening" } });
            tesTeknis = await prisma.applicant.count({ where: { status: "Tes Logika & Teknis" } });
            trialWawancara = await prisma.applicant.count({ where: { status: "Wawancara / Trial" } });
            diterima = await prisma.applicant.count({ where: { status: "Diterima" } });
            ditolak = await prisma.applicant.count({ where: { status: "Ditolak" } });
            activeJobsCount = await prisma.jobPosting.count({ where: { status: "Aktif" } });

            const sumberGroup = await prisma.applicant.groupBy({
                by: ["sumber_lamaran"],
                _count: { id: true }
            }).catch(() => []);

            sumberStats = (sumberGroup || []).map(g => ({
                sumber: g.sumber_lamaran || "Walk-in",
                total: g._count?.id || 0
            })).sort((a, b) => b.total - a.total);
        } catch (dbErr) {
            // In-memory defaults
            activeJobsCount = DEFAULT_JOBS.length;
        }

        res.json({
            success: true,
            data: {
                total_pelamar: totalApplicants,
                baru_masuk: baruMasuk,
                screening: screening,
                tes_teknis: tesTeknis,
                trial_wawancara: trialWawancara,
                diterima: diterima,
                ditolak: ditolak,
                lowongan_aktif: activeJobsCount,
                sumber_stats: sumberStats
            }
        });
    } catch (error) {
        console.error("Error fetching recruitment stats:", error);
        res.status(500).json({ success: false, message: "Gagal memuat statistik rekrutmen" });
    }
}

// GET all job postings
async function getJobPostings(req, res) {
    try {
        let jobs = [];
        try {
            jobs = await prisma.jobPosting.findMany({
                include: {
                    _count: {
                        select: { pelamar: true }
                    }
                },
                orderBy: { created_at: "desc" }
            });
        } catch (dbErr) {
            jobs = DEFAULT_JOBS.map((j, i) => ({ id: i + 1, ...j, _count: { pelamar: 0 } }));
        }

        res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat daftar lowongan" });
    }
}

// GET single job posting by ID
async function getJobById(req, res) {
    try {
        const id = parseInt(req.params.id);
        const job = await prisma.jobPosting.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { pelamar: true }
                }
            }
        });

        if (!job) {
            return res.status(404).json({ success: false, message: "Lowongan tidak ditemukan" });
        }

        res.json({
            success: true,
            data: job
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat detail lowongan" });
    }
}

// CREATE job posting
async function createJobPosting(req, res) {
    try {
        const { judul_posisi, departemen, tipe_kerja, lokasi, nomor_kontak, deskripsi, kualifikasi, gaji_min, gaji_max, status, external_links, iklan_template } = req.body;

        if (!judul_posisi || !departemen) {
            return res.status(400).json({ success: false, message: "Judul posisi dan departemen wajib diisi" });
        }

        const newJob = await prisma.jobPosting.create({
            data: {
                judul_posisi: judul_posisi.trim(),
                departemen: departemen.trim(),
                tipe_kerja: tipe_kerja || "Full Time",
                lokasi: lokasi || "Workshop Utama",
                nomor_kontak: nomor_kontak ? nomor_kontak.trim() : null,
                deskripsi: deskripsi?.trim() || null,
                kualifikasi: kualifikasi?.trim() || null,
                gaji_min: parseInt(gaji_min) || 0,
                gaji_max: parseInt(gaji_max) || 0,
                external_links: Array.isArray(external_links) ? external_links : null,
                iklan_template: iklan_template?.trim() || null,
                status: status || "Aktif"
            }
        });

        res.status(201).json({
            success: true,
            message: "Lowongan posisi berhasil ditambahkan",
            data: newJob
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal membuat lowongan baru" });
    }
}

// UPDATE job posting
async function updateJobPosting(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { judul_posisi, departemen, tipe_kerja, lokasi, nomor_kontak, deskripsi, kualifikasi, gaji_min, gaji_max, status, external_links, iklan_template } = req.body;

        const updated = await prisma.jobPosting.update({
            where: { id },
            data: {
                ...(judul_posisi && { judul_posisi: judul_posisi.trim() }),
                ...(departemen && { departemen: departemen.trim() }),
                ...(tipe_kerja && { tipe_kerja }),
                ...(lokasi && { lokasi }),
                ...(nomor_kontak !== undefined && { nomor_kontak: nomor_kontak ? nomor_kontak.trim() : null }),
                ...(deskripsi !== undefined && { deskripsi: deskripsi?.trim() || null }),
                ...(kualifikasi !== undefined && { kualifikasi: kualifikasi?.trim() || null }),
                ...(gaji_min !== undefined && { gaji_min: parseInt(gaji_min) || 0 }),
                ...(gaji_max !== undefined && { gaji_max: parseInt(gaji_max) || 0 }),
                ...(external_links !== undefined && { external_links: Array.isArray(external_links) ? external_links : null }),
                ...(iklan_template !== undefined && { iklan_template: iklan_template?.trim() || null }),
                ...(status && { status })
            }
        });

        res.json({
            success: true,
            message: "Data lowongan berhasil diperbarui",
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memperbarui lowongan" });
    }
}

// DELETE job posting
async function deleteJobPosting(req, res) {
    try {
        const id = parseInt(req.params.id);
        await prisma.jobPosting.delete({ where: { id } });
        res.json({ success: true, message: "Lowongan berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus lowongan" });
    }
}

// GET all applicants
async function getApplicants(req, res) {
    try {
        const { job_id, status, search, sumber } = req.query;
        const where = {};

        if (job_id && job_id !== "all") {
            where.job_posting_id = parseInt(job_id);
        }

        if (status && status !== "all") {
            where.status = status;
        }

        if (sumber && sumber !== "all") {
            where.sumber_lamaran = sumber;
        }

        if (search && search.trim() !== "") {
            const q = search.trim();
            where.OR = [
                { nama_lengkap: { contains: q } },
                { nomor_telepon: { contains: q } },
                { email: { contains: q } },
                { pendidikan: { contains: q } },
                { sumber_lamaran: { contains: q } }
            ];
        }

        let applicants = [];
        try {
            applicants = await prisma.applicant.findMany({
                where,
                include: {
                    job_posting: {
                        select: { id: true, judul_posisi: true, departemen: true }
                    },
                    user_hired: {
                        select: { id: true, nama: true, email: true, role: true }
                    }
                },
                orderBy: { created_at: "desc" }
            });
        } catch (dbErr) {
            applicants = [];
        }

        res.json({
            success: true,
            total: applicants.length,
            data: applicants
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat daftar pelamar" });
    }
}

// GET single applicant by ID
async function getApplicantById(req, res) {
    try {
        const id = parseInt(req.params.id);
        const applicant = await prisma.applicant.findUnique({
            where: { id },
            include: {
                job_posting: true,
                user_hired: {
                    select: { id: true, nama: true, email: true, role: true }
                }
            }
        });

        if (!applicant) {
            return res.status(404).json({ success: false, message: "Data pelamar tidak ditemukan" });
        }

        res.json({
            success: true,
            data: applicant
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat detail pelamar" });
    }
}

// CREATE applicant (Walk-in or Manual entry by Admin)
async function createApplicant(req, res) {
    try {
        const { job_posting_id, nama_lengkap, email, nomor_telepon, alamat, pendidikan, pengalaman_thn, resume_url, portofolio_url, status, sumber_lamaran } = req.body;

        if (!job_posting_id || !nama_lengkap || !nomor_telepon) {
            return res.status(400).json({ success: false, message: "Posisi lowongan, nama lengkap, dan nomor WhatsApp/telepon wajib diisi" });
        }

        const newApplicant = await prisma.applicant.create({
            data: {
                job_posting_id: parseInt(job_posting_id),
                nama_lengkap: nama_lengkap.trim(),
                email: email?.trim() || null,
                nomor_telepon: nomor_telepon.trim(),
                alamat: alamat?.trim() || null,
                pendidikan: pendidikan?.trim() || null,
                pengalaman_thn: parseInt(pengalaman_thn) || 0,
                resume_url: resume_url?.trim() || null,
                portofolio_url: portofolio_url?.trim() || null,
                sumber_lamaran: (sumber_lamaran || "Walk-in").trim(),
                status: status || "Baru Masuk"
            },
            include: {
                job_posting: true
            }
        });

        res.status(201).json({
            success: true,
            message: "Kandidat pelamar berhasil dicatat ke sistem",
            data: newApplicant
        });
    } catch (error) {
        console.error("Error creating applicant:", error);
        res.status(500).json({ success: false, message: "Gagal mendaftarkan pelamar" });
    }
}

// UPDATE applicant info / status
async function updateApplicant(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { nama_lengkap, email, nomor_telepon, alamat, pendidikan, pengalaman_thn, status, resume_url, portofolio_url, sumber_lamaran } = req.body;

        const updated = await prisma.applicant.update({
            where: { id },
            data: {
                ...(nama_lengkap && { nama_lengkap: nama_lengkap.trim() }),
                ...(email !== undefined && { email: email?.trim() || null }),
                ...(nomor_telepon && { nomor_telepon: nomor_telepon.trim() }),
                ...(alamat !== undefined && { alamat: alamat?.trim() || null }),
                ...(pendidikan !== undefined && { pendidikan: pendidikan?.trim() || null }),
                ...(pengalaman_thn !== undefined && { pengalaman_thn: parseInt(pengalaman_thn) || 0 }),
                ...(status && { status }),
                ...(resume_url !== undefined && { resume_url: resume_url?.trim() || null }),
                ...(portofolio_url !== undefined && { portofolio_url: portofolio_url?.trim() || null }),
                ...(sumber_lamaran !== undefined && { sumber_lamaran: (sumber_lamaran || "Walk-in").trim() })
            },
            include: { job_posting: true }
        });

        res.json({
            success: true,
            message: "Data pelamar berhasil diperbarui",
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memperbarui pelamar" });
    }
}

// EVALUATE candidate (KEOS Rubric: Logika, Teknis, Attitude, Kepatuhan SOP)
async function evaluateApplicant(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { skor_logika, skor_teknis, skor_attitude, skor_sop, catatan_evaluasi, status, sumber_lamaran } = req.body;

        const updated = await prisma.applicant.update({
            where: { id },
            data: {
                ...(skor_logika !== undefined && { skor_logika: Math.max(0, Math.min(100, parseInt(skor_logika) || 0)) }),
                ...(skor_teknis !== undefined && { skor_teknis: Math.max(0, Math.min(100, parseInt(skor_teknis) || 0)) }),
                ...(skor_attitude !== undefined && { skor_attitude: Math.max(0, Math.min(100, parseInt(skor_attitude) || 0)) }),
                ...(skor_sop !== undefined && { skor_sop: Math.max(0, Math.min(100, parseInt(skor_sop) || 0)) }),
                ...(catatan_evaluasi !== undefined && { catatan_evaluasi: catatan_evaluasi?.trim() || null }),
                ...(status && { status }),
                ...(sumber_lamaran !== undefined && { sumber_lamaran: (sumber_lamaran || "Walk-in").trim() })
            },
            include: { job_posting: true }
        });

        res.json({
            success: true,
            message: "Penilaian rubrik KEOS berhasil disimpan",
            data: updated
        });
    } catch (error) {
        console.error("Error evaluating applicant:", error);
        res.status(500).json({ success: false, message: "Gagal menyimpan penilaian kandidat" });
    }
}

// ONE-CLICK HIRE TO STAFF (Convert Candidate to System User)
async function hireApplicant(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { email, password, role } = req.body;

        const applicant = await prisma.applicant.findUnique({
            where: { id },
            include: { job_posting: true }
        });

        if (!applicant) {
            return res.status(404).json({ success: false, message: "Kandidat pelamar tidak ditemukan" });
        }

        const targetEmail = (email || applicant.email || "").trim().toLowerCase();
        if (!targetEmail) {
            return res.status(400).json({ success: false, message: "Email staf wajib diisi untuk pembuatan akun" });
        }

        const targetPassword = password || "ServioStaff2026!";
        const targetRole = role || (applicant.job_posting?.departemen === "Frontliner" ? "admin" : "teknisi");

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: targetEmail }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: `Akun dengan email ${targetEmail} sudah ada di sistem. Gunakan email lain.`
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(targetPassword, 10);

        // Transaction to create user and link applicant
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    nama: applicant.nama_lengkap,
                    email: targetEmail,
                    password: hashedPassword,
                    role: targetRole
                }
            });

            const updatedApplicant = await tx.applicant.update({
                where: { id },
                data: {
                    status: "Diterima",
                    user_id_hired: newUser.id
                },
                include: {
                    job_posting: true,
                    user_hired: {
                        select: { id: true, nama: true, email: true, role: true }
                    }
                }
            });

            return { newUser, updatedApplicant };
        });

        res.status(201).json({
            success: true,
            message: `Selamat! ${applicant.nama_lengkap} resmi diterima & akun staf (${targetRole.toUpperCase()}) telah berhasil dibuat.`,
            data: {
                applicant: result.updatedApplicant,
                staff_user: {
                    id: result.newUser.id,
                    nama: result.newUser.nama,
                    email: result.newUser.email,
                    role: result.newUser.role
                }
            }
        });
    } catch (error) {
        console.error("Error hiring applicant:", error);
        res.status(500).json({ success: false, message: error.message || "Gagal mengonversi kandidat menjadi staf" });
    }
}

// DELETE applicant
async function deleteApplicant(req, res) {
    try {
        const id = parseInt(req.params.id);
        await prisma.applicant.delete({ where: { id } });
        res.json({ success: true, message: "Data pelamar berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus data pelamar" });
    }
}

module.exports = {
    getOverviewStats,
    getJobPostings,
    getJobById,
    createJobPosting,
    updateJobPosting,
    deleteJobPosting,
    getApplicants,
    getApplicantById,
    createApplicant,
    updateApplicant,
    evaluateApplicant,
    hireApplicant,
    deleteApplicant
};

