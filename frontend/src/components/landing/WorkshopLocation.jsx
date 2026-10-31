import { MapPin, Clock, Phone, MessageCircle, ArrowUpRight, Navigation, ShieldCheck } from "lucide-react";

export default function WorkshopLocation() {
    return (
        <section className="relative w-full bg-[#090a0d] text-zinc-100 py-16 sm:py-24 border-b border-zinc-800/80" id="workshop-location">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="space-y-3 max-w-2xl pb-10 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-400" />
                        <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold">
                            WORKSHOP DISPATCH // PHYSICAL LAB
                        </span>
                    </div>
                    <h2 className="font-grotesk font-black text-2xl sm:text-4xl text-white tracking-tight">
                        Lokasi Workshop &amp; Jadwal Operasional
                    </h2>
                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                        Kunjungi workshop kami untuk konsultasi langsung, serah terima perangkat secara aman, atau gunakan layanan kurir ekspedisi dengan nomor resi terdaftar.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-10">
                    {/* Left Column: Workshop Details & Schedule */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Address Card */}
                        <div className="bg-[#111318] border border-zinc-800/90 rounded-2xl p-6 sm:p-7 space-y-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-grotesk font-bold text-base text-white">
                                        Workshop Yangversa Computer (YVS)
                                    </h3>
                                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                                        Pusat Spesialis Servis Laptop &amp; PC Desktop, Penggantian Komponen Logic Board &amp; Pengadaan Part Resmi.
                                    </p>
                                    <p className="font-mono text-2xs text-zinc-400 pt-1">
                                        Akses mudah, parkir luas, dan ruang tunggu nyaman ber-AC.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-3">
                                <a
                                    href="https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-sm"
                                >
                                    <Navigation className="w-3.5 h-3.5" />
                                    <span>Buka Petunjuk Arah Google Maps</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>

                        {/* Operating Hours Card */}
                        <div className="bg-[#111318] border border-zinc-800/90 rounded-2xl p-6 sm:p-7 space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                                <Clock className="w-5 h-5 text-sky-400" />
                                <h3 className="font-grotesk font-bold text-base text-white">
                                    Jadwal Layanan Workshop
                                </h3>
                            </div>

                            <div className="space-y-2.5 font-mono text-xs">
                                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                                    <span className="text-zinc-400">Senin &ndash; Jumat</span>
                                    <span className="text-white font-bold">09:00 &ndash; 20:00 WIB</span>
                                </div>
                                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                                    <span className="text-zinc-400">Sabtu</span>
                                    <span className="text-white font-bold">09:00 &ndash; 18:00 WIB</span>
                                </div>
                                <div className="flex items-center justify-between py-1.5 text-zinc-400">
                                    <span>Minggu &amp; Hari Libur</span>
                                    <span className="text-amber-400 font-bold">Janji Temu / Emergency Intake</span>
                                </div>
                            </div>

                            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-3xs font-mono text-zinc-400 leading-relaxed">
                                Penerimaan unit melalui kurir (Gojek / Grab / JNE / J&amp;T) diterima pada jam operasional kerja dengan menyertakan catatan kendala dan nomor kontak aktif.
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Direct Engineering Helpline Card */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="bg-[#12151b] border border-zinc-800/90 rounded-2xl p-6 sm:p-8 space-y-6">
                            <div className="space-y-2">
                                <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold">
                                    DIRECT HOTLINE // WHATSAPP HELPDESK
                                </span>
                                <h3 className="font-grotesk font-bold text-xl text-white">
                                    Konsultasi Langsung dengan Tim Teknisi
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                                    Jelaskan gejala kerusakan (misal: mati total, no display, layar bergaris, kipas berisik, tumpahan air). Teknisi kami siap memberikan estimasi awal dan rekomendasi teknis terbaik sebelum Anda datang ke workshop.
                                </p>
                            </div>

                            <div className="space-y-3 font-mono text-xs">
                                <a
                                    href="https://wa.me/6281234567890?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-700/70 text-emerald-400 flex items-center justify-center">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">WhatsApp Resmi YVS</div>
                                            <div className="text-3xs text-zinc-400 font-sans">0812-3456-7890 (Respon Cepat)</div>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                                </a>

                                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800">
                                    <div className="text-3xs uppercase tracking-widest text-zinc-400 mb-1">
                                        Situs Resmi Toko &bull; Brand Domain
                                    </div>
                                    <div className="text-white font-bold text-sm">
                                        www.komputerawet.com &bull; Yangversa Service
                                    </div>
                                </div>
                            </div>

                            {/* Trust Assurance */}
                            <div className="flex items-center gap-3 pt-2 text-2xs font-mono text-zinc-400">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Estimasi transparan &bull; Tidak ada biaya terselubung</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
