import React, { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { 
    Calendar, Clock, ShieldCheck, CheckCircle2, AlertTriangle, 
    Send, Copy, Check, MessageCircle, X, Search, Filter, 
    User, Laptop, Wrench, HeartHandshake, ShieldAlert,
    ExternalLink, ArrowRight, RefreshCw, Smartphone
} from "lucide-react";
import { PERSONALITY_TYPES } from "../constants/personalityTypes";

function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

export default function MaintenanceRecallModal({ isOpen, onClose, initialSelectedId = null }) {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [filterUrgency, setFilterUrgency] = useState("all"); // "all" | "urgent_1y" | "routine_6m" | "unreminded" | "reminded"
    const [searchQuery, setSearchQuery] = useState("");
    const [copied, setCopied] = useState(false);
    const [submittingNote, setSubmittingNote] = useState(false);

    // Message Customization options
    const [personalityTone, setPersonalityTone] = useState("Netral");
    const [includePromo, setIncludePromo] = useState(true);
    const [customNote, setCustomNote] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        fetchDueList();
    }, [isOpen]);

    async function fetchDueList() {
        setLoading(true);
        try {
            const res = await api.get("/tiket-servis/maintenance/due");
            const dataItems = res.data?.items || [];
            setItems(dataItems);

            if (dataItems.length > 0) {
                if (initialSelectedId) {
                    const match = dataItems.find(i => i.id === Number(initialSelectedId));
                    if (match) {
                        selectItem(match);
                        return;
                    }
                }
                selectItem(dataItems[0]);
            } else {
                setSelectedItem(null);
            }
        } catch (err) {
            console.error("Gagal memuat jadwal servis berkala:", err);
            toast.error("Gagal memuat jadwal servis berkala");
        } finally {
            setLoading(false);
        }
    }

    function selectItem(item) {
        setSelectedItem(item);
        setPersonalityTone(item.customer_personality || "Netral");
        setCustomNote("");
        setCopied(false);
    }

    if (!isOpen) return null;

    // Filter items
    const filteredItems = items.filter(item => {
        const query = searchQuery.toLowerCase();
        const matchSearch = (
            item.customer_nama?.toLowerCase().includes(query) ||
            item.nomor_tiket?.toLowerCase().includes(query) ||
            item.merek?.toLowerCase().includes(query) ||
            item.model?.toLowerCase().includes(query) ||
            item.kategori_perbaikan?.toLowerCase().includes(query)
        );

        let matchUrgency = true;
        if (filterUrgency === "urgent_1y") matchUrgency = item.urgency === "urgent_1y";
        if (filterUrgency === "routine_6m") matchUrgency = item.urgency === "routine_6m";
        if (filterUrgency === "unreminded") matchUrgency = !item.is_follow_up_sent;
        if (filterUrgency === "reminded") matchUrgency = item.is_follow_up_sent;

        return matchSearch && matchUrgency;
    });

    const urgentCount = items.filter(i => i.urgency === "urgent_1y").length;
    const routineCount = items.filter(i => i.urgency === "routine_6m").length;
    const unremindedCount = items.filter(i => !i.is_follow_up_sent).length;

    // WhatsApp Message Generator (Zero Emojis, 6 Months - 1 Year Framework)
    function generateMessage() {
        if (!selectedItem) return "";

        const customerName = selectedItem.customer_nama || "Pelanggan";
        const deviceStr = `${selectedItem.merek || ""} ${selectedItem.model || ""}`.trim() || "perangkat komputer Anda";
        const months = selectedItem.diff_months || 6;
        const recommended = selectedItem.recommended_service;

        let greeting = "";
        let body = "";
        let closing = "";

        const timePhrase = months >= 12 
            ? `kurang lebih 1 tahun (${months} bulan)`
            : `${months} bulan`;

        switch (personalityTone) {
            case "Koleris":
                greeting = `Halo Kak ${customerName}, salam dari Serv.io / YVS Computer.`;
                body = `Mengingatkan secara singkat bahwa unit ${deviceStr} milik Anda telah selesai diservis sekitar ${timePhrase} lalu (${formatDate(selectedItem.tgl_diambil)}). Dalam siklus pemakaian 6 hingga 12 bulan, pasta termal mulai mengering dan debu ventilasi berpotensi menghambat pendinginan. Untuk mencegah penurunan performa dan kerusakan komponen yang lebih mahal, kami menyarankan perawatan berkala: ${recommended}.`;
                closing = `Unit dapat dibawa ke workshop kami hari ini atau besok untuk inspeksi singkat tanpa antre panjang. Terima kasih atas kerja samanya.`;
                break;

            case "Sanguinis":
                greeting = `Halo Kak ${customerName}, apa kabar? Semoga dalam keadaan sehat dan lancar selalu aktivitasnya bersama YVS Computer / Serv.io.`;
                body = `Sekadar menyapa dan menanyakan kabar unit ${deviceStr} Kakak yang diservis ${timePhrase} lalu, semoga sampai hari ini masih nyaman dan lancar dipakai ya kak. Mengingat sudah memasuki siklus 6 bulan hingga 1 tahun pemakaian, ada baiknya unit dijadwalkan perawatan rutin seperti ${recommended} agar suhu mesin tetap dingin dan selalu responsif.`;
                closing = `Bisa langsung mampir ke toko kami kapan saja ya Kak, tim kami siap bantu cek kondisinya. Terima kasih banyak Kak ${customerName}!`;
                break;

            case "Melankolis":
                greeting = `Selamat siang/sore Kak ${customerName}, salam dari tim teknis Serv.io / YVS Computer.`;
                body = `Berdasarkan rekam jejak servis pada tiket #${selectedItem.nomor_tiket}, unit ${deviceStr} telah beroperasi selama ${timePhrase} sejak tanggal pengambilan (${formatDate(selectedItem.tgl_diambil)}). Berdasarkan standar pemeliharaan teknis perangkat keras, interval 6 hingga 12 bulan merupakan siklus rekomendasi untuk melakukan ${recommended} guna menjamin kestabilan temperatur, putaran kipas, serta keandalan media penyimpanan data.`;
                closing = `Kami menyediakan layanan inspeksi parameter sistem dan uji termal menyeluruh di workshop. Silakan hubungi kami apabila memerlukan reservasi waktu kedatangan. Terima kasih.`;
                break;

            case "Plegmatis":
                greeting = `Halo Kak ${customerName}, selamat beraktivitas. Salam hangat dari tim YVS Computer / Serv.io.`;
                body = `Kami ingin menanyakan kabar unit ${deviceStr} yang kemarin diservis sekitar ${timePhrase} lalu, semoga masih berjalan dengan baik dan tidak ada kendala. Apabila Kakak sedang memiliki waktu luang, kami menyarankan pemeriksaan berkala santai seperti ${recommended} supaya unitnya tetap awet dan tidak cepat panas.`;
                closing = `Tidak perlu terburu-buru kak, bila nanti senggang silakan berkunjung ke bengkel kami. Semoga harinya menyenangkan.`;
                break;

            default: // Netral
                greeting = `Halo Kak ${customerName}, salam dari Serv.io / YVS Computer Service.`;
                body = `Kami menginformasikan bahwa unit ${deviceStr} telah selesai diservis sekitar ${timePhrase} lalu (${formatDate(selectedItem.tgl_diambil)}). Untuk menjaga performa tetap stabil dan mencegah overheat, siklus 6 bulan hingga 1 tahun dianjurkan untuk perawatan berkala: ${recommended}.`;
                closing = `Silakan bawa perangkat ke workshop kami untuk pemeriksaan rutin. Terima kasih atas kepercayaan Anda kepada YVS Computer.`;
                break;
        }

        let promoText = "";
        if (includePromo) {
            promoText = `\n\n*Program Perawatan Rutin Toko:*\n- Gratis pengecekan suhu & inspeksi fisik singkat\n- Potongan biaya jasa pembersihan debu / ganti pasta termal khusus pelanggan setia`;
        }

        let noteText = "";
        if (customNote.trim()) {
            noteText = `\n\n*Catatan Khusus:* ${customNote.trim()}`;
        }

        return `*PENGINGAT PERAWATAN BERKALA PERANGKAT*\n*YVS Computer / Serv.io*\n\n${greeting}\n\n${body}${promoText}${noteText}\n\n${closing}`;
    }

    async function handleMarkFollowUp(autoSendWa = false) {
        if (!selectedItem) return;
        setSubmittingNote(true);
        try {
            const noteContent = `Pengingat servis berkala (${selectedItem.diff_months} bln) via WhatsApp [Tone: ${personalityTone}]`;
            await api.post(`/tiket-servis/${selectedItem.id}/reminder-maintenance`, {
                catatan: noteContent
            });

            toast.success("Status pengingat berhasil dicatat!");

            setItems(prev => prev.map(it => {
                if (it.id === selectedItem.id) {
                    return {
                        ...it,
                        is_follow_up_sent: true,
                        last_follow_up_at: new Date().toISOString(),
                        last_follow_up_note: noteContent
                    };
                }
                return it;
            }));

            if (selectedItem) {
                setSelectedItem(prev => ({
                    ...prev,
                    is_follow_up_sent: true,
                    last_follow_up_at: new Date().toISOString(),
                    last_follow_up_note: noteContent
                }));
            }

            if (autoSendWa) {
                executeOpenWhatsApp();
            }
        } catch (err) {
            console.error("Gagal mencatat pengingat:", err);
            toast.error("Gagal mencatat status pengingat");
        } finally {
            setSubmittingNote(false);
        }
    }

    function executeOpenWhatsApp() {
        if (!selectedItem?.customer_phone) {
            toast.error("Nomor WhatsApp pelanggan tidak tersedia");
            return;
        }
        let phone = selectedItem.customer_phone.replace(/[^0-9]/g, "");
        if (phone.startsWith("0")) phone = "62" + phone.substring(1);

        const text = generateMessage();
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
    }

    function handleCopyMessage() {
        const text = generateMessage();
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Pesan pengingat disalin ke clipboard!");
        setTimeout(() => setCopied(false), 2500);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs modal-backdrop" 
                onClick={onClose}
            ></div>

            {/* Modal Dialog (60fps Spring Modal Surface) */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden z-10 border border-slate-200 modal-surface">
                
                {/* 1. Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-bold text-slate-900 leading-tight">
                                    CRM Pengingat Perawatan Berkala Pelanggan
                                </h2>
                                <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    Siklus 6 Bulan - 1 Tahun
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                                Tindak lanjut proaktif perangkat yang telah beroperasi 180 hingga 365+ hari untuk perawatan preventif
                            </p>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0 ml-3"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. Sub-Header Toolbar (Filter Tabs + Search Bar) */}
                <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setFilterUrgency("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                filterUrgency === "all" ? "bg-slate-800 text-white shadow-2xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                        >
                            Semua ({items.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterUrgency("urgent_1y")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                filterUrgency === "urgent_1y" 
                                    ? "bg-rose-600 text-white shadow-2xs" 
                                    : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            }`}
                        >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>&ge; 1 Tahun ({urgentCount})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterUrgency("routine_6m")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                filterUrgency === "routine_6m" 
                                    ? "bg-amber-600 text-white shadow-2xs" 
                                    : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span>6 - 11 Bulan ({routineCount})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterUrgency("unreminded")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                filterUrgency === "unreminded" 
                                    ? "bg-blue-600 text-white shadow-2xs" 
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                        >
                            Belum Diingatkan ({unremindedCount})
                        </button>
                    </div>

                    <div className="relative min-w-[200px] sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari pelanggan / unit..."
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                {/* 3. Main Split Body Layout (Clean 40% Left / 60% Right) */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-white">
                    
                    {/* Left Column: Device Queue List */}
                    <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto p-3.5 space-y-2 custom-scrollbar shrink-0 max-h-[280px] md:max-h-none bg-slate-50/40">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mb-2"></div>
                                <p className="text-xs font-medium">Memuat antrean servis berkala...</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-200">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-800">Tidak Ada Perangkat Jatuh Tempo</p>
                                <p className="text-[11px] text-slate-500 mt-1">Belum ada unit yang mencapai siklus pemakaian 6-12 bulan saat ini.</p>
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const isSelected = selectedItem?.id === item.id;
                                const isCritical = item.urgency === "urgent_1y";
                                const persConfig = PERSONALITY_TYPES[item.customer_personality] || PERSONALITY_TYPES["Netral"];

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => selectItem(item)}
                                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                                            isSelected
                                                ? "bg-white border-blue-600 shadow-sm ring-1 ring-blue-500/30"
                                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-xs font-bold text-slate-900 truncate">
                                                        {item.customer_nama}
                                                    </span>
                                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${persConfig.badge}`}>
                                                        {persConfig.label}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                                                    {item.merek} {item.model}
                                                </p>
                                            </div>

                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                                                isCritical 
                                                    ? "bg-rose-50 text-rose-700 border-rose-200" 
                                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                            }`}>
                                                {isCritical ? <ShieldAlert className="w-3 h-3 text-rose-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                                                <span>{item.diff_months} Bln Lalu</span>
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 mt-2">
                                            <span className="font-mono text-slate-600">#{item.nomor_tiket}</span>
                                            {item.is_follow_up_sent ? (
                                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                                    <span>Sudah Diingatkan</span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">Belum Diingatkan</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Right Column: Active Customer Details & WhatsApp Editor */}
                    <div className="w-full md:w-7/12 overflow-y-auto p-4 sm:p-5 custom-scrollbar flex flex-col justify-between space-y-4">
                        {selectedItem ? (
                            <div className="space-y-4">
                                
                                {/* A. Context Header Card */}
                                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                                                    {selectedItem.customer_nama}
                                                </h3>
                                                <span className="text-xs font-mono text-slate-500">
                                                    ({selectedItem.customer_phone || "No. WA Kosong"})
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                Unit: <strong className="text-slate-800">{selectedItem.merek} {selectedItem.model}</strong> ({selectedItem.jenis_perangkat || "Komputer"})
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Selesai Diservis:</span>
                                            <span className="text-xs font-bold text-slate-800">
                                                {formatDate(selectedItem.tgl_diambil)} ({selectedItem.diff_months} bulan / {selectedItem.diff_days} hari lalu)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Recommended Service Banner */}
                                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                                        <Wrench className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                                                Fokus Perawatan Berkala:
                                            </span>
                                            <p className="text-xs font-semibold text-blue-950 mt-0.5">
                                                {selectedItem.recommended_service}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedItem.is_follow_up_sent && (
                                        <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Pengingat terkirim ({formatDate(selectedItem.last_follow_up_at)})</span>
                                            </span>
                                            <span className="text-[10px] text-emerald-700 italic truncate max-w-[200px]">
                                                {selectedItem.last_follow_up_note}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* B. Customization Controls */}
                                <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                                Gaya Bahasa Pesan
                                            </label>
                                            <select
                                                value={personalityTone}
                                                onChange={(e) => setPersonalityTone(e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all"
                                            >
                                                <option value="Netral">Netral (Standar Bisnis Sopan)</option>
                                                <option value="Koleris">Koleris (To The Point & Efisien)</option>
                                                <option value="Sanguinis">Sanguinis (Ramah & Hangat)</option>
                                                <option value="Melankolis">Melankolis (Rinci & Spesifikasi)</option>
                                                <option value="Plegmatis">Plegmatis (Tenang & Santai)</option>
                                            </select>
                                        </div>

                                        <div className="sm:pt-5">
                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={includePromo}
                                                    onChange={(e) => setIncludePromo(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                />
                                                <span>Sertakan gratis cek suhu & diskon loyalitas</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Catatan Tambahan untuk Pelanggan (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            value={customNote}
                                            onChange={(e) => setCustomNote(e.target.value)}
                                            placeholder="Misal: Workshop buka setiap hari sampai pkl 20.00 WIB..."
                                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* C. Clean WhatsApp Chat Preview */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Pratinjau Pesan WhatsApp</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleCopyMessage}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                                        >
                                            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                            <span>{copied ? "Tersalin!" : "Salin Pesan"}</span>
                                        </button>
                                    </div>

                                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-[190px] overflow-y-auto custom-scrollbar text-slate-800 select-all">
                                        {generateMessage()}
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
                                <Calendar className="w-10 h-10 text-slate-300 mb-2" />
                                <p className="text-xs font-semibold text-slate-600">Pilih salah satu jadwal servis berkala di daftar sebelah kiri</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Single Unified Footer */}
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-slate-500 text-center sm:text-left">
                        {selectedItem ? (
                            <span>Unit <strong>{selectedItem.merek} {selectedItem.model}</strong> milik <strong>{selectedItem.customer_nama}</strong></span>
                        ) : (
                            <span>{filteredItems.length} unit masuk siklus servis berkala.</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {selectedItem && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleMarkFollowUp(false)}
                                    disabled={submittingNote}
                                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
                                    title="Tandai sudah diingatkan tanpa meluncurkan WhatsApp"
                                >
                                    Tandai Terkirim Saja
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleMarkFollowUp(true)}
                                    disabled={submittingNote || !selectedItem.customer_phone}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-green-600/20 disabled:opacity-50"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Kirim WhatsApp & Tandai</span>
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
