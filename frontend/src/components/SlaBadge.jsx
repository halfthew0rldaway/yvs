import { Clock, Zap, AlertTriangle, CheckCircle2, ShieldAlert, Wrench, Search, Pause } from "lucide-react";

// Paket SLA Tahap 1: Estimasi Pengecekan & Diagnosis (Ditentukan saat Intake)
export const SLA_PENGECEKAN_PACKAGES = [
    {
        id: "express",
        label: "Express (Estimasi 4 Jam)",
        shortLabel: "Express",
        hours: 4,
        checkHours: 4,
        icon: Zap,
        color: "text-amber-700",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        pillBg: "bg-amber-500",
        desc: "Prioritas antrean diagnosis kilat di meja teknisi (maksimal 4 jam)."
    },
    {
        id: "reguler",
        label: "Reguler (Estimasi 24 Jam)",
        shortLabel: "Reguler",
        hours: 24,
        checkHours: 24,
        icon: Clock,
        color: "text-blue-700",
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
        pillBg: "bg-blue-600",
        desc: "Standar inspeksi diagnosis dan analisa estimasi biaya (1 hari kerja)."
    },
    {
        id: "kompleks",
        label: "Kompleks (Estimasi 48 Jam)",
        shortLabel: "Kompleks",
        hours: 48,
        checkHours: 48,
        icon: Wrench,
        color: "text-purple-700",
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
        pillBg: "bg-purple-600",
        desc: "Diagnosa mendalam tracing board untuk unit mati total / konslet berat."
    }
];

// Paket SLA Tahap 2: Estimasi Pengerjaan Servis Fisik (Ditentukan saat Pelanggan ACC Penawaran)
export const SLA_PENGERJAAN_PACKAGES = [
    {
        id: "express",
        label: "Express (Estimasi 6 Jam)",
        shortLabel: "Express",
        hours: 6,
        repairHours: 6,
        icon: Zap,
        color: "text-amber-700",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        pillBg: "bg-amber-500",
        desc: "Pengerjaan servis prioritas langsung di meja teknisi (6 jam kerja)."
    },
    {
        id: "reguler",
        label: "Reguler (Estimasi 48 Jam / 2 Hari)",
        shortLabel: "Reguler",
        hours: 48,
        repairHours: 48,
        icon: Clock,
        color: "text-blue-700",
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
        pillBg: "bg-blue-600",
        desc: "Standar pengerjaan servis fisik dan pengetesan QC (2 hari kerja)."
    },
    {
        id: "kompleks",
        label: "Kompleks (Estimasi 96 Jam / 4 Hari)",
        shortLabel: "Kompleks",
        hours: 96,
        repairHours: 96,
        icon: Wrench,
        color: "text-purple-700",
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
        pillBg: "bg-purple-600",
        desc: "Pengerjaan board-level rumit atau menunggu pengiriman suku cadang inden."
    }
];

// Fallback compatibility
export const SLA_PACKAGES = SLA_PENGECEKAN_PACKAGES;

// Helper client-side calculate if backend sla_status not available
export function computeClientSla(tiket) {
    if (!tiket) return null;
    if (tiket.sla_status) return tiket.sla_status;

    const slaPaket = (tiket.sla_paket || "reguler").toLowerCase();
    const pkgCek = SLA_PENGECEKAN_PACKAGES.find(p => p.id === slaPaket) || SLA_PENGECEKAN_PACKAGES[1];
    const pkgServis = SLA_PENGERJAAN_PACKAGES.find(p => p.id === slaPaket) || SLA_PENGERJAAN_PACKAGES[1];
    const createdAt = new Date(tiket.created_at || Date.now());
    const status = tiket.status || "diterima";
    const now = new Date();

    const targetPengecekanAt = tiket.target_pengecekan_at 
        ? new Date(tiket.target_pengecekan_at) 
        : new Date(createdAt.getTime() + (pkgCek.hours || 24) * 3600000);

    const disetujuiAt = tiket.disetujui_at ? new Date(tiket.disetujui_at) : null;
    let targetSelesaiAt = tiket.target_selesai_at ? new Date(tiket.target_selesai_at) : null;

    if (!targetSelesaiAt && disetujuiAt) {
        targetSelesaiAt = new Date(disetujuiAt.getTime() + (pkgServis.hours || 48) * 3600000);
    }

    const isClosed = ["selesai", "diambil", "dibatalkan"].includes(status);
    const completedAt = tiket.completed_at ? new Date(tiket.completed_at) : null;

    const formatDuration = (ms) => {
        const absMs = Math.abs(ms);
        const diffHours = Math.floor(absMs / (1000 * 60 * 60));
        const diffMins = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}h ${diffHours % 24}j`;
        if (diffHours > 0) return `${diffHours}j ${diffMins}m`;
        return `${diffMins}m`;
    };

    let activePhase = "pengecekan";
    let phaseLabel = "Estimasi Pengecekan / Diagnosis";
    let isPaused = false;
    let isOverdue = false;
    let urgency = "normal";
    let statusLabel = "";
    let timeText = "";
    let percentElapsed = 0;
    let completedOnTime = null;

    if (status === "diterima" || status === "didiagnosis") {
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
        activePhase = "menunggu_persetujuan";
        phaseLabel = "Tahap Penawaran Biaya (Menunggu ACC)";
        isPaused = true;
        isOverdue = false;
        urgency = "paused";
        percentElapsed = 100;
        timeText = "Menunggu ACC";
        statusLabel = "Menunggu ACC (Estimasi Servis Belum Dimulai)";
    } else if (status === "disetujui" || status === "dalam_perbaikan") {
        activePhase = "pengerjaan";
        phaseLabel = "Tahap 2: Estimasi Pengerjaan Servis Fisik";
        const startRepair = disetujuiAt || createdAt;
        const targetRepair = targetSelesaiAt || new Date(startRepair.getTime() + (pkgServis.hours || 48) * 3600000);

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
        activePhase = "selesai";
        phaseLabel = "Servis Selesai";
        const targetRepair = targetSelesaiAt || (disetujuiAt ? new Date(disetujuiAt.getTime() + (pkgServis.hours || 48) * 3600000) : null);
        completedOnTime = completedAt && targetRepair ? (completedAt <= targetRepair) : true;
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

// Compact Badge for Table Rows
export default function SlaBadge({ tiket, className = "" }) {
    const sla = computeClientSla(tiket);
    if (!sla) return null;

    const isExpress = sla.sla_paket === "express";
    const isPaused = sla.is_paused || sla.urgency === "paused";
    const isOverdue = sla.is_overdue;

    let urgencyStyle = "bg-slate-50 text-slate-700 border-slate-200";
    let DotIcon = Clock;

    if (sla.urgency === "completed") {
        urgencyStyle = sla.completed_on_time 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium" 
            : "bg-slate-100 text-slate-600 border-slate-200";
        DotIcon = CheckCircle2;
    } else if (isPaused) {
        urgencyStyle = "bg-amber-50 text-amber-800 border-amber-300 font-medium";
        DotIcon = Pause;
    } else if (sla.urgency === "danger" || isOverdue) {
        urgencyStyle = "bg-rose-50 text-rose-700 border-rose-200 font-semibold";
        DotIcon = ShieldAlert;
    } else if (sla.urgency === "warning") {
        urgencyStyle = "bg-amber-50 text-amber-800 border-amber-200 font-medium";
        DotIcon = AlertTriangle;
    } else if (sla.active_phase === "pengecekan") {
        urgencyStyle = "bg-blue-50 text-blue-700 border-blue-200 font-medium";
        DotIcon = Search;
    } else if (isExpress) {
        urgencyStyle = "bg-amber-50 text-amber-800 border-amber-200 font-medium";
        DotIcon = Zap;
    }

    return (
        <div className={`inline-flex flex-col gap-1 items-start ${className}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
                {/* SLA Package Pill */}
                {isExpress ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <Zap className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                        <span>Express</span>
                    </span>
                ) : sla.sla_paket === "kompleks" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <span>Kompleks</span>
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <span>Reguler</span>
                    </span>
                )}

                {/* Dual-Phase Urgency Pill */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${urgencyStyle}`}>
                    <DotIcon className="w-3 h-3 flex-shrink-0" />
                    <span>{sla.status_label}</span>
                </span>
            </div>

            {/* Micro Progress bar for active tickets */}
            {!["selesai", "diambil", "dibatalkan"].includes(tiket.status) && (
                <div className="w-full min-w-[90px] h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                    <div 
                        className={`h-full transition-all rounded-full ${
                            isPaused
                                ? "bg-amber-400 opacity-60"
                                : isOverdue 
                                    ? "bg-rose-500" 
                                    : sla.percent_elapsed >= 75 
                                        ? "bg-amber-500" 
                                        : sla.active_phase === "pengecekan"
                                            ? "bg-blue-500"
                                            : "bg-indigo-600"
                        }`}
                        style={{ width: `${Math.min(sla.percent_elapsed || 0, 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// Full SLA Dual-Phase Countdown Card for Ticket Detail & Tracking
export function SlaCountdownCard({ tiket, onAccClick, onEditSla }) {
    const sla = computeClientSla(tiket);
    if (!sla) return null;

    const pkgCek = SLA_PENGECEKAN_PACKAGES.find(p => p.id === sla.sla_paket) || SLA_PENGECEKAN_PACKAGES[1];
    const isClosed = ["selesai", "diambil", "dibatalkan"].includes(tiket.status);
    const isPaused = sla.is_paused || tiket.status === "menunggu_persetujuan";

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }) + " WIB";
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            {/* Header: Paket Estimasi SLA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${pkgCek.badgeBg}`}>
                        <pkgCek.icon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">Paket Estimasi SLA: {pkgCek.shortLabel}</span>
                            {sla.sla_paket === "express" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                                    Priority Queue
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{pkgCek.desc}</p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Fase Operasional:</span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        isPaused 
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : sla.active_phase === "pengecekan"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : sla.active_phase === "pengerjaan"
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                        {sla.phase_label}
                    </span>
                </div>
            </div>

            {/* Dual Phase SLA Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tahap 1: Estimasi SLA Pengecekan / Diagnosis */}
                <div className={`p-4 rounded-xl border transition-all ${
                    sla.active_phase === "pengecekan"
                        ? "bg-blue-50/50 border-blue-200 ring-2 ring-blue-500/10"
                        : "bg-slate-50 border-slate-200"
                }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                1
                            </div>
                            <h4 className="text-xs font-bold text-slate-900">Tahap 1: Estimasi Pengecekan & Diagnosis</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            sla.pengecekan?.is_completed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : sla.pengecekan?.is_active && sla.is_overdue
                                    ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                            {sla.pengecekan?.is_completed ? "Pengecekan Selesai" : (sla.is_overdue ? "Lewat Estimasi Cek" : "Sedang Dicek")}
                        </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                        Pemeriksaan hardware/software dan perumusan penawaran estimasi biaya untuk pelanggan.
                    </p>

                    <div className="text-xs space-y-1 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px] text-slate-400">Estimasi Target Cek:</span>
                            <span className="font-semibold text-slate-800">{formatDate(sla.target_pengecekan_at)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px] text-slate-400">Status Waktu:</span>
                            <span className="font-semibold text-slate-700">{sla.pengecekan?.status_label}</span>
                        </div>
                    </div>
                </div>

                {/* Tahap 2: Estimasi SLA Pengerjaan Servis Fisik */}
                <div className={`p-4 rounded-xl border transition-all ${
                    sla.active_phase === "pengerjaan"
                        ? "bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/10"
                        : "bg-slate-50 border-slate-200"
                }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                2
                            </div>
                            <h4 className="text-xs font-bold text-slate-900">Tahap 2: Estimasi Pengerjaan Servis Fisik</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {onEditSla && !isClosed && (
                                <button
                                    type="button"
                                    onClick={onEditSla}
                                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline px-1.5 py-0.5 rounded cursor-pointer"
                                >
                                    Ubah Estimasi
                                </button>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                sla.pengerjaan?.is_completed
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : isPaused
                                        ? "bg-amber-100 text-amber-800 border-amber-300"
                                        : sla.pengerjaan?.is_active && sla.is_overdue
                                            ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                                            : sla.pengerjaan?.is_active
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                                {sla.pengerjaan?.is_completed 
                                    ? "Servis Selesai" 
                                    : isPaused 
                                        ? "SLA Pause (Menunggu ACC)" 
                                        : sla.pengerjaan?.is_active 
                                            ? (sla.is_overdue ? "Lewat Estimasi Servis" : "Sedang Dikerjakan") 
                                            : "Menunggu ACC"}
                            </span>
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                        Pengerjaan fisik komponen. Timer pengerjaan dimulai HANYA setelah pelanggan menyetujui penawaran biaya.
                    </p>

                    <div className="text-xs space-y-1 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px] text-slate-400">Persetujuan Pelanggan:</span>
                            <span className="font-semibold text-slate-800">
                                {sla.disetujui_at ? formatDate(sla.disetujui_at) : "Belum di-ACC (Timer Belum Berjalan)"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px] text-slate-400">Estimasi Target Selesai:</span>
                            <span className="font-semibold text-slate-800">
                                {sla.disetujui_at ? formatDate(sla.target_selesai_at) : "Ditentukan saat penawaran di-ACC"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner Khusus Ketika Berada di Status Menunggu Persetujuan */}
            {isPaused && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 leading-relaxed">
                    <div className="flex items-start gap-3">
                        <Pause className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block text-amber-950 mb-0.5">Status: Tahap Penawaran Biaya (Tidak Ada SLA Berjalan)</span>
                            Pengecekan diagnosis awal telah selesai. Saat ini bengkel sedang menunggu keputusan persetujuan estimasi biaya dari pelanggan. Timer estimasi pengerjaan servis tidak berjalan (zero SLA clock) selama masa penawaran ini.
                        </div>
                    </div>
                    {onAccClick && (
                        <button
                            type="button"
                            onClick={onAccClick}
                            className="shrink-0 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-end sm:self-center cursor-pointer"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ACC Penawaran & Atur SLA</span>
                        </button>
                    )}
                </div>
            )}

            {/* Active Phase Linear Progress Bar */}
            {!isClosed && !isPaused && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Progres {sla.phase_label}:</span>
                        </span>
                        <span className={`font-semibold px-2 py-0.5 rounded-md text-xs border ${
                            sla.is_overdue 
                                ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold" 
                                : sla.percent_elapsed >= 75 
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                            {sla.status_label}
                        </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                sla.is_overdue 
                                    ? "bg-rose-500" 
                                    : sla.percent_elapsed >= 75 
                                        ? "bg-amber-500" 
                                        : sla.active_phase === "pengecekan"
                                            ? "bg-blue-600"
                                            : "bg-indigo-600"
                            }`}
                            style={{ width: `${Math.min(sla.percent_elapsed || 0, 100)}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Waktu terpakai: {sla.percent_elapsed}%</span>
                        <span>{sla.is_overdue ? "Melewati Estimasi Waktu" : `Estimasi sisa ${sla.time_text}`}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
