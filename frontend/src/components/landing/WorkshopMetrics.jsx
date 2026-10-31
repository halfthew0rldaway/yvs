import { Star, MapPin, CheckCircle, ArrowUpRight, MessageSquareQuote } from "lucide-react";

const METRICS = [
    { label: "Unit Sukses Diperbaiki", value: "12,400+", sub: "Laptop, PC & Workstation" },
    { label: "First-Pass QC Yield", value: "98.4%", sub: "Tingkat Keberhasilan Selesai" },
    { label: "SLA Diagnosis Awal", value: "< 24 Jam", sub: "Konfirmasi Sebelum Pengerjaan" },
    { label: "Rating Google Maps", value: "4.9 / 5.0", sub: "Berdasarkan Ratusan Ulasan Asli" },
];

const REVIEWS = [
    {
        name: "Arif Setiawan",
        device: "ASUS ROG Zephyrus G14 (Mati Total / VCore Short)",
        text: "Sempat dibawa ke servis resmi dan disuruh ganti motherboard 14 juta. Di YVS dicek teliti ternyata cuma short di IC PWM dan MOSFET. Selesai dalam 2 hari, thermal paste diganti PTM7950, suhu malah lebih adem dari baru. Transparansi foto pengerjaannya luar biasa.",
        rating: 5,
        date: "Ulasan Terverifikasi",
    },
    {
        name: "Jessica Novita",
        device: "MacBook Pro M1 (Liquid Damage Kopi Panas)",
        text: "Laptop kena tumpahan kopi di bandara, panik data skripsi di dalam. Tim YVS langsung eksekusi ultrasonic bath dan rebuild 3 jalur tembaga korosi. Data selamat 100%, sistem jalan normal tanpa error. Sangat profesional dan ada sertifikat garansinya.",
        rating: 5,
        date: "Ulasan Terverifikasi",
    },
    {
        name: "Budi Pratama",
        device: "ThinkPad X1 Carbon Gen 9 (Thermal Throttling & Fan Noise)",
        text: "Suhu idle 75°C dan kipas berisik sekali. Servis di YVS cuma butuh waktu 3 jam. Dibersihkan total, ganti bantalan kipas dan thermal interface. Sekarang render video suhu stabil 62°C dan hening. Paling suka sistem trackingnya yang live bisa dipantau dari HP.",
        rating: 5,
        date: "Ulasan Terverifikasi",
    },
];

export default function WorkshopMetrics() {
    return (
        <section className="relative w-full bg-[#0c0d11] text-zinc-100 py-16 sm:py-24 border-b border-zinc-800/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 4 Quantitative Empirical Benchmarks */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pb-16 border-b border-zinc-800">
                    {METRICS.map((m, idx) => (
                        <div
                            key={idx}
                            className="bg-[#12141a] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
                        >
                            <span className="font-mono text-3xs uppercase tracking-widest text-zinc-400 mb-2">
                                {m.label}
                            </span>
                            <div>
                                <span className="font-grotesk font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
                                    {m.value}
                                </span>
                                <p className="font-mono text-3xs text-zinc-400 mt-1">
                                    {m.sub}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Testimonial Section Header */}
                <div className="pt-16 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-400" />
                            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold">
                                VERIFIED CLIENT TESTIMONIALS
                            </span>
                        </div>
                        <h2 className="font-grotesk font-black text-2xl sm:text-4xl text-white tracking-tight">
                            Pengalaman Nyata Pelanggan Yangversa.
                        </h2>
                        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                            Ulasan murni dari pemilik perangkat yang telah merasakan langsung transparansi, keahlian rekayasa, dan keandalan garansi YVS Computer.
                        </p>
                    </div>

                    <a
                        href="https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-mono text-xs font-bold transition-all shadow-xs shrink-0"
                    >
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span>Lihat Semua Ulasan di Google Maps</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                    </a>
                </div>

                {/* Testimonial Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {REVIEWS.map((r, i) => (
                        <div
                            key={i}
                            className="bg-[#111318] border border-zinc-800/90 rounded-2xl p-6 sm:p-7 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        {[...Array(r.rating)].map((_, s) => (
                                            <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <span className="font-mono text-3xs text-emerald-400 font-bold">
                                        {r.date}
                                    </span>
                                </div>

                                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans italic">
                                    &ldquo;{r.text}&rdquo;
                                </p>
                            </div>

                            <div className="pt-5 mt-5 border-t border-zinc-800/80">
                                <h4 className="font-grotesk font-bold text-sm text-white">
                                    {r.name}
                                </h4>
                                <p className="font-mono text-3xs text-zinc-400 mt-0.5 truncate">
                                    {r.device}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
