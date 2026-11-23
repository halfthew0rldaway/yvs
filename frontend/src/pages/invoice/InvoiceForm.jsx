import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Save, FileCheck, DollarSign, Info, Percent, CreditCard, Tag, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import CustomSelect from "../../components/common/CustomSelect";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

export default function InvoiceForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryTiketId = searchParams.get("tiket_id") || "";
    const [form, setForm] = useState({ 
        tiket_id: queryTiketId, 
        biaya_jasa: "",
        diskon: 0,
        nominal_dp: 0,
        metode_pembayaran: "Tunai",
        catatan: ""
    });
    const [tikets, setTikets] = useState([]);
    const [selectedTiketData, setSelectedTiketData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (form.tiket_id) {
            api.get(`/tiket-servis/${form.tiket_id}`)
                .then(res => setSelectedTiketData(res.data))
                .catch(err => toast.error("Gagal mengambil detail tiket"));
        } else {
            setSelectedTiketData(null);
        }
    }, [form.tiket_id]);

    useEffect(() => {
        api
            .get("/tiket-servis")
            .then((res) => {
                // Filter tiket yang sudah selesai/diambil dan belum memiliki invoice
                const readyTikets = res.data.filter((t) => ["selesai", "diambil"].includes(t.status) && !t.invoice);
                // Jika ada tiket_id dari query param tapi sudah punya invoice, tampilkan info
                setTikets(readyTikets);
                if (queryTiketId && !readyTikets.some(t => String(t.id) === String(queryTiketId))) {
                    // Check if selected tiket already has invoice
                    const currentTiket = res.data.find(t => String(t.id) === String(queryTiketId));
                    if (currentTiket?.invoice) {
                        toast("Tiket ini sudah memiliki invoice resmi.");
                    }
                }
            })
            .catch(() => toast.error("Gagal memuat data"))
            .finally(() => setFetching(false));
    }, [queryTiketId]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/invoice", form);
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

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
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
                        <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                            <h3 className="font-bold text-slate-800 mb-2">Detail Perbaikan & Suku Cadang</h3>
                            <p className="text-slate-600 mb-1"><span className="font-medium text-slate-700">Diagnosis/Solusi:</span> {selectedTiketData.diagnosis?.masalah || "-"} / {selectedTiketData.diagnosis?.solusi || "-"}</p>
                            <p className="text-slate-600 mb-3"><span className="font-medium text-slate-700">Estimasi Awal:</span> Rp {selectedTiketData.diagnosis?.estimasi_biaya || 0}</p>
                            
                            {selectedTiketData.penggunaan_sparepart?.length > 0 ? (
                                <div className="space-y-2 mt-4 pt-3 border-t border-slate-200">
                                    <p className="font-semibold text-slate-700 mb-2">Suku Cadang Digunakan:</p>
                                    {selectedTiketData.penggunaan_sparepart.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-slate-600">
                                            <span>{p.sparepart.nama} (x{p.jumlah})</span>
                                            <span>Rp {p.sparepart.harga * p.jumlah}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center font-bold text-slate-800 pt-3 border-t border-slate-200 mt-2">
                                        <span>Total Suku Cadang</span>
                                        <span>Rp {totalSparepart}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-amber-600 italic mt-2 border-t border-slate-200 pt-2">Tidak ada suku cadang yang digunakan.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Financial Fields: Biaya Jasa, Diskon, DP, Metode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            Biaya Jasa (Rp) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={form.biaya_jasa}
                            onChange={(e) => setForm({ ...form, biaya_jasa: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="Contoh: 150000"
                            min="0"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                            Biaya sparepart terhitung otomatis dari suku cadang.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-slate-400" />
                            Potongan Harga / Diskon (Rp)
                        </label>
                        <input
                            type="number"
                            value={form.diskon}
                            onChange={(e) => setForm({ ...form, diskon: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="0"
                            min="0"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">
                            Diskon khusus pelanggan atau voucher promo.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            Uang Muka / DP Telah Dibayar (Rp)
                        </label>
                        <input
                            type="number"
                            value={form.nominal_dp}
                            onChange={(e) => setForm({ ...form, nominal_dp: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="0"
                            min="0"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">
                            Uang muka saat intake (kosongkan jika langsung lunas).
                        </p>
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
                    const biayaJasaNum = Number(form.biaya_jasa || 0);
                    const diskonNum = Number(form.diskon || 0);
                    const dpNum = Number(form.nominal_dp || 0);
                    const subtotal = biayaJasaNum + totalSparepart;
                    const totalTagihan = Math.max(0, subtotal - diskonNum);
                    const sisaTagihan = Math.max(0, totalTagihan - dpNum);
                    const statusOtomatis = sisaTagihan <= 0 ? "lunas" : dpNum > 0 ? "dp_awal" : "belum_lunas";

                    return (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 mt-6">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
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
                                {diskonNum > 0 && (
                                    <div className="flex justify-between text-rose-600 font-medium">
                                        <span>Potongan Diskon</span>
                                        <span className="font-mono">- {formatRupiah(diskonNum)}</span>
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
                        disabled={loading || tikets.length === 0}
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
