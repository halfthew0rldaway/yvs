import { useState } from "react";
import { X, BookOpen, Sparkles, Smile, ShieldAlert, Award, CheckCircle2, AlertTriangle, ArrowRight, PhoneCall, MessageSquare } from "lucide-react";

export default function SopModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState("motto");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900">Buku Saku Panduan Service Excellent YVS</h2>
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Versi 1.0
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Transparent &bull; Trusted &bull; WOW &mdash; Panduan Praktis Frontliner, Admin & Teknisi
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-100 px-5 bg-white overflow-x-auto gap-2 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setActiveTab("motto")}
                        className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === "motto"
                                ? "border-blue-600 text-blue-600 font-bold"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        Motto & Sikap Dasar
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("kepribadian")}
                        className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === "kepribadian"
                                ? "border-blue-600 text-blue-600 font-bold"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        4 Tipe Kepribadian
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("komplain")}
                        className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === "komplain"
                                ? "border-blue-600 text-blue-600 font-bold"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        5 Langkah Komplain
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("eskalasi")}
                        className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === "eskalasi"
                                ? "border-blue-600 text-blue-600 font-bold"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        Matriks 3 Eskalasi
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("dodont")}
                        className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === "dodont"
                                ? "border-blue-600 text-blue-600 font-bold"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        Do & Don't
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs leading-relaxed text-slate-700">
                    {/* Tab 1: Motto & Sikap Dasar */}
                    {activeTab === "motto" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <div className="p-2 bg-blue-100/70 text-blue-700 rounded-lg w-fit mb-2.5">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-bold text-sm text-slate-900 mb-1">
                                            Transparent
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Keterbukaan tanpa biaya terselubung. Diagnosa apa adanya, estimasi jujur, dan dokumentasi foto kondisi fisik sebelum tindakan teknis.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <div className="p-2 bg-emerald-100/70 text-emerald-700 rounded-lg w-fit mb-2.5">
                                            <Award className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-bold text-sm text-slate-900 mb-1">
                                            Trusted
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Integritas penuh terhadap unit dan privasi data pelanggan. Jaminan garansi perbaikan yang jelas, tercatat, dan dapat dipertanggungjawabkan.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <div className="p-2 bg-purple-100/70 text-purple-700 rounded-lg w-fit mb-2.5">
                                            <Smile className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-bold text-sm text-slate-900 mb-1">
                                            WOW Service
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Pelayanan prima yang melebihi ekspektasi. Sentuhan personal yang ramah, kebersihan unit saat serah terima, dan ketepatan waktu.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                                <div className="border-b border-slate-200/80 pb-3">
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        5 Sikap Dasar Pelayanan Frontliner & Teknisi
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Prinsip interaksi langsung dan etika pelayanan dalam melayani pelanggan
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { num: "1", title: "Senyum & Salam Hangat", desc: "Sapa pelanggan sesuai waktu (pagi/siang/sore) dengan ramah, santun, dan sebut nama pelanggan." },
                                        { num: "2", title: "Mendengarkan Aktif", desc: "Biarkan pelanggan menyampaikan kendala unit secara tuntas tanpa memotong atau menyela pembicaraan." },
                                        { num: "3", title: "Empati Tulus", desc: "Pahami kekhawatiran pelanggan dan jangan pernah menyalahkan atau mendebat pelanggan." },
                                        { num: "4", title: "Bahasa Positif & Solutif", desc: "Fokus pada langkah solusi yang bisa dilakukan untuk membantu, bukan sekadar menolak kendala." },
                                        { num: "5", title: "Jaga Komitmen & Janji", desc: "Hanya menjanjikan hal yang pasti bisa ditepati, lalu penuhi tepat waktu dengan penuh tanggung jawab." }
                                    ].map((item) => (
                                        <div key={item.num} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                                            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0 mt-0.5">
                                                {item.num}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-bold text-xs text-slate-900">{item.title}</span>
                                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: 4 Tipe Kepribadian */}
                    {activeTab === "kepribadian" && (
                        <div className="space-y-3">
                            <p className="text-slate-500">
                                Mengenali gaya komunikasi pelanggan membantu kita memberikan respon yang paling nyaman dan efektif:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-bold text-rose-900 text-sm">1. Koleris (Tegas & Cepat)</h4>
                                        <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">Fokus Solusi</span>
                                    </div>
                                    <p className="text-slate-600 mb-2">
                                        Karakter: To the point, menghargai efisiensi waktu, tidak suka basa-basi panjang, berorientasi hasil.
                                    </p>
                                    <div className="bg-white/80 p-2.5 rounded-lg border border-rose-100 text-[11px] text-slate-700">
                                        <strong>Cara Menghadapi:</strong> Langsung sampaikan pokok masalah, solusi, estimasi biaya angka pasti, dan tanggal selesai. Hindari penjelasan bertele-tele.
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-bold text-amber-900 text-sm">2. Sanguinis (Ramah & Ekspresif)</h4>
                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Hubungan Akrab</span>
                                    </div>
                                    <p className="text-slate-600 mb-2">
                                        Karakter: Suka bercerita, ceria, antusias, menghargai perhatian personal dan sambutan bersahabat.
                                    </p>
                                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100 text-[11px] text-slate-700">
                                        <strong>Cara Menghadapi:</strong> Berikan sambutan hangat, tunjukkan antusiasme, puji unitnya, lampirkan foto kondisi unit, dan gunakan kalimat ramah bersahabat.
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-bold text-emerald-900 text-sm">3. Plegmatis (Tenang & Sabar)</h4>
                                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Rasa Aman</span>
                                    </div>
                                    <p className="text-slate-600 mb-2">
                                        Karakter: Tidak suka konflik, butuh kepastian dan ketenangan, butuh waktu dalam mengambil keputusan.
                                    </p>
                                    <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 text-[11px] text-slate-700">
                                        <strong>Cara Menghadapi:</strong> Bicara dengan tenang, sabar, jangan mendesak konfirmasi, beri rasa aman bahwa unit dipegang oleh teknisi berpengalaman.
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-bold text-indigo-900 text-sm">4. Melankolis (Kritis & Rinci)</h4>
                                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Detail Logis</span>
                                    </div>
                                    <p className="text-slate-600 mb-2">
                                        Karakter: Teliti, menyukai data, kritis terhadap biaya, ingin memahami penyebab masalah secara teknis logis.
                                    </p>
                                    <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100 text-[11px] text-slate-700">
                                        <strong>Cara Menghadapi:</strong> Jelaskan secara runut dan logis: temuan, penyebab, tindakan, rincian biaya sparepart vs jasa, serta syarat garansi tertulis.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: 5 Langkah Komplain */}
                    {activeTab === "komplain" && (
                        <div className="space-y-3">
                            <p className="text-slate-500 font-medium">
                                Prosedur 5 Langkah Penanganan Keluhan Pelanggan:
                            </p>
                            <div className="space-y-2.5">
                                {[
                                    {
                                        step: "1",
                                        title: "Dengarkan Sepenuhnya Tanpa Memotong",
                                        desc: "Biarkan pelanggan meluapkan keluhan dan kekecewaannya hingga tuntas. Tunjukkan bahwa kita mencatat dan memperhatikan."
                                    },
                                    {
                                        step: "2",
                                        title: "Minta Maaf Secara Tulus",
                                        desc: "Ucapkan permohonan maaf atas ketidaknyamanan yang dialami: 'Kami memohon maaf atas kendala yang terjadi pada unit Bapak/Ibu.'"
                                    },
                                    {
                                        step: "3",
                                        title: "Konfirmasi & Gali Inti Masalah",
                                        desc: "Ulangi poin keluhan untuk memastikan kesamaan pemahaman: 'Jadi kendalanya setelah dibawa pulang, kipas berbunyi keras ya, Bu?'"
                                    },
                                    {
                                        step: "4",
                                        title: "Tawarkan Solusi Jelas & Terukur",
                                        desc: "Sampaikan tindakan langsung yang akan dilakukan, siapa teknisi penanggung jawab, dan tenggat waktu kepastian kabar."
                                    },
                                    {
                                        step: "5",
                                        title: "Tindak Lanjuti & Ucapkan Apresiasi",
                                        desc: "Jalankan penanganan sebagai prioritas utama dan hubungi kembali pelanggan untuk memastikan unit sudah berfungsi dengan prima."
                                    }
                                ].map((item) => (
                                    <div key={item.step} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-900 text-xs">{item.title}</h5>
                                            <p className="text-slate-600 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Matriks Eskalasi */}
                    {activeTab === "eskalasi" && (
                        <div className="space-y-3">
                            <p className="text-slate-500">
                                Alur Eskalasi 3 Level Workshop untuk memastikan penanganan bertingkat yang tepat dan bertanggung jawab:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                                    <div className="flex items-center gap-1.5 font-bold text-blue-900 text-sm">
                                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                                        Level 1: Frontliner / Admin
                                    </div>
                                    <ul className="text-slate-600 space-y-1 list-disc list-inside">
                                        <li>Penerimaan intake unit baru & konsultasi awal.</li>
                                        <li>Penyampaian hasil diagnosa & estimasi biaya standar.</li>
                                        <li>Komplain ringan / klarifikasi status pengerjaan.</li>
                                    </ul>
                                </div>

                                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
                                        <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                                        Level 2: Kepala Teknisi / SPV
                                    </div>
                                    <ul className="text-slate-600 space-y-1 list-disc list-inside">
                                        <li>Klaim garansi berulang / kendala teknis kompleks.</li>
                                        <li>Kebutuhan tindakan berisiko tinggi (chipset/motherboard).</li>
                                        <li>Pelanggan menolak penawaran namun butuh solusi alternatif.</li>
                                    </ul>
                                </div>

                                <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2">
                                    <div className="flex items-center gap-1.5 font-bold text-red-900 text-sm">
                                        <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">3</span>
                                        Level 3: Pimpinan Workshop
                                    </div>
                                    <ul className="text-slate-600 space-y-1 list-disc list-inside">
                                        <li>Komplain berat / pelanggan sangat kecewa.</li>
                                        <li>Keputusan ganti rugi, diskon khusus atau penggantian unit.</li>
                                        <li>Insiden kerusakan tak terduga selama masa servis.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 5: Do & Don't */}
                    {activeTab === "dodont" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                                <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> HAL YANG WAJIB DILAKUKAN (DO)
                                </h4>
                                <ul className="space-y-1.5 text-slate-700 list-disc list-inside text-[11px]">
                                    <li>Menyapa dengan sebutan hormat Bapak/Ibu dan menyebut nama pelanggan.</li>
                                    <li>Meminta izin tertulis/lisan jelas sebelum membongkar atau tes login OS.</li>
                                    <li>Mendokumentasikan foto fisik unit saat diterima di depan pelanggan.</li>
                                    <li>Memberikan estimasi waktu yang realistis dan memperbarui status tepat waktu.</li>
                                    <li>Menyampaikan rincian garansi dan tips perawatan saat serah terima selesai.</li>
                                </ul>
                            </div>

                            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-2">
                                <h4 className="font-bold text-red-900 text-sm flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-red-600" /> HAL YANG DILARANG (DON'T)
                                </h4>
                                <ul className="space-y-1.5 text-slate-700 list-disc list-inside text-[11px]">
                                    <li>Mengirim stiker atau emoji di pesan WhatsApp resmi workshop kepada pelanggan.</li>
                                    <li>Membantah pelanggan dengan kata 'Kan sudah saya bilang' atau 'Itu salah Bapak'.</li>
                                    <li>Menyentuh atau membuka file pribadi (foto/dokumen) pelanggan di luar izin teknis.</li>
                                    <li>Membiarkan pesan atau pertanyaan pelanggan tanpa kepastian kabar berhari-hari.</li>
                                    <li>Menjanjikan garansi atau hal teknis di luar batas wewenang tanpa konfirmasi SPV.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                    >
                        Tutup Buku Saku
                    </button>
                </div>
            </div>
        </div>
    );
}

