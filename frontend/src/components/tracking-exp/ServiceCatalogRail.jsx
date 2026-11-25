import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ArrowUpRight } from "lucide-react";
import { MaskedLines } from "./MotionPrimitives";

const CATEGORIES = [
    "Semua",
    "Mati Total & Daya",
    "Layar & Grafis",
    "Panas & Perawatan",
    "Kena Cairan",
    "Data & Upgrade",
];

const SERVICES = [
    {
        id: "power",
        num: "01",
        category: "Mati Total & Daya",
        title: "Perbaikan motherboard & jalur daya",
        symptoms: "Laptop mati total, tidak mau cas, atau mendadak mati sendiri.",
        detail: "Melacak korsleting jalur daya utama dan mengganti komponen yang rusak langsung di papan utama—bukan langsung ganti seluruh mesin.",
        devices: "MacBook, ThinkPad, ASUS, Lenovo, HP, Acer, Dell",
        eta: "1–3 hari kerja",
        warranty: "Garansi 30–90 hari",
    },
    {
        id: "gpu",
        num: "02",
        category: "Layar & Grafis",
        title: "Perbaikan chipset & tampilan layar",
        symptoms: "Layar gelap, muncul garis, berkedip, atau kartu grafis tidak terbaca.",
        detail: "Penanganan ulang solder chipset grafis, pemeriksaan kabel fleksibel, hingga penggantian panel layar sesuai spesifikasi aslinya.",
        devices: "Laptop kerja, laptop gaming, workstation, PC desktop",
        eta: "2–4 hari kerja",
        warranty: "Garansi 60–90 hari",
    },
    {
        id: "thermal",
        num: "03",
        category: "Panas & Perawatan",
        title: "Pembersihan menyeluruh & ganti pasta termal",
        symptoms: "Kipas berisik, bodi cepat panas, atau performa mendadak melambat.",
        detail: "Pembersihan debu menumpuk di sirip tembaga dan kipas, serta penggantian pasta termal baru agar suhu kerja kembali dingin dan senyap.",
        devices: "Semua laptop, MacBook, dan PC desktop",
        eta: "2–4 jam (bisa ditunggu)",
        warranty: "Garansi 30 hari",
    },
    {
        id: "liquid",
        num: "04",
        category: "Kena Cairan",
        title: "Penanganan perangkat terkena cairan",
        symptoms: "Tertumpah air, kopi, atau minuman hingga tombol dan mesin tidak merespons.",
        detail: "Pencucian ultrasonik untuk menghentikan korosi, lalu menyambung ulang jalur papan yang terputus dan melindungi bagian rentan.",
        devices: "Laptop & MacBook terkena tumpahan cairan",
        eta: "1–5 hari kerja",
        warranty: "Garansi 30–60 hari",
    },
    {
        id: "recovery",
        num: "05",
        category: "Data & Upgrade",
        title: "Penyelamatan data dari SSD & harddisk",
        symptoms: "Penyimpanan tidak terbaca, meminta format, atau file penting hilang.",
        detail: "Penyelamatan dokumen kerja, foto, dan data penting dari SSD maupun harddisk bermasalah dengan prosedur aman terhadap media asli.",
        devices: "SSD NVMe, SSD SATA, Harddisk internal & eksternal",
        eta: "1–3 hari kerja",
        warranty: "Kerahasiaan data terjaga",
    },
    {
        id: "upgrade",
        num: "06",
        category: "Data & Upgrade",
        title: "Upgrade SSD, tambah RAM & rakit PC",
        symptoms: "Laptop terasa lambat saat membuka aplikasi atau butuh rakitan PC kerja.",
        detail: "Pemasangan SSD cepat, penambahan kapasitas RAM, migrasi sistem tanpa kehilangan file, hingga perakitan PC desktop rapi dan stabil.",
        devices: "Laptop upgradeable & PC desktop kustom",
        eta: "Hari yang sama",
        warranty: "Garansi pemasangan 30 hari",
    },
];

export default function ServiceCatalogRail() {
    const [activeCat, setActiveCat] = useState("Semua");
    const [openId, setOpenId] = useState("power");

    const list =
        activeCat === "Semua"
            ? SERVICES
            : SERVICES.filter((item) => item.category === activeCat);

    return (
        <section
            id="layanan"
            className="w-full bg-slate-50 border-b border-slate-200 py-16 sm:py-24 scroll-mt-16 overflow-x-clip"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                {/* Editorial Section Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end pb-8 sm:pb-10 border-b border-slate-200">
                    <div className="lg:col-span-7 space-y-2.5">
                        <span className="font-mono text-xs text-blue-600 font-semibold block">
                            02 / JENIS PENANGANAN
                        </span>
                        <MaskedLines
                            as="h2"
                            lines={["Apa yang bisa kami", "perbaiki untuk Anda."]}
                            className="font-display font-extrabold text-2xl sm:text-4xl lg:text-[2.75rem] text-slate-950 tracking-[-0.03em] leading-[1.08]"
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                            Setiap jenis perbaikan punya estimasi waktu yang jelas, pilihan suku cadang sesuai anggaran, dan garansi tertulis.
                        </p>
                    </div>
                </div>

                {/* Filter Tabs with Spring Indicator */}
                <div
                    role="tablist"
                    aria-label="Filter kategori layanan"
                    className="flex items-center gap-1.5 overflow-x-auto yvs-no-scrollbar py-5 border-b border-slate-200"
                >
                    {CATEGORIES.map((cat) => {
                        const active = cat === activeCat;
                        return (
                            <button
                                key={cat}
                                role="tab"
                                aria-selected={active}
                                type="button"
                                onClick={() => {
                                    setActiveCat(cat);
                                    const firstMatch =
                                        cat === "Semua"
                                            ? SERVICES[0]
                                            : SERVICES.find((s) => s.category === cat);
                                    if (firstMatch) setOpenId(firstMatch.id);
                                }}
                                className={`relative min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                                    active
                                        ? "text-white"
                                        : "text-slate-600 hover:text-slate-950 hover:bg-white"
                                }`}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="yvs-service-cat-pill"
                                        transition={{ type: "spring", stiffness: 440, damping: 34 }}
                                        className="absolute inset-0 bg-slate-900 rounded-lg -z-0"
                                    />
                                )}
                                <span className="relative z-10">{cat}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Interactive Editorial Ledger Rows */}
                <div className="divide-y divide-slate-200">
                    {list.map((service) => {
                        const isOpen = openId === service.id;
                        const waText = encodeURIComponent(
                            `Halo YVS Computer, saya ingin tanya soal ${service.title.toLowerCase()}.`
                        );
                        return (
                            <div
                                key={service.id}
                                className={`transition-colors ${
                                    isOpen ? "bg-white -mx-3 sm:-mx-5 px-3 sm:px-5 rounded-2xl my-2 border border-slate-200 shadow-2xs" : ""
                                }`}
                            >
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    onClick={() => setOpenId(isOpen ? "" : service.id)}
                                    className="w-full py-5 sm:py-6 grid grid-cols-12 gap-3 sm:gap-6 items-center text-left cursor-pointer group"
                                >
                                    <span className="col-span-2 sm:col-span-1 font-mono text-xs sm:text-sm font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                                        {service.num}
                                    </span>

                                    <div className="col-span-8 sm:col-span-6 lg:col-span-6 min-w-0">
                                        <h3 className="font-display font-bold text-base sm:text-xl text-slate-950 group-hover:text-blue-600 transition-colors leading-snug">
                                            {service.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2 sm:line-clamp-1">
                                            {service.symptoms}
                                        </p>
                                    </div>

                                    <div className="hidden lg:flex lg:col-span-2 flex-col">
                                        <span className="font-mono text-[11px] text-slate-400">Estimasi</span>
                                        <span className="text-sm font-semibold text-slate-800">{service.eta}</span>
                                    </div>

                                    <div className="hidden sm:flex sm:col-span-3 lg:col-span-2 flex-col">
                                        <span className="font-mono text-[11px] text-slate-400">Jaminan</span>
                                        <span className="text-sm font-semibold text-emerald-700">{service.warranty}</span>
                                    </div>

                                    <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex justify-end">
                                        <span
                                            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                                                isOpen
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "bg-white border-slate-300 text-slate-700 group-hover:border-slate-900"
                                            }`}
                                        >
                                            {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        </span>
                                    </div>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pb-6 pt-1 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 border-t border-slate-100">
                                                <div className="hidden lg:block lg:col-span-1" />
                                                <div className="lg:col-span-7 space-y-2.5 pt-3">
                                                    <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                                                        {service.detail}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        <strong className="text-slate-700">Perangkat ditangani:</strong>{" "}
                                                        {service.devices}
                                                    </p>
                                                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 lg:hidden pt-1">
                                                        <span>
                                                            Estimasi: <strong className="text-slate-900">{service.eta}</strong>
                                                        </span>
                                                        <span>
                                                            Jaminan: <strong className="text-emerald-700">{service.warranty}</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="lg:col-span-4 flex lg:justify-end items-end pt-2">
                                                    <a
                                                        href={`https://wa.me/628121034212?text=${waText}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold transition-colors"
                                                    >
                                                        <span>Tanya estimasi layanan ini</span>
                                                        <ArrowUpRight className="w-4 h-4 shrink-0" />
                                                    </a>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
