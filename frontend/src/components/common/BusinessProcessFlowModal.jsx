import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    X,
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
    Send,
    Package,
    Sparkles,
    ChevronRight,
    Layers,
    ExternalLink,
    Laptop,
    Cpu,
    GitFork,
    Workflow,
    Check,
    ClipboardCheck,
    Shield,
    Target,
    HelpCircle,
    Columns,
    GitCommit,
    FileText
} from "lucide-react";

// Standardized 6 Stages of the Serv.io Workshop ERP Lifecycle
// Symmetrical architecture: every stage has 3 left cards and 3 right cards for perfect balance
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
        sopInstructions: [
            "Sambut pelanggan di meja depan dengan ramah dan dengarkan gejala kerusakan spesifik (mati total, blank, panas).",
            "Lakukan inspeksi visual bodi unit (baut, lecet, casing retak) serta catat seluruh kelengkapan (adaptor, tas, box).",
            "Tentukan jenis pengerjaan: Quick Service (bisa ditunggu) atau Tiket Inap (masuk antrian pengerjaan mendalam)."
        ],
        decisionRules: [
            {
                type: "quick",
                label: "Jalur A: Quick Service (Bisa Ditunggu)",
                badge: "Durasi 15-45 Menit",
                badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
                condition: "Kerusakan ringan seperti ganti pasta thermal, pasang RAM/SSD, bersihkan debu kipas, atau aktivasi software.",
                outcome: "Unit langsung diserahkan ke teknisi di meja belakang untuk dieksekusi saat itu juga. Pelanggan dapat menunggu di lounge bengkel."
            },
            {
                type: "inbound",
                label: "Jalur B: Tiket Servis Resmi (Unit Ditinggal)",
                badge: "Masuk Antrian Tiket",
                badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
                condition: "Kerusakan berat seperti mati total, reballing IC, jalur sirkuit putus, part inden, atau running test lama.",
                outcome: "Wajib diinput ke sistem ERP: Data Pelanggan, Perangkat, SN, Keluhan, dan Foto Kelengkapan. Tiket resmi terbit dan label barcode QR ditempel."
            }
        ],
        keyTasks: [
            "Mendengarkan gejala kerusakan (mati total, tidak tampil gambar, blue screen, panas berlebih).",
            "Mencatat seluruh kelengkapan bawaan pelanggan (Adaptor/Charger, Kabel Power, Tas Laptop, Box).",
            "Inspeksi fisik eksternal (baut hilang, lecet, retak) guna mencegah komplain fisik saat pengambilan.",
            "Konfirmasi kata sandi Windows/PIN serta persetujuan pencadangan data penting pelanggan."
        ],
        deliverables: [
            "Tiket servis resmi terbit dengan nomor tiket dan kode QR barcode tercetak.",
            "Label stiker barcode QR tertempel rapi pada bodi perangkat pelanggan.",
            "Foto kelengkapan (adaptor, tas, kondisi fisik) tersimpan di modul ERP."
        ],
        slaAndPic: {
            pic: "Frontman / Meja Depan",
            sla: "5 - 10 Menit di Meja Depan",
            checkpoint: "Formulir digital ditandatangani pelanggan"
        },
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
        sopInstructions: [
            "Klaim tiket servis dari rak antrian dan lakukan verifikasi fisik sesuai catatan meja depan.",
            "Bongkar unit secara hati-hati, ukur tegangan rail utama (19V, 3.3V, 5V) dan lakukan cek arus pendek (short circuit).",
            "Lakukan pengujian 21-titik checklist standar dan dokumentasikan titik kerusakan fisik pada Defect Mapper."
        ],
        decisionRules: [
            {
                type: "reparable",
                label: "Kondisi A: Kerusakan Jalur / Komponen Eksisting",
                badge: "Jasa Reparasi Murni",
                badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
                condition: "Kerusakan dapat diatasi melalui soldering jalur, flashing BIOS, reballing chip, atau pembersihan korosi.",
                outcome: "Teknisi menghitung estimasi biaya berdasarkan tingkat kesulitan pengerjaan tanpa perlu menambahkan beban biaya suku cadang baru."
            },
            {
                type: "part_needed",
                label: "Kondisi B: Komponen Rusak Wajib Diganti",
                badge: "Butuh Suku Cadang",
                badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
                condition: "Komponen fisik rusak permanen (LCD pecah, baterai kembung, keyboard short, IC berlubang, kipas macet).",
                outcome: "Teknisi memeriksa ketersediaan suku cadang di modul gudang ERP Serv.io dan mencantumkan rincian part pada estimasi biaya."
            }
        ],
        keyTasks: [
            "Melakukan verifikasi 21-titik checklist: Port USB, Keyboard, Layar LCD, Speaker, WiFi, Charger, Webcam, dan Baterai.",
            "Dokumentasi foto kerusakan fisik (Defect Mapping) dan kondisi awal motherboard sebelum disolder.",
            "Menghitung estimasi biaya pengerjaan: estimasi durasi, jasa teknisi, dan suku cadang yang wajib diganti.",
            "Mengisi formulir estimasi pada tiket servis agar Admin dapat meneruskan rincian biaya ke pelanggan."
        ],
        deliverables: [
            "Formulir 21-titik checklist terisi lengkap dengan status pass/fail per komponen.",
            "Peta titik cacat fisik (2D Defect Map) tersimpan di catatan tiket.",
            "Rincian kalkulasi estimasi jasa dan daftar suku cadang yang dibutuhkan siap diajukan."
        ],
        slaAndPic: {
            pic: "Teknisi Hardware / Diagnostik",
            sla: "1 - 3 Jam Pengerjaan Diagnosa",
            checkpoint: "Hasil ukur rail & defect map terinput di ERP"
        },
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
        sopInstructions: [
            "Buka estimasi teknisi di sistem ERP, verifikasi rincian jasa dan harga part sebelum menghubungi pelanggan.",
            "Kirim pesan WhatsApp resmi yang mencantumkan rincian biaya transparan, durasi pengerjaan, dan jaminan garansi.",
            "Catat keputusan pelanggan secara digital di tiket servis: ACC untuk lanjut, atau BATAL jika tidak disetujui."
        ],
        decisionRules: [
            {
                type: "reject",
                label: "Keputusan A: Pelanggan Membatalkan (CANCEL)",
                badge: "Batal Servis",
                badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
                condition: "Biaya servis dirasa terlalu tinggi atau perangkat dinilai pelanggan sudah tidak ekonomis lagi untuk diperbaiki.",
                outcome: "Teknisi WAJIB merakit kembali unit ke kondisi semula secara rapi (seluruh baut terpasang, tanpa cacat tambahan). Biaya diagnosa disesuaikan kebijakan toko."
            },
            {
                type: "accept",
                label: "Keputusan B: Pelanggan Menyetujui (ACC / LANJUT)",
                badge: "Disetujui Pelanggan",
                badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
                condition: "Pelanggan menyetujui rincian total biaya, masa garansi yang diberikan, dan perkiraan waktu pengerjaan.",
                outcome: "Status tiket diperbarui menjadi 'Dalam Pengerjaan'. Teknisi langsung menjadwalkan eksekusi reparasi dan mereservasi stok sparepart."
            }
        ],
        keyTasks: [
            "Menjelaskan penyebab kerusakan dan solusi teknis dengan bahasa yang sopan dan mudah dipahami.",
            "Menyampaikan rincian biaya: Jasa Servis + Harga Suku Cadang + Durasi Garansi yang diberikan.",
            "Mendokumentasikan keputusan pelanggan ke sistem: Mengubah status tiket sesuai persetujuan pelanggan.",
            "Memberikan kepastian estimasi waktu pengerjaan kepada pelanggan setelah disetujui."
        ],
        deliverables: [
            "Log pengiriman pesan WhatsApp penawaran resmi tercatat pada riwayat tiket.",
            "Persetujuan pelanggan (ACC) terdokumentasi sebelum komponen dibongkar lebih lanjut.",
            "Status tiket bertransisi ke 'Dalam Pengerjaan' atau 'Dibatalkan'."
        ],
        slaAndPic: {
            pic: "Admin Bengkel / Customer Service",
            sla: "Maksimal 30 Menit Pasca Diagnosa",
            checkpoint: "Konfirmasi tertulis resmi nomor WhatsApp pelanggan"
        },
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
        sopInstructions: [
            "Ambil suku cadang dari gudang sesuai estimasi yang telah di-ACC dan periksa kecocokan nomor part.",
            "Lakukan tindakan perbaikan teknis (soldering IC, pergantian LCD, repaste thermal) sesuai SOP keselamatan kerja.",
            "Jalankan stress test hardware minimal 30-60 menit (suhu thermal, tes beban kerja YouTube/benchmark)."
        ],
        decisionRules: [
            {
                type: "part_used",
                label: "Skenario A: Menggunakan Suku Cadang Gudang",
                badge: "Potong Stok Otomatis",
                badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
                condition: "Perbaikan memerlukan part baru seperti SSD, RAM, LCD Panel, Baterai, Keyboard, atau Kipas Pendingin.",
                outcome: "Stok suku cadang gudang terpotong otomatis dari inventaris ERP Serv.io dan tercatat dalam rincian nota servis unit."
            },
            {
                type: "component_level",
                label: "Skenario B: Reparasi Tanpa Suku Cadang Baru",
                badge: "Jasa Komponen Murni",
                badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
                condition: "Perbaikan berupa restorasi jalur tembaga putus, solder ulang kaki IC korosi, atau perbaikan engsel mekanik.",
                outcome: "Teknisi mengisi tahapan progres pada 'Log Perbaikan' tanpa mencantumkan konsumsi stok fisik inventaris."
            }
        ],
        keyTasks: [
            "Eksekusi perbaikan teknis (soldering IC, reballing chip, flashing BIOS, ganti LCD, pasang engsel).",
            "Pemotongan stok suku cadang dari katalog gudang ERP secara otomatis saat part dipasang ke unit.",
            "Pengisian bertahap 'Log Perbaikan' setiap tahapan pengerjaan terselesaikan.",
            "Uji Kualitas (QC Verification): Menjalankan stress test hardware minimal 30-60 menit hingga suhu dan daya stabil."
        ],
        deliverables: [
            "Komponen rusak berhasil diganti atau jalur sirkuit berhasil direparasi sempurna.",
            "Stok suku cadang gudang terpotong otomatis di sistem inventaris ERP.",
            "Hasil running stress test hardware (suhu dan kestabilan daya) lolos parameter."
        ],
        slaAndPic: {
            pic: "Teknisi Eksekutor & Kepala Teknisi",
            sla: "Sesuai Paket SLA Servis",
            checkpoint: "Log perbaikan terisi & part tercatat resmi"
        },
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
        sopInstructions: [
            "Verifikasi bahwa unit telah lolos 100% running test dan bersihkan bodi dari bekas debu atau pasta thermal.",
            "Pasang stiker segel garansi workshop Serv.io dan unggah foto dokumentasi fisik pasca-servis ke sistem.",
            "Kirim pesan WhatsApp resmi otomatis memberitahukan unit telah siap diambil lengkap dengan rincian biaya."
        ],
        decisionRules: [
            {
                type: "pass_qc",
                label: "Kriteria A: Lolos Uji Kelayakan QC",
                badge: "Siap Diserahkan",
                badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
                condition: "Seluruh fungsi normal, suhu stabil, tidak ada bluescreen saat stress test, dan segel garansi terpasang rapi.",
                outcome: "Status tiket diubah menjadi 'Siap Diambil' dan sistem mengantarkan notifikasi WhatsApp penjemputan ke nomor pelanggan."
            },
            {
                type: "fail_qc",
                label: "Kriteria B: Masih Ditemukan Gejala Kerusakan",
                badge: "Kembali ke Meja Teknisi",
                badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
                condition: "Ditemukan suhu berlebih, perangkat restart mendadak, atau salah satu port belum berfungsi normal saat QC.",
                outcome: "Unit WAJIB dikembalikan ke meja teknisi untuk investigasi ulang. Pelanggan BELUM BOLEH dikabari sebelum unit 100% sempurna."
            }
        ],
        keyTasks: [
            "Mengunggah foto dokumentasi unit setelah selesai servis (kondisi rapi dan segel garansi terpasang).",
            "Menyatukan kelengkapan pelanggan (charger, tas) dan komponen lama ke dalam tas serah terima.",
            "Admin mengirim pesan WhatsApp resmi otomatis: 'Unit Anda telah selesai diperbaiki dan siap diambil di workshop'.",
            "Menyertakan rincian total tagihan serta tautan tracking online resmi Serv.io."
        ],
        deliverables: [
            "Foto kondisi fisik pasca-servis dan segel garansi terunggah di modul tiket.",
            "Unit terkemas rapi bersama seluruh kelengkapan bawaan pelanggan.",
            "Pesan WhatsApp notifikasi penjemputan unit terkirim ke kontak pelanggan."
        ],
        slaAndPic: {
            pic: "Admin Notifikasi & Quality Assurance",
            sla: "Maksimal 15 Menit Pasca Lolos QC",
            checkpoint: "Pesan WhatsApp terkirim & tracking aktif"
        },
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
        sopInstructions: [
            "Sambut pelanggan, lakukan demonstrasi live test bersama (keyboard, display, audio, charger) di hadapan pelanggan.",
            "Terbitkan invoice resmi melalui modul ERP dan proses pembayaran (QRIS, Tunai, atau Transfer Bank).",
            "Minta tanda tangan digital serah terima di layar HP/tablet, serahkan kartu garansi resmi, dan ubah status menjadi CLOSED."
        ],
        decisionRules: [
            {
                type: "handover_success",
                label: "Prosedur A: Pembayaran Lunas & Live Test Sukses",
                badge: "Garansi SLA Aktif",
                badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
                condition: "Pelanggan puas dengan hasil pengetesan, pembayaran invoice terverifikasi, dan tanda tangan digital telah terekam.",
                outcome: "Cetak invoice lunas, kartu garansi 30-90 hari resmi diterbitkan, dan tiket ditutup ('CLOSED') dalam laporan keuangan."
            },
            {
                type: "handover_issue",
                label: "Prosedur B: Pelanggan Menemukan Kendala Tambahan",
                badge: "Garansi / Retur Instan",
                badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
                condition: "Pelanggan menemukan hal yang belum sesuai dengan ekspektasi saat pengetesan langsung di meja serah terima.",
                outcome: "Unit langsung ditangani oleh Kepala Teknisi tanpa biaya tambahan sebagai bentuk perlindungan kepuasan konsumen Serv.io."
            }
        ],
        keyTasks: [
            "Live Testing: Pelanggan menguji fungsi keyboard, layar, audio, port USB, dan pengisian daya baterai bersama staf.",
            "Penerbitan Invoice Resmi dari modul ERP Serv.io (pencatatan metode bayar Tunai, QRIS, atau Transfer Bank).",
            "Tanda Tangan Digital Serah Terima di layar tablet/HP sebagai bukti penerimaan unit tanpa cacat baru.",
            "Penerbitan Kartu Garansi Servis (SLA Garansi 30 - 90 Hari) yang tersimpan di sistem pelacakan online."
        ],
        deliverables: [
            "Lembar berita acara live test fisik ditandatangani digital oleh pelanggan.",
            "Invoice pembayaran lunas tercetak (Tunai, QRIS, atau Transfer).",
            "Sertifikat kartu garansi resmi SLA aktif dan tiket resmi ditutup ('CLOSED')."
        ],
        slaAndPic: {
            pic: "Admin Kasir / Meja Serah Terima",
            sla: "10 - 15 Menit saat Pengambilan",
            checkpoint: "Tanda tangan digital tersimpan & lunas"
        },
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
    const [diagramView, setDiagramView] = useState("swimlane"); // 'swimlane' | 'flowchart'
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

    const jumpToStageDetail = (stageId) => {
        setSelectedStageId(stageId);
        setActiveTab("detail");
    };

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
                                Panduan terstandarisasi untuk pemula: diagram alur minimalis, SOP checklist seimbang, dan simulasi kasus nyata.
                            </p>
                        </div>
                    </div>

                    {/* View Switcher Tabs: 3 Explicit, Distinct Sections */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {[
                                { id: "pipeline", label: "1. Diagram Alur Proses", icon: GitFork },
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

                {/* 2. MAIN WORKSPACE VIEWPORT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-50/50">
                    
                    {/* =========================================================================
                        SECTION 1: TRUE BUSINESS PROCESS FLOW DIAGRAM (MINIMUM TEXT / BPMN STYLE)
                        ========================================================================= */}
                    {activeTab === "pipeline" && (
                        <div className="w-full max-w-full space-y-5">
                            
                            {/* Diagram Header, Shape Legend & View Mode Toggle */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <GitFork className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                            Diagram Alur Proses Bisnis (Business Process Flowchart)
                                        </h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500">
                                        Format standar BPMN dengan teks minimalis. Klik kotak tahapan manapun untuk langsung membuka SOP & Checklist detail di Halaman 2.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Flowchart Shape Legend */}
                                    <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-5 h-3 rounded-full bg-slate-900 inline-block"></span>
                                            <span className="font-semibold text-3xs uppercase">Terminal</span>
                                        </div>
                                        <span className="text-slate-300">•</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3.5 h-3.5 rounded-sm bg-white border border-slate-400 inline-block"></span>
                                            <span className="font-semibold text-3xs uppercase">Aktivitas</span>
                                        </div>
                                        <span className="text-slate-300">•</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rotate-45 bg-amber-400 inline-block"></span>
                                            <span className="font-semibold text-3xs uppercase">Keputusan</span>
                                        </div>
                                    </div>

                                    {/* View Toggle */}
                                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setDiagramView("swimlane")}
                                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                diagramView === "swimlane"
                                                    ? "bg-white text-blue-600 shadow-2xs border border-slate-200"
                                                    : "text-slate-600 hover:text-slate-900"
                                            }`}
                                        >
                                            <Columns className="w-3.5 h-3.5" />
                                            <span>Swimlane Departemen</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDiagramView("flowchart")}
                                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                diagramView === "flowchart"
                                                    ? "bg-white text-blue-600 shadow-2xs border border-slate-200"
                                                    : "text-slate-600 hover:text-slate-900"
                                            }`}
                                        >
                                            <GitCommit className="w-3.5 h-3.5" />
                                            <span>BPMN Flow Vertikal</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* VIEW A: AUTHENTIC BPMN SWIMLANE DIAGRAM (Role Lanes: Frontman, Teknisi, Admin / Kasir) */}
                            {diagramView === "swimlane" && (
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-4 sm:p-6 overflow-x-auto custom-scrollbar">
                                    <div className="min-w-[1020px] space-y-4">
                                        
                                        {/* SWIMLANE 1: FRONTMAN (Customer Service / Meja Depan) */}
                                        <div className="border border-blue-200 bg-blue-50/20 rounded-2xl overflow-hidden flex items-stretch">
                                            {/* Lane Header */}
                                            <div className="w-36 sm:w-44 bg-blue-600 text-white p-4 flex flex-col justify-center items-center text-center shrink-0 border-r border-blue-700">
                                                <User className="w-6 h-6 mb-1 text-blue-100" />
                                                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                                                    FRONTMAN
                                                </h4>
                                                <span className="text-3xs text-blue-200 font-semibold mt-0.5">Meja Depan & Intake</span>
                                            </div>

                                            {/* Lane Content Track */}
                                            <div className="p-4 sm:p-5 flex-1 flex flex-wrap items-center gap-3">
                                                {/* Terminal Start */}
                                                <div className="px-3.5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center gap-2 shadow-2xs shrink-0">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                                    <span>Pelanggan Tiba</span>
                                                </div>

                                                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                                                {/* Node 01: Intake */}
                                                <button
                                                    type="button"
                                                    onClick={() => jumpToStageDetail("intake")}
                                                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 shrink-0 flex items-center gap-2 text-left"
                                                    title="Lihat SOP 01. Intake"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                                    <div>
                                                        <p className="leading-tight">01. Penerimaan & Cek Fisik</p>
                                                        <span className="text-3xs text-slate-400 font-normal">Inspeksi visual & kelengkapan</span>
                                                    </div>
                                                </button>

                                                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                                                {/* Decision: Ditinggal? */}
                                                <div className="px-3 py-2 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0">
                                                    <GitFork className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                    <span>Perlu Ditinggal?</span>
                                                </div>

                                                <div className="flex flex-col gap-2 shrink-0">
                                                    {/* Branch: TIDAK (Quick Service ke Meja Belakang) */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-3xs font-black uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                                            TIDAK
                                                        </span>
                                                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                            Arahkan Langsung ke Teknisi (Quick Fix)
                                                        </span>
                                                    </div>

                                                    {/* Branch: YA (Input Tiket ERP) */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-3xs font-black uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white">
                                                            YA
                                                        </span>
                                                        <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                                                        <button
                                                            type="button"
                                                            onClick={() => jumpToStageDetail("intake")}
                                                            className="px-3 py-1 rounded-lg bg-white border border-blue-200 text-blue-900 text-xs font-bold hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                                        >
                                                            <QrCode className="w-3 h-3 text-blue-600" />
                                                            <span>Input Tiket Servis & Tempel Barcode QR</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Return Section if Cancelled */}
                                                <div className="ml-auto pl-4 border-l border-blue-200 flex items-center gap-2 shrink-0">
                                                    <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-1.5">
                                                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                        <span>Pengembalian Unit Batal</span>
                                                    </div>
                                                    <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                                                    <div className="px-3 py-1.5 rounded-full bg-rose-700 text-white text-xs font-bold">
                                                        <span>Dibatalkan</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SWIMLANE CONNECTOR 1 -> 2 */}
                                        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold py-0.5">
                                            <ArrowDown className="w-4 h-4 text-blue-500 animate-bounce" />
                                            <span>Unit diserahkan ke Meja Belakang Teknisi</span>
                                        </div>

                                        {/* SWIMLANE 2: TEKNISI (Workshop Belakang / Reparasi Hardware) */}
                                        <div className="border border-indigo-200 bg-indigo-50/20 rounded-2xl overflow-hidden flex items-stretch">
                                            {/* Lane Header */}
                                            <div className="w-36 sm:w-44 bg-indigo-600 text-white p-4 flex flex-col justify-center items-center text-center shrink-0 border-r border-indigo-700">
                                                <Wrench className="w-6 h-6 mb-1 text-indigo-100" />
                                                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                                                    TEKNISI
                                                </h4>
                                                <span className="text-3xs text-indigo-200 font-semibold mt-0.5">Workshop Meja Servis</span>
                                            </div>

                                            {/* Lane Content Track */}
                                            <div className="p-4 sm:p-5 flex-1 flex flex-wrap items-center gap-3">
                                                {/* Quick Fix Path */}
                                                <div className="flex items-center gap-2 bg-emerald-50/70 p-1.5 rounded-xl border border-emerald-200 shrink-0">
                                                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span className="text-xs font-bold text-emerald-900">
                                                        Quick Service (15-45m)
                                                    </span>
                                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                                        Eksekusi di Tempat
                                                    </span>
                                                </div>

                                                <span className="text-slate-300 font-bold">|</span>

                                                {/* Inbound Ticket Path */}
                                                {/* Node 02: Diagnosa */}
                                                <button
                                                    type="button"
                                                    onClick={() => jumpToStageDetail("diagnosis")}
                                                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 shrink-0 flex items-center gap-2 text-left"
                                                    title="Lihat SOP 02. Diagnosa"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                                                    <div>
                                                        <p className="leading-tight">02. Diagnosa 21-Titik</p>
                                                        <span className="text-3xs text-slate-400 font-normal">Ukur tegangan & defect map</span>
                                                    </div>
                                                </button>

                                                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                                                {/* Estimasi Biaya */}
                                                <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0">
                                                    <Package className="w-3.5 h-3.5 text-slate-500" />
                                                    <span>Kalkulasi Part & Jasa</span>
                                                </div>

                                                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                                                {/* Branch Cancel (Reassembly) */}
                                                <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-1.5 shrink-0">
                                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                    <span>Rakit ke Kondisi Semula</span>
                                                </div>

                                                <span className="text-slate-300 font-bold">|</span>

                                                {/* Node 04: Pengerjaan */}
                                                <button
                                                    type="button"
                                                    onClick={() => jumpToStageDetail("execution")}
                                                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 shrink-0 flex items-center gap-2 text-left"
                                                    title="Lihat SOP 04. Pengerjaan"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                                                    <div>
                                                        <p className="leading-tight">04. Reparasi & Pasang Part</p>
                                                        <span className="text-3xs text-slate-400 font-normal">Soldering IC & potong stok</span>
                                                    </div>
                                                </button>

                                                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                                                {/* QC Verification */}
                                                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0">
                                                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Running Test QC 30-60m</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SWIMLANE CONNECTOR 2 -> 3 */}
                                        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold py-0.5">
                                            <ArrowDown className="w-4 h-4 text-purple-500 animate-bounce" />
                                            <span>Notifikasi diteruskan ke Admin & Meja Kasir</span>
                                        </div>

                                        {/* SWIMLANE 3: ADMIN & KASIR (Komunikasi, Invoice & Serah Terima) */}
                                        <div className="border border-purple-200 bg-purple-50/20 rounded-2xl overflow-hidden flex items-stretch">
                                            {/* Lane Header */}
                                            <div className="w-36 sm:w-44 bg-purple-600 text-white p-4 flex flex-col justify-center items-center text-center shrink-0 border-r border-purple-700">
                                                <Receipt className="w-6 h-6 mb-1 text-purple-100" />
                                                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                                                    ADMIN & KASIR
                                                </h4>
                                                <span className="text-3xs text-purple-200 font-semibold mt-0.5">Komunikasi & Kasir</span>
                                            </div>

                                            {/* Lane Content Track */}
                                            <div className="p-4 sm:p-5 flex-1 flex flex-wrap items-center gap-3">
                                                {/* Node 03: Penawaran WhatsApp */}
                                                <button
                                                    type="button"
                                                    onClick={() => jumpToStageDetail("quotation")}
                                                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 shrink-0 flex items-center gap-2 text-left"
                                                    title="Lihat SOP 03. Penawaran"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                                                    <div>
                                                        <p className="leading-tight">03. Penawaran Biaya WhatsApp</p>
                                                        <span className="text-3xs text-slate-400 font-normal">Kirim estimasi resmi ke pelanggan</span>
                                                    </div>
                                                </button>

                                                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                                                {/* Decision: ACC? */}
                                                <div className="px-3 py-2 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0">
                                                    <GitFork className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                    <span>Pelanggan ACC?</span>
                                                </div>

                                                <div className="flex flex-col gap-1.5 shrink-0">
                                                    <span className="text-3xs font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white text-center">
                                                        BATAL → Rakit Ulang
                                                    </span>
                                                    <span className="text-3xs font-black uppercase px-2 py-0.5 rounded bg-emerald-600 text-white text-center">
                                                        ACC → Lanjut Servis
                                                    </span>
                                                </div>

                                                <span className="text-slate-300 font-bold">|</span>

                                                {/* Node 05: Notifikasi */}
                                                <button
                                                    type="button"
                                                    onClick={() => jumpToStageDetail("completion")}
                                                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 shrink-0 flex items-center gap-2 text-left"
                                                    title="Lihat SOP 05. Notifikasi"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                                                    <div>
                                                        <p className="leading-tight">05. Foto Selesai & WA Siap</p>
                                                        <span className="text-3xs text-slate-400 font-normal">Segel garansi & notifikasi ambil</span>
                                                    </div>
                                                </button>

                                                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                                                {/* Node 06: Handover */}
                                                <button
                                                    type="button"
                                                    onClick={() => jumpToStageDetail("handover")}
                                                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 shrink-0 flex items-center gap-2 text-left"
                                                    title="Lihat SOP 06. Serah Terima"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                                                    <div>
                                                        <p className="leading-tight">06. Live Test, Bayar & TTD</p>
                                                        <span className="text-3xs text-slate-400 font-normal">Invoice QRIS & tanda tangan digital</span>
                                                    </div>
                                                </button>

                                                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                                                {/* Terminal End */}
                                                <div className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>Selesai (Garansi Aktif)</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* VIEW B: VERTICAL BPMN DECISION FLOW (Linear Pipeline Tree with Minimum Text) */}
                            {diagramView === "flowchart" && (
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 sm:p-7 max-w-3xl mx-auto space-y-4">
                                    <div className="text-center pb-2 border-b border-slate-100">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            BPMN Decision Tree: Alur Keputusan Vertikal
                                        </h4>
                                    </div>

                                    <div className="flex flex-col items-center space-y-3">
                                        {/* Start Terminal */}
                                        <div className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold shadow-xs">
                                            Mulai: Pelanggan Tiba Membawa Perangkat
                                        </div>

                                        <ArrowDown className="w-4 h-4 text-slate-400" />

                                        {/* Step 1 */}
                                        <button
                                            type="button"
                                            onClick={() => jumpToStageDetail("intake")}
                                            className="px-5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900 text-xs font-bold shadow-2xs transition-all cursor-pointer w-64 text-center"
                                        >
                                            01. Konsultasi & Cek Fisik Awal (Frontman)
                                        </button>

                                        <ArrowDown className="w-4 h-4 text-slate-400" />

                                        {/* Decision 1 */}
                                        <div className="px-5 py-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-bold shadow-xs flex items-center gap-2">
                                            <GitFork className="w-4 h-4 text-amber-600" />
                                            <span>Perlu Ditinggal di Workshop?</span>
                                        </div>

                                        <div className="w-full grid grid-cols-2 gap-4 pt-1">
                                            <div className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                                                <span className="text-3xs font-black uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">TIDAK</span>
                                                <p className="text-xs font-bold text-emerald-900 text-center">Quick Service Meja Belakang (15-45m)</p>
                                                <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                                                <span className="text-xs font-bold text-slate-700">Pelunasan Kasir di Tempat</span>
                                                <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                                                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-3xs font-bold">Selesai (Langsung Bawa Pulang)</span>
                                            </div>

                                            <div className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                                                <span className="text-3xs font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white">YA (INAP)</span>
                                                <p className="text-xs font-bold text-blue-900 text-center">Input Tiket Servis di ERP & Barcode QR</p>
                                                <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                                                <span className="text-xs font-bold text-slate-700">Unit Masuk Rak Antrian Servis</span>
                                            </div>
                                        </div>

                                        <ArrowDown className="w-4 h-4 text-slate-400" />

                                        {/* Step 2 */}
                                        <button
                                            type="button"
                                            onClick={() => jumpToStageDetail("diagnosis")}
                                            className="px-5 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 text-xs font-bold shadow-2xs transition-all cursor-pointer w-64 text-center"
                                        >
                                            02. Diagnosa 21-Titik Checklist (Teknisi)
                                        </button>

                                        <ArrowDown className="w-4 h-4 text-slate-400" />

                                        {/* Step 3 */}
                                        <button
                                            type="button"
                                            onClick={() => jumpToStageDetail("quotation")}
                                            className="px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-bold shadow-2xs transition-all cursor-pointer w-64 text-center"
                                        >
                                            03. Penawaran Biaya WhatsApp (Admin)
                                        </button>

                                        <ArrowDown className="w-4 h-4 text-slate-400" />

                                        {/* Decision 2 */}
                                        <div className="px-5 py-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-bold shadow-xs flex items-center gap-2">
                                            <GitFork className="w-4 h-4 text-amber-600" />
                                            <span>Pelanggan Menyetujui Biaya (ACC)?</span>
                                        </div>

                                        <div className="w-full grid grid-cols-2 gap-4 pt-1">
                                            <div className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-rose-50/60 border border-rose-200">
                                                <span className="text-3xs font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white">BATAL / CANCEL</span>
                                                <p className="text-xs font-bold text-rose-900 text-center">Teknisi Rakit Kembali ke Kondisi Semula</p>
                                                <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                                                <span className="px-3 py-1 rounded-full bg-rose-700 text-white text-3xs font-bold">Unit Dikembalikan (Dibatalkan)</span>
                                            </div>

                                            <div className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                                                <span className="text-3xs font-black uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">SETUJU / ACC</span>
                                                <p className="text-xs font-bold text-emerald-900 text-center">04. Eksekusi Reparasi & Pasang Sparepart</p>
                                                <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                                                <span className="text-xs font-bold text-slate-700">Running Stress Test QC (30-60m)</span>
                                            </div>
                                        </div>

                                        <ArrowDown className="w-4 h-4 text-slate-400" />

                                        {/* Step 5 */}
                                        <button
                                            type="button"
                                            onClick={() => jumpToStageDetail("completion")}
                                            className="px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 text-xs font-bold shadow-2xs transition-all cursor-pointer w-64 text-center"
                                        >
                                            05. Foto Selesai, Segel & WA Siap (Admin)
                                        </button>

                                        <ArrowDown className="w-4 h-4 text-slate-400" />

                                        {/* Step 6 */}
                                        <button
                                            type="button"
                                            onClick={() => jumpToStageDetail("handover")}
                                            className="px-5 py-2.5 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-900 text-xs font-bold shadow-2xs transition-all cursor-pointer w-64 text-center"
                                        >
                                            06. Live Test, Kasir & TTD Digital (Kasir)
                                        </button>

                                        <ArrowDown className="w-4 h-4 text-slate-400" />

                                        {/* End Terminal */}
                                        <div className="px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs">
                                            Selesai: Garansi Resmi SLA Aktif (CLOSED)
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* =========================================================================
                        SECTION 2: BALANCED DETAILED SOP & CHECKLIST SECTION (EQUAL-WEIGHT DUAL COLUMNS)
                        ========================================================================= */}
                    {activeTab === "detail" && (
                        <div className="w-full max-w-full space-y-5">
                            
                            {/* Horizontal Interactive Step Navigation Bar */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xs overflow-x-auto custom-scrollbar">
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
                                                            <span className="text-3xs font-medium text-slate-500 truncate whitespace-nowrap">
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

                            {/* UNIFIED FULL-WIDTH STAGE HEADER CARD */}
                            <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start sm:items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center font-mono text-base font-bold text-blue-600 shadow-2xs shrink-0">
                                        {currentStage.stepNumber}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                                {currentStage.title}
                                            </h3>
                                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md border ${currentStage.roleBadgeBg}`}>
                                                Penanggung Jawab: {currentStage.role}
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                                            {currentStage.description}
                                        </p>
                                    </div>
                                </div>

                                {currentStage.erpActionLink && (
                                    <Link
                                        to={currentStage.erpActionLink}
                                        onClick={onClose}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap self-start md:self-auto shrink-0"
                                    >
                                        <span>{currentStage.erpActionText}</span>
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>

                            {/* SYMMETRICAL 50% / 50% DUAL-COLUMN GRID: IDENTICAL 3-CARD RHYTHM PER SIDE */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                                
                                {/* ================= KOLOM KIRI: ALUR PROSEDUR & ATURAN KEPUTUSAN ================= */}
                                <div className="space-y-4 flex flex-col justify-between h-full">
                                    
                                    {/* Card 1: 3-Langkah Prosedur Operasional Standar (SOP) */}
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                                Instruksi Kerja & Prosedur Operasional (SOP)
                                            </h4>
                                        </div>

                                        <div className="space-y-2.5 pt-1">
                                            {currentStage.sopInstructions?.map((inst, iIdx) => (
                                                <div key={iIdx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                        {iIdx + 1}
                                                    </span>
                                                    <p className="text-xs sm:text-sm text-slate-700 text-justify leading-relaxed font-medium">
                                                        {inst}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card 2: Logika Keputusan & Skenario Percabangan */}
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                            <GitFork className="w-4 h-4 text-amber-500" />
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                                Logika Keputusan & Aturan Percabangan
                                            </h4>
                                        </div>

                                        <div className="space-y-3 pt-1">
                                            {currentStage.decisionRules?.map((rule, rIdx) => (
                                                <div 
                                                    key={rIdx}
                                                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-slate-900">
                                                            {rule.label}
                                                        </span>
                                                        <span className={`text-3xs font-bold px-2 py-0.5 rounded-md border ${rule.badgeClass}`}>
                                                            {rule.badge}
                                                        </span>
                                                    </div>

                                                    <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                                                        <strong className="text-slate-800">Kondisi: </strong>
                                                        {rule.condition}
                                                    </div>

                                                    <p className="text-xs text-slate-700 text-justify leading-relaxed">
                                                        {rule.outcome}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card 3: Kebijakan Keamanan & Anti-Fraud */}
                                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 shadow-2xs">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-0.5">
                                                Kebijakan Keamanan & Proteksi Audit
                                            </h5>
                                            <p className="text-xs sm:text-sm text-amber-900 text-justify leading-relaxed">
                                                {currentStage.proTip}
                                            </p>
                                        </div>
                                    </div>

                                </div>

                                {/* ================= KOLOM KANAN: CHECKLIST VERIFIKASI & DELIVERABLE AUDIT ================= */}
                                <div className="space-y-4 flex flex-col justify-between h-full">
                                    
                                    {/* Card 1: Checklist Tugas Wajib (4 Poin) */}
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                                                <span>Checklist Tugas Wajib Tahap Ini</span>
                                            </h4>
                                            <span className="text-xs font-bold text-slate-400 font-mono">
                                                {currentStage.keyTasks.length} Poin Verifikasi
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            {currentStage.keyTasks.map((task, tIdx) => (
                                                <div 
                                                    key={tIdx}
                                                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
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

                                    {/* Card 2: Bukti Fisik & Output Audit Deliverable */}
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-indigo-600" />
                                                <span>Bukti Fisik & Output Deliverable Audit</span>
                                            </h4>
                                            <span className="text-3xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                                Rekam Jejak ERP
                                            </span>
                                        </div>

                                        <ul className="space-y-2 pt-1">
                                            {currentStage.deliverables?.map((d, dIdx) => (
                                                <li key={dIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2"></span>
                                                    <span>{d}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Card 3: Target SLA & Aksi Cepat Modul ERP */}
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-blue-600" /> Target SLA Penanganan:
                                            </span>
                                            <span className="text-blue-700 font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                                {currentStage.slaAndPic?.sla}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/80">
                                            <span>Petugas: <strong className="text-slate-800">{currentStage.slaAndPic?.pic}</strong></span>
                                            {currentStage.erpActionLink && (
                                                <Link
                                                    to={currentStage.erpActionLink}
                                                    onClick={onClose}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    <span>{currentStage.erpActionText}</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                </div>

                            </div>

                            {/* Full-Width Bottom Stage Navigation Bar */}
                            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between">
                                <button
                                    type="button"
                                    disabled={currentIndex === 0}
                                    onClick={() => setSelectedStageId(FLOW_STAGES[currentIndex - 1].id)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
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
                                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm font-bold text-white shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                                    >
                                        Tahap Berikutnya →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("cases")}
                                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs sm:text-sm font-bold text-white shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                                    >
                                        Lanjut Simulasi Kasus →
                                    </button>
                                )}
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

                {/* 3. MODAL FOOTER BAR */}
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
