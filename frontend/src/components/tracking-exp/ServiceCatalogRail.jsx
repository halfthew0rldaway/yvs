import { useState } from "react";
import { Plus, Minus, ArrowUpRight } from "lucide-react";
import { MaskedLines } from "./MotionPrimitives";

const CATEGORIES = [
    "Semua",
    "Daya & Mesin",
    "Layar & Fisik",
    "Perawatan Suhu",
    "Kena Cairan",
    "Upgrade & Data",
];

const SERVICES = [
    {
        id: "power",
        num: "01",
        category: "Daya & Mesin",
        title: "Perbaikan laptop & PC mati total atau bermasalah daya",
        symptoms: "Perangkat tidak menyala, tidak mengisi daya, atau sering mati mendadak.",
        detail: "Pemeriksaan menyeluruh mulai dari adaptor, baterai, konektor daya, hingga komponen papan utama sesuai hasil pengecekan teknisi.",
        devices: "Laptop berbagai merek, MacBook, dan PC desktop",
        note: "Estimasi waktu & biaya diinfokan setelah diagnosa",
    },
    {
        id: "display",
        num: "02",
        category: "Layar & Fisik",
        title: "Perbaikan layar, keyboard, baterai & engsel",
        symptoms: "Layar bergaris atau gelap, tombol macet, baterai cepat habis, atau engsel patah.",
        detail: "Pengecekan kabel fleksibel, panel layar, modul keyboard, baterai, hingga perbaikan dudukan engsel dan casing dengan pilihan suku cadang sesuai kebutuhan.",
        devices: "Laptop kerja, laptop gaming, dan MacBook",
        note: "Pilihan suku cadang dibahas dulu bersama pemilik",
    },
    {
        id: "thermal",
        num: "03",
        category: "Perawatan Suhu",
        title: "Pembersihan debu & ganti pasta termal",
        symptoms: "Kipas terdengar berisik, bodi terasa cepat panas, atau performa menurun saat dipakai lama.",
        detail: "Pembersihan debu di jalur pendingin dan kipas, disertai penggantian pasta termal agar sirkulasi panas perangkat lebih terjaga.",
        devices: "Laptop, MacBook, dan PC desktop",
        note: "Disarankan secara berkala tiap 6–12 bulan",
    },
    {
        id: "liquid",
        num: "04",
        category: "Kena Cairan",
        title: "Penanganan perangkat terkena cairan",
        symptoms: "Tertumpah air, kopi, atau minuman lainnya ke area keyboard maupun mesin.",
        detail: "Pembersihan sisa cairan dan pemeriksaan bagian yang terdampak untuk menekan risiko kerusakan lanjutan. Sebaiknya segera matikan unit dan jangan dinyalakan dulu sebelum diperiksa.",
        devices: "Laptop & MacBook terkena tumpahan cairan",
        note: "Penanganan bergantung tingkat kerusakan cairan",
    },
    {
        id: "upgrade",
        num: "05",
        category: "Upgrade & Data",
        title: "Upgrade SSD, tambah RAM & instalasi sistem",
        symptoms: "Perangkat terasa lambat saat membuka aplikasi atau ruang penyimpanan mulai penuh.",
        detail: "Pemasangan SSD, penambahan RAM, pemindahan sistem serta file, hingga instalasi ulang sistem operasi dan perakitan PC desktop sesuai kebutuhan.",
        devices: "Laptop yang mendukung upgrade & PC desktop",
        note: "Bisa konsultasi spesifikasi terlebih dulu",
    },
    {
        id: "recovery",
        num: "06",
        category: "Upgrade & Data",
        title: "Pengecekan & penyelamatan data",
        symptoms: "SSD atau harddisk sulit terbaca, sistem gagal masuk, atau perlu memindahkan dokumen penting.",
        detail: "Pemeriksaan kondisi media penyimpanan dan upaya penyelamatan file penting menyesuaikan tingkat kerusakan perangkat.",
        devices: "SSD NVMe, SSD SATA, harddisk internal & eksternal",
        note: "Kerahasiaan data pelanggan dijaga",
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
            className="w-full bg-white border-b border-slate-200 py-16 sm:py-24 scroll-mt-16 overflow-x-clip"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                {/* Editorial Section Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end pb-8 sm:pb-10 border-b border-slate-200">
                    <div className="lg:col-span-7 space-y-2.5">
                        <span className="font-mono text-xs text-blue-700 font-semibold block">
                            02 / LAYANAN PERBAIKAN
                        </span>
                        <MaskedLines
                            as="h2"
                            lines={["Layanan yang biasa", "kami tangani di bengkel."]}
                            className="font-display font-extrabold text-2xl sm:text-4xl lg:text-[2.65rem] text-slate-950 tracking-[-0.03em] leading-[1.12]"
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                            Biaya dan lama pengerjaan selalu mengikuti hasil pemeriksaan unit. Anda bisa bertanya dulu lewat WhatsApp sebelum membawa perangkat.
                        </p>
                    </div>
                </div>

                {/* Filter Tabs (44px+ touch targets, WCAG AA contrast) */}
                <div
                    role="tablist"
                    aria-label="Filter kategori layanan"
                    className="flex items-center gap-2 overflow-x-auto yvs-no-scrollbar py-5 border-b border-slate-200"
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
                                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                                    active
                                        ? "bg-[#0B162C] text-white"
                                        : "bg-slate-100 text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Editorial Ledger Rows (No icon-card grid) */}
                <div className="divide-y divide-slate-200">
                    {list.map((service) => {
                        const isOpen = openId === service.id;
                        const waText = encodeURIComponent(
                            `Halo YVS Computer, saya ingin konsultasi soal ${service.title.toLowerCase()}.`
                        );
                        return (
                            <div
                                key={service.id}
                                className={`transition-colors ${
                                    isOpen
                                        ? "bg-slate-50 rounded-2xl my-2 px-4 sm:px-6 border border-slate-200"
                                        : "hover:bg-slate-50/70"
                                }`}
                            >
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    data-cursor={isOpen ? "Tutup" : "Buka"}
                                    onClick={() => setOpenId(isOpen ? "" : service.id)}
                                    className="w-full py-5 sm:py-6 grid grid-cols-12 gap-3 sm:gap-6 items-center text-left cursor-pointer group"
                                >
                                    <span className="col-span-2 sm:col-span-1 font-mono text-xs sm:text-sm font-bold text-slate-600 group-hover:text-blue-700 transition-colors">
                                        {service.num}
                                    </span>

                                    <div className="col-span-8 sm:col-span-9 lg:col-span-7 min-w-0">
                                        <h3 className="font-display font-bold text-base sm:text-xl text-slate-950 group-hover:text-blue-700 transition-colors leading-snug">
                                            {service.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                                            {service.symptoms}
                                        </p>
                                    </div>

                                    <div className="hidden lg:block lg:col-span-3 text-xs font-medium text-slate-600">
                                        {service.note}
                                    </div>

                                    <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex justify-end">
                                        <span
                                            aria-hidden="true"
                                            className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors ${
                                                isOpen
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "bg-white border-slate-300 text-slate-800 group-hover:border-blue-600 group-hover:text-blue-600"
                                            }`}
                                        >
                                            {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        </span>
                                    </div>
                                </button>

                                {/* Smooth CSS Grid Accordion (Zero layout thrash, zero framer-motion overhead) */}
                                <div
                                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="pb-6 pt-1 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 border-t border-slate-200/80">
                                            <div className="hidden lg:block lg:col-span-1" />
                                            <div className="lg:col-span-7 space-y-2 pt-3">
                                                <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                                                    {service.detail}
                                                </p>
                                                <p className="text-xs text-slate-600">
                                                    <strong className="text-slate-900">Cakupan unit:</strong>{" "}
                                                    {service.devices}
                                                </p>
                                            </div>
                                            <div className="lg:col-span-4 flex lg:justify-end items-end pt-2">
                                                <a
                                                    href={`https://wa.me/628121034212?text=${waText}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
                                                >
                                                    <span>Tanya via WhatsApp</span>
                                                    <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
