import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useConnectivity } from "../../hooks/useConnectivity";
import {
    ArrowLeft,
    Save,
    FileCheck,
    DollarSign,
    Info,
    CreditCard,
    Tag,
    CheckCircle2,
    Clock,
    AlertCircle,
    AlertTriangle,
    WifiOff,
    Sparkles,
} from "lucide-react";
import CustomSelect from "../../components/common/CustomSelect";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

const SCOPE_LABELS = {
    jasa: "Khusus Biaya Jasa",
    sparepart: "Khusus Suku Cadang",
    total: "Total Tagihan",
};

export default function InvoiceForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isOnline } = useConnectivity();
    const queryTiketId = searchParams.get("tiket_id") || "";

    const [form, setForm] = useState({
        tiket_id: queryTiketId,
        biaya_jasa: "",
        diskon: 0,
        keterangan_diskon: "",
        nominal_dp: 0,
        metode_pembayaran: "Tunai",
        catatan: ""
    });

    // Discount Mode: "none" | "promo" | "manual"
    const [discountMode, setDiscountMode] = useState("none");
    const [activePromos, setActivePromos] = useState([]);
    const [loadingPromos, setLoadingPromos] = useState(false);
    const [selectedPromoId, setSelectedPromoId] = useState("");
    const [manualPromoCode, setManualPromoCode] = useState("");
    const [promoValidation, setPromoValidation] = useState(null);
    const [validatingCode, setValidatingCode] = useState(false);

    const [tikets, setTikets] = useState([]);
    const [selectedTiketData, setSelectedTiketData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (form.tiket_id) {
            api.get(`/tiket-servis/${form.tiket_id}`)
                .then(res => setSelectedTiketData(res.data))
                .catch(() => toast.error("Gagal mengambil detail tiket"));
        } else {
            setSelectedTiketData(null);
        }
    }, [form.tiket_id]);

    useEffect(() => {
        api
            .get("/tiket-servis")
            .then((res) => {
                const readyTikets = res.data.filter((t) => ["selesai", "diambil"].includes(t.status) && !t.invoice);
                setTikets(readyTikets);
                if (queryTiketId && !readyTikets.some(t => String(t.id) === String(queryTiketId))) {
                    const currentTiket = res.data.find(t => String(t.id) === String(queryTiketId));
                    if (currentTiket?.invoice) {
                        toast("Tiket ini sudah memiliki invoice resmi.");
                    }
                }
            })
            .catch(() => toast.error("Gagal memuat data"))
            .finally(() => setFetching(false));
    }, [queryTiketId]);

    // Fetch active promos evaluated against selected ticket & biaya_jasa (debounced)
    useEffect(() => {
        if (!isOnline) {
            setActivePromos([]);
            return;
        }
        let active = true;
        const timer = setTimeout(() => {
            setLoadingPromos(true);
            const params = {};
            if (form.tiket_id) params.tiket_id = form.tiket_id;
            if (form.biaya_jasa !== "") params.biaya_jasa = Number(form.biaya_jasa) || 0;
            api.get("/marketing/promotions/active", { params, skipCache: true })
                .then((res) => {
                    if (active) setActivePromos(Array.isArray(res.data) ? res.data : []);
                })
                .catch(() => {
                    if (active) setActivePromos([]);
                })
                .finally(() => {
                    if (active) setLoadingPromos(false);
                });
        }, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [form.tiket_id, form.biaya_jasa, isOnline]);

    const selectedPromo = useMemo(
        () => activePromos.find((p) => String(p.id) === String(selectedPromoId)) || null,
        [activePromos, selectedPromoId]
    );

    // Sync validation preview whenever selectedPromo updates
    useEffect(() => {
        if (discountMode !== "promo") {
            setPromoValidation(null);
            return;
        }
        if (selectedPromo) {
            setPromoValidation(selectedPromo.eligibility || null);
        }
    }, [discountMode, selectedPromo]);

    const handleModeChange = (mode) => {
        setDiscountMode(mode);
        if (mode === "none") {
            setSelectedPromoId("");
            setManualPromoCode("");
            setPromoValidation(null);
            setForm((prev) => ({ ...prev, diskon: 0, keterangan_diskon: "" }));
        } else if (mode === "promo") {
            setForm((prev) => ({ ...prev, diskon: 0, keterangan_diskon: "" }));
        } else if (mode === "manual") {
            setSelectedPromoId("");
            setManualPromoCode("");
            setPromoValidation(null);
        }
    };

    const handleApplyPromoCode = async () => {
        const clean = manualPromoCode.trim().toUpperCase();
        if (!clean) {
            toast.error("Masukkan kode promo terlebih dahulu");
            return;
        }
        if (!isOnline) {
            toast.error("Validasi kode promo memerlukan koneksi internet");
            return;
        }
        setValidatingCode(true);
        try {
            const res = await api.post("/marketing/promotions/validate", {
                kode_promo: clean,
                tiket_id: form.tiket_id ? Number(form.tiket_id) : undefined,
                biaya_jasa: Number(form.biaya_jasa) || 0,
            });
            const data = res.data;
            if (data.promotion?.id) {
                setSelectedPromoId(String(data.promotion.id));
            }
            setPromoValidation(data);
            if (data.eligible) {
                toast.success(`Promo ${data.promotion.kode_promo} valid! Potongan ${formatRupiah(data.discount)}`);
            } else {
                toast.error(data.reason || "Promo tidak memenuhi syarat untuk tiket ini");
            }
        } catch (err) {
            setPromoValidation({
                eligible: false,
                reason: err.response?.data?.message || "Kode promo tidak ditemukan",
            });
            toast.error(err.response?.data?.message || "Kode promo tidak valid");
        } finally {
            setValidatingCode(false);
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (discountMode === "promo") {
            if (!isOnline) {
                toast.error("Klaim promo resmi memerlukan koneksi internet. Gunakan Potongan Manual jika offline.");
                return;
            }
            if (!selectedPromoId) {
                toast.error("Pilih promo toko terlebih dahulu atau ganti mode potongan.");
                return;
            }
            if (promoValidation && !promoValidation.eligible) {
                toast.error(promoValidation.reason || "Promo yang dipilih belum memenuhi syarat untuk tiket ini.");
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                tiket_id: form.tiket_id,
                biaya_jasa: form.biaya_jasa,
                nominal_dp: form.nominal_dp,
                metode_pembayaran: form.metode_pembayaran,
                catatan: form.catatan,
            };

            if (discountMode === "promo" && selectedPromoId) {
                payload.promotion_id = Number(selectedPromoId);
            } else if (discountMode === "manual") {
                payload.diskon = Math.max(0, Number(form.diskon) || 0);
                payload.keterangan_diskon = form.keterangan_diskon.trim() || "Penyesuaian Harga / Apresiasi";
            } else {
                payload.diskon = 0;
            }

            await api.post("/invoice", payload);
            toast.success("Invoice resmi berhasil diterbitkan!");
            navigate("/invoice");
        } catch (err) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const totalSparepart = selectedTiketData?.penggunaan_sparepart?.reduce((acc, p) => acc + (p.sparepart.harga * p.jumlah), 0) || 0;
    const biayaJasaNum = Math.max(0, Number(form.biaya_jasa || 0));
    const subtotal = biayaJasaNum + totalSparepart;

    const effectiveDiskon =
        discountMode === "promo"
            ? (promoValidation?.eligible ? Number(promoValidation.discount || 0) : 0)
            : discountMode === "manual"
            ? Math.min(subtotal, Math.max(0, Number(form.diskon || 0)))
            : 0;

    const effectiveDiscountLabel =
        discountMode === "promo" && selectedPromo
            ? `Promo: ${selectedPromo.nama_promo} (${selectedPromo.kode_promo})`
            : discountMode === "manual" && effectiveDiskon > 0
            ? (form.keterangan_diskon.trim() || "Penyesuaian Harga / Apresiasi")
            : "";

    const manualExceedsJasa = discountMode === "manual" && totalSparepart > 0 && effectiveDiskon > biayaJasaNum;

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/invoice")}
                    className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Buat Invoice</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Buat tagihan pembayaran untuk perbaikan selesai</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 md:p-8 space-y-6">
                {/* Tiket Servis Picker */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-slate-400" />
                        Tiket Servis Selesai <span className="text-red-500">*</span>
                    </label>
                    <CustomSelect
                        value={form.tiket_id}
                        onChange={(e) => setForm({ ...form, tiket_id: e.target.value })}
                        label="Pilih Tiket Servis Selesai"
                        placeholder="-- Cari / Pilih Tiket Servis --"
                        searchable
                        required
                    >
                        <option value="">Pilih Tiket</option>
                        {tikets.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.nomor_tiket} - {t.perangkat?.customer?.nama} ({t.perangkat?.merek} {t.perangkat?.model})
                            </option>
                        ))}
                    </CustomSelect>
                    {tikets.length === 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm">
                            <Info className="w-4 h-4" />
                            <p>Tidak ada tiket yang siap untuk dibuatkan invoice (status Selesai/Diambil).</p>
                        </div>
                    )}

                    {selectedTiketData && (
                        <div className="mt-4 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <h3 className="font-bold text-slate-800">Detail Perbaikan & Suku Cadang</h3>
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-2xs font-bold">
                                    {selectedTiketData.perangkat?.jenis_perangkat || "Perangkat"} · {selectedTiketData.sla_paket || "Reguler"}
                                </span>
                            </div>
                            <p className="text-slate-600 mb-1"><span className="font-medium text-slate-700">Diagnosis/Solusi:</span> {selectedTiketData.diagnosis?.masalah || "-"} / {selectedTiketData.diagnosis?.solusi || "-"}</p>
                            <p className="text-slate-600 mb-3"><span className="font-medium text-slate-700">Estimasi Awal:</span> {formatRupiah(selectedTiketData.diagnosis?.estimasi_biaya || 0)}</p>

                            {selectedTiketData.penggunaan_sparepart?.length > 0 ? (
                                <div className="space-y-2 mt-4 pt-3 border-t border-slate-200">
                                    <p className="font-semibold text-slate-700 mb-2">Suku Cadang Digunakan:</p>
                                    {selectedTiketData.penggunaan_sparepart.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-slate-600">
                                            <span>{p.sparepart.nama} (x{p.jumlah})</span>
                                            <span className="font-mono">{formatRupiah(p.sparepart.harga * p.jumlah)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center font-bold text-slate-800 pt-3 border-t border-slate-200 mt-2">
                                        <span>Total Suku Cadang</span>
                                        <span className="font-mono">{formatRupiah(totalSparepart)}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-amber-600 italic mt-2 border-t border-slate-200 pt-2">Tidak ada suku cadang yang digunakan.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Biaya Jasa, DP & Metode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            Biaya Jasa (Rp) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={form.biaya_jasa}
                            onChange={(e) => setForm({ ...form, biaya_jasa: e.target.value })}
                            className="w-full min-h-[42px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="Contoh: 150000"
                            min="0"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1.5">Harga standar jasa sebelum potongan.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            Uang Muka / DP (Rp)
                        </label>
                        <input
                            type="number"
                            value={form.nominal_dp}
                            onChange={(e) => setForm({ ...form, nominal_dp: e.target.value })}
                            className="w-full min-h-[42px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="0"
                            min="0"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">Kosongkan jika langsung pelunasan.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-slate-400" />
                            Metode Pembayaran <span className="text-red-500">*</span>
                        </label>
                        <CustomSelect
                            value={form.metode_pembayaran}
                            onChange={(e) => setForm({ ...form, metode_pembayaran: e.target.value })}
                            label="Pilih Metode Pembayaran"
                            required
                        >
                            <option value="Tunai">Tunai / Cash</option>
                            <option value="Transfer Bank">Transfer Bank (BCA / Mandiri)</option>
                            <option value="QRIS">QRIS Dinamis</option>
                            <option value="Kartu Debit">Kartu Debit</option>
                        </CustomSelect>
                    </div>
                </div>

                {/* Potongan / Promo Section (Dedicated Deduction Block) */}
                <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-2 !mb-0">
                            <Tag className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Potongan Harga / Program Promo</span>
                        </label>
                        <div className="w-full sm:w-auto grid grid-cols-3 gap-1 p-1 bg-white rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => handleModeChange("none")}
                                className={`min-h-[38px] px-2 sm:px-3 py-1.5 rounded-lg text-2xs sm:text-xs font-semibold transition-all cursor-pointer flex items-center justify-center text-center leading-tight min-w-0 ${
                                    discountMode === "none" ? "bg-slate-800 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <span className="truncate">Tanpa Diskon</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeChange("promo")}
                                className={`min-h-[38px] px-2 sm:px-3 py-1.5 rounded-lg text-2xs sm:text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 text-center leading-tight min-w-0 ${
                                    discountMode === "promo" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
                                <span className="truncate">Promo Toko</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeChange("manual")}
                                className={`min-h-[38px] px-2 sm:px-3 py-1.5 rounded-lg text-2xs sm:text-xs font-semibold transition-all cursor-pointer flex items-center justify-center text-center leading-tight min-w-0 ${
                                    discountMode === "manual" ? "bg-amber-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <span className="truncate">Manual</span>
                            </button>
                        </div>
                    </div>

                    {discountMode === "promo" && (
                        <div className="space-y-3 pt-1 min-w-0">
                            {!isOnline ? (
                                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2 leading-relaxed">
                                    <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Mode Offline:</strong> Validasi dan penguncian kuota promo toko memerlukan koneksi internet. Silakan beralih ke mode <strong>Manual</strong> bila transaksi perlu diselesaikan saat offline.
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        <div className="min-w-0">
                                            <label className="form-label">Pilih Promo Aktif Workshop</label>
                                            <CustomSelect
                                                value={selectedPromoId}
                                                onChange={(e) => setSelectedPromoId(e.target.value)}
                                                label="Pilih Promo Aktif"
                                                placeholder={loadingPromos ? "Memuat promo aktif..." : "-- Pilih Promo Toko --"}
                                                searchable
                                            >
                                                <option value="">-- Pilih Promo Toko --</option>
                                                {activePromos.map((p) => {
                                                    const valStr = p.tipe_diskon === "persen" ? `${p.nilai_diskon}%` : formatRupiah(p.nilai_diskon);
                                                    const statusTag = p.eligibility
                                                        ? (p.eligibility.eligible ? `✓ -${formatRupiah(p.eligibility.discount)}` : "✗ Belum memenuhi syarat")
                                                        : "";
                                                    return (
                                                        <option key={p.id} value={p.id}>
                                                            {p.kode_promo} · {p.nama_promo} ({valStr} {SCOPE_LABELS[p.cakupan_diskon] || ""}) {statusTag}
                                                        </option>
                                                    );
                                                })}
                                            </CustomSelect>
                                        </div>

                                        <div className="min-w-0">
                                            <label className="form-label">Atau Input Kode Promo Langsung</label>
                                            <div className="flex flex-col xs:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    value={manualPromoCode}
                                                    onChange={(e) => setManualPromoCode(e.target.value.toUpperCase())}
                                                    placeholder="Contoh: LEBARAN2026"
                                                    className="flex-1 min-w-0 min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono uppercase focus:border-blue-500 outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={validatingCode}
                                                    onClick={handleApplyPromoCode}
                                                    className="btn-secondary min-h-[40px] px-4 text-xs sm:text-sm justify-center shrink-0"
                                                >
                                                    {validatingCode ? "Cek..." : "Cek Kode"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedPromo && promoValidation && (
                                        promoValidation.eligible ? (
                                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
                                                <div className="flex items-start gap-2 min-w-0">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                    <div className="min-w-0">
                                                        <p className="font-bold break-words">
                                                            Promo {selectedPromo.kode_promo} ({selectedPromo.nama_promo}) diterapkan
                                                        </p>
                                                        <p className="text-emerald-700 mt-0.5">
                                                            Cakupan: {SCOPE_LABELS[selectedPromo.cakupan_diskon]} ·{" "}
                                                            {selectedPromo.sisa_kuota !== null ? `Sisa kuota: ${selectedPromo.sisa_kuota}` : "Kuota tanpa batas"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-mono font-bold text-sm text-emerald-700 shrink-0">
                                                    - {formatRupiah(promoValidation.discount)}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="font-bold">Promo belum memenuhi syarat untuk tiket ini</p>
                                                    <p className="mt-0.5 break-words">{promoValidation.reason}</p>
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {!loadingPromos && activePromos.length === 0 && (
                                        <p className="form-helper italic !mt-0">
                                            Saat ini belum ada promo toko yang aktif. Kelola promo di menu Marketing &amp; Promosi.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {discountMode === "manual" && (
                        <div className="space-y-3 pt-1 min-w-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="min-w-0">
                                    <label className="form-label">Nominal Potongan Manual (Rp)</label>
                                    <input
                                        type="number"
                                        value={form.diskon}
                                        onChange={(e) => setForm({ ...form, diskon: e.target.value })}
                                        className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        placeholder="0"
                                        min="0"
                                    />
                                    <p className="form-helper">Dicatat terpisah di baris potongan tanpa mengubah harga katalog.</p>
                                </div>
                                <div className="min-w-0">
                                    <label className="form-label">Keterangan Potongan / Apresiasi</label>
                                    <input
                                        type="text"
                                        maxLength={255}
                                        value={form.keterangan_diskon}
                                        onChange={(e) => setForm({ ...form, keterangan_diskon: e.target.value })}
                                        className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        placeholder="Contoh: Apresiasi Pelanggan Setia / Pembulatan"
                                    />
                                    <p className="form-helper">Tampil rapi sebagai keterangan potongan pada faktur resmi.</p>
                                </div>
                            </div>

                            {manualExceedsJasa && (
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Informasi Margin:</strong> Potongan manual ({formatRupiah(effectiveDiskon)}) lebih besar daripada biaya jasa ({formatRupiah(biayaJasaNum)}), sehingga memotong sebagian estimasi nilai suku cadang.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Catatan Transaksi / Keterangan Tambahan
                    </label>
                    <textarea
                        value={form.catatan}
                        onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-sm"
                        placeholder="Contoh: Garansi berlaku 30 hari untuk servis motherboard..."
                    />
                </div>

                {selectedTiketData && (() => {
                    const dpNum = Math.max(0, Number(form.nominal_dp || 0));
                    const totalTagihan = Math.max(0, subtotal - effectiveDiskon);
                    const sisaTagihan = Math.max(0, totalTagihan - dpNum);
                    const statusOtomatis = sisaTagihan <= 0 ? "lunas" : dpNum > 0 ? "dp_awal" : "belum_lunas";

                    return (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 mt-6">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between gap-2 flex-wrap">
                                <span>Ringkasan Keuangan Invoice</span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                    statusOtomatis === "lunas"
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : statusOtomatis === "dp_awal"
                                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                                        : "bg-rose-100 text-rose-800 border border-rose-200"
                                }`}>
                                    {statusOtomatis === "lunas" ? (
                                        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Status: Lunas</>
                                    ) : statusOtomatis === "dp_awal" ? (
                                        <><Clock className="w-3.5 h-3.5 text-amber-600" /> Status: DP Awal</>
                                    ) : (
                                        <><AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Status: Belum Lunas</>
                                    )}
                                </span>
                            </h4>

                            <div className="space-y-1.5 text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-200">
                                <div className="flex justify-between">
                                    <span>Biaya Jasa Servis</span>
                                    <span className="font-mono text-slate-900">{formatRupiah(biayaJasaNum)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Biaya Suku Cadang</span>
                                    <span className="font-mono text-slate-900">{formatRupiah(totalSparepart)}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-slate-700 pt-1 border-t border-slate-200/60">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{formatRupiah(subtotal)}</span>
                                </div>
                                {effectiveDiskon > 0 && (
                                    <div className="flex justify-between text-rose-600 font-medium gap-2">
                                        <span className="truncate">
                                            Potongan / Apresiasi{effectiveDiscountLabel ? ` (${effectiveDiscountLabel})` : ""}
                                        </span>
                                        <span className="font-mono shrink-0">- {formatRupiah(effectiveDiskon)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-slate-900 text-sm sm:text-base pt-1 border-t border-slate-200">
                                    <span>Total Tagihan Bersih</span>
                                    <span className="font-mono text-blue-700">{formatRupiah(totalTagihan)}</span>
                                </div>
                                {dpNum > 0 && (
                                    <div className="flex justify-between text-amber-700 font-medium">
                                        <span>Uang Muka / DP Masuk</span>
                                        <span className="font-mono">- {formatRupiah(dpNum)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-extrabold text-sm sm:text-base pt-1.5 border-t-2 border-slate-300">
                                    <span className={sisaTagihan > 0 ? "text-rose-700" : "text-emerald-700"}>
                                        {sisaTagihan > 0 ? "Sisa Tagihan Pelunasan" : "Kembalian / Lunas"}
                                    </span>
                                    <span className={`font-mono ${sisaTagihan > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                                        {formatRupiah(sisaTagihan)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate("/invoice")}
                        className="btn-secondary h-9 px-4 text-xs"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading || tikets.length === 0 || (discountMode === "promo" && (!selectedPromoId || (promoValidation && !promoValidation.eligible)))}
                        className="btn-primary h-9 px-4 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white"></div>
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        <span>{loading ? "Menerbitkan..." : "Terbitkan Invoice"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
