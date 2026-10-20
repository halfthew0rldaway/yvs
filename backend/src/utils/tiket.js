// Menghasilkan nomor tiket unik: SRV-TAHUN-XXX
function generateNomorTiket(sequence) {
    const year = new Date().getFullYear();
    const num = String(sequence).padStart(3, "0");
    return `SRV-${year}-${num}`;
}

// Menghitung nomor tiket berikutnya yang dijamin unik berdasarkan sequence tahun berjalan
async function getNextNomorTiket(prisma, offset = 0) {
    const year = new Date().getFullYear();
    const prefix = `SRV-${year}-`;
    const latest = await prisma.tiketServis.findFirst({
        where: { nomor_tiket: { startsWith: prefix } },
        orderBy: { id: "desc" },
        select: { nomor_tiket: true }
    });

    let nextSeq = 1;
    if (latest && latest.nomor_tiket) {
        const parts = latest.nomor_tiket.split("-");
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
            nextSeq = lastNum + 1;
        }
    }
    return `${prefix}${String(nextSeq + offset).padStart(3, "0")}`;
}

// Menghitung tanggal kadaluwarsa garansi dari tanggal mulai dan string durasi
function calculateWarrantyExpiry(startDate, durationStr) {
    if (!startDate) return null;
    const date = new Date(startDate);
    if (isNaN(date.getTime())) return null;

    const durStr = (durationStr || "1 Bulan").toLowerCase().trim();
    const match = durStr.match(/(\d+)\s*(hari|minggu|bulan|tahun|day|days|week|weeks|month|months|year|years)?/i);
    
    let amount = 1;
    let unit = "bulan";

    if (match) {
        amount = parseInt(match[1], 10);
        const rawUnit = match[2] || "bulan";
        if (rawUnit.startsWith("hari") || rawUnit.startsWith("day")) unit = "hari";
        else if (rawUnit.startsWith("minggu") || rawUnit.startsWith("week")) unit = "minggu";
        else if (rawUnit.startsWith("bulan") || rawUnit.startsWith("month")) unit = "bulan";
        else if (rawUnit.startsWith("tahun") || rawUnit.startsWith("year")) unit = "tahun";
    }

    if (unit === "hari") {
        date.setDate(date.getDate() + amount);
    } else if (unit === "minggu") {
        date.setDate(date.getDate() + (amount * 7));
    } else if (unit === "bulan") {
        date.setMonth(date.getMonth() + amount);
    } else if (unit === "tahun") {
        date.setFullYear(date.getFullYear() + amount);
    }
    return date;
}

// Mendapatkan ringkasan status garansi real-time
function getWarrantyStatus(tiket) {
    if (!tiket) return null;

    if (tiket.status !== "diambil" || !tiket.tgl_diambil) {
        return {
            status: "belum_aktif",
            label: "Menunggu Unit Diambil",
            sisaHari: null,
            garansi_berakhir_at: null,
            isExpired: false
        };
    }

    const expiryDate = tiket.garansi_berakhir_at 
        ? new Date(tiket.garansi_berakhir_at) 
        : calculateWarrantyExpiry(tiket.tgl_diambil, tiket.durasi_garansi);

    if (!expiryDate || isNaN(expiryDate.getTime())) {
        return {
            status: "tidak_diketahui",
            label: "Tidak Diketahui",
            sisaHari: null,
            garansi_berakhir_at: null,
            isExpired: false
        };
    }

    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        return {
            status: "aktif",
            label: "Garansi Aktif",
            sisaHari: diffDays,
            garansi_berakhir_at: expiryDate,
            isExpired: false
        };
    } else {
        return {
            status: "kedaluwarsa",
            label: "Garansi Kedaluwarsa",
            sisaHari: 0,
            lewatHari: Math.abs(diffDays),
            garansi_berakhir_at: expiryDate,
            isExpired: true
        };
    }
}

// Menghitung target SLA Pengecekan / Diagnosis (Tahap 1: Sejak unit diterima sampai penawaran selesai dirumuskan)
function calculateSlaPengecekanTarget(startDate, slaPaket) {
    const start = startDate ? new Date(startDate) : new Date();
    const paket = (slaPaket || "reguler").toLowerCase().trim();
    const target = new Date(start);

    if (paket === "express") {
        target.setTime(target.getTime() + 4 * 60 * 60 * 1000); // 4 jam pengecekan kilat
    } else if (paket === "kompleks") {
        target.setTime(target.getTime() + 48 * 60 * 60 * 1000); // 48 jam (2 hari kerja tracing kerusakan berat)
    } else {
        target.setTime(target.getTime() + 24 * 60 * 60 * 1000); // 24 jam (1 hari kerja standar)
    }
    return target;
}

// Menghitung target SLA Pengerjaan Servis (Tahap 2: Dimulai HANYA SETELAH customer menyetujui / ACC penawaran)
function calculateSlaPengerjaanTarget(approvedDate, slaPaket) {
    const start = approvedDate ? new Date(approvedDate) : new Date();
    const paket = (slaPaket || "reguler").toLowerCase().trim();
    const target = new Date(start);

    if (paket === "express") {
        target.setTime(target.getTime() + 6 * 60 * 60 * 1000); // 6 jam pengerjaan prioritas
    } else if (paket === "kompleks") {
        target.setTime(target.getTime() + 96 * 60 * 60 * 1000); // 96 jam (4 hari kerja pengerjaan rumit)
    } else {
        target.setTime(target.getTime() + 48 * 60 * 60 * 1000); // 48 jam (2 hari kerja)
    }
    return target;
}

// Menghitung target SLA selesai otomatis (Fallback kompatibilitas pengerjaan)
function calculateSlaTarget(startDate, slaPaket) {
    return calculateSlaPengerjaanTarget(startDate, slaPaket);
}

// Mendapatkan status SLA real-time tiket (Dual-Phase: Pengecekan vs Pengerjaan Servis vs Idle Persetujuan)
function getSlaStatus(tiket) {
    if (!tiket) return null;

    const slaPaket = (tiket.sla_paket || "reguler").toLowerCase();
    const createdAt = new Date(tiket.created_at || Date.now());
    const status = tiket.status || "diterima";
    const now = new Date();

    // 1. Target Pengecekan / Diagnosis
    const targetPengecekanAt = tiket.target_pengecekan_at 
        ? new Date(tiket.target_pengecekan_at) 
        : calculateSlaPengecekanTarget(createdAt, slaPaket);

    // 2. Waktu Persetujuan & Target Pengerjaan
    const disetujuiAt = tiket.disetujui_at ? new Date(tiket.disetujui_at) : null;
    let targetSelesaiAt = tiket.target_selesai_at ? new Date(tiket.target_selesai_at) : null;

    // Jika sudah disetujui tapi target_selesai_at belum tercatat di DB, hitung dari disetujuiAt
    if (!targetSelesaiAt && disetujuiAt) {
        targetSelesaiAt = calculateSlaPengerjaanTarget(disetujuiAt, slaPaket);
    }

    const isClosed = ["selesai", "diambil", "dibatalkan"].includes(status);
    const completedAt = tiket.completed_at ? new Date(tiket.completed_at) : null;

    // Helper format durasi teks (hari, jam, menit)
    const formatDuration = (ms) => {
        const absMs = Math.abs(ms);
        const diffHours = Math.floor(absMs / (1000 * 60 * 60));
        const diffMins = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} hari ${diffHours % 24} jam`;
        if (diffHours > 0) return `${diffHours} jam ${diffMins} mnt`;
        return `${diffMins} mnt`;
    };

    // Identifikasi fase aktif operasional
    let activePhase = "pengecekan"; // pengecekan | menunggu_persetujuan | pengerjaan | selesai | dibatalkan
    let phaseLabel = "Estimasi Pengecekan / Diagnosis";
    let isPaused = false;
    let isOverdue = false;
    let urgency = "normal"; // normal | warning | danger | paused | completed
    let statusLabel = "";
    let timeText = "";
    let percentElapsed = 0;
    let completedOnTime = null;

    if (status === "diterima" || status === "didiagnosis") {
        // FASE 1: PENGECEKAN & DIAGNOSIS
        activePhase = "pengecekan";
        phaseLabel = "Tahap 1: Estimasi Pengecekan & Diagnosis";
        const totalDurationMs = Math.max(targetPengecekanAt.getTime() - createdAt.getTime(), 1);
        const elapsedMs = now.getTime() - createdAt.getTime();
        const remainingMs = targetPengecekanAt.getTime() - now.getTime();

        isOverdue = remainingMs < 0;
        timeText = formatDuration(remainingMs);
        percentElapsed = Math.min(Math.max(Math.round((elapsedMs / totalDurationMs) * 100), 0), 100);

        if (isOverdue) {
            urgency = "danger";
            statusLabel = `Estimasi Cek Lewat ${timeText}`;
        } else if (percentElapsed >= 75) {
            urgency = "warning";
            statusLabel = `Estimasi Cek Sisa ${timeText}`;
        } else {
            urgency = "normal";
            statusLabel = `Estimasi Cek Sisa ${timeText}`;
        }
    } else if (status === "menunggu_persetujuan") {
        // FASE 2: IDLE MENUNGGU KONFIRMASI CUSTOMER (SLA PENGERJAAN BELUM DIMULAI / ZERO SLA CLOCK)
        activePhase = "menunggu_persetujuan";
        phaseLabel = "Tahap Penawaran Biaya (Menunggu ACC)";
        isPaused = true;
        isOverdue = false; // Bebas penalti keterlambatan karena bola keputusan ada di pelanggan
        urgency = "paused";
        percentElapsed = 100; // Pengecekan selesai 100%
        timeText = "Menunggu ACC";
        statusLabel = "Menunggu ACC (Estimasi Servis Belum Dimulai)";
    } else if (status === "disetujui" || status === "dalam_perbaikan") {
        // FASE 3: PENGERJAAN SERVIS FISIK (DIMULAI SETELAH ACC CUSTOMER)
        activePhase = "pengerjaan";
        phaseLabel = "Tahap 2: Estimasi Pengerjaan Servis Fisik";
        const startRepair = disetujuiAt || createdAt;
        const targetRepair = targetSelesaiAt || calculateSlaPengerjaanTarget(startRepair, slaPaket);

        const totalDurationMs = Math.max(targetRepair.getTime() - startRepair.getTime(), 1);
        const elapsedMs = now.getTime() - startRepair.getTime();
        const remainingMs = targetRepair.getTime() - now.getTime();

        isOverdue = remainingMs < 0;
        timeText = formatDuration(remainingMs);
        percentElapsed = Math.min(Math.max(Math.round((elapsedMs / totalDurationMs) * 100), 0), 100);

        if (isOverdue) {
            urgency = "danger";
            statusLabel = `Estimasi Servis Lewat ${timeText}`;
        } else if (percentElapsed >= 75) {
            urgency = "warning";
            statusLabel = `Estimasi Servis Sisa ${timeText}`;
        } else {
            urgency = "normal";
            statusLabel = `Estimasi Servis Sisa ${timeText}`;
        }
    } else if (status === "selesai" || status === "diambil") {
        // FASE 4: SELESAI
        activePhase = "selesai";
        phaseLabel = "Servis Selesai";
        const targetRepair = targetSelesaiAt || (disetujuiAt ? calculateSlaPengerjaanTarget(disetujuiAt, slaPaket) : calculateSlaPengerjaanTarget(createdAt, slaPaket));
        
        completedOnTime = completedAt ? (completedAt <= targetRepair) : true;
        urgency = completedOnTime ? "completed" : "danger";
        statusLabel = completedOnTime ? "Selesai Sesuai Estimasi" : "Selesai Melewati Estimasi";
        timeText = completedOnTime ? "Sesuai Estimasi" : "Melewati Estimasi";
        percentElapsed = 100;
    } else if (status === "dibatalkan") {
        activePhase = "dibatalkan";
        phaseLabel = "Dibatalkan";
        urgency = "completed";
        statusLabel = "Dibatalkan Pelanggan";
        timeText = "Dibatalkan";
        percentElapsed = 0;
    }

    return {
        sla_paket: slaPaket,
        active_phase: activePhase,
        phase_label: phaseLabel,
        is_paused: isPaused,
        is_overdue: isOverdue,
        urgency,
        percent_elapsed: percentElapsed,
        status_label: statusLabel,
        time_text: timeText,
        completed_on_time: completedOnTime,
        target_pengecekan_at: targetPengecekanAt,
        target_selesai_at: targetSelesaiAt,
        disetujui_at: disetujuiAt,
        pengecekan: {
            target_at: targetPengecekanAt,
            is_completed: ["menunggu_persetujuan", "disetujui", "dalam_perbaikan", "selesai", "diambil"].includes(status),
            is_active: status === "diterima" || status === "didiagnosis",
            status_label: ["menunggu_persetujuan", "disetujui", "dalam_perbaikan", "selesai", "diambil"].includes(status) 
                ? "Pengecekan Selesai" 
                : (now > targetPengecekanAt ? `Lewat Estimasi Cek (${formatDuration(now - targetPengecekanAt)})` : `Estimasi Cek ${formatDuration(targetPengecekanAt - now)} tersisa`)
        },
        pengerjaan: {
            started_at: disetujuiAt,
            target_at: targetSelesaiAt,
            is_started: Boolean(disetujuiAt) || ["disetujui", "dalam_perbaikan", "selesai", "diambil"].includes(status),
            is_completed: ["selesai", "diambil"].includes(status),
            is_active: status === "disetujui" || status === "dalam_perbaikan",
            status_label: !disetujuiAt && !["disetujui", "dalam_perbaikan", "selesai", "diambil"].includes(status)
                ? "Menunggu Konfirmasi Penawaran (Estimasi Servis Belum Dimulai)"
                : (status === "selesai" || status === "diambil")
                    ? (completedOnTime ? "Pengerjaan Sesuai Estimasi" : "Pengerjaan Melewati Estimasi")
                    : (targetSelesaiAt && now > targetSelesaiAt ? `Lewat Estimasi Servis (${formatDuration(now - targetSelesaiAt)})` : `Estimasi Servis ${formatDuration(targetSelesaiAt - now)} tersisa`)
        }
    };
}

module.exports = { 
    generateNomorTiket, 
    getNextNomorTiket, 
    calculateWarrantyExpiry, 
    getWarrantyStatus,
    calculateSlaPengecekanTarget,
    calculateSlaPengerjaanTarget,
    calculateSlaTarget,
    getSlaStatus
};

