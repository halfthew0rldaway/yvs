import React, { useState } from "react";
import { 
    X, 
    ShieldCheck, 
    ShieldAlert, 
    AlertTriangle, 
    Clock, 
    Cpu, 
    User, 
    CheckCircle2, 
    ArrowRight, 
    FileText,
    Wrench
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function KlaimGaransiModal({
    isOpen = false,
    onClose,
    tiket,
    onSuccess
}) {
    const navigate = useNavigate();
    const [kategoriKlaim, setKategoriKlaim] = useState("Kerusakan Berulang");
    const [alasanKlaim, setAlasanKlaim] = useState("");
    const [kelengkapan, setKelengkapan] = useState(() => tiket?.kelengkapan || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(e) {
            if (e.key === "Escape" && !isSubmitting) onClose?.();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen || !tiket) return null;

    const warrantyInfo = tiket.warranty_status || {};
    const isExpired = warrantyInfo.isExpired;
    const sisaHari = warrantyInfo.sisaHari;

    const KATEGORI_OPTIONS = [
        {
            id: "Kerusakan Berulang",
            title: "Kerusakan Berulang",
            desc: "Gejala atau kendala yang sama persis muncul kembali setelah pengerjaan."
        },
        {
            id: "Sparepart Malfungsi",
            title: "Sparepart Cacat / Malfungsi",
            desc: "Komponen atau modul pengganti bermasalah/cacat produksi."
        },
        {
            id: "Kendala Terkait",
            title: "Kendala Terkait Pengerjaan",
            desc: "Fungsi lain bermasalah setelah perbaikan selesai (efek samping assembly/solder)."
        },
        {
            id: "Kebijakan Toko",
            title: "Kebijakan Toko / Goodwill",
            desc: "Garansi telah lewat atau penanganan khusus atas persetujuan pimpinan."
        }
    ];

    async function handleSubmit(e) {
        e.preventDefault();
        if (!alasanKlaim.trim()) {
            toast.error("Mohon jelaskan kendala atau gejala kerusakan yang terjadi.");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await api.post(`/tiket-servis/${tiket.id}/claim-garansi`, {
                kategori_klaim: kategoriKlaim,
                alasan_klaim: alasanKlaim.trim(),
                keluhan_detail: alasanKlaim.trim(),
                kelengkapan: kelengkapan.trim()
            });

            toast.success("Tiket Klaim Garansi berhasil diterbitkan!");
            if (onSuccess) {
                onSuccess(res.data.data);
            }
            onClose();

            // Opsional langsung arahkan ke tiket klaim yang baru dibuat
            if (res.data?.data?.id) {
                navigate(`/tiket-servis/${res.data.data.id}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menerbitkan klaim garansi");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="modal-shell bg-slate-900/60 backdrop-blur-xs">
            {/* 60fps Hardware-Accelerated Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs modal-backdrop"
                onClick={() => !isSubmitting && onClose?.()}
            />

            {/* 60fps Spring Modal Surface */}
            <div className="modal-panel max-w-xl z-10">
                <div className="modal-grabber" />
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 px-3.5 sm:px-6 py-4 sm:py-6 text-white relative">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-2.5 top-2.5 sm:right-5 sm:top-5 p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 pr-7 sm:pr-0 min-w-0">
                        <div className="p-2 sm:p-3 bg-white/10 rounded-xl sm:rounded-2xl backdrop-blur-xs border border-white/20 shrink-0">
                            <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-3xs xs:text-2xs font-bold uppercase tracking-wider text-blue-200">
                                Alur Re-work & Retur Servis
                            </span>
                            <h2 className="text-sm xs:text-base sm:text-xl font-bold text-white tracking-tight break-words">
                                Form Klaim Garansi Servis
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="modal-body-tight space-y-3 sm:space-y-4 md:space-y-5 text-2xs sm:text-xs md:text-sm">
                    {/* Ringkasan Tiket Asal */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg sm:rounded-2xl p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2 sm:pb-3">
                            <span className="text-3xs xs:text-2xs sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Rujukan Tiket Selesai
                            </span>
                            <span className="font-mono text-3xs xs:text-2xs sm:text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg whitespace-nowrap">
                                #{tiket.nomor_tiket}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-3xs xs:text-2xs sm:text-xs">
                            <div className="flex items-start gap-1.5 sm:gap-2 min-w-0">
                                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-slate-400 font-medium">Pelanggan</p>
                                    <p className="font-bold text-slate-800 break-words">{tiket.perangkat?.customer?.nama || "-"}</p>
                                    <p className="text-slate-500 break-words">{tiket.perangkat?.customer?.nomor_telepon}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-1.5 sm:gap-2 min-w-0">
                                <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-slate-400 font-medium">Unit Perangkat</p>
                                    <p className="font-bold text-slate-800 break-words">{tiket.perangkat?.merek} {tiket.perangkat?.model}</p>
                                    <p className="text-slate-500 font-mono text-3xs xs:text-2xs break-all">SN: {tiket.perangkat?.serial_number || "-"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Garansi Badge */}
                        <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3 ${
                            isExpired 
                                ? "bg-amber-50 border-amber-200 text-amber-900" 
                                : "bg-emerald-50 border-emerald-200 text-emerald-900"
                        }`}>
                            <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 min-w-0">
                                {isExpired ? (
                                    <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                                ) : (
                                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="text-3xs xs:text-2xs sm:text-xs font-bold break-words">
                                        {isExpired ? "Masa Garansi Resmi Berakhir" : "Unit Dalam Masa Garansi Resmi"}
                                    </p>
                                    <p className="text-3xs xs:text-2xs opacity-80 break-words">
                                        {isExpired 
                                            ? "Tiket ini akan diproses sebagai diskresi kebijakan toko / SPK khusus."
                                            : `Sisa masa garansi: ${sisaHari ?? 0} hari kerja.`}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-3xs xs:text-2xs font-bold px-2 py-0.5 rounded-full uppercase shrink-0 self-start xs:self-auto ${
                                isExpired ? "bg-amber-200 text-amber-900" : "bg-emerald-200 text-emerald-900"
                            }`}>
                                {isExpired ? "Lewat Masa" : "Aktif"}
                            </span>
                        </div>
                    </div>

                    {/* Kategori Klaim */}
                    <div>
                        <label className="block text-3xs xs:text-2xs sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 sm:mb-2">
                            Kategori Retur / Klaim Garansi <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                            {KATEGORI_OPTIONS.map((opt) => {
                                const isSelected = kategoriKlaim === opt.id;
                                return (
                                    <button
                                        type="button"
                                        key={opt.id}
                                        onClick={() => setKategoriKlaim(opt.id)}
                                        className={`text-left p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all cursor-pointer min-w-0 ${
                                            isSelected 
                                                ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 text-slate-900 shadow-2xs" 
                                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-1.5 mb-1">
                                            <span className="font-bold text-3xs xs:text-2xs sm:text-xs break-words">{opt.title}</span>
                                            {isSelected && (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-3xs xs:text-2xs text-slate-500 leading-snug break-words">{opt.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rincian Gejala / Kendala Retur */}
                    <div>
                        <label className="block text-3xs xs:text-2xs sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Deskripsi Kendala & Keluhan Pelanggan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={alasanKlaim}
                            onChange={(e) => setAlasanKlaim(e.target.value)}
                            placeholder="Contoh: Unit mati mendadak setelah 3 hari pemakaian, indikator adaptor hanya kedip kuning..."
                            className="w-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all text-3xs xs:text-2xs sm:text-xs text-slate-800 placeholder:text-slate-400"
                        />
                    </div>

                    {/* Kelengkapan Fisik saat intake retur */}
                    <div>
                        <label className="block text-3xs xs:text-2xs sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Kelengkapan Fisik Unit yang Diterima
                        </label>
                        <input
                            type="text"
                            value={kelengkapan}
                            onChange={(e) => setKelengkapan(e.target.value)}
                            placeholder="Contoh: Unit laptop, charger original, tanpa tas"
                            className="w-full px-2.5 sm:px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all text-3xs xs:text-2xs sm:text-xs text-slate-800"
                        />
                        <p className="text-3xs xs:text-2xs text-slate-400 mt-1 break-words">
                            Disalin otomatis dari tiket sebelumnya. Sesuaikan bila pelanggan membawa kelengkapan berbeda.
                        </p>
                    </div>

                    {/* SOP Priority Alert */}
                    <div className="p-2.5 sm:p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg sm:rounded-xl text-3xs xs:text-2xs sm:text-xs text-blue-900 flex items-start gap-2 sm:gap-2.5">
                        <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 min-w-0">
                            <span className="font-bold">Prioritas SLA Re-work (Express):</span>
                            <p className="text-3xs xs:text-2xs text-blue-800 leading-relaxed break-words">
                                Tiket klaim garansi otomatis diprioritaskan ke teknisi awal dengan paket pengerjaan Express untuk menjaga kepuasan dan kepercayaan pelanggan.
                            </p>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-3 pt-2.5 sm:pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-3 sm:px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg sm:rounded-xl text-3xs xs:text-2xs sm:text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-3xs xs:text-2xs sm:text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <span>Menerbitkan...</span>
                            ) : (
                                <>
                                    <span className="break-words">Terbitkan Tiket Klaim Garansi</span>
                                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
