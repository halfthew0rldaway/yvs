import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { ArrowLeft, Edit, Save, Trash2, CheckCircle2, XCircle, AlertCircle, Phone, MapPin, Search, Plus, Filter, MonitorSmartphone, User, Info, FileText, Wrench, ClipboardList, Send, Package, Camera, ExternalLink, MessageCircle, CheckCircle, ArrowRight, PenTool, FileCheck, AlertTriangle } from "lucide-react";
import ConfirmModal from "../../components/ConfirmModal";


const STATUS_LABELS = {
    diterima: { label: "Diterima", color: "bg-blue-50 text-blue-700 border-blue-200" },
    didiagnosis: { label: "Didiagnosis", color: "bg-purple-50 text-purple-700 border-purple-200" },
    menunggu_persetujuan: { label: "Menunggu Persetujuan", color: "bg-amber-50 text-amber-700 border-amber-200" },
    disetujui: { label: "Disetujui", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    dalam_perbaikan: { label: "Dalam Perbaikan", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    selesai: { label: "Selesai", color: "bg-green-50 text-green-700 border-green-200" },
    diambil: { label: "Diambil", color: "bg-slate-50 text-slate-700 border-slate-200" },
    dibatalkan: { label: "Dibatalkan", color: "bg-red-50 text-red-600 border-red-200" },
};

const STATUS_TRANSITIONS = {
    diterima: ["didiagnosis"],
    didiagnosis: ["menunggu_persetujuan"],
    menunggu_persetujuan: ["disetujui", "dibatalkan"],
    disetujui: ["dalam_perbaikan"],
    dalam_perbaikan: ["selesai"],
    selesai: ["diambil"],
    diambil: [],
    dibatalkan: [],
};

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

function generateWaLink(tiket) {
    if (!tiket || !tiket.perangkat?.customer) return "#";
    const customer = tiket.perangkat.customer;
    let phone = customer.nomor_telepon || "";
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);
    
    let text = "";

    if (tiket.status === "menunggu_persetujuan") {
        text = `Halo kak ${customer.nama},

Terkait perangkat *${tiket.perangkat.merek} ${tiket.perangkat.model}* dengan nomor tiket *${tiket.nomor_tiket}*, teknisi kami telah selesai melakukan pengecekan.

*Hasil Diagnosis:*
Masalah: ${tiket.diagnosis?.masalah || "Telah kami periksa (Mohon hubungi admin untuk detail)"}
Solusi: ${tiket.diagnosis?.solusi || "Menunggu konfirmasi tindakan lebih lanjut"}

*Estimasi Biaya:* ${formatRupiah(tiket.diagnosis?.estimasi_biaya || 0)}

Apakah perbaikan ingin dilanjutkan? Mohon konfirmasinya ya kak. Terima kasih!`;
    } else if (tiket.status === "selesai") {
        const tagihanInfo = tiket.invoice ? `\n*Total Tagihan:* ${formatRupiah(tiket.invoice.total_biaya)}\n` : "";
        text = `Halo kak ${customer.nama},

Kabar gembira! Perbaikan perangkat *${tiket.perangkat.merek} ${tiket.perangkat.model}* milik kakak dengan nomor tiket *${tiket.nomor_tiket}* telah selesai dikerjakan oleh teknisi kami. 🎉
${tagihanInfo}
Perangkat sudah bisa diambil di toko pada jam operasional kami. Mohon tunjukkan nomor tiket ini saat pengambilan.

Terima kasih telah mempercayakan perbaikan perangkat Anda kepada kami! 🙏`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

const MAINTENANCE_TIPS = {
    "Baterai": [
        "Hindari menggunakan laptop di atas kasur/bantal agar sirkulasi udara tidak tersumbat.",
        "Cobalah untuk tidak mengisi daya terus-menerus saat baterai sudah 100%.",
        "Jangan biarkan baterai habis total (0%) terlalu sering."
    ],
    "SSD / Storage": [
        "Sisakan kapasitas penyimpanan minimal 15-20% agar kecepatan SSD tetap optimal.",
        "Hindari mematikan perangkat secara paksa (shutdown via tombol power) saat proses simpan data.",
        "Lakukan backup berkala untuk data-data penting Anda."
    ],
    "Layar / LCD": [
        "Bersihkan layar menggunakan kain microfiber halus (hindari cairan berbahan alkohol keras).",
        "Hindari menutup layar laptop dengan benda keras (pulpen/headset) di atas keyboard.",
        "Buka dan tutup engsel layar dari bagian tengah, bukan dari pojok."
    ],
    "Pembersihan & Thermal Paste": [
        "Bersihkan debu ventilasi udara secara berkala.",
        "Disarankan melakukan repaste dan servis pembersihan berkala setiap 6-12 bulan.",
        "Pastikan kipas pendingin berputar lancar saat perangkat digunakan."
    ],
    "Software / OS": [
        "Rutin lakukan update sistem operasi dan antivirus.",
        "Hindari mengunduh file atau software dari sumber yang tidak terpercaya.",
        "Bersihkan file temporary/cache secara berkala."
    ],
    "Umum": [
        "Gunakan charger original atau berkualitas tinggi sesuai spesifikasi perangkat.",
        "Simpan perangkat di tempat kering dan terhindar dari paparan matahari langsung.",
        "Gunakan tas laptop bermaterial tebal saat bepergian."
    ]
};

function generateWarrantyWaLink(tiket) {
    if (!tiket || !tiket.perangkat?.customer) return "#";
    const customer = tiket.perangkat.customer;
    let phone = customer.nomor_telepon || "";
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);
    
    const kategori = tiket.kategori_perbaikan || "Umum";
    const durasi = tiket.durasi_garansi || "1 Bulan";
    const tipsList = MAINTENANCE_TIPS[kategori] || MAINTENANCE_TIPS["Umum"];
    const tipsText = tipsList.map((tip, idx) => `${idx + 1}. ${tip}`).join("\n");
    
    let text = `Halo kak ${customer.nama},

Terima kasih telah melakukan perbaikan perangkat *${tiket.perangkat.merek} ${tiket.perangkat.model}* (No. Tiket: *${tiket.nomor_tiket}*) di YVS Computer. 🎉

*Info Garansi Perbaikan:*
🛡️ Durasi Garansi: *${durasi}*
*(Garansi berlaku untuk perbaikan / sparepart yang diganti)*

💡 *Tips Perawatan Perangkat (${kategori}):*
${tipsText}

Jika ada kendala selama masa garansi, jangan ragu untuk menghubungi kami atau membawa kembali unit ke toko. Semoga perangkatnya awet dan lancar selalu ya kak! 🙏`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function generateReminderWaLink(tiket, months) {
    if (!tiket || !tiket.perangkat?.customer) return "#";
    const customer = tiket.perangkat.customer;
    let phone = customer.nomor_telepon || "";
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);
    
    let text = `Halo kak ${customer.nama},

Kami dari YVS Computer ingin mengingatkan kembali terkait perangkat *${tiket.perangkat.merek} ${tiket.perangkat.model}* milik kakak dengan nomor tiket *${tiket.nomor_tiket}*.

Perangkat kakak telah selesai diperbaiki sejak ${months} bulan yang lalu dan saat ini masih berada di toko kami. Mohon kesediaannya untuk segera mengambil perangkat tersebut pada jam operasional toko kami.

Apabila ada kendala dalam pengambilan, mohon konfirmasikan kepada kami. Terima kasih! 🙏`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default function TiketServisDetail() {
    const { id } = useParams();
    const { isAdmin, isTeknisi, user } = useAuth();
    const [tiket, setTiket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [catatanAdmin, setCatatanAdmin] = useState("");
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [kategoriPerbaikan, setKategoriPerbaikan] = useState("Umum");
    const [durasiGaransi, setDurasiGaransi] = useState("1 Bulan");
    const [isSavingWarrantyConfig, setIsSavingWarrantyConfig] = useState(false);
    
    // Modals state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isTakeOverModalOpen, setIsTakeOverModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Sparepart use form
    const [spareparts, setSpareparts] = useState([]);
    const [sparepartForm, setSparepartForm] = useState({ sparepart_id: "", jumlah: 1 });
    const [sparepartSearchQuery, setSparepartSearchQuery] = useState("");
    const [sparepartCategoryFilter, setSparepartCategoryFilter] = useState("");
    const [useSparepartLoading, setUseSparepartLoading] = useState(false);

    useEffect(() => {
        fetchTiket();
        api.get("/sparepart").then((res) => setSpareparts(res.data)).catch(() => { });
    }, [id]);

    async function fetchTiket() {
        try {
            const res = await api.get(`/tiket-servis/${id}`);
            setTiket(res.data);
            setSelectedStatus("");
            setKategoriPerbaikan(res.data.kategori_perbaikan || "Umum");
            setDurasiGaransi(res.data.durasi_garansi || "1 Bulan");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleStatusChangeClick() {
        if (!selectedStatus) return;
        setIsUpdatingStatus(true);
    }

    async function executeStatusChange() {
        setIsUpdatingStatus(false);
        try {
            const payload = { 
                status: selectedStatus,
                kategori_perbaikan: kategoriPerbaikan,
                durasi_garansi: durasiGaransi
            };
            if (catatanAdmin && isAdmin) {
                payload.catatan_admin = catatanAdmin;
            }
            await api.put(`/tiket-servis/${id}`, payload);
            setCatatanAdmin("");
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengubah status");
        }
    }

    async function handleTakeOver() {
        if (!user) return;
        try {
            await api.put(`/tiket-servis/${id}`, { teknisi_id: user.id });
            toast.success("Berhasil mengambil alih tiket!");
            setIsTakeOverModalOpen(false);
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengambil alih tiket");
        }
    }

    function getReminderDue(tiket) {
        if (tiket.status !== "selesai" || !tiket.completed_at) return null;
        
        const completedDate = new Date(tiket.completed_at);
        const now = new Date();
        
        const diffTime = Math.abs(now - completedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 90 && tiket.last_reminder_sent < 3) return 3;
        if (diffDays >= 60 && tiket.last_reminder_sent < 2) return 2;
        if (diffDays >= 30 && tiket.last_reminder_sent < 1) return 1;
        
        return null;
    }

    async function handleSendReminder(months) {
        setIsSendingReminder(true);
        try {
            await api.put(`/tiket-servis/${id}/reminder`, { last_reminder_sent: months });
            toast.success(`Status pengingat ${months} bulan berhasil disimpan!`);
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal memperbarui status pengingat");
        } finally {
            setIsSendingReminder(false);
        }
    }

    async function handleSaveWarrantyConfig() {
        setIsSavingWarrantyConfig(true);
        try {
            await api.put(`/tiket-servis/${id}`, {
                kategori_perbaikan: kategoriPerbaikan,
                durasi_garansi: durasiGaransi
            });
            toast.success("Pengaturan garansi & tips berhasil disimpan!");
            fetchTiket();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menyimpan pengaturan garansi");
        } finally {
            setIsSavingWarrantyConfig(false);
        }
    }

    async function handleUseSparepart(e) {
        e.preventDefault();
        setUseSparepartLoading(true);

        try {
            await api.post("/sparepart/use", {
                tiket_id: Number(id),
                sparepart_id: Number(sparepartForm.sparepart_id),
                jumlah: Number(sparepartForm.jumlah),
            });
            setSparepartForm({ sparepart_id: "", jumlah: 1 });
            fetchTiket();
            // Refresh sparepart list
            const res = await api.get("/sparepart");
            setSpareparts(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menggunakan sparepart");
        } finally {
            setUseSparepartLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!tiket) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                <FileText className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-900">Tiket tidak ditemukan</p>
                <Link to="/tiket-servis" className="mt-4 text-blue-600 hover:underline">Kembali ke Daftar Tiket</Link>
            </div>
        );
    }

    const allowedTransitions = STATUS_TRANSITIONS[tiket.status] || [];
    
    // Admin bisa mengubah semua status kapan saja.
    // Teknisi hanya bisa mengubah status JIKA tiket tersebut sudah di-assign kepadanya.
    const isAssignedToMe = isTeknisi && tiket.teknisi?.id === user?.id;
    const canUpdateStatus = isAdmin || isAssignedToMe;

    // Teknisi hanya boleh mengubah status menjadi "Selesai" (saat tiket sedang "Dalam Perbaikan").
    // Perubahan status lainnya, seperti "Disetujui" -> "Dalam Perbaikan" harus dilakukan oleh Admin.
    let filteredTransitions = allowedTransitions;
    if (isTeknisi && !isAdmin) {
        const teknisiAllowed = ["selesai"];
        filteredTransitions = allowedTransitions.filter(s => teknisiAllowed.includes(s));
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link 
                        to="/tiket-servis" 
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{tiket.nomor_tiket}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_LABELS[tiket.status]?.color}`}>
                                {STATUS_LABELS[tiket.status]?.label}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Dibuat pada {new Date(tiket.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                {isAdmin && (tiket.status === "menunggu_persetujuan" || tiket.status === "selesai" || tiket.status === "diambil") && (
                    <a
                        href={tiket.status === "diambil" ? generateWarrantyWaLink(tiket) : generateWaLink(tiket)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-sm font-bold shadow-md shadow-green-500/20 transition-all shrink-0"
                    >
                        <MessageCircle className="w-5 h-5" />
                        {tiket.status === "diambil" ? "Kirim Garansi & Tips WA" : "Kabari via WhatsApp"}
                    </a>
                )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                        <MonitorSmartphone className="w-5 h-5 text-blue-500" />
                        <h2 className="text-base font-bold text-slate-900">Informasi Perangkat</h2>
                    </div>
                    <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                            <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Customer</p>
                                <p className="font-medium text-slate-900">{tiket.perangkat?.customer?.nama}</p>
                                <p className="text-slate-500">{tiket.perangkat?.customer?.nomor_telepon}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Detail Perangkat</p>
                                <p className="font-medium text-slate-900">{tiket.perangkat?.merek} {tiket.perangkat?.model}</p>
                                <p className="text-slate-600">{tiket.perangkat?.jenis_perangkat} • SN: {tiket.perangkat?.serial_number || "-"}</p>
                            </div>
                        </div>
                        {tiket.kelengkapan && (
                            <div className="flex items-start gap-3">
                                <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Kelengkapan Perangkat</p>
                                    <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">{tiket.kelengkapan}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                        <FileText className="w-5 h-5 text-purple-500" />
                        <h2 className="text-base font-bold text-slate-900">Detail Tiket</h2>
                    </div>
                    <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                            <Wrench className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Teknisi Penanggung Jawab</p>
                                <p className="font-medium text-slate-900">{tiket.teknisi?.nama || <span className="text-amber-600 italic">Belum ditugaskan</span>}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <ClipboardList className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">Keluhan Pelanggan</p>
                                <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 whitespace-pre-line">{tiket.keluhan}</p>
                            </div>
                        </div>
                        {tiket.foto_kondisi && JSON.parse(tiket.foto_kondisi).length > 0 && (
                            <div className="flex items-start gap-3">
                                <Camera className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div className="w-full">
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Foto Kondisi Awal</p>
                                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                        {JSON.parse(tiket.foto_kondisi).map((foto, idx) => {
                                            const imageUrl = foto.startsWith('http') ? foto : `http://localhost:5000${foto}`;
                                            return (
                                                <button 
                                                    key={idx} 
                                                    onClick={() => setSelectedImage(imageUrl)}
                                                    className="relative shrink-0 group outline-none focus:ring-4 focus:ring-blue-500/20 rounded-xl"
                                                >
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={`Kondisi ${idx+1}`} 
                                                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm transition-transform group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                        <Search className="w-4 h-4 text-white" />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ambil Alih Action */}
            {isTeknisi && !tiket.teknisi && tiket.status !== "selesai" && tiket.status !== "diambil" && tiket.status !== "dibatalkan" && (
                <div className="bg-amber-50/50 rounded-2xl p-6 shadow-sm border border-amber-200 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-amber-600" />
                        <h2 className="text-base font-bold text-amber-900">Tiket Belum Ditangani</h2>
                    </div>
                    <p className="text-sm text-amber-700/80 mb-5">
                        Tiket ini masih berada di antrean. Apakah kamu ingin mengambil alih dan menangani perbaikan perangkat ini?
                    </p>
                    <button
                        onClick={() => setIsTakeOverModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2"
                    >
                        <User className="w-4 h-4" />
                        <span>Ambil Alih Tiket Ini</span>
                    </button>
                </div>
            )}

            {/* Unassigned Warning for Admin */}
            {isAdmin && !tiket.teknisi && tiket.status !== "selesai" && tiket.status !== "diambil" && tiket.status !== "dibatalkan" && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h2 className="text-base font-bold text-amber-900">Perhatian: Tiket Belum Ditugaskan!</h2>
                    </div>
                    <p className="text-sm text-amber-700/80">
                        Tiket ini belum memiliki teknisi penanggung jawab sehingga proses diagnosis dan perbaikan tidak bisa dimulai. Silakan pilih teknisi pada menu di panel "Informasi Tiket" di sebelah kanan.
                    </p>
                </div>
            )}

            {/* Reminder Section */}
            {isAdmin && tiket.status === "selesai" && getReminderDue(tiket) && (
                <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h2 className="text-base font-bold text-red-900">Pengingat Pengambilan (Due)</h2>
                    </div>
                    <p className="text-sm text-red-700/80 mb-5">
                        Tiket ini sudah selesai lebih dari {getReminderDue(tiket)} bulan tetapi belum diambil. Kirim pesan pengingat kepada customer.
                    </p>
                    <div className="flex items-center gap-3">
                        <a
                            href={generateReminderWaLink(tiket, getReminderDue(tiket))}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => handleSendReminder(getReminderDue(tiket))}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Kirim Pengingat {getReminderDue(tiket)} Bulan</span>
                        </a>
                    </div>
                </div>
            )}

            {/* Warranty & Care Tips Card for Diambil */}
            {tiket.status === "diambil" && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-base font-bold text-emerald-900">Garansi & Tips Perawatan Perangkat</h2>
                    </div>
                    <p className="text-sm text-emerald-700/80 mb-5">
                        Perangkat telah diambil oleh pelanggan. Anda dapat mengirimkan rincian garansi beserta tips perawatan yang disesuaikan dengan jenis perbaikan.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1.5">
                                Kategori Perbaikan / Tips
                            </label>
                            <select
                                value={kategoriPerbaikan}
                                onChange={(e) => setKategoriPerbaikan(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                            >
                                {Object.keys(MAINTENANCE_TIPS).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1.5">
                                Durasi Garansi
                            </label>
                            <input
                                type="text"
                                value={durasiGaransi}
                                onChange={(e) => setDurasiGaransi(e.target.value)}
                                placeholder="Misal: 1 Bulan / 3 Bulan / 14 Hari"
                                className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-emerald-100">
                        {isAdmin && (
                            <button
                                onClick={handleSaveWarrantyConfig}
                                disabled={isSavingWarrantyConfig}
                                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isSavingWarrantyConfig ? "Menyimpan..." : "Simpan Pengaturan Garansi"}</span>
                            </button>
                        )}

                        <a
                            href={generateWarrantyWaLink(tiket)}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto px-6 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-green-500/20 flex items-center justify-center gap-2 shrink-0"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span>Kirim Info Garansi & Tips via WhatsApp</span>
                        </a>
                    </div>
                </div>
            )}

            {/* Status Actions */}
            {canUpdateStatus && filteredTransitions.length > 0 && (
                <div className="bg-blue-50/50 rounded-2xl p-6 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <h2 className="text-base font-bold text-blue-900">Perbarui Status Tiket</h2>
                    </div>
                    <p className="text-sm text-blue-700/80 mb-5">
                        Pilih status dari daftar di bawah ini untuk memperbarui progres perbaikan tiket.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full sm:w-auto flex-1 px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                        >
                            <option value="" disabled>Pilih Status Selanjutnya...</option>
                            {filteredTransitions.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]?.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleStatusChangeClick}
                            disabled={!selectedStatus}
                            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Simpan Status</span>
                        </button>
                    </div>

                    {isAdmin && (selectedStatus === "dalam_perbaikan" || selectedStatus === "disetujui") && (
                        <div className="mt-4 pt-4 border-t border-blue-100">
                            <label className="block text-sm font-semibold text-blue-900 mb-2">
                                Catatan Khusus untuk Teknisi (Opsional)
                            </label>
                            <textarea
                                value={catatanAdmin}
                                onChange={(e) => setCatatanAdmin(e.target.value)}
                                placeholder="Misal: Customer minta tolong sekalian install aplikasi X..."
                                rows={2}
                                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Diagnosis */}
            {tiket.diagnosis && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                        <Search className="w-5 h-5 text-amber-500" />
                        <h2 className="text-base font-bold text-slate-900">Hasil Diagnosis</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Masalah Ditemukan</p>
                            <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 h-[calc(100%-1.5rem)]">{tiket.diagnosis.masalah}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Solusi yang Ditawarkan</p>
                            <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 h-[calc(100%-1.5rem)]">{tiket.diagnosis.solusi}</p>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div>
                            <p className="text-blue-800 font-semibold text-sm">Estimasi Biaya Perbaikan</p>
                            <p className="text-blue-900 font-bold text-xl">{formatRupiah(tiket.diagnosis.estimasi_biaya)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Diagnosis Form Action */}
            {isTeknisi && isAssignedToMe && tiket.status === "diterima" && !tiket.diagnosis && (
                <Link
                    to={`/tiket-servis/${id}/diagnosis`}
                    className="flex flex-col items-center justify-center p-8 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-2xl text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all group"
                >
                    <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Search className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="font-bold text-lg">Mulai Diagnosis</span>
                    <span className="text-amber-600/70 text-sm mt-1">Periksa perangkat dan catat masalah yang ditemukan</span>
                </Link>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[650px] mb-6">
                {/* Log Perbaikan */}
                <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <PenTool className="w-5 h-5 text-slate-700" />
                            <h2 className="text-base font-bold text-slate-900">Log Perbaikan</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            {(isAdmin || isAssignedToMe) && (tiket.status === "dalam_perbaikan" || tiket.status === "diterima" || tiket.status === "didiagnosis") && (
                                <Link to={`/tiket-servis/${id}/log`} className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 hover:underline flex items-center gap-1">
                                    <PenTool className="w-4 h-4" />
                                    Tambah Log
                                </Link>
                            )}
                            <Link to={`/tiket-servis/${id}/log`} className="text-blue-600 text-sm font-semibold hover:text-blue-700 hover:underline">
                                Lihat Semua
                            </Link>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                        {tiket.log_perbaikan?.length > 0 ? (
                            <div className="space-y-4">
                                {tiket.log_perbaikan.map((log, index) => {
                                    let dotColor = "bg-blue-500";
                                    let badgeColor = "bg-blue-100 text-blue-700";
                                    let label = "Perbaikan";

                                    if (log.fase === "Diagnosis") {
                                        dotColor = "bg-amber-500";
                                        badgeColor = "bg-amber-100 text-amber-700";
                                        label = "Diagnosis";
                                    } else if (log.fase === "Catatan Admin") {
                                        dotColor = "bg-purple-500";
                                        badgeColor = "bg-purple-100 text-purple-700";
                                        label = "Admin";
                                    }

                                    return (
                                        <div key={log.id} className="relative pl-6 pb-4 last:pb-0">
                                            {/* Timeline line */}
                                            {index !== tiket.log_perbaikan.length - 1 && (
                                                <div className="absolute left-[7px] top-6 bottom-[-8px] w-px bg-slate-200"></div>
                                            )}
                                            {/* Timeline dot */}
                                            <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ${dotColor}`}></div>
                                            
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm text-sm">
                                                <div className="mb-2">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${badgeColor}`}>{label}</span>
                                                </div>
                                                <p className="text-slate-800 mb-2 whitespace-pre-line">{log.catatan}</p>
                                            {log.foto_url && (
                                                <div className="mb-3">
                                                    <a href={log.foto_url} target="_blank" rel="noreferrer" className="block w-fit">
                                                        <img 
                                                            src={log.foto_url} 
                                                            alt="Dokumentasi Perbaikan" 
                                                            className="h-20 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                                                        />
                                                    </a>
                                                </div>
                                            )}
                                            <p className="text-xs font-medium text-slate-400 mt-2">
                                                {new Date(log.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                                <ClipboardList className="w-10 h-10 text-slate-200 mb-3" />
                                <p className="text-sm font-medium text-slate-900">Belum ada log</p>
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Catatan perbaikan akan muncul di sini</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6 h-full">
                    {/* Penggunaan Sparepart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                            <Package className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-bold text-slate-900">Penggunaan Sparepart</h2>
                        </div>

                        {tiket.penggunaan_sparepart?.length > 0 ? (
                            <div className="flex-1 overflow-auto mb-6 custom-scrollbar min-h-0">
                                <table className="w-full text-sm whitespace-nowrap">
                                    <thead>
                                        <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50/50">
                                            <th className="py-3 px-4 font-semibold rounded-tl-lg">Sparepart</th>
                                            <th className="py-3 px-4 font-semibold text-center">Jumlah</th>
                                            <th className="py-3 px-4 font-semibold text-right">Harga Satuan</th>
                                            <th className="py-3 px-4 font-semibold text-right rounded-tr-lg">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tiket.penggunaan_sparepart.map((ps) => (
                                            <tr key={ps.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-slate-900">{(ps.sparepart?.brand?.nama && ps.sparepart.brand.nama.toLowerCase() !== "lainnya" ? ps.sparepart.brand.nama + " " : "") + ps.sparepart?.nama}</td>
                                                <td className="py-3 px-4 text-center text-slate-600">{ps.jumlah}</td>
                                                <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(ps.sparepart?.harga)}</td>
                                                <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatRupiah(ps.sparepart?.harga * ps.jumlah)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t border-slate-200 font-semibold bg-slate-50/50">
                                        <tr>
                                            <td colSpan="3" className="py-3 px-4 text-right text-slate-700">Total Sparepart:</td>
                                            <td className="py-3 px-4 text-right text-slate-900">
                                                {formatRupiah(tiket.penggunaan_sparepart.reduce((acc, ps) => acc + (ps.sparepart?.harga * ps.jumlah), 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 mb-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <Package className="w-10 h-10 text-slate-300 mb-3" />
                                <p className="text-sm font-medium text-slate-900">Tidak ada sparepart</p>
                                <p className="text-xs text-slate-500 mt-1">Belum ada suku cadang yang digunakan untuk perbaikan ini.</p>
                            </div>
                        )}

                        {/* Form tambah sparepart */}
                        {(isTeknisi || isAdmin) && tiket.status === "dalam_perbaikan" && (
                            <div className="bg-indigo-50/30 p-5 rounded-xl border border-indigo-100 shrink-0 mt-auto">
                                <h3 className="text-sm font-bold text-indigo-900 mb-3">Tambah Penggunaan Suku Cadang</h3>
                                <form onSubmit={handleUseSparepart} className="flex flex-col sm:flex-row gap-3 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Pilih Sparepart</label>
                                        
                                        {/* Filter Controls */}
                                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-4 w-4 text-indigo-400" />
                                                </div>
                                                <input 
                                                    type="text"
                                                    placeholder="Ketik untuk mencari sparepart..."
                                                    value={sparepartSearchQuery}
                                                    onChange={(e) => setSparepartSearchQuery(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-white/60 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                />
                                            </div>
                                            <select
                                                value={sparepartCategoryFilter}
                                                onChange={(e) => setSparepartCategoryFilter(e.target.value)}
                                                className="sm:w-1/3 px-3 py-2 bg-white/60 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-600"
                                            >
                                                <option value="">Semua Kategori</option>
                                                {[...new Set(spareparts.flatMap(s => (s.kategori || "").split(",").map(k => k.trim())))].filter(Boolean).sort().map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <select
                                            value={sparepartForm.sparepart_id}
                                            onChange={(e) => setSparepartForm({ ...sparepartForm, sparepart_id: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-indigo-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                            required
                                        >
                                            <option value="">-- Hasil Pencarian ({
                                                spareparts
                                                    .filter((s) => s.stok > 0)
                                                    .filter((s) => !sparepartCategoryFilter || (s.kategori && s.kategori.includes(sparepartCategoryFilter)))
                                                    .filter((s) => ((s.brand?.nama && s.brand.nama.toLowerCase() !== "lainnya" ? s.brand.nama + " " : "") + s.nama).toLowerCase().includes(sparepartSearchQuery.toLowerCase()) || (s.kategori && s.kategori.toLowerCase().includes(sparepartSearchQuery.toLowerCase())))
                                                    .length
                                            }) --</option>
                                            {spareparts
                                                .filter((s) => s.stok > 0)
                                                .filter((s) => !sparepartCategoryFilter || (s.kategori && s.kategori.includes(sparepartCategoryFilter)))
                                                .filter((s) => ((s.brand?.nama && s.brand.nama.toLowerCase() !== "lainnya" ? s.brand.nama + " " : "") + s.nama).toLowerCase().includes(sparepartSearchQuery.toLowerCase()) || (s.kategori && s.kategori.toLowerCase().includes(sparepartSearchQuery.toLowerCase())))
                                                .sort((a, b) => ((a.brand?.nama && a.brand.nama.toLowerCase() !== "lainnya" ? a.brand.nama + " " : "") + a.nama).localeCompare((b.brand?.nama && b.brand.nama.toLowerCase() !== "lainnya" ? b.brand.nama + " " : "") + b.nama))
                                                .map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {(s.brand?.nama && s.brand.nama.toLowerCase() !== "lainnya" ? s.brand.nama + " " : "") + s.nama} (Sisa stok: {s.stok}) - {formatRupiah(s.harga)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-full sm:w-28 shrink-0">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jumlah</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={sparepartForm.jumlah}
                                            onChange={(e) => setSparepartForm({ ...sparepartForm, jumlah: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-center"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={useSparepartLoading}
                                        className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm shrink-0 whitespace-nowrap"
                                    >
                                        {useSparepartLoading ? "Memproses..." : "Tambahkan"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Invoice */}
                    {tiket.invoice && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 shrink-0">
                            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                                <FileCheck className="w-5 h-5 text-emerald-500" />
                                <h2 className="text-base font-bold text-slate-900">Tagihan Pembayaran</h2>
                            </div>
                            
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Biaya Jasa Teknisi</span>
                                    <span className="text-slate-900 font-medium">{formatRupiah(tiket.invoice.biaya_jasa)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Biaya Suku Cadang</span>
                                    <span className="text-slate-900 font-medium">{formatRupiah(tiket.invoice.biaya_sparepart)}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-slate-800 font-bold uppercase tracking-wider text-sm">Total Tagihan</span>
                                    <span className="text-emerald-700 font-bold text-xl">{formatRupiah(tiket.invoice.total_biaya)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isUpdatingStatus}
                title="Konfirmasi Perubahan Status"
                message={`Apakah Anda yakin ingin mengubah status perbaikan menjadi "${STATUS_LABELS[selectedStatus]?.label}"?`}
                onConfirm={executeStatusChange}
                onCancel={() => setIsUpdatingStatus(false)}
                confirmText="Ya, Ubah Status"
            />
            
            <ConfirmModal
                isOpen={isTakeOverModalOpen}
                onCancel={() => setIsTakeOverModalOpen(false)}
                onConfirm={handleTakeOver}
                title="Ambil Alih Tiket"
                message="Anda yakin ingin mengambil alih tiket ini? Status tiket akan berubah menjadi Didiagnosis dan Anda akan menjadi teknisi penanggung jawab."
                confirmText="Ya, Ambil Alih"
                confirmColor="amber"
                icon={<Wrench className="w-6 h-6 text-amber-600" />}
            />

            {/* Image Preview Modal (Lightbox) */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
                    <button 
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
                        onClick={() => setSelectedImage(null)}
                    >
                        <XCircle className="w-8 h-8" />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Preview" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
}

