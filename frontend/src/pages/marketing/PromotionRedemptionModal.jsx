import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { X, Tag, Receipt, ExternalLink, Megaphone, Calendar, Users, Percent } from "lucide-react";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

function formatDate(d) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function PromotionRedemptionModal({ isOpen, onClose, promotionId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !promotionId) return;
        let active = true;
        setLoading(true);
        api.get(`/marketing/promotions/${promotionId}`, { skipCache: true })
            .then((res) => {
                if (active) setData(res.data);
            })
            .catch(() => {
                if (active) toast.error("Gagal memuat riwayat penukaran promo");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [isOpen, promotionId]);

    if (!isOpen) return null;

    const quotaPct = data?.kuota_total ? Math.min(100, Math.round((data.kuota_terpakai / data.kuota_total) * 100)) : 0;

    return (
        <div className="modal-shell z-[100]">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
            <div className="modal-panel max-w-6xl">
                {/* Pinned Header */}
                <div className="modal-header flex items-center justify-between gap-3 bg-slate-50/70">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                {data ? `${data.nama_promo} (${data.kode_promo})` : "Riwayat Penukaran Promo"}
                            </h2>
                            <p className="text-2xs sm:text-xs text-slate-500 truncate">
                                Pelacakan invoice, sisa kuota, dan timeline catatan kampanye
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors shrink-0"
                        aria-label="Tutup"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="modal-body space-y-4 sm:space-y-5">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-medium">Memuat data penukaran...</span>
                        </div>
                    ) : !data ? (
                        <div className="py-12 text-center text-sm text-slate-500">Data tidak tersedia.</div>
                    ) : (
                        <>
                            {/* Balanced KPI Strip */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
                                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block truncate">Penukaran</span>
                                    <p className="text-base xs:text-lg sm:text-xl font-bold text-slate-900 tabular-nums mt-1 truncate">
                                        {data.summary?.redemptions_count || 0}
                                        {data.kuota_total ? <span className="text-xs font-semibold text-slate-400"> / {data.kuota_total}</span> : ""}
                                    </p>
                                    <span className="text-2xs text-slate-500 block truncate mt-0.5">
                                        {data.sisa_kuota !== null ? `Sisa ${data.sisa_kuota} kuota` : "Kuota tanpa batas"}
                                    </span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/70 min-w-0">
                                    <span className="text-2xs font-bold uppercase tracking-wider text-rose-700 block truncate">Total Potongan</span>
                                    <p className="text-base xs:text-lg sm:text-xl font-bold text-rose-700 font-mono tabular-nums mt-1 truncate">
                                        {formatRupiah(data.summary?.total_diskon_diberikan)}
                                    </p>
                                    <span className="text-2xs text-rose-600 block truncate mt-0.5">Diskon resmi diberikan</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/70 min-w-0">
                                    <span className="text-2xs font-bold uppercase tracking-wider text-blue-700 block truncate">Nilai Invoice Bersih</span>
                                    <p className="text-base xs:text-lg sm:text-xl font-bold text-blue-700 font-mono tabular-nums mt-1 truncate">
                                        {formatRupiah(data.summary?.total_omset_bersih)}
                                    </p>
                                    <span className="text-2xs text-blue-600 block truncate mt-0.5">
                                        Kotor: {formatRupiah(data.summary?.total_omset_kotor)}
                                    </span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 min-w-0">
                                    <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700 block truncate">Pelanggan</span>
                                    <p className="text-base xs:text-lg sm:text-xl font-bold text-emerald-800 tabular-nums mt-1 truncate">
                                        {data.summary?.new_customers || 0} Baru · {data.summary?.returning_customers || 0} Kembali
                                    </p>
                                    <span className="text-2xs text-emerald-700 block truncate mt-0.5">Berdasarkan riwayat tiket</span>
                                </div>
                            </div>

                            {/* Quota bar + Campaign Notes Timeline */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 min-w-0">
                                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700 flex-wrap">
                                        <span className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Aturan &amp; Periode</span>
                                        <span className="font-mono text-blue-700">
                                            {data.tipe_diskon === "persen" ? `${data.nilai_diskon}%` : formatRupiah(data.nilai_diskon)} ({data.cakupan_diskon})
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="break-words">{formatDate(data.tanggal_mulai)} s/d {formatDate(data.tanggal_selesai)}</span>
                                    </p>
                                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="break-words">Kategori: <strong>{data.kategori_perangkat}</strong> · Layanan: <strong>{data.tipe_tiket}</strong></span>
                                    </p>
                                    {data.kuota_total && (
                                        <div className="pt-1">
                                            <div className="flex justify-between text-2xs font-semibold text-slate-500 mb-1">
                                                <span>Penggunaan Kuota</span>
                                                <span>{quotaPct}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${quotaPct >= 90 ? "bg-rose-500" : "bg-blue-600"}`}
                                                    style={{ width: `${quotaPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 min-w-0">
                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Timeline Catatan Kampanye ({data.campaign_notes?.length || 0})
                                    </span>
                                    {data.campaign_notes?.length > 0 ? (
                                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                            {data.campaign_notes.map((cn) => {
                                                const isUrl = cn.tautan_referensi && /^https?:\/\//i.test(cn.tautan_referensi);
                                                return (
                                                    <div key={cn.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <strong className="text-slate-800 break-words min-w-0">{cn.judul}</strong>
                                                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-2xs font-semibold shrink-0">
                                                                {cn.saluran}
                                                            </span>
                                                        </div>
                                                        <p className="text-2xs text-slate-500 break-words">{formatDate(cn.tanggal_publikasi)}{cn.catatan ? ` · ${cn.catatan}` : ""}</p>
                                                        {cn.tautan_referensi && (
                                                            isUrl ? (
                                                                <a href={cn.tautan_referensi} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-2xs text-blue-600 hover:underline font-semibold">
                                                                    Buka Tautan <ExternalLink className="w-3 h-3 shrink-0" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-2xs text-slate-500 font-mono block break-all">{cn.tautan_referensi}</span>
                                                            )
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Belum ada log kampanye tercatat untuk promo ini. Tambahkan melalui tab <strong>Catatan Kampanye</strong>.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Redeemed Invoices List */}
                            <div className="space-y-2.5">
                                <h3 className="section-overline flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Daftar Invoice yang Menggunakan Promo ({data.redemptions?.length || 0})
                                </h3>

                                {!data.redemptions?.length ? (
                                    <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                                        Belum ada invoice yang menggunakan penawaran ini.
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile Cards (< lg) */}
                                        <div className="space-y-2.5 lg:hidden">
                                            {data.redemptions.map((r) => (
                                                <div key={r.invoice_id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs min-w-0">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <Link to={`/invoice/${r.invoice_id}`} onClick={onClose} className="font-mono font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                                                            {r.nomor_invoice} <ExternalLink className="w-3 h-3 shrink-0" />
                                                        </Link>
                                                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                                                            r.customer_type === "baru"
                                                                ? "bg-blue-100 text-blue-700"
                                                                : "bg-emerald-100 text-emerald-700"
                                                        }`}>
                                                            {r.customer_type === "baru" ? "Pelanggan Baru" : "Pelanggan Kembali"}
                                                        </span>
                                                    </div>
                                                    <div className="text-slate-700 min-w-0">
                                                        <p className="font-semibold break-words">{r.customer_nama} <span className="text-slate-400 font-mono">({r.nomor_tiket})</span></p>
                                                        <p className="text-2xs text-slate-500 break-words mt-0.5">{r.perangkat} · {formatDate(r.created_at)}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 font-mono text-xs">
                                                        <span className="text-rose-600 font-semibold">-{formatRupiah(r.diskon)}</span>
                                                        <span className="font-bold text-slate-900">{formatRupiah(r.total_biaya)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table (>= lg) */}
                                        <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-200">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-2xs tracking-wider">
                                                        <th className="py-2.5 px-3">Invoice / Tiket</th>
                                                        <th className="py-2.5 px-3">Pelanggan</th>
                                                        <th className="py-2.5 px-3">Perangkat</th>
                                                        <th className="py-2.5 px-3">Tipe</th>
                                                        <th className="py-2.5 px-3 text-right">Potongan</th>
                                                        <th className="py-2.5 px-3 text-right">Total Bersih</th>
                                                        <th className="py-2.5 px-3 text-right">Tanggal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {data.redemptions.map((r) => (
                                                        <tr key={r.invoice_id} className="hover:bg-slate-50/70">
                                                            <td className="py-2.5 px-3 font-mono">
                                                                <Link to={`/invoice/${r.invoice_id}`} onClick={onClose} className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                                                                    {r.nomor_invoice} <ExternalLink className="w-3 h-3" />
                                                                </Link>
                                                                <span className="block text-2xs text-slate-400">{r.nomor_tiket}</span>
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <span className="font-semibold text-slate-800 block">{r.customer_nama}</span>
                                                                <span className="text-2xs text-slate-400 font-mono">{r.customer_telepon}</span>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-slate-600">
                                                                <span className="block">{r.perangkat}</span>
                                                                <span className="text-2xs text-slate-400">{r.jenis_perangkat}</span>
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                                                                    r.customer_type === "baru"
                                                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                }`}>
                                                                    {r.customer_type === "baru" ? "Baru" : "Kembali"}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
                                                                -{formatRupiah(r.diskon)}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                                                {formatRupiah(r.total_biaya)}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right text-slate-500">
                                                                {formatDate(r.created_at)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Pinned Footer */}
                <div className="modal-footer bg-slate-50/70">
                    <button type="button" onClick={onClose} className="btn-secondary min-h-[40px] px-4 text-[13px] sm:text-sm w-full xs:w-auto justify-center">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
