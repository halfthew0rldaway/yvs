import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Tag, Copy, Check, Calendar, Sparkles, MonitorSmartphone } from "lucide-react";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const SCOPE_SHORT = {
    jasa: "Biaya Jasa",
    sparepart: "Suku Cadang",
    total: "Total Tagihan",
};

export default function PromoShowcase() {
    const [promos, setPromos] = useState([]);
    const [copiedCode, setCopiedCode] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/tracking/promotions", { skipCache: true })
            .then((res) => {
                if (active && Array.isArray(res.data)) setPromos(res.data);
            })
            .catch(() => {
                // Silent fail on public landing page — never disrupt tracking UX
            });
        return () => { active = false; };
    }, []);

    if (!promos.length) return null;

    const handleCopy = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            toast.success(`Kode promo ${code} disalin! Tunjukkan ke kasir saat pembayaran.`);
            setTimeout(() => setCopiedCode(""), 2500);
        } catch {
            toast.success(`Catat kode promo: ${code}`);
        }
    };

    return (
        <section className="w-full bg-white py-12 sm:py-16 border-b border-slate-200 overflow-x-clip" id="promo-aktif">
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                {/* Editorial Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 sm:mb-8">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-2xs sm:text-xs font-bold uppercase tracking-wider mb-2.5">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" /> Penawaran Resmi Workshop
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Promo Aktif YVS Computer
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
                            Salin kode penawaran di bawah dan sebutkan kepada petugas kasir saat pengambilan atau pembayaran unit servis Anda.
                        </p>
                    </div>
                    <span className="text-2xs sm:text-xs font-mono font-semibold text-slate-400 shrink-0">
                        {promos.length} PENAWARAN BERLAKU SAAT INI
                    </span>
                </div>

                {/* Responsive Promo Cards Grid */}
                <div className={`grid grid-cols-1 gap-4 sm:gap-5 ${
                    promos.length === 1
                        ? "md:grid-cols-1 max-w-2xl"
                        : promos.length === 2
                        ? "md:grid-cols-2"
                        : "md:grid-cols-2 lg:grid-cols-3"
                }`}>
                    {promos.map((p) => {
                        const isCopied = copiedCode === p.kode_promo;
                        const headline = p.tipe_diskon === "persen"
                            ? `DISKON ${p.nilai_diskon}%`
                            : `HEMAT ${formatRupiah(p.nilai_diskon)}`;

                        return (
                            <div
                                key={p.id}
                                className="group relative flex flex-col justify-between bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200 hover:border-blue-300 p-4 sm:p-5 lg:p-6 transition-all shadow-2xs hover:shadow-md min-w-0"
                            >
                                <div className="space-y-3 min-w-0">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs tracking-wide shadow-2xs">
                                            <Tag className="w-3.5 h-3.5 shrink-0" /> {headline}
                                        </span>
                                        {p.sisa_kuota !== null && (
                                            <span className={`px-2 py-0.5 rounded-full text-2xs font-bold border ${
                                                p.sisa_kuota <= 5
                                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                                    : "bg-white text-slate-600 border-slate-200"
                                            }`}>
                                                Sisa {p.sisa_kuota} kuota
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
                                            {p.nama_promo}
                                        </h3>
                                        {p.deskripsi && (
                                            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed break-words">
                                                {p.deskripsi}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-2xs sm:text-xs text-slate-500 pt-0.5">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium text-slate-700">
                                            <MonitorSmartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            <span>{p.kategori_perangkat === "Semua" ? "Semua Perangkat" : p.kategori_perangkat}</span>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium text-slate-600">
                                            {SCOPE_SHORT[p.cakupan_diskon] || p.cakupan_diskon}
                                        </span>
                                        {p.maksimal_diskon > 0 && p.tipe_diskon === "persen" && (
                                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                                Maks. {formatRupiah(p.maksimal_diskon)}
                                            </span>
                                        )}
                                        {p.minimal_transaksi > 0 && (
                                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                                Min. {formatRupiah(p.minimal_transaksi)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-slate-200/80 space-y-2.5 min-w-0">
                                    <div className="flex items-center justify-between gap-2 bg-white border border-dashed border-blue-300 rounded-xl px-3 py-2 min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <span className="block text-2xs uppercase tracking-wider font-bold text-slate-400">
                                                Kode Promo Kasir
                                            </span>
                                            <span className="block font-mono font-extrabold text-sm sm:text-base text-blue-700 tracking-wide truncate">
                                                {p.kode_promo}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(p.kode_promo)}
                                            className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                                isCopied
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-slate-900 hover:bg-blue-600 text-white"
                                            }`}
                                        >
                                            {isCopied ? <><Check className="w-3.5 h-3.5 shrink-0" /> Tersalin</> : <><Copy className="w-3.5 h-3.5 shrink-0" /> Salin</>}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 flex-wrap text-2xs text-slate-500 font-medium">
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" /> Berlaku s/d {formatDate(p.tanggal_selesai)}
                                        </span>
                                        {p.satu_kali_per_pelanggan && (
                                            <span>1x per pelanggan</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
