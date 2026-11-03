import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
    Layers,
    ExternalLink,
    BookOpen,
    Laptop,
    Cpu,
    GitFork,
    Workflow,
    Compass,
    Check,
    RotateCcw,
    CornerDownRight,
    Search,
    MessageSquareQuote,
    ClipboardCheck
} from "lucide-react";

// Standardized 6 Stages of the Serv.io Workshop ERP Lifecycle
const FLOW_STAGES = [
    {
        id: "intake",
        stepNumber: "01",
        title: "Intake & Konsultasi Awal",
        role: "Frontman",
        roleBadgeBg: "bg-blue-50 text-blue-700 border-blue-200",
        roleIcon: User,
        summary: "Penerimaan unit dari pelanggan, pendengaran keluhan, dan penentuan kategori pengerjaan.",
        description: "Frontman menyambut pelanggan di meja depan dengan ramah, mendengarkan kendala secara spesifik, serta melakukan inspeksi fisik visual kilat di hadapan pelanggan.",
        erpActionText: "Buka Form Input Tiket",
        erpActionLink: "/tiket-servis/tambah",
        keyTasks: [
            "Mendengarkan gejala kerusakan (mati total, tidak tampil gambar, blue screen, panas berlebih, engsel patah).",
            "Mencatat seluruh kelengkapan bawaan pelanggan (Adaptor/Charger, Kabel Power, Tas Laptop, Box/Kardus).",
            "Inspeksi fisik eksternal (baut hilang, lecet, casing retak) guna mencegah komplain fisik saat pengambilan.",
            "Konfirmasi kata sandi Windows/PIN serta persetujuan pencadangan data penting pelanggan."
        ],
        hasBranching: true,
        branchQuestion: "Apakah pengerjaan unit perlu ditinggal di bengkel?",
        branches: [
            {
                type: "quick",
                label: "Quick Service (Bisa Ditunggu)",
                badge: "Durasi 15-45 Menit",
                badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
                condition: "Kerusakan ringan seperti ganti pasta thermal, pasang RAM/SSD baru, bersihkan debu kipas, atau aktivasi OS.",
                outcome: "Unit langsung diserahkan ke teknisi di meja belakang untuk dieksekusi saat itu juga. Pelanggan dapat menunggu di lounge bengkel.",
                icon: Clock
            },
            {
                type: "inbound",
                label: "Tiket Servis Resmi (Unit Ditinggal)",
                badge: "Masuk Antrian Tiket",
                badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
                condition: "Kerusakan berat, motherboard mati, reballing chip, perbaikan jalur IC, part inden, atau butuh running test berjam-jam.",
                outcome: "Wajib diinput ke sistem ERP: Data Pelanggan, Data Perangkat, SN, Keluhan, dan Foto Kelengkapan. Tiket resmi terbit dan label barcode QR ditempel pada casing unit.",
                icon: QrCode
            }
        ],
        proTip: "Selalu foto kelengkapan adaptor dan fisik unit sebelum pelanggan meninggalkan meja depan untuk bukti otentik."
    },
    {
        id: "diagnosis",
        stepNumber: "02",
        title: "Diagnosa Menyeluruh & SOP Checklist",
        role: "Teknisi",
        roleBadgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        roleIcon: Wrench,
        summary: "Teknisi mengambil alih tiket dan melakukan pengujian 21 titik checklist standar.",
        description: "Teknisi mengklaim tiket dari antrian servis. Menggunakan panduan SOP bengkel, unit dibongkar secara hati-hati untuk pengukuran tegangan rail dan pemeriksaan menyeluruh.",
        erpActionText: "Lihat Daftar Tiket Servis",
        erpActionLink: "/tiket-servis",
        keyTasks: [
            "Melakukan verifikasi 21-titik checklist: Port USB, Keyboard, Layar LCD, Speaker, WiFi, Charger, Webcam, Baterai, dan Suhu Thermal.",
            "Dokumentasi foto kerusakan fisik (Defect Mapping) dan kondisi awal motherboard sebelum disolder.",
            "Menghitung estimasi biaya pengerjaan: estimasi durasi, jasa teknisi, dan suku cadang yang wajib diganti.",
            "Mengisi formulir estimasi pada tiket servis agar Admin dapat meneruskan rincian biaya ke pelanggan."
        ],
        hasBranching: false,
        proTip: "Jangan pernah langsung memvonis kerusakan termahal sebelum melakukan pengukuran dasar (Short circuit check dan voltage drop)."
    },
    {
        id: "quotation",
        stepNumber: "03",
        title: "Penawaran Biaya & Konfirmasi Pelanggan",
        role: "Admin / Frontman",
        roleBadgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        roleIcon: ShieldCheck,
        summary: "Penyampaian rincian biaya kepada pelanggan via WhatsApp resmi untuk persetujuan (ACC / Cancel).",
        description: "Setelah teknisi selesai melakukan diagnosa dan mencatat kebutuhan part, Admin bengkel menghubungi pelanggan secara resmi untuk menyampaikan estimasi biaya dan durasi garansi.",
        erpActionText: "Kirim Pesan WhatsApp Penawaran",
        erpActionLink: "/tiket-servis",
        keyTasks: [
            "Menjelaskan penyebab kerusakan dan solusi teknis dengan bahasa yang sopan dan mudah dipahami.",
            "Menyampaikan rincian biaya: Jasa Servis + Harga Suku Cadang + Durasi Garansi yang diberikan.",
            "Mendokumentasikan keputusan pelanggan ke sistem: Mengubah status tiket sesuai persetujuan pelanggan."
        ],
        hasBranching: true,
        branchQuestion: "Bagaimana keputusan pelanggan terkait penawaran biaya?",
        branches: [
            {
                type: "reject",
                label: "Pelanggan Membatalkan (CANCEL)",
                badge: "Batal Servis",
                badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
                condition: "Biaya servis dirasa terlalu tinggi atau perangkat sudah tidak ekonomis lagi untuk diperbaiki.",
                outcome: "Teknisi WAJIB merakit kembali unit ke kondisi semula secara rapi (seluruh baut terpasang, tanpa cacat tambahan). Biaya diagnosa disesuaikan kebijakan toko.",
                icon: XCircle
            },
            {
                type: "accept",
                label: "Pelanggan Menyetujui (ACC / LANJUT)",
                badge: "Disetujui Pelanggan",
                badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
                condition: "Pelanggan menyetujui rincian total biaya, masa garansi, dan perkiraan waktu pengerjaan.",
                outcome: "Status tiket diperbarui menjadi 'Dalam Pengerjaan'. Teknisi langsung menjadwalkan eksekusi reparasi dan mereservasi stok sparepart.",
                icon: CheckCircle2
            }
        ],
        proTip: "DILARANG KERAS melakukan tindakan servis berbayar sebelum pelanggan resmi menyatakan persetujuan (ACC)."
    },
    {
        id: "execution",
        stepNumber: "04",
        title: "Pengerjaan Servis & Penggunaan Sparepart",
        role: "Teknisi",
        roleBadgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        roleIcon: Cpu,
        summary: "Eksekusi perbaikan motherboard, penggantian komponen, dan pencatatan log progres.",
        description: "Teknisi mengeksekusi perbaikan sesuai estimasi yang disetujui. Setiap perkembangan dicatat ke dalam log perbaikan sistem ERP Serv.io secara real-time.",
        erpActionText: "Kelola Stok Sparepart",
        erpActionLink: "/sparepart",
        keyTasks: [
            "Eksekusi perbaikan teknis (soldering IC, reballing chip, flashing BIOS, ganti LCD, pasang engsel).",
            "Pemotongan stok suku cadang dari katalog gudang ERP secara otomatis saat part dipasang ke unit.",
            "Pengisian bertahap 'Log Perbaikan' setiap tahapan pengerjaan terselesaikan.",
            "Uji Kualitas (QC Verification): Menjalankan stress test hardware minimal 30-60 menit hingga suhu dan daya stabil."
        ],
        hasBranching: false,
        proTip: "Simpan part rusak yang diganti ke dalam plastik wadah unit sebagai bukti otentik transparansi kepada pelanggan."
    },
    {
        id: "completion",
        stepNumber: "05",
        title: "Dokumentasi Selesai & Notifikasi WA",
        role: "Admin",
        roleBadgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        roleIcon: Send,
        summary: "Unit lolos QC, foto hasil perbaikan diunggah, dan pelanggan dikabari via WhatsApp otomatis.",
        description: "Teknisi menandai tiket 'Selesai' setelah lolos uji kelayakan QC. Sistem secara otomatis memberi tahu Admin untuk mengirimkan notifikasi penjemputan unit.",
        erpActionText: "Pantau Tiket Siap Diambil",
        erpActionLink: "/tiket-servis",
        keyTasks: [
            "Mengunggah foto dokumentasi unit setelah selesai servis (kondisi rapi dan segel garansi terpasang).",
            "Menyatukan kelengkapan pelanggan (charger, tas) dan komponen lama ke dalam tas serah terima.",
            "Admin mengirim pesan WhatsApp resmi otomatis: 'Unit Anda telah selesai diperbaiki dan siap diambil di workshop'.",
            "Menyertakan rincian total tagihan serta tautan tracking online resmi Serv.io."
        ],
        hasBranching: false,
        proTip: "Pastikan unit dalam kondisi bersih tanpa sisa sidik jari atau pasta thermal di bodi luar sebelum diserahkan."
    },
    {
        id: "handover",
        stepNumber: "06",
        title: "Serah Terima, Pembayaran & Garansi",
        role: "Admin / Kasir",
        roleBadgeBg: "bg-purple-50 text-purple-700 border-purple-200",
        roleIcon: Receipt,
        summary: "Live testing bersama pelanggan, pembayaran invoice, tanda tangan digital, dan penerbitan sertifikat garansi.",
        description: "Pelanggan tiba di bengkel membawa nomor tiket servis. Petugas mendemonstrasikan unit di meja depan bahwa seluruh keluhan telah terselesaikan dengan baik.",
        erpActionText: "Buka Menu Invoice & Kas",
        erpActionLink: "/invoice",
        keyTasks: [
            "Live Testing: Pelanggan menguji fungsi keyboard, layar, audio, port USB, dan pengisian daya baterai bersama staf.",
            "Penerbitan Invoice Resmi dari modul ERP Serv.io (pencatatan metode bayar Tunai, QRIS, atau Transfer Bank).",
            "Tanda Tangan Digital Serah Terima di layar tablet/HP sebagai bukti penerimaan unit tanpa cacat baru.",
            "Penerbitan Kartu Garansi Servis (SLA Garansi 30 - 90 Hari) yang tersimpan di sistem pelacakan online.",
            "Tiket resmi ditutup ('CLOSED') dan otomatis tercatat ke dalam laporan keuangan dan performa teknisi."
        ],
        hasBranching: false,
        proTip: "Tanda tangan digital melindungi bengkel secara hukum dari klaim kehilangan kelengkapan di masa mendatang."
    }
];

// Interactive real-world case simulations for beginners
const CASE_STUDIES = [
    {
        id: "case-water-damage",
        title: "Kasus 1: Laptop Masuk Air (Unit Ditinggal)",
        type: "Wajib Ditinggal & ACC",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        scenario: "Pelanggan membawa laptop Asus yang terkena tumpahan teh manis. Laptop tidak bisa dinyalakan sama sekali.",
        steps: [
            { stage: "01. Intake", actor: "Frontman", action: "Catat unit mati total kena air, terima charger original dan tas. Terbitkan Tiket Servis resmi berlabel barcode QR." },
            { stage: "02. Diagnosa", actor: "Teknisi", action: "Bongkar unit, bersihkan korosi dengan ultrasonic cleaner, temukan IC Power short circuit. Estimasi: Rp 350.000." },
            { stage: "03. Penawaran", actor: "Admin", action: "Kirim pesan WA rincian biaya Rp 350.000 dengan garansi 30 hari. Pelanggan membalas: 'Setuju kak, tolong dikerjakan'." },
            { stage: "04. Pengerjaan", actor: "Teknisi", action: "Ganti IC Power, ukur tegangan 19V & 3.3V/5V normal, running test YouTube 1 jam stabil. Status: Lolos QC." },
            { stage: "05. Notifikasi", actor: "Admin", action: "Kirim pesan WA penjemputan unit ke pelanggan beserta foto hasil tes dan segel garansi workshop." },
            { stage: "06. Handover", actor: "Kasir", action: "Pelanggan live test, bayar via QRIS Rp 350.000, TTD serah terima digital, cetak invoice dan kartu garansi resmi." }
        ]
    },
    {
        id: "case-quick-ram",
        title: "Kasus 2: Upgrade RAM & Ganti Pasta (Quick Service)",
        type: "Quick Fix (Tidak Ditinggal)",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        scenario: "Pelanggan membawa laptop Lenovo kerja yang terasa lambat saat membuka browser dan bersuhu panas.",
        steps: [
            { stage: "01. Intake", actor: "Frontman", action: "Inspeksi fisik normal. Konsultasi: disepakati tambah RAM 8GB DDR4 dan repaste thermal grizzly. Unit TIDAK perlu ditinggal." },
            { stage: "02. Eksekusi Cepat", actor: "Teknisi", action: "Bawa ke meja belakang langsung: buka casing, bersihkan debu kipas, pasang RAM 8GB, oles pasta baru (durasi 20 menit)." },
            { stage: "03. QC Kilat", actor: "Teknisi", action: "Nyalakan laptop, cek Task Manager RAM terbaca 16GB dual channel, suhu idle stabil di 42°C." },
            { stage: "04. Administrasi", actor: "Kasir", action: "Pelanggan yang menunggu di lounge langsung dipanggil, bayar jasa + part, invoice cetak, selesai tanpa tiket inap!" }
        ]
    },
    {
        id: "case-cancel-lcd",
        title: "Kasus 3: Layar Pecah & Pelanggan Batal (Alur Cancel)",
        type: "Alur Pembatalan & Reassembly",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
        scenario: "Pelanggan membawa laptop dengan layar pecah garis-garis karena tertekan benda keras saat dimasukkan ke tas.",
        steps: [
            { stage: "01. Intake", actor: "Frontman", action: "Dokumentasikan retakan layar luar-dalam di form tiket, simpan unit ke rak servis antrian diagnosa." },
            { stage: "02. Diagnosa", actor: "Teknisi", action: "Cek tipe panel (14 inch IPS 144Hz FHD), estimasi part LCD original Rp 1.150.000 + Jasa Rp 100.000." },
            { stage: "03. Penawaran", actor: "Admin", action: "Hubungi pelanggan via WA. Pelanggan menyatakan belum ada budget saat ini dan memilih BATAL perbaikan." },
            { stage: "04. Reassembly", actor: "Teknisi", action: "WAJIB: Pasang kembali layar lama dan baut unit secara rapi ke kondisi semula tanpa merusak komponen lain." },
            { stage: "05. Pengembalian", actor: "Frontman", action: "Pelanggan mengambil unit, verifikasi barang bawaan lengkap, status tiket diubah menjadi Dibatalkan." }
        ]
    }
];

export default function BusinessProcessFlowModal({ isOpen, onClose }) {
    // 3 Dedicated Distinct Sections
    const [activeTab, setActiveTab] = useState("pipeline"); // 'pipeline' | 'detail' | 'cases'
    const [selectedStageId, setSelectedStageId] = useState("intake");
    const [selectedCaseId, setSelectedCaseId] = useState("case-water-damage");

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
    const currentCase = CASE_STUDIES.find((c) => c.id === selectedCaseId) || CASE_STUDIES[0];

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* WIDE-TO-EDGE MODAL CONTAINER */}
            <div 
                className="bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-slate-200 w-[98vw] max-w-[1650px] h-[95vh] max-h-[95vh] flex flex-col overflow-hidden text-slate-900"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. STANDARDIZED CLEAN LIGHT HEADER WITH DISTINCT PAGE TABS */}
                <div className="px-5 sm:px-7 py-3.5 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
                                    Alur Kerja Operasional Bengkel Serv.io
                                </h2>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> SOP Bengkel
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Panduan terstandarisasi untuk pemula: dari penerimaan unit, diagnosa, penawaran, pengerjaan, hingga serah terima & garansi.
                            </p>
                        </div>
                    </div>

                    {/* View Switcher Tabs: 3 Explicit, Distinct Sections */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {[
                                { id: "pipeline", label: "1. Diagram Alur Sederhana", icon: GitFork },
                                { id: "detail", label: "2. Langkah Detail & Checklist", icon: Layers },
                                { id: "cases", label: "3. Simulasi Kasus Nyata", icon: Laptop }
                            ].map((tab) => {
                                const TabIcon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                                            isActive
                                                ? "bg-white text-blue-600 shadow-xs border border-slate-200"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                                        }`}
                                    >
                                        <TabIcon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                            title="Tutup (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 2. MAIN WORKSPACE VIEWPORT (EDGE TO EDGE WIDE VIEW) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-50/50">
                    
                    {/* =========================================================================
                        SECTION 1: DIAGRAM ALUR SEDERHANA (Dedicated Visual Flowchart Page)
                        ========================================================================= */}
                    {activeTab === "pipeline" && (
                        <div className="w-full max-w-full space-y-6">
                            
                            {/* Section Header Card */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <GitFork className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                            Halaman 1: Peta Alur Visual Keseluruhan Bengkel
                                        </h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-600">
                                        Alur kronologis mulai dari pelanggan membawa perangkat sampai unit selesai dan diserahkan kembali dengan garansi resmi.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("detail")}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
                                >
                                    <span>Pelajari Checklist & SOP Detail</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Wide Flow Pipeline Grid (Edge to Edge) */}
                            <div className="space-y-4">
                                
                                {/* STAGE 01: INTAKE WITH BRANCHING */}
                                <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                                                01
                                            </span>
                                            <div>
                                                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                                    Tahap 1: Intake & Konsultasi Awal (Frontman)
                                                </h4>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    Area: Meja Depan Bengkel
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold uppercase px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                            Frontman
                                        </span>
                                    </div>

                                    <p className="text-xs sm:text-sm text-slate-700 text-justify leading-relaxed">
                                        Pelanggan datang membawa unit bermasalah. Frontman mendengarkan keluhan secara seksama, mencatat riwayat pemakaian, kelengkapan unit (charger, tas), serta melakukan inspeksi fisik visual kilat di hadapan pelanggan.
                                    </p>

                                    {/* Decision Split Diamond */}
                                    <div className="pt-3 border-t border-slate-100 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <GitFork className="w-4 h-4 text-amber-500 shrink-0" />
                                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                                                Percabangan Keputusan: Apakah pengerjaan unit perlu ditinggal di bengkel?
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Branch A: Quick Service */}
                                            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-emerald-600" />
                                                        TIDAK DITINGGAL (Quick Service)
                                                    </span>
                                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                        Durasi 15-45 Menit
                                                    </span>
                                                </div>
                                                <p className="text-xs text-emerald-900 text-justify leading-relaxed">
                                                    Kerusakan ringan seperti ganti pasta thermal, pasang RAM/SSD baru, bersihkan debu kipas, atau aktivasi software. Unit langsung diserahkan ke teknisi meja belakang untuk dieksekusi saat itu juga. Pelanggan dapat menunggu di lounge.
                                                </p>
                                            </div>

                                            {/* Branch B: Tiket Servis Resmi */}
                                            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-2">
                                                        <QrCode className="w-4 h-4 text-blue-600" />
                                                        WAJIB DITINGGAL (Tiket Servis Resmi)
                                                    </span>
                                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-300">
                                                        Masuk Antrian Tiket
                                                    </span>
                                                </div>
                                                <p className="text-xs text-blue-900 text-justify leading-relaxed">
                                                    Motherboard mati, reballing chip, perbaikan IC, part inden, atau butuh running test berjam-jam. Wajib diinput ke ERP: Data Pelanggan, Data Perangkat, SN, Keluhan, Password, & Foto Kelengkapan. Tiket resmi terbit dan label barcode QR ditempel pada casing unit.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Flow Connecting Arrow */}
                                <div className="flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500 shadow-2xs">
                                        <ArrowDown className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* STAGE 02: DIAGNOSA */}
                                <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                                                02
                                            </span>
                                            <div>
                                                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                                    Tahap 2: Diagnosa Menyeluruh & SOP Checklist (Teknisi)
                                                </h4>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    Area: Meja Belakang Teknisi
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold uppercase px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                            Teknisi
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-700 text-justify leading-relaxed">
                                        Teknisi mengklaim tiket ('Take Over') dari antrian pengerjaan. Menggunakan SOP checklist 21 titik (Port USB, Keyboard, Layar LCD, Speaker, WiFi, Charger, Webcam, Baterai, Suhu Thermal), teknisi memeriksa unit, mendokumentasikan foto kerusakan fisik (Defect Mapping), dan merumuskan kalkulasi estimasi kebutuhan jasa serta suku cadang.
                                    </p>
                                </div>

                                {/* Flow Connecting Arrow */}
                                <div className="flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500 shadow-2xs">
                                        <ArrowDown className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* STAGE 03: QUOTATION & DECISION */}
                                <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                                                03
                                            </span>
                                            <div>
                                                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                                    Tahap 3: Penawaran Biaya & Konfirmasi Pelanggan (Admin)
                                                </h4>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    Area: Komunikasi WhatsApp Resmi
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold uppercase px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                                            Admin / Frontman
                                        </span>
                                    </div>

                                    <p className="text-xs sm:text-sm text-slate-700 text-justify leading-relaxed">
                                        Admin bengkel menghubungi pelanggan secara resmi via WhatsApp untuk menyampaikan hasil diagnosa, rincian biaya estimasi (Jasa Teknisi + Harga Suku Cadang), serta durasi masa garansi yang diberikan.
                                    </p>

                                    {/* Decision Split Diamond */}
                                    <div className="pt-3 border-t border-slate-100 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <GitFork className="w-4 h-4 text-amber-500 shrink-0" />
                                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                                                Percabangan Keputusan: Bagaimana keputusan pelanggan atas biaya estimasi?
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Branch Cancel */}
                                            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs sm:text-sm font-bold text-rose-900 flex items-center gap-2">
                                                        <XCircle className="w-4 h-4 text-rose-600" />
                                                        BATAL (Cancel Servis)
                                                    </span>
                                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                                                        Kembalikan Utuh
                                                    </span>
                                                </div>
                                                <p className="text-xs text-rose-900 text-justify leading-relaxed">
                                                    Biaya dirasa terlalu tinggi atau perangkat tidak ekonomis diperbaiki. Teknisi WAJIB merakit kembali unit ke kondisi semula secara rapi (seluruh baut terpasang, tanpa cacat baru). Status tiket diubah menjadi Dibatalkan dan unit siap diambil kembali.
                                                </p>
                                            </div>

                                            {/* Branch ACC */}
                                            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        SETUJU (ACC / Lanjut Servis)
                                                    </span>
                                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                        Mulai Pengerjaan
                                                    </span>
                                                </div>
                                                <p className="text-xs text-emerald-900 text-justify leading-relaxed">
                                                    Pelanggan menyetujui total biaya dan estimasi waktu. Status tiket diperbarui menjadi 'Dalam Pengerjaan'. Teknisi langsung menjadwalkan eksekusi pengerjaan, mengambil sparepart dari gudang, dan mengisi log perbaikan berkala.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Flow Connecting Arrow */}
                                <div className="flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500 shadow-2xs">
                                        <ArrowDown className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* STAGE 04: EXECUTION & SPAREPART */}
                                <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                                                04
                                            </span>
                                            <div>
                                                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                                    Tahap 4: Eksekusi Servis, Sparepart & QC (Teknisi)
                                                </h4>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    Area: Meja Servis & Gudang Suku Cadang
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold uppercase px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                            Teknisi
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-700 text-justify leading-relaxed">
                                        Teknisi melakukan reparasi teknis (soldering IC, reballing chip, flashing BIOS, ganti LCD, pasang engsel). Suku cadang resmi diambil dari gudang katalog ERP (stok terpotong otomatis). Teknisi mengisi log perbaikan dan menjalankan stress test pengujian mutu (Quality Control) minimal 30-60 menit.
                                    </p>
                                </div>

                                {/* Flow Connecting Arrow */}
                                <div className="flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500 shadow-2xs">
                                        <ArrowDown className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* STAGE 05: COMPLETION NOTIFICATION */}
                                <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                                                05
                                            </span>
                                            <div>
                                                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                                    Tahap 5: Dokumentasi Pasca-Servis & Notifikasi Selesai (Admin)
                                                </h4>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    Area: Meja QC & Notifikasi WhatsApp
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold uppercase px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                            Admin
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-700 text-justify leading-relaxed">
                                        Unit dinyatakan lolos uji kelayakan QC. Teknisi mendokumentasikan foto hasil servis dan menempel segel garansi workshop. Admin mengirim pesan WhatsApp resmi otomatis bahwa unit telah selesai dan siap diambil di workshop beserta rincian total tagihan.
                                    </p>
                                </div>

                                {/* Flow Connecting Arrow */}
                                <div className="flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500 shadow-2xs">
                                        <ArrowDown className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* STAGE 06: HANDOVER, PAYMENT, WARRANTY */}
                                <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                                                06
                                            </span>
                                            <div>
                                                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                                    Tahap 6: Serah Terima, Kasir, Garansi & Tanda Tangan Digital (Kasir)
                                                </h4>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    Area: Meja Kasir & Serah Terima
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold uppercase px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                                            Kasir & Pelanggan
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-700 text-justify leading-relaxed">
                                        Pelanggan menguji unit secara langsung di meja serah terima (live testing). Kasir menerbitkan Invoice pembayaran (Tunai, QRIS, Transfer Bank). Pelanggan menandatangani bukti serah terima secara digital di layar HP/tablet. Sertifikat garansi aktif dan tiket resmi ditutup ('CLOSED').
                                    </p>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* =========================================================================
                        SECTION 2: LANGKAH DETAIL & CHECKLIST OPERASIONAL (Dedicated SOP Page)
                        ========================================================================= */}
                    {activeTab === "detail" && (
                        <div className="w-full max-w-full space-y-6">
                            
                            {/* Section Header Card */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                            Halaman 2: Panduan Langkah Detail & Checklist SOP
                                        </h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-600">
                                        Pilih tahapan di bawah ini untuk mempelajari SOP lengkap, tanggung jawab peran, dan checklist wajib pengerjaan.
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap self-start md:self-auto">
                                    Tahap Aktif: {currentStage.stepNumber} - {currentStage.title}
                                </span>
                            </div>

                            {/* Horizontal Interactive Step Navigation Exclusively Scoped to This Page */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs overflow-x-auto custom-scrollbar">
                                <div className="flex items-center justify-between min-w-[760px] gap-2">
                                    {FLOW_STAGES.map((stage, idx) => {
                                        const isSelected = stage.id === selectedStageId;
                                        const RoleIcon = stage.roleIcon;

                                        return (
                                            <div key={stage.id} className="flex items-center flex-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedStageId(stage.id)}
                                                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer w-full text-left border ${
                                                        isSelected
                                                            ? "bg-blue-50/70 border-blue-600 shadow-xs ring-2 ring-blue-500/10"
                                                            : "bg-white hover:bg-slate-50 border-slate-200"
                                                    }`}
                                                >
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 transition-colors ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}>
                                                        {stage.stepNumber}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-xs font-bold truncate leading-snug ${
                                                            isSelected ? "text-blue-700" : "text-slate-800"
                                                        }`}>
                                                            {stage.title}
                                                        </p>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <RoleIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                                            <span className="text-xs font-medium text-slate-500 truncate whitespace-nowrap">
                                                                {stage.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>

                                                {idx < FLOW_STAGES.length - 1 && (
                                                    <ChevronRight className="w-4 h-4 text-slate-300 mx-1 shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Wide 2-Column Responsive Layout for Selected Stage Details */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                
                                {/* Left Column: Stage Overview & Branching (5 Cols) */}
                                <div className="lg:col-span-5 space-y-4">
                                    
                                    {/* Stage Identification Card */}
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-mono text-sm font-bold text-blue-600 shrink-0">
                                                    {currentStage.stepNumber}
                                                </span>
                                                <div>
                                                    <h4 className="text-base font-bold text-slate-900 tracking-tight">
                                                        {currentStage.title}
                                                    </h4>
                                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 mt-1 rounded-md border ${currentStage.roleBadgeBg}`}>
                                                        Penanggung Jawab: {currentStage.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs sm:text-sm text-slate-700 text-justify leading-relaxed">
                                            {currentStage.description}
                                        </p>

                                        {currentStage.erpActionLink && (
                                            <div className="pt-2 border-t border-slate-100">
                                                <Link
                                                    to={currentStage.erpActionLink}
                                                    onClick={onClose}
                                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                                                >
                                                    <span>{currentStage.erpActionText}</span>
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Branching Card If Applicable */}
                                    {currentStage.hasBranching && currentStage.branches && (
                                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                            <div className="flex items-center gap-2">
                                                <GitFork className="w-4 h-4 text-amber-500" />
                                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                                    {currentStage.branchQuestion}
                                                </h4>
                                            </div>

                                            <div className="space-y-3 pt-1">
                                                {currentStage.branches.map((branch, bIdx) => {
                                                    const BranchIcon = branch.icon;
                                                    return (
                                                        <div 
                                                            key={bIdx}
                                                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <BranchIcon className="w-4 h-4 text-slate-700" />
                                                                    <span className="text-xs font-bold text-slate-900">
                                                                        {branch.label}
                                                                    </span>
                                                                </div>
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${branch.badgeClass}`}>
                                                                    {branch.badge}
                                                                </span>
                                                            </div>

                                                            <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                                                                <strong className="text-slate-800">Kondisi: </strong>
                                                                {branch.condition}
                                                            </div>

                                                            <p className="text-xs text-slate-700 text-justify leading-relaxed">
                                                                {branch.outcome}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Right Column: Mandatory Tasks Checklist & Security Guidelines (7 Cols) */}
                                <div className="lg:col-span-7 space-y-4">
                                    
                                    {/* Mandatory Checklist Tasks */}
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <ClipboardCheck className="w-4 h-4 text-blue-600" />
                                            <span>Daftar Checklist Tugas Wajib Pada Tahap Ini</span>
                                        </h4>

                                        <div className="space-y-2.5">
                                            {currentStage.keyTasks.map((task, tIdx) => (
                                                <div 
                                                    key={tIdx}
                                                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                                                >
                                                    <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify font-medium">
                                                        {task}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Anti-Fraud / Pro Tip Notice */}
                                    {currentStage.proTip && (
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-0.5">
                                                    Standar Keamanan & Anti-Fraud Bengkel
                                                </h5>
                                                <p className="text-xs sm:text-sm text-amber-900 text-justify leading-relaxed">
                                                    {currentStage.proTip}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stage Navigation Buttons */}
                                    <div className="pt-2 flex items-center justify-between">
                                        <button
                                            type="button"
                                            disabled={currentIndex === 0}
                                            onClick={() => setSelectedStageId(FLOW_STAGES[currentIndex - 1].id)}
                                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                                        >
                                            ← Tahap Sebelumnya
                                        </button>

                                        <span className="text-xs font-bold text-slate-400 font-mono">
                                            Tahap {currentIndex + 1} dari {FLOW_STAGES.length}
                                        </span>

                                        {currentIndex < FLOW_STAGES.length - 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedStageId(FLOW_STAGES[currentIndex + 1].id)}
                                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm font-bold text-white shadow-2xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                                            >
                                                <span>Tahap Berikutnya</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab("cases")}
                                                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs sm:text-sm font-bold text-white shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                                            >
                                                Lanjut Simulasi Kasus →
                                            </button>
                                        )}
                                    </div>

                                </div>

                            </div>

                        </div>
                    )}

                    {/* =========================================================================
                        SECTION 3: SIMULASI KASUS NYATA (Dedicated Real-World Case Studies Page)
                        ========================================================================= */}
                    {activeTab === "cases" && (
                        <div className="w-full max-w-full space-y-6">
                            
                            {/* Section Header Card */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Laptop className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                            Halaman 3: Simulasi Kasus Nyata di Meja Servis
                                        </h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-600">
                                        Pelajari bagaimana alur kerja dan pembagian peran petugas diterapkan secara nyata pada 3 skenario yang paling sering ditemui.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("pipeline")}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
                                >
                                    <span>Kembali ke Diagram Alur</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Case Selector Tabs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {CASE_STUDIES.map((c) => {
                                    const isSelected = c.id === selectedCaseId;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setSelectedCaseId(c.id)}
                                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                                isSelected
                                                    ? "bg-blue-50/70 border-blue-600 shadow-xs ring-2 ring-blue-500/10"
                                                    : "bg-white hover:bg-slate-50 border-slate-200"
                                            }`}
                                        >
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${c.badgeColor} whitespace-nowrap`}>
                                                {c.type}
                                            </span>
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-2 truncate">
                                                {c.title}
                                            </h4>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Selected Case Detail Breakdown (Wide Edge to Edge) */}
                            <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
                                <div className="border-b border-slate-100 pb-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-base sm:text-lg font-bold text-slate-900">
                                            {currentCase.title}
                                        </h4>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentCase.badgeColor} whitespace-nowrap`}>
                                            {currentCase.type}
                                        </span>
                                    </div>
                                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-xs sm:text-sm text-slate-700 text-justify leading-relaxed">
                                            <strong className="text-slate-900">Skenario Masalah: </strong>
                                            {currentCase.scenario}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-1">
                                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Workflow className="w-4 h-4 text-blue-600" />
                                        <span>Kronologi & Eksekusi Peran Petugas</span>
                                    </h5>

                                    <div className="space-y-2.5">
                                        {currentCase.steps.map((st, sIdx) => (
                                            <div 
                                                key={sIdx}
                                                className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                                            >
                                                <div className="flex items-center gap-2 sm:w-48 shrink-0">
                                                    <span className="text-xs sm:text-sm font-bold text-blue-700 whitespace-nowrap">
                                                        {st.stage}
                                                    </span>
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 whitespace-nowrap">
                                                        {st.actor}
                                                    </span>
                                                </div>

                                                <p className="text-xs sm:text-sm text-slate-700 text-justify leading-relaxed flex-1">
                                                    {st.action}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                </div>

                {/* 3. MODAL FOOTER BAR (Clean Light Slate) */}
                <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 whitespace-nowrap font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Frontman (Meja Depan)
                        </span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Teknisi (Meja Belakang)
                        </span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Admin & Kasir (Administrasi)
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-slate-400">
                        <span>Tekan <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md text-slate-700 text-xs font-bold">ESC</kbd> untuk menutup</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
