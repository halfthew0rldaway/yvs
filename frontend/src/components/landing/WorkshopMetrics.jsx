import { Star, MapPin, ArrowUpRight } from "lucide-react";

const METRICS = [
    { label: "Unit Sukses Diperbaiki", value: "12.400+", sub: "Laptop, PC & Workstation" },
    { label: "First-Pass QC Yield", value: "98,4%", sub: "Tingkat Keberhasilan Selesai" },
    { label: "SLA Diagnosis Awal", value: "< 24 Jam", sub: "Konfirmasi Sebelum Pengerjaan" },
    { label: "Rating Google Maps", value: "4,9 / 5,0", sub: "Berdasarkan Ratusan Ulasan Asli" },
];

const REVIEWS = [
    {
        name: "Arif Setiawan",
        device: "ASUS ROG Zephyrus G14 — Mati Total / VCore Short",
        text: "Sempat dibawa ke servis resmi dan disuruh ganti motherboard 14 juta. Di YVS dicek teliti ternyata cuma short di IC PWM dan MOSFET. Selesai dalam 2 hari, thermal paste diganti PTM7950, suhu malah lebih adem dari baru. Transparansi foto pengerjaannya luar biasa.",
        rating: 5,
        date: "Ulasan Terverifikasi",
    },
    {
        name: "Jessica Novita",
        device: "MacBook Pro M1 — Liquid Damage Kopi Panas",
        text: "Laptop kena tumpahan kopi di bandara, panik data skripsi di dalam. Tim YVS langsung eksekusi ultrasonic bath dan rebuild 3 jalur tembaga korosi. Data selamat 100%, sistem jalan normal tanpa error. Sangat profesional dan ada sertifikat garansinya.",
        rating: 5,
        date: "Ulasan Terverifikasi",
    },
    {
        name: "Budi Pratama",
        device: "ThinkPad X1 Carbon Gen 9 — Thermal Throttling & Fan Noise",
        text: "Suhu idle 75°C dan kipas berisik sekali. Servis di YVS cuma butuh waktu 3 jam. Dibersihkan total, ganti bantalan kipas dan thermal interface. Sekarang render video suhu stabil 62°C dan hening. Paling suka sistem trackingnya yang live bisa dipantau dari HP.",
        rating: 5,
        date: "Ulasan Terverifikasi",
    },
];

export default function WorkshopMetrics() {
    return (
        <section className="relative w-full bg-slate-50 py-16 sm:py-24 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pb-16 border-b border-slate-200">
                    {METRICS.map((m, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs"
                        >
                            <span className="text-xs font-sans font-semibold text-slate-400 uppercase tracking-wide mb-3 block">
                                {m.label}
                            </span>
                            <div>
                                <span className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight">
                                    {m.value}
                                </span>
                                <p className="text-xs text-slate-400 font-sans mt-1">{m.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reviews Header */}
                <div className="pt-14 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <span className="text-xs font-sans font-semibold text-blue-600 uppercase tracking-wide">
                            Ulasan Pelanggan Terverifikasi
                        </span>
                        <h2 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight">
                            Pengalaman Nyata Pelanggan YVS Computer.
                        </h2>
                        <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-sans">
                            Ulasan murni dari pemilik perangkat yang telah merasakan langsung transparansi, keahlian rekayasa, dan keandalan garansi YVS Computer.
                        </p>
                    </div>

                    <a
                        href="https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-sans text-sm font-medium transition-all shadow-xs shrink-0"
                    >
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span>Semua Ulasan Google Maps</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                </div>

                {/* Testimonial Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {REVIEWS.map((r, i) => (
                        <div
                            key={i}
                            className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-0.5">
                                        {[...Array(r.rating)].map((_, s) => (
                                            <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <span className="text-xs text-emerald-600 font-sans font-medium">{r.date}</span>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                                    &ldquo;{r.text}&rdquo;
                                </p>
                            </div>

                            <div className="pt-5 mt-5 border-t border-slate-100">
                                <h4 className="font-display font-semibold text-sm text-slate-900">{r.name}</h4>
                                <p className="font-mono text-xs text-slate-400 mt-0.5 truncate">{r.device}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
