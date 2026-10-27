import { useState, useEffect } from "react";
import { User, PenTool, Check, Trash2, Plus, X, ShieldCheck, Sparkles } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import DigitalSignaturePadModal from "./DigitalSignaturePadModal";

// Default standard workshop signature dataUrl (Clean cursive signature)
export const DEFAULT_WORKSHOP_SIGNATURE = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 70" width="180" height="70">
  <path d="M 20,45 Q 45,15 65,35 T 95,30 Q 115,10 130,42 Q 145,55 165,25 Q 175,15 155,42 Q 125,60 95,52 Q 65,46 160,48" 
        fill="none" stroke="#1d4ed8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`);

export default function AdminSignatureSelectorModal({
    isOpen,
    onClose,
    onSelect,
    currentSignature = null,
    currentSignerName = "",
    invoiceId = null
}) {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
    const [savingSignature, setSavingSignature] = useState(false);

    // Load saved staff signatures from backend & localStorage
    const loadSignatures = async () => {
        setLoading(true);
        try {
            // First check local storage for instant responsiveness
            let localData = [];
            try {
                const stored = localStorage.getItem("yvs_saved_staff_signatures");
                if (stored) localData = JSON.parse(stored);
            } catch {}

            const res = await api.get("/staff-signatures");
            if (res.data?.data && res.data.data.length > 0) {
                setStaffList(res.data.data);
                localStorage.setItem("yvs_saved_staff_signatures", JSON.stringify(res.data.data));
            } else if (localData.length > 0) {
                setStaffList(localData);
            } else {
                // If totally empty, initialize with default Yangversa profile
                const defaultProfile = {
                    id: "default-1",
                    nama: "Admin Kasir Yangversa",
                    role: "Admin Kasir",
                    signature: DEFAULT_WORKSHOP_SIGNATURE,
                    is_system_default: true
                };
                setStaffList([defaultProfile]);
            }
        } catch {
            // Fallback to localStorage if offline/network error
            try {
                const stored = localStorage.getItem("yvs_saved_staff_signatures");
                if (stored) {
                    setStaffList(JSON.parse(stored));
                } else {
                    setStaffList([{
                        id: "default-1",
                        nama: "Admin Kasir Yangversa",
                        role: "Admin Kasir",
                        signature: DEFAULT_WORKSHOP_SIGNATURE,
                        is_system_default: true
                    }]);
                }
            } catch {}
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadSignatures();
        }
    }, [isOpen]);

    const handleSelectProfile = (item) => {
        onSelect({
            signature: item.signature,
            signerName: item.nama
        });
        toast.success(`Tanda tangan ${item.nama} dipilih!`);
        onClose();
    };

    const handleDeleteProfile = async (e, id) => {
        e.stopPropagation();
        if (!confirm("Hapus profil tanda tangan ini dari daftar?")) return;

        try {
            if (typeof id === "number") {
                await api.delete(`/staff-signatures/${id}`);
            }
            const updated = staffList.filter(s => s.id !== id);
            setStaffList(updated);
            localStorage.setItem("yvs_saved_staff_signatures", JSON.stringify(updated));
            toast.success("Profil tanda tangan dihapus");
        } catch (err) {
            // Local deletion fallback
            const updated = staffList.filter(s => s.id !== id);
            setStaffList(updated);
            localStorage.setItem("yvs_saved_staff_signatures", JSON.stringify(updated));
            toast.success("Profil tanda tangan dihapus");
        }
    };

    const handleSaveNewCanvasSignature = async ({ signature, signerName, saveProfile }) => {
        setSavingSignature(true);
        try {
            const finalName = signerName.trim() || "Admin Yangversa";

            if (saveProfile) {
                try {
                    const res = await api.post("/staff-signatures", {
                        nama: finalName,
                        role: "Admin Kasir",
                        signature
                    });
                    const newObj = res.data?.data || {
                        id: Date.now(),
                        nama: finalName,
                        role: "Admin Kasir",
                        signature
                    };
                    const updated = [newObj, ...staffList];
                    setStaffList(updated);
                    localStorage.setItem("yvs_saved_staff_signatures", JSON.stringify(updated));
                } catch {
                    const newObj = {
                        id: Date.now(),
                        nama: finalName,
                        role: "Admin Kasir",
                        signature
                    };
                    const updated = [newObj, ...staffList];
                    setStaffList(updated);
                    localStorage.setItem("yvs_saved_staff_signatures", JSON.stringify(updated));
                }
            }

            onSelect({
                signature,
                signerName: finalName
            });

            toast.success(`Tanda tangan ${finalName} berhasil diterapkan!`);
            setIsCanvasModalOpen(false);
            onClose();
        } catch (err) {
            toast.error("Gagal menerapkan tanda tangan");
        } finally {
            setSavingSignature(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl sm:max-w-2xl w-full flex flex-col overflow-hidden my-auto animate-in zoom-in-95">
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                                <PenTool className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                                    Pilih Tanda Tangan Petugas / Admin Toko
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pilih dari profil admin tersimpan atau bubuhkan tanda tangan baru
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Daftar Admin / Staf Kasir ({staffList.length})
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsCanvasModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Tanda Tangan Manual / Baru</span>
                            </button>
                        </div>

                        {/* List of Saved Staff Profiles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {staffList.map((item) => {
                                const isCurrent = (currentSignature && currentSignature === item.signature) || 
                                                  (!currentSignature && item.is_system_default);

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelectProfile(item)}
                                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative group flex flex-col justify-between gap-3 ${
                                            isCurrent
                                                ? "bg-blue-50/70 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20"
                                                : "bg-slate-50/70 hover:bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">
                                                        {item.nama}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 truncate">
                                                        {item.role || "Admin Kasir"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Delete Button (except system default) */}
                                            {!item.is_system_default && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteProfile(e, item.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Hapus profil ini"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Signature Stroke Preview */}
                                        <div className="h-16 w-full bg-white rounded-xl border border-slate-200/80 flex items-center justify-center p-2 overflow-hidden shadow-2xs">
                                            <img
                                                src={item.signature}
                                                alt={`TTD ${item.nama}`}
                                                className="max-h-full max-w-full object-contain filter"
                                            />
                                        </div>

                                        {/* Selection Indicator */}
                                        <div className="flex items-center justify-between text-[11px] pt-1">
                                            <span className="text-slate-400 text-[10px]">
                                                {item.is_system_default ? "Default Sistem" : "Tersimpan"}
                                            </span>
                                            {isCurrent ? (
                                                <span className="font-bold text-blue-700 flex items-center gap-1">
                                                    <Check className="w-3.5 h-3.5" /> Aktif
                                                </span>
                                            ) : (
                                                <span className="font-semibold text-slate-500 group-hover:text-blue-600">
                                                    Klik untuk Pilih &rarr;
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                            Tanda tangan yang dipilih akan otomatis tercetak di lembar Invoice & Garansi.
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Canvas Tanda Tangan Baru / Manual */}
            <DigitalSignaturePadModal
                isOpen={isCanvasModalOpen}
                onClose={() => setIsCanvasModalOpen(false)}
                onSave={handleSaveNewCanvasSignature}
                title="Tanda Tangan Manual Staf / Admin"
                description="Bubuhkan tanda tangan admin di area kanvas berikut. Anda dapat menyimpannya ke profil agar mudah digunakan lagi di masa mendatang."
                agreementText="Dengan ini saya menyatakan sebagai petugas berwenang dari Yangversa Computer yang memproses dan menyerahkan unit servis ini."
                showSaveProfile={true}
                defaultSaveProfile={true}
                loading={savingSignature}
            />
        </>
    );
}

