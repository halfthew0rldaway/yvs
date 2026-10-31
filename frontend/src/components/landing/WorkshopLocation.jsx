import { MapPin, Clock, MessageCircle, ArrowUpRight, Navigation, ShieldCheck } from "lucide-react";

export default function WorkshopLocation() {
    return (
        <section className="relative w-full bg-white py-16 sm:py-24 border-b border-slate-100" id="workshop-location">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="space-y-3 max-w-2xl pb-10 border-b border-slate-100 mb-10">
                    <span className="text-xs font-sans font-semibold text-blue-600 uppercase tracking-wide">
                        Workshop Fisik · Physical Lab
                    </span>
                    <h2 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight">
                        Lokasi Workshop &amp; Jadwal Operasional
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-sans">
                        Kunjungi workshop kami untuk konsultasi langsung, serah terima perangkat secara aman, atau gunakan layanan kurir ekspedisi dengan nomor resi terdaftar.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Address + Hours */}
                    <div className="lg:col-span-6 space-y-5">
                        {/* Address Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-display font-semibold text-base text-slate-900">
                                        Workshop YVS Computer (Yangversa)
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed font-sans">
                                        Pusat Spesialis Servis Laptop &amp; PC Desktop, Penggantian Komponen Logic Board &amp; Pengadaan Part Resmi.
                                    </p>
                                    <p className="text-xs text-slate-400 font-sans pt-0.5">
                                        Akses mudah, parkir luas, dan ruang tunggu nyaman ber-AC.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <a
                                    href="https://maps.app.goo.gl/A82Vw4qNW4N2oeqPA"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm font-medium transition-all shadow-sm"
                                >
                                    <Navigation className="w-3.5 h-3.5" />
                                    <span>Buka di Google Maps</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>

                        {/* Operating Hours */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <h3 className="font-display font-semibold text-base text-slate-900">
                                    Jadwal Layanan Workshop
                                </h3>
                            </div>

                            <div className="space-y-2.5 text-sm font-sans">
                                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                    <span className="text-slate-500">Senin – Jumat</span>
                                    <span className="text-slate-900 font-semibold font-mono text-xs">09:00 – 20:00 WIB</span>
                                </div>
                                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                    <span className="text-slate-500">Sabtu</span>
                                    <span className="text-slate-900 font-semibold font-mono text-xs">09:00 – 18:00 WIB</span>
                                </div>
                                <div className="flex items-center justify-between py-1.5">
                                    <span className="text-slate-500">Minggu &amp; Hari Libur</span>
                                    <span className="text-amber-600 font-semibold font-mono text-xs">Janji Temu / Emergency</span>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 font-sans leading-relaxed">
                                Penerimaan unit melalui kurir (Gojek / Grab / JNE / J&amp;T) diterima pada jam operasional kerja dengan menyertakan catatan kendala dan nomor kontak aktif.
                            </div>
                        </div>
                    </div>

                    {/* Right: Contact / WhatsApp */}
                    <div className="lg:col-span-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
                            <div className="space-y-2">
                                <span className="text-xs font-sans font-semibold text-emerald-600 uppercase tracking-wide">
                                    Direct Helpdesk · WhatsApp
                                </span>
                                <h3 className="font-display font-semibold text-xl text-slate-900">
                                    Konsultasi Langsung dengan Tim Teknisi
                                </h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-sans">
                                    Jelaskan gejala kerusakan (misal: mati total, no display, layar bergaris, kipas berisik, tumpahan air). Teknisi kami siap memberikan estimasi awal dan rekomendasi teknis terbaik sebelum Anda datang ke workshop.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href="https://wa.me/6281234567890?text=Halo%20YVS%20Computer,%20saya%20ingin%20konsultasi%20mengenai%20perangkat%20saya"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-900 font-sans font-semibold">WhatsApp Resmi YVS</div>
                                            <div className="text-xs text-slate-400 font-sans mt-0.5">0812-3456-7890 · Respon Cepat</div>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                                </a>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="text-xs font-sans font-semibold text-slate-400 uppercase tracking-wide mb-1">
                                        Situs Resmi
                                    </div>
                                    <div className="text-sm text-slate-900 font-sans font-medium">
                                        www.komputerawet.com · Yangversa Service
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 pt-1 text-xs font-sans text-slate-400 border-t border-slate-100">
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Estimasi transparan · Tidak ada biaya diagnosis tersembunyi</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
