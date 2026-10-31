import { useState, useEffect, useRef } from "react";
import { Star, MapPin, ArrowUpRight, CheckCircle2, SearchCheck, ShieldCheck } from "lucide-react";
import { motion, useInView, animate } from "framer-motion";

function AnimatedNumber({ to, decimals = 0, suffix = "" }) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });

    useEffect(() => {
        if (!inView) return;
        const controls = animate(0, to, {
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (latest) => {
                setValue(decimals > 0 ? latest.toFixed(decimals).replace(".", ",") : Math.round(latest));
            }
        });
        return () => controls.stop();
    }, [inView, to, decimals]);

    return <span ref={ref}>{value}{suffix}</span>;
}

const REVIEWS_B5 = [
    {
        name: "Rizky Fajar",
        role: "Google Maps Reviewer",
        device: "Servis Laptop & Upgrade SSD",
        text: "Tempat servis laptop dan komputer paling recommended di Bekasi! Pelayanannya sangat jujur, transparan, dan konsultasinya gratis. Teknisi menjelaskan kerusakannya secara detail tanpa ada yang ditutup-tutupi atau akal-akalan biaya tambahan. Laptop yang tadinya lemot sekarang normal dan ngebut lagi. Bintang 5 buat Yangversa!",
        rating: 5,
        badge: "Bintang 5 Terverifikasi",
    },
    {
        name: "Dewi Anggraini",
        role: "Google Maps Reviewer",
        device: "Deep Cleaning & Ganti Pasta Thermal",
        text: "Buat orang yang gaptek rekomended banget ke sini, jadi paham karena dijelasin sama mas-masnya secara detail. Pelayanannya ramah banget, mirip di hotel bintang 5. Setiap tindakan atau penggantian sparepart pasti dikonfirmasi dulu biayanya ke customer. Tempat langganan servis komputer keluarga!",
        rating: 5,
        badge: "Bintang 5 Terverifikasi",
    },
    {
        name: "Dimas Prasetyo",
        role: "Google Maps Reviewer",
        device: "Perbaikan Motherboard & Engsel Casing",
        text: "Tempat servis yang jujur di Pekayon. Laptop mati total dan engsel patah diperbaiki dengan sangat rapi. Part copotan bekasnya juga dibawain balik ke saya sebagai bukti penggantian. Harganya masuk akal dan ada garansi resminya jadi tenang. Mantap Yangversa Komputerawet!",
        rating: 5,
        badge: "Bintang 5 Terverifikasi",
    },
    {
        name: "Hendro Wijaya",
        role: "Google Maps Reviewer",
        device: "PC Desktop & Optimasi Sistem",
        text: "Pelayanan sangat solutif. Datang konsultasi masalah PC kantor sering restart sendiri, langsung dicek dan dikasih opsi solusi yang pas di kantong. Pengerjaan cepat, komunikatif via WhatsApp, dan progres pengerjaannya jelas terpantau. Sangat memuaskan!",
        rating: 5,
        badge: "Bintang 5 Terverifikasi",
    },
    {
        name: "Bagus Pratama",
        role: "Google Maps Reviewer",
        device: "Servis MacBook & Maintenance",
        text: "Pelayanan bintang 5! Datang ke sini karena MacBook error tidak mau booting, ditangani dengan sangat profesional oleh teknisinya. Proses pengerjaannya jelas, biaya sesuai estimasi awal, dan stafnya sangat kooperatif. Tempat terpercaya buat perbaikan gadget.",
        rating: 5,
        badge: "Bintang 5 Terverifikasi",
    },
    {
        name: "Siti Nurhaliza",
        role: "Google Maps Reviewer",
        device: "Ganti Keyboard & Baterai Laptop",
        text: "Sangat puas servis di sini. Sebelum dikerjakan selalu diinfokan perkiraan biayanya dulu jadi nggak kaget. Sparepart original, garansi jelas, dan teknisinya sangat sopan. Sukses selalu untuk Yangversa Komputerawet.",
        rating: 5,
        badge: "Bintang 5 Terverifikasi",
    },
];

export default function WorkshopMetrics() {
    return (
        <section className="relative w-full bg-slate-50 py-16 sm:py-24 border-b border-slate-200 font-sans scroll-mt-14 sm:scroll-mt-16" id="workshop-reviews">
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                {/* Metrics Grid - Polished, Tactile & Interactive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pb-16 border-b border-slate-200/80">
                    {/* Card 1: Flagship Google Maps Rating */}
                    <motion.a
                        href="https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
                        target="_blank"
                        rel="noreferrer"
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="group relative bg-blue-600 text-white border border-blue-500/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:shadow-blue-600/20 transition-all cursor-pointer overflow-hidden"
                    >
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-3xs sm:text-xs font-mono font-semibold uppercase tracking-wider text-blue-100">
                                    Rating Google Maps
                                </span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-3xs font-mono font-semibold text-blue-100 bg-blue-700/80 group-hover:bg-white group-hover:text-blue-600 px-2 py-0.5 rounded-full border border-blue-400/40 transition-colors">
                                <span>Profil</span>
                                <ArrowUpRight className="w-3 h-3" />
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[2.65rem] tracking-tight leading-none text-white">
                                    <AnimatedNumber to={4.7} decimals={1} />
                                </span>
                                <span className="font-mono text-sm sm:text-base text-blue-200/80 font-semibold">
                                    / 5,0
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 drop-shadow-2xs" />
                                ))}
                                <span className="ml-1 text-3xs font-mono text-blue-100/90 font-medium">
                                    (4.7★)
                                </span>
                            </div>

                            <p className="text-xs font-sans text-blue-100/90 leading-snug pt-1">
                                <AnimatedNumber to={350} suffix="+" /> Ulasan Asli di Google Maps
                            </p>
                        </div>
                    </motion.a>

                    {/* Card 2: Biaya Diagnosis Rp 0 */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="group relative bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all"
                    >
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-3xs sm:text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                                Biaya Diagnosis
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                <SearchCheck className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="font-display font-extrabold text-2xl sm:text-3xl lg:text-[1.85rem] tracking-tight text-slate-900 leading-tight">
                                    Rp 0
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-3xs font-mono font-semibold">
                                    Gratis Cek
                                </span>
                            </div>
                            <p className="text-xs font-sans text-slate-500 leading-snug text-justify [text-justify:inter-word]">
                                Bebas biaya jika estimasi tidak disetujui, unit bisa langsung diambil kembali.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 3: Transparansi Biaya 100% */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="group relative bg-white border border-slate-200 hover:border-blue-300 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all"
                    >
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-3xs sm:text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                                Transparansi Biaya
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="font-display font-extrabold text-2xl sm:text-3xl lg:text-[1.85rem] tracking-tight text-slate-900 leading-tight">
                                    <AnimatedNumber to={100} suffix="%" /> Terbuka
                                </span>
                            </div>
                            <p className="text-xs font-sans text-slate-500 leading-snug text-justify [text-justify:inter-word]">
                                Konfirmasi estimasi sebelum dikerjakan, tidak ada biaya siluman atau tak terduga.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 4: Garansi Pengerjaan Resmi */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="group relative bg-white border border-slate-200 hover:border-amber-300 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all"
                    >
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-3xs sm:text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                                Garansi Pengerjaan
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="font-display font-extrabold text-2xl sm:text-3xl lg:text-[1.85rem] tracking-tight text-slate-900 leading-tight">
                                    Resmi Terbit
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-3xs font-mono font-semibold">
                                    Sertifikat Digital
                                </span>
                            </div>
                            <p className="text-xs font-sans text-slate-500 leading-snug text-justify [text-justify:inter-word]">
                                Nota fisik dan sertifikat garansi resmi otomatis tersimpan di sistem pelacakan.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Reviews Header */}
                <div className="pt-14 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-mono font-semibold text-emerald-700 uppercase tracking-wider">
                                Ulasan Asli Google Maps (4.7★)
                            </span>
                        </div>
                        <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                            Kata Pelanggan di Google Maps Yangversa
                        </h2>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-sans text-justify [text-justify:inter-word]">
                            Seluruh ulasan di bawah ini adalah review bintang 5 (★★★★★) murni dari pelanggan riil yang mempercayakan perangkat laptop dan komputernya ke workshop kami di Pekayon, Bekasi.
                        </p>
                    </div>

                    <a
                        href="https://www.google.com/maps/search/?api=1&query=Komputerawet.Com+By+Yangversa+Computer+Jl+Raya+Pekayon+Bekasi"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-sans text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:border-slate-300 shrink-0"
                    >
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Lihat Profil Google Maps (4.7★)</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                </div>

                {/* Testimonial Grid (6 Bintang 5 Reviews) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {REVIEWS_B5.map((r, i) => (
                        <div
                            key={i}
                            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs transition-all hover:shadow-xs"
                        >
                            <div className="space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        {[...Array(r.rating)].map((_, s) => (
                                            <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-3xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        {r.badge}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-700 leading-relaxed font-sans text-justify [text-justify:inter-word]">
                                    &ldquo;{r.text}&rdquo;
                                </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    <h4 className="font-display font-bold text-sm text-slate-900">{r.name}</h4>
                                    <p className="font-sans text-xs text-blue-600 font-medium mt-0.5">{r.device}</p>
                                </div>
                                <span className="text-3xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                    Google Maps
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
