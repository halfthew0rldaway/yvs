import { ShieldCheck, Eye, Cpu, Award, ArrowUpRight } from "lucide-react";

const PRINCIPLES = [
    {
        num: "01",
        title: "Transparansi Biaya & Diagnosis Tanpa Beban",
        desc: "Kami tidak pernah memungut biaya diagnosis jika estimasi yang diajukan tidak disetujui. Obeng tidak akan menyentuh logic board Anda sebelum ada persetujuan resmi dari pemilik perangkat.",
        tag: "NO_HIDDEN_COST_POLICY",
        icon: ShieldCheck,
    },
    {
        num: "02",
        title: "Dokumentasi Visual Lengkap di Portal Pelacakan",
        desc: "Bukan sekadar klaim sepihak. Setiap temuan mikroskop, jalur terbakar, proses soldering, hingga komponen yang diganti difoto atau direkam dan dapat Anda periksa langsung di portal ini.",
        tag: "VERIFIED_AUDIT_TRAIL",
        icon: Eye,
    },
    {
        num: "03",
        title: "ESD-Safe Clean Room & Pengadaan Part Terkurasi",
        desc: "Seluruh pengerjaan chip-level dilakukan pada stasiun kerja terlindung Anti-Static (ESD Safe) dengan instrumentasi suhu terkalibrasi. Komponen IC dan suku cadang berasal dari rantai pasok OEM Grade-A.",
        tag: "CERTIFIED_SEMICONDUCTORS",
        icon: Cpu,
    },
    {
        num: "04",
        title: "Sertifikat Garansi Digital & Tanda Tangan Resmi",
        desc: "Sertifikat garansi digital dengan nomor tiket unik otomatis aktif setelah serah terima unit ditandatangani secara digital. Anda memiliki bukti proteksi resmi tanpa takut nota fisik hilang.",
        tag: "AUTHENTIC_WARRANTY_PASS",
        icon: Award,
    },
];

export default function EngineeringStandards() {
    return (
        <section className="relative w-full bg-[#0a0b0e] text-zinc-100 py-16 sm:py-24 border-b border-zinc-800/80" id="engineering-standards">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    {/* Left Sticky Editorial Column */}
                    <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
                        <div className="space-y-3">
                            <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold">
                                // THE YVS ENGINEERING CODE
                            </span>
                            <h2 className="font-grotesk font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                                Standar Rekayasa yang Membedakan Kami dari Servis Konvensional.
                            </h2>
                        </div>

                        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-sans">
                            Industri reparasi komputer kerap dibayangi oleh ketidakpastian biaya, penggantian komponen yang tidak transparan, dan ketiadaan jaminan tertulis. Di YVS Computer, kami membangun reputasi di atas fondasi integritas teknis dan bukti nyata.
                        </p>

                        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 font-mono text-xs">
                            <div className="flex items-center justify-between text-zinc-400 text-3xs">
                                <span>STANDAR PENGUJIAN</span>
                                <span className="text-emerald-400 font-bold">TERVERIFIKASI</span>
                            </div>
                            <p className="text-zinc-300 text-2xs leading-relaxed">
                                Setiap unit yang selesai melewati 25 titik inspeksi (QC Matrix) mencakup pengujian thermals, stress-test CPU/GPU minimum 2 jam, uji daya tahan baterai, dan stabilitas I/O port.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: 4 Numbered Architectural Blocks */}
                    <div className="lg:col-span-7 space-y-5">
                        {PRINCIPLES.map((p) => {
                            const IconComponent = p.icon;
                            return (
                                <div
                                    key={p.num}
                                    className="bg-[#101217] border border-zinc-800/90 rounded-2xl p-6 sm:p-7 hover:border-zinc-700 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-black text-amber-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                                                [ {p.num} ]
                                            </span>
                                            <span className="font-mono text-3xs uppercase tracking-widest text-zinc-400">
                                                {p.tag}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                    </div>

                                    <h3 className="font-grotesk font-bold text-base sm:text-lg text-white mb-2">
                                        {p.title}
                                    </h3>

                                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                                        {p.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
