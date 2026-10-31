import { Star, MapPin, ArrowUpRight, CheckCircle2 } from "lucide-react";

const METRICS = [
    { label: "Rating Google Maps", value: "4,7 / 5,0", sub: "350+ Ulasan Asli di Google Maps", highlight: true },
    { label: "Biaya Diagnosis", value: "Rp 0 (Gratis)", sub: "Bebas Biaya jika Estimasi Tidak Cocok" },
    { label: "Transparansi Biaya", value: "100% Terbuka", sub: "Konfirmasi Estimasi Sebelum Dikerjakan" },
    { label: "Garansi Pengerjaan", value: "Resmi Terbit", sub: "Nota & Sertifikat Garansi Digital" },
];

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
        <section className="relative w-full bg-slate-50 py-16 sm:py-24 border-b border-slate-200 font-sans" id="workshop-reviews">
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 pb-16 border-b border-slate-200">
                    {METRICS.map((m, idx) => (
                        <div
                            key={idx}
                            className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs transition-all ${
                                m.highlight
                                    ? "bg-blue-600 text-white border-blue-600 shadow-blue-500/10"
                                    : "bg-white border-slate-200 text-slate-900"
                            }`}
                        >
                            <span
                                className={`text-3xs sm:text-xs font-mono font-semibold uppercase tracking-wider mb-3 block ${
                                    m.highlight ? "text-blue-100" : "text-slate-400"
                                }`}
                            >
                                {m.label}
                            </span>
                            <div>
                                <span
                                    className={`font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight block ${
                                        m.highlight ? "text-white" : "text-slate-900"
                                    }`}
                                >
                                    {m.value}
                                </span>
                                <p
                                    className={`text-xs font-sans mt-1 leading-snug ${
                                        m.highlight ? "text-blue-100" : "text-slate-500"
                                    }`}
                                >
                                    {m.sub}
                                </p>
                            </div>
                        </div>
                    ))}
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
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-sans">
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

                                <p className="text-sm text-slate-700 leading-relaxed font-sans">
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
