import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Copy, Check, Calendar } from "lucide-react";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num || 0);
}

function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

const SCOPE_TEXT = {
    jasa: "Biaya jasa servis",
    sparepart: "Suku cadang",
    total: "Total tagihan",
};

export default function EditorialPromoStrip() {
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
        return () => {
            active = false;
        };
    }, []);

    if (!promos.length) return null;

    const handleCopy = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            toast.success(`Kode ${code} disalin. Tunjukkan ke kasir saat pembayaran.`);
            setTimeout(() => setCopiedCode(""), 2400);
        } catch {
            toast.success(`Catat kode promo: ${code}`);
        }
    };

    return (
        <section
            id="promo-aktif"
            className="w-full bg-white border-b border-slate-200 py-14 sm:py-20 overflow-x-clip scroll-mt-16"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
                    <div className="space-y-2 max-w-2xl">
                        <span className="font-mono text-xs text-blue-600 font-semibold block">
                            PENAWARAN BULAN INI
                        </span>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-950 tracking-tight leading-tight">
                            Potongan biaya servis yang sedang berlaku.
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
                        Salin kode di bawah dan sebutkan ke kasir saat pengambilan atau pembayaran unit.
                    </p>
                </div>

                {/* Editorial Ticket-Stub Ledger Rows */}
                <div className="divide-y divide-slate-200">
                    {promos.map((p) => {
                        const isCopied = copiedCode === p.kode_promo;
                        const bigValue =
                            p.tipe_diskon === "persen"
                                ? `${p.nilai_diskon}%`
                                : formatRupiah(p.nilai_diskon).replace(",00", "");

                        const conditions = [
                            p.kategori_perangkat === "Semua"
                                ? "Semua perangkat"
                                : `Khusus ${p.kategori_perangkat}`,
                            SCOPE_TEXT[p.cakupan_diskon] || p.cakupan_diskon,
                            p.maksimal_diskon > 0 && p.tipe_diskon === "persen"
                                ? `Maks. ${formatRupiah(p.maksimal_diskon)}`
                                : null,
                            p.minimal_transaksi > 0
                                ? `Min. transaksi ${formatRupiah(p.minimal_transaksi)}`
                                : null,
                            p.satu_kali_per_pelanggan ? "1x per pelanggan" : null,
                        ].filter(Boolean);

                        return (
                            <div
                                key={p.id}
                                className="py-6 sm:py-7 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center hover:bg-slate-50/70 transition-colors -mx-3 px-3 rounded-xl"
                            >
                                {/* Discount Figure */}
                                <div className="lg:col-span-3 flex lg:flex-col items-baseline lg:items-start justify-between gap-2">
                                    <span className="font-display font-extrabold text-3xl sm:text-4xl text-blue-600 tracking-tight tabular-nums leading-none">
                                        {bigValue}
                                    </span>
                                    {p.sisa_kuota !== null && (
                                        <span
                                            className={`font-mono text-xs font-semibold ${
                                                p.sisa_kuota <= 5 ? "text-amber-700" : "text-slate-500"
                                            }`}
                                        >
                                            Sisa {p.sisa_kuota} kuota
                                        </span>
                                    )}
                                </div>

                                {/* Title & Plain Terms */}
                                <div className="lg:col-span-5 space-y-1.5 min-w-0">
                                    <h3 className="font-display font-bold text-lg text-slate-950 leading-snug">
                                        {p.nama_promo}
                                    </h3>
                                    {p.deskripsi && (
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {p.deskripsi}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-slate-500">
                                        <span>{conditions.join(" · ")}</span>
                                    </div>
                                </div>

                                {/* Dashed Ticket Code + Copy Action */}
                                <div className="lg:col-span-4 lg:border-l lg:border-dashed lg:border-slate-300 lg:pl-7 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <span className="font-mono text-[11px] text-slate-400 block">
                                            Kode di kasir
                                        </span>
                                        <span className="font-mono font-bold text-base sm:text-lg text-slate-950 tracking-wide block truncate">
                                            {p.kode_promo}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>s/d {formatDate(p.tanggal_selesai)}</span>
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleCopy(p.kode_promo)}
                                        className={`min-h-[42px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                                            isCopied
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-900 hover:bg-blue-600 text-white"
                                        }`}
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="w-4 h-4 shrink-0" />
                                                <span>Tersalin</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 shrink-0" />
                                                <span>Salin kode</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
