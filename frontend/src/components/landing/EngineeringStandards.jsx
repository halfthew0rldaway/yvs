import { ShieldCheck, Eye, Cpu, Award } from "lucide-react";

const PRINCIPLES = [
    {
        num: "01",
        title: "Transparansi Biaya & Diagnosis Tanpa Beban",
        desc: "Kami tidak pernah memungut biaya diagnosis jika estimasi yang diajukan tidak disetujui. Obeng tidak akan menyentuh logic board Anda sebelum ada persetujuan resmi dari pemilik perangkat.",
        tag: "NO_HIDDEN_COST_POLICY",
        icon: ShieldCheck,
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-100",
    },
    {
        num: "02",
        title: "Dokumentasi Visual Lengkap di Portal Pelacakan",
        desc: "Bukan sekadar klaim sepihak. Setiap temuan mikroskop, jalur terbakar, proses soldering, hingga komponen yang diganti difoto atau direkam dan dapat Anda periksa langsung di portal ini.",
        tag: "VERIFIED_AUDIT_TRAIL",
        icon: Eye,
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-100",
    },
    {
        num: "03",
        title: "ESD-Safe Clean Room & Pengadaan Part Terkurasi",
        desc: "Seluruh pengerjaan chip-level dilakukan pada stasiun kerja terlindung Anti-Static (ESD Safe) dengan instrumentasi suhu terkalibrasi. Komponen IC dan suku cadang berasal dari rantai pasok OEM Grade-A.",
        tag: "CERTIFIED_SEMICONDUCTORS",
        icon: Cpu,
        color: "text-indigo-600",
        bg: "bg-indigo-50 border-indigo-100",
    },
    {
        num: "04",
        title: "Sertifikat Garansi Digital & Tanda Tangan Resmi",
        desc: "Sertifikat garansi digital dengan nomor tiket unik otomatis aktif setelah serah terima unit ditandatangani secara digital. Anda memiliki bukti proteksi resmi tanpa takut nota fisik hilang.",
        tag: "AUTHENTIC_WARRANTY_PASS",
        icon: Award,
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-100",
    },
];

export default function EngineeringStandards() {
    return (
        <section className="relative w-full bg-white py-16 sm:py-24 border-b border-slate-100" id="engineering-standards">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    {/* Left Sticky Column */}
                    <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
                        <div className="space-y-3">
                            <span className="text-xs font-sans font-semibold text-blue-600 uppercase tracking-wide">
                                The YVS Engineering Code
                            </span>
                            <h2 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                                Standar Rekayasa yang Membedakan Kami dari Servis Konvensional.
                            </h2>
                        </div>

                        <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-sans">
                            Industri reparasi komputer kerap dibayangi oleh ketidakpastian biaya, penggantian komponen yang tidak transparan, dan ketiadaan jaminan tertulis. Di YVS Computer, kami membangun reputasi di atas fondasi integritas teknis dan bukti nyata.
                        </p>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between text-xs font-sans">
                                <span className="text-slate-500 uppercase tracking-wide font-semibold">Standar Pengujian</span>
                                <span className="text-emerald-600 font-semibold">Terverifikasi</span>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed font-sans">
                                Setiap unit yang selesai melewati 25 titik inspeksi (QC Matrix) mencakup pengujian thermals, stress-test CPU/GPU minimum 2 jam, uji daya tahan baterai, dan stabilitas I/O port.
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
                                    className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-slate-300 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${p.bg}`}>
                                            <Icon className={`w-5 h-5 ${p.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="font-mono text-xs font-bold text-slate-400">[{p.num}]</span>
                                                <span className="font-mono text-2xs text-slate-300 uppercase tracking-widest hidden sm:inline">{p.tag}</span>
                                            </div>
                                            <h3 className="font-display font-semibold text-base text-slate-900 mb-2 leading-snug">
                                                {p.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 leading-relaxed font-sans">
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
