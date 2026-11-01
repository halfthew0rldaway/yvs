import { ShieldCheck, Eye, Cpu, Award } from "lucide-react";

const PRINCIPLES = [
    {
        num: "01",
        title: "Transparansi Biaya & Bebas Biaya Diagnosis",
        desc: "Kami tidak pernah memungut biaya diagnosis jika estimasi biaya yang diajukan tidak disetujui. Tindakan perbaikan tidak akan dilakukan sebelum ada konfirmasi resmi dari Anda.",
        tag: "Tanpa Biaya Siluman",
        icon: ShieldCheck,
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-100",
    },
    {
        num: "02",
        title: "Dokumentasi Visual Lengkap di Portal Pelacakan",
        desc: "Bukan sekadar perkiraan. Setiap temuan mikroskopis teknisi, komponen rusak yang diganti, hingga hasil pengujian akhir difoto atau direkam dan dapat Anda periksa langsung di portal ini.",
        tag: "Bukti Pengerjaan Terbuka",
        icon: Eye,
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-100",
    },
    {
        num: "03",
        title: "Stasiun Kerja Anti-Statis & Suku Cadang Terkurasi",
        desc: "Seluruh penanganan mikrosolder dilakukan pada stasiun kerja terlindung Anti-Static (ESD Safe) dengan pengaturan suhu terkalibrasi. Suku cadang pengganti dipilih dari standar kualitas terbaik agar perangkat awet.",
        tag: "Standar Perlindungan ESD",
        icon: Cpu,
        color: "text-indigo-600",
        bg: "bg-indigo-50 border-indigo-100",
    },
    {
        num: "04",
        title: "Sertifikat Garansi Digital & Catatan Riwayat Aman",
        desc: "Sertifikat garansi digital dengan nomor tiket unik otomatis aktif setelah serah terima unit ditandatangani. Bukti garansi tersimpan permanen di database tanpa risiko hilang seperti nota fisik kertas.",
        tag: "Garansi Resmi Digital",
        icon: Award,
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-100",
    },
];

export default function EngineeringStandards() {
    return (
        <section className="relative w-full bg-white py-16 sm:py-24 border-b border-slate-200 font-sans scroll-mt-14 sm:scroll-mt-16 content-deferred" id="engineering-standards">
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                    {/* Left Sticky Column on Desktop */}
                    <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                <span className="text-xs font-mono font-semibold text-blue-700 uppercase tracking-wider">
                                    Komitmen & Standar Pelayanan
                                </span>
                            </div>
                            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                                Standar Pemeriksaan yang Menjamin Keamanan Perangkat Anda.
                            </h2>
                        </div>

                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-sans text-justify [text-justify:inter-word]">
                            Industri reparasi komputer kerap dibayangi oleh ketidakpastian biaya, penggantian komponen yang tidak transparan, dan ketiadaan jaminan tertulis. Di YVS Computer (komputerawet.com), kami mengutamakan pemeriksaan jujur, estimasi jelas di awal, dan bukti nyata pengerjaan.
                        </p>

                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-slate-500 uppercase tracking-wider font-semibold">Prosedur Uji Mutu</span>
                                <span className="text-emerald-700 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 whitespace-nowrap shrink-0">
                                    QC Matrix 25 Titik
                                </span>
                            </div>
                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans text-justify [text-justify:inter-word]">
                                Setiap unit yang selesai diperbaiki wajib melewati 25 titik inspeksi mencakup kestabilan suhu, uji beban CPU/GPU, daya tahan baterai, dan fungsi port sebelum diserahkan kembali ke pemilik.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Principle Cards */}
                    <div className="lg:col-span-7 space-y-4">
                        {PRINCIPLES.map((p) => {
                            const Icon = p.icon;
                            return (
                                <div
                                    key={p.num}
                                    className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 hover:border-slate-300 hover:shadow-xs transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 shadow-2xs ${p.bg}`}>
                                            <Icon className={`w-5 h-5 ${p.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="font-mono text-xs font-bold text-slate-400">[{p.num}]</span>
                                                <span className="font-mono text-3xs font-semibold text-blue-600 uppercase tracking-wider">{p.tag}</span>
                                            </div>
                                            <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 mb-2 leading-snug">
                                                {p.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 leading-relaxed font-sans text-justify [text-justify:inter-word]">
                                                {p.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
