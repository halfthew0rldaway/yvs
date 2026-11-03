import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    HelpCircle,
    ArrowRight,
    ArrowDown,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    User,
    Wrench,
    ShieldCheck,
    Receipt,
    QrCode,
    Camera,
    FileText,
    Send,
    Package,
    Sparkles,
    CheckSquare,
    ChevronRight,
    Split,
    Layers,
    Info,
    ExternalLink,
    PlayCircle,
    BookOpen
} from "lucide-react";

// Flow stages data representing the Serv.io Workshop ERP business lifecycle
const FLOW_STAGES = [
    {
        id: "intake",
        stepNumber: "01",
        title: "Intake & Konsultasi Awal",
        role: "Frontman",
        roleColor: "bg-blue-50 text-blue-700 border-blue-200",
        roleIcon: User,
        summary: "Customer datang membawa unit laptop/PC & keluhan kerusakan.",
        description: "Frontman menyambut pelanggan dengan ramah di meja depan (Front Office), mendengarkan keluhan secara detail, dan melakukan inspeksi fisik visual kilat di depan pelanggan.",
        erpActionText: "Buka Form Tiket Baru",
        erpActionLink: "/tiket-servis/tambah",
        keyTasks: [
            "Mendengarkan gejala kerusakan & riwayat pemakaian (jatuh, kena air, mati mendadak, lambat).",
            "Mencatat kelengkapan bawaan (Adaptor/Charger, Tas, Box, Baterai, Kabel power).",
            "Pengecekan fisik eksternal (lecet, baut hilang, casing retak, engsel patah) untuk mencegah komplain."
        ],
        hasBranching: true,
        branches: [
            {
                type: "quick",
                label: "Quick Service (Bisa Ditunggu)",
                condition: "Kerusakan ringan seperti ganti pasta thermal, pasang RAM/SSD, bersihkan debu kipas, aktivasi OS.",
                badge: "Express 15-45 Menit",
                badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                outcome: "Unit langsung diserahkan ke teknisi meja belakang untuk ditangani saat itu juga tanpa tiket inap. Pelanggan menunggu di lounge.",
                icon: Clock
            },
            {
                type: "inbound",
                label: "Tiket Servis Resmi (Unit Ditinggal)",
                condition: "Perlu pembongkaran mendalam, motherboard mati, reballing chip, part inden, atau running test panjang.",
                badge: "Masuk Antrian Tiket",
                badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
                outcome: "Wajib diinput ke ERP: Data Pelanggan, Data Perangkat, SN, Keluhan, Password Windows/BIOS. Tiket terbit & barcode QR ditempel pada unit.",
                icon: QrCode
            }
        ],
        proTip: "Selalu konfirmasi kata sandi Windows/PIN unit dan minta persetujuan backup data penting pelanggan sebelum unit masuk ke meja teknisi."
    },
    {
        id: "diagnosis",
        stepNumber: "02",
        title: "Diagnosa Menyeluruh & SOP Checklist",
        role: "Teknisi",
        roleColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
        roleIcon: Wrench,
        summary: "Teknisi mengambil alih unit dan melakukan pengetesan 21 titik checklist.",
        description: "Teknisi mengambil tiket dari antrian ('Take Over'). Menggunakan SOP bengkel, teknisi membongkar unit secara hati-hati, mengukur tegangan jalur daya (rail voltage), dan melakukan checklist lengkap.",
        erpActionText: "Lihat Daftar Tiket Masuk",
        erpActionLink: "/tiket-servis",
        keyTasks: [
            "Verifikasi 21-titik checklist: Port USB, Keyboard, LCD/Layar, Speaker, WiFi, Charger, Webcam, Baterai, Suhu Thermal.",
            "Dokumentasi foto kerusakan fisik (Defect Mapping) & foto motherboard sebelum dikerjakan.",
            "Menghitung kalkulasi estimasi: estimasi lama pengerjaan, estimasi biaya jasa, serta suku cadang yang wajib diganti."
        ],
        hasBranching: false,
        proTip: "Gunakan fitur 'Defect Mapper' dan 'Checklist Diagnosa' pada detail tiket servis agar rekam jejak audit tersimpan permanen dan terlindungi dari sengketa pelanggan."
    },
    {
        id: "quotation",
        stepNumber: "03",
        title: "Penawaran Biaya & Konfirmasi Pelanggan",
        role: "Admin / Frontman",
        roleColor: "bg-amber-50 text-amber-700 border-amber-200",
        roleIcon: ShieldCheck,
        summary: "Persetujuan estimasi biaya servis dan suku cadang oleh pelanggan.",
        description: "Setelah teknisi selesai mendiagnosa dan mengajukan rincian estimasi, Admin bengkel menghubungi pelanggan secara resmi via WhatsApp otomatis atau telepon untuk menyampaikan penawaran biaya.",
        erpActionText: "Buka Detail Tiket & Kirim WA",
        erpActionLink: "/tiket-servis",
        keyTasks: [
            "Menjelaskan sumber kerusakan dengan bahasa yang mudah dipahami pelanggan.",
            "Menyampaikan rincian biaya: Jasa Perbaikan + Harga Sparepart + Estimasi Durasi Garansi.",
            "Mencatat keputusan pelanggan ke sistem ERP: Status tiket diubah menjadi 'Menunggu Konfirmasi' lalu diputuskan."
        ],
        hasBranching: true,
        branches: [
            {
                type: "reject",
                label: "Pelanggan Membatalkan (CANCEL)",
                condition: "Biaya dirasa terlalu tinggi atau unit tidak ekonomis lagi untuk diperbaiki.",
                badge: "Batal Servis",
                badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
                outcome: "Teknisi WAJIB mengembalikan unit ke kondisi semula secara rapi (baut terpasang utuh, segel intake dilepas). Biaya diagnosa disesuaikan kebijakan toko.",
                icon: XCircle
            },
            {
                type: "accept",
                label: "Pelanggan Menyetujui (ACC / LANJUT)",
                condition: "Pelanggan menyetujui rincian biaya dan estimasi waktu perbaikan.",
                badge: "Disetujui Pelanggan",
                badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                outcome: "Status tiket diperbarui menjadi 'Dalam Pengerjaan'. Teknisi langsung menjadwalkan eksekusi pengerjaan dan reservasi sparepart.",
                icon: CheckCircle2
            }
        ],
        proTip: "DILARANG KERAS melakukan tindakan servis berat yang berbayar sebelum pelanggan resmi menyatakan setuju (ACC) demi kepatuhan hukum dan transparansi."
    },
    {
        id: "execution",
        stepNumber: "04",
        title: "Pengerjaan Servis & Penggunaan Sparepart",
        role: "Teknisi",
        roleColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
        roleIcon: Wrench,
        summary: "Proses perbaikan motherboard/hardware dan pemotongan stok part.",
        description: "Teknisi mengeksekusi perbaikan sesuai rencana teknis yang telah disetujui. Setiap perkembangan dicatat ke dalam log perbaikan sistem.",
        erpActionText: "Kelola Katalog Sparepart",
        erpActionLink: "/sparepart",
        keyTasks: [
            "Eksekusi perbaikan (soldering komponen, reballing chip, flashing BIOS, ganti LCD, pasang engsel).",
            "Jika butuh komponen: Potong stok sparepart dari katalog ERP agar inventaris gudang akurat.",
            "Pengisian bertahap 'Log Perbaikan' setiap tahapan teknis tercapai.",
            "Uji Kualitas (QC Verification): Stress test GPU/CPU, tes stabilitas daya minimal 30-60 menit."
        ],
        hasBranching: false,
        proTip: "Ambil foto bukti setelah part baru terpasang dan pasang stiker segel garansi workshop Serv.io di area baut casing sebelum ditutup."
    },
    {
        id: "completion",
        stepNumber: "05",
        title: "Dokumentasi Selesai & Notifikasi WA",
        role: "Admin",
        roleColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        roleIcon: Send,
        summary: "Unit lolos QC, status tiket 'Selesai', dan pelanggan diinfokan.",
        description: "Teknisi mengubah status tiket menjadi 'Selesai' dan melampirkan foto hasil akhir. Sistem mengirimkan peringatan ke Admin untuk segera mengabari pelanggan.",
        erpActionText: "Monitor Tiket Siap Ambil",
        erpActionLink: "/tiket-servis",
        keyTasks: [
            "Admin memeriksa kelengkapan unit: charger, tas, dan part lama yang diganti wajib disatukan ke dalam wadah unit.",
            "Sistem mengirim pesan WhatsApp otomatis: 'Halo Kak [Nama], unit [Tipe] telah selesai diperbaiki dan siap diambil di Serv.io!'.",
            "Menyertakan tautan pelacakan online (Tracking Link) dan total tagihan resmi."
        ],
        hasBranching: false,
        proTip: "Part rusak yang diganti (misal keyboard lama, IC terbakar, baterai drop) wajib diserahkan kembali ke pelanggan sebagai bukti transparansi."
    },
    {
        id: "handover",
        stepNumber: "06",
        title: "Serah Terima, Pembayaran & Garansi",
        role: "Admin / Kasir",
        roleColor: "bg-purple-50 text-purple-700 border-purple-200",
        roleIcon: Receipt,
        summary: "Pemeriksaan fungsi bersama pelanggan, cetak invoice, & tanda tangan digital.",
        description: "Pelanggan datang ke bengkel mengambil unit. Frontman/Admin mendemonstrasikan unit di depan pelanggan bahwa masalah telah teratasi.",
        erpActionText: "Kelola Invoice & Kas",
        erpActionLink: "/invoice",
        keyTasks: [
            "Live Testing: Pelanggan mencoba keyboard, layar, audio, dan pengisian daya di meja serah terima.",
            "Penerbitan Invoice Resmi dari modul ERP Serv.io (mencatat metode Cash, Transfer Bank, atau QRIS).",
            "Tanda Tangan Digital Serah Terima di layar tablet/HP (Digital Handover Signature).",
            "Penerbitan Kartu Garansi Elektronik (SLA Garansi 30 - 90 Hari sesuai jenis pengerjaan).",
            "Tiket resmi ditutup ('CLOSED') dan otomatis masuk ke laporan performa teknisi serta pembukuan keuangan."
        ],
        hasBranching: false,
        proTip: "Tanda tangan digital serah terima melindungi bengkel dari klaim sepihak di kemudian hari mengenai kelengkapan fisik unit."
    }
];

export default function BusinessProcessFlowModal({ isOpen, onClose }) {
    const [selectedStageId, setSelectedStageId] = useState("intake");
    const [roleFilter, setRoleFilter] = useState("all"); // 'all' | 'Frontman' | 'Teknisi' | 'Admin'

    // Keyboard ESC to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    const currentStage = FLOW_STAGES.find((s) => s.id === selectedStageId) || FLOW_STAGES[0];
    const currentIndex = FLOW_STAGES.findIndex((s) => s.id === selectedStageId);

    // Filter stages by role if requested
    const filteredStages = FLOW_STAGES.filter((s) => {
        if (roleFilter === "all") return true;
        if (roleFilter === "Admin") return s.role.includes("Admin");
        return s.role.includes(roleFilter);
    });

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-slate-950/75 backdrop-blur-xs select-none animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden text-slate-900"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. TOP HEADER BAR */}
                <div className="px-5 sm:px-7 py-4 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                    Alur Bisnis & Standar Operasional Servis
                                </h2>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-blue-100 text-blue-700 border border-blue-200 tracking-wider">
                                    <Sparkles className="w-3 h-3" /> SOP BENGKEL
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Panduan interaktif alur kerja end-to-end: dari pelanggan datang hingga serah terima & garansi.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        {/* Role Perspective Filter */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                            <span className="text-3xs font-bold text-slate-400 px-2 uppercase tracking-wider hidden md:inline">
                                Peran:
                            </span>
                            {[
                                { id: "all", label: "Semua" },
                                { id: "Frontman", label: "Frontman" },
                                { id: "Teknisi", label: "Teknisi" },
                                { id: "Admin", label: "Admin/Kasir" }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setRoleFilter(tab.id)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        roleFilter === tab.id
                                            ? "bg-slate-900 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                            title="Tutup Panduan (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 2. MAIN WORKSPACE (Split: Visual Interactive Pipeline on Top, In-Depth Detail Below) */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    
                    {/* LEFT PANEL: Interactive Stages Timeline / Flow Navigator */}
                    <div className="lg:w-2/5 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-slate-50/50 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2.5">
                        <div className="flex items-center justify-between px-2 pt-1 pb-1">
                            <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">
                                6 Tahap Proses Utama
                            </span>
                            <span className="text-3xs font-semibold text-slate-500 font-mono">
                                Step {currentIndex + 1} of 6
                            </span>
                        </div>

                        {FLOW_STAGES.map((stage, idx) => {
                            const isSelected = stage.id === selectedStageId;
                            const RoleIcon = stage.roleIcon;

                            return (
                                <div key={stage.id} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStageId(stage.id)}
                                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 group ${
                                            isSelected
                                                ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-600/10"
                                                : "bg-white/80 hover:bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
                                        }`}
                                    >
                                        {/* Step Circle */}
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                                            isSelected
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                                        }`}>
                                            {stage.stepNumber}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <h4 className={`text-xs font-bold truncate ${
                                                    isSelected ? "text-blue-900" : "text-slate-900"
                                                }`}>
                                                    {stage.title}
                                                </h4>
                                                {stage.hasBranching && (
                                                    <span className="inline-flex items-center gap-0.5 text-3xs font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                                        <Split className="w-2.5 h-2.5" /> Cabang
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-2xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {stage.summary}
                                            </p>

                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center gap-1 text-3xs font-semibold px-2 py-0.5 rounded-md border ${stage.roleColor}`}>
                                                    <RoleIcon className="w-2.5 h-2.5" />
                                                    {stage.role}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`self-center text-slate-400 transition-transform ${isSelected ? "text-blue-600 translate-x-1" : "opacity-0 group-hover:opacity-100"}`}>
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </button>

                                    {/* Vertical Arrow connector between timeline cards */}
                                    {idx < FLOW_STAGES.length - 1 && (
                                        <div className="flex items-center justify-center my-0.5">
                                            <div className="w-0.5 h-2 bg-slate-300 rounded-full" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* RIGHT PANEL: Rich Deep-Dive Detail with Visual Diagrams, Branching & SOP Rules */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-7 space-y-6 bg-white">
                        
                        {/* 1. Stage Overview Banner */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                            
                            <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center font-mono text-sm font-black text-blue-400">
                                        {currentStage.stepNumber}
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                                                {currentStage.title}
                                            </h3>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 mt-1 rounded-md bg-white/10 text-white border border-white/15`}>
                                            Penanggung Jawab: {currentStage.role}
                                        </span>
                                    </div>
                                </div>

                                {currentStage.erpActionLink && (
                                    <Link
                                        to={currentStage.erpActionLink}
                                        onClick={onClose}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
                                    >
                                        <span>{currentStage.erpActionText}</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                            </div>

                            <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed relative z-10 max-w-3xl">
                                {currentStage.description}
                            </p>
                        </div>

                        {/* 2. Visual Branching Decision Diagram (If stage has decision points) */}
                        {currentStage.hasBranching && currentStage.branches && (
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                                            <Split className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                                            Titik Keputusan & Percabangan Alur (Decision Logic)
                                        </h4>
                                    </div>
                                    <span className="text-3xs font-mono text-slate-400 font-semibold">IF / ELSE FLOW</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                    {currentStage.branches.map((branch, bIdx) => {
                                        const BranchIcon = branch.icon;
                                        return (
                                            <div 
                                                key={bIdx}
                                                className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-slate-300 transition-colors"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                                                                <BranchIcon className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-900">
                                                                {branch.label}
                                                            </span>
                                                        </div>
                                                        <span className={`text-3xs font-bold px-2 py-0.5 rounded-full border ${branch.badgeColor}`}>
                                                            {branch.badge}
                                                        </span>
                                                    </div>

                                                    <div className="text-2xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                                                        <strong className="text-slate-700">Kondisi: </strong>
                                                        {branch.condition}
                                                    </div>

                                                    <p className="text-xs text-slate-600 leading-relaxed">
                                                        {branch.outcome}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 3. Key SOP Action Checklist */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                                <span>Checklist Tugas Wajib Pada Tahap Ini</span>
                            </h4>

                            <div className="space-y-2">
                                {currentStage.keyTasks.map((task, tIdx) => (
                                    <div 
                                        key={tIdx}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs text-slate-700 leading-relaxed font-medium">
                                            {task}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Golden Rules & Pro Tip */}
                        {currentStage.proTip && (
                            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 flex items-start gap-3 text-amber-900">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-0.5">
                                        Aturan Baku & Anti-Fraud Bengkel
                                    </h5>
                                    <p className="text-xs text-amber-900/90 leading-relaxed">
                                        {currentStage.proTip}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 5. Stage Progress Navigation Bar */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <button
                                type="button"
                                disabled={currentIndex === 0}
                                onClick={() => setSelectedStageId(FLOW_STAGES[currentIndex - 1].id)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                ← Tahap Sebelumnya
                            </button>

                            <div className="hidden sm:flex items-center gap-1.5">
                                {FLOW_STAGES.map((s, idx) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setSelectedStageId(s.id)}
                                        className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                                            s.id === selectedStageId ? "w-6 bg-blue-600" : "bg-slate-300 hover:bg-slate-400"
                                        }`}
                                        title={s.title}
                                    />
                                ))}
                            </div>

                            {currentIndex < FLOW_STAGES.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setSelectedStageId(FLOW_STAGES[currentIndex + 1].id)}
                                    className="px-4.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                                >
                                    <span>Tahap Berikutnya</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                    Selesai Membaca
                                </button>
                            )}
                        </div>

                    </div>
                </div>

                {/* 3. MODAL FOOTER BAR */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Frontman (Meja Depan)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Teknisi (Meja Belakang)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-600"></span> Admin & Kasir (Administrasi)
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-1 font-mono text-slate-400">
                        <span>Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-slate-600 text-3xs font-semibold">ESC</kbd> untuk keluar</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
