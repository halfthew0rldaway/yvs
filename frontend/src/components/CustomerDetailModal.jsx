import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
    User, Phone, MapPin, MonitorSmartphone, Plus, ExternalLink, X, 
    FileText, Calendar, MessageCircle, Edit2, Wrench, Laptop, Tv, Printer, 
    Smartphone, AlertCircle, HeartHandshake, Sparkles, CheckCircle2, RotateCcw 
} from "lucide-react";
import { PERSONALITY_TYPES } from "../constants/personalityTypes";
import MaintenanceRecallModal from "./MaintenanceRecallModal";
import CustomerBadges from "./CustomerBadges";

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

function formatRupiah(num) {
    if (!num) return "Rp 0";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getDeviceIcon(jenis) {
    const j = (jenis || "").toLowerCase();
    if (j.includes("laptop") || j.includes("notebook")) return Laptop;
    if (j.includes("pc") || j.includes("desktop") || j.includes("tower")) return Tv;
    if (j.includes("printer")) return Printer;
    if (j.includes("phone") || j.includes("hp") || j.includes("tablet")) return Smartphone;
    return MonitorSmartphone;
}

export default function CustomerDetailModal({ customerId, isOpen, onClose, onSelectPerangkat }) {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("perangkat"); // "perangkat" | "riwayat" | "profil"
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [selectedRecallTiketId, setSelectedRecallTiketId] = useState(null);

    useEffect(() => {
        if (!isOpen || !customerId) {
            setCustomer(null);
            return;
        }

        async function fetchCustomerDetail() {
            setLoading(true);
            try {
                const res = await api.get(`/customer/${customerId}`);
                setCustomer(res.data);
            } catch (err) {
                console.error("Gagal memuat detail customer:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCustomerDetail();
    }, [isOpen, customerId]);

    if (!isOpen) return null;

    const personality = customer ? (PERSONALITY_TYPES[customer.tipe_kepribadian] || PERSONALITY_TYPES["Netral"]) : PERSONALITY_TYPES["Netral"];

    // WhatsApp direct link
    let waLink = "#";
    if (customer?.nomor_telepon) {
        let phone = customer.nomor_telepon.replace(/[^0-9]/g, "");
        if (phone.startsWith("0")) phone = "62" + phone.substring(1);
        const text = `Halo kak ${customer.nama}, kami dari Yangversa Computer Service. Ada yang bisa kami bantu terkait perangkat atau servis Anda?`;
        waLink = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
                onClick={onClose}
            ></div>

            {/* Modal Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden z-10 border border-slate-200 animate-fadeIn">
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-base shrink-0">
                            {customer?.nama ? customer.nama.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight truncate">
                                    {loading ? "Memuat..." : (customer?.nama || "Detail Pelanggan")}
                                </h3>
                                {customer?.tipe_kepribadian && (
                                    <span 
                                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${personality.badge}`}
                                        title={personality.trait}
                                    >
                                        {personality.label}
                                    </span>
                                )}
                                {customer && (
                                    <CustomerBadges 
                                        customer={customer} 
                                        variant="icon-only" 
                                        size="normal" 
                                        showGuideButton={true}
                                        onCustomerUpdated={(updated) => setCustomer(prev => ({ ...prev, ...updated }))} 
                                    />
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                                <span className="font-mono">{customer?.nomor_telepon || "-"}</span>
                                <span>•</span>
                                <span>Terdaftar: {formatDate(customer?.created_at)}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {customer && (
                            <Link
                                to={`/customer/edit/${customer.id}`}
                                className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Data</span>
                            </Link>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Summary Bar */}
                {customer && (
                    <div className="px-5 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <div>
                                <span className="text-slate-500">Total Unit: </span>
                                <strong className="text-slate-900 font-semibold">{customer.stats?.total_perangkat ?? customer.perangkat?.length ?? 0} Perangkat</strong>
                            </div>
                            <span className="text-slate-300">•</span>
                            <div>
                                <span className="text-slate-500">Riwayat Servis: </span>
                                <strong className="text-blue-600 font-semibold">{customer.stats?.total_tiket ?? 0} Tiket</strong>
                                {customer.stats?.tiket_selesai !== undefined && (
                                    <span className="text-slate-500 text-[11px]"> ({customer.stats.tiket_selesai} Selesai)</span>
                                )}
                            </div>
                            <span className="text-slate-300">•</span>
                            <div>
                                <span className="text-slate-500">Revisi ACC: </span>
                                <strong className={customer.stats?.total_revisi_acc > 0 ? "text-rose-600 font-semibold" : "text-slate-700 font-semibold"}>
                                    {customer.stats?.total_revisi_acc ?? 0}x {customer.stats?.revisi_rate ? `(${customer.stats.revisi_rate}%)` : ''}
                                </strong>
                            </div>
                            {customer.stats?.total_belanja > 0 && (
                                <>
                                    <span className="text-slate-300 hidden sm:inline">•</span>
                                    <div className="hidden sm:block">
                                        <span className="text-slate-500">Total Transaksi: </span>
                                        <strong className="text-emerald-600 font-semibold">{formatRupiah(customer.stats.total_belanja)}</strong>
                                    </div>
                                </>
                            )}
                        </div>
                        {customer.nomor_telepon && (
                            <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                                title="Kirim pesan WhatsApp"
                            >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp</span>
                            </a>
                        )}
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="px-5 sm:px-6 pt-2 border-b border-slate-200 flex items-center justify-between gap-4 bg-white overflow-x-auto">
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                            onClick={() => setActiveTab("perangkat")}
                            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === "perangkat"
                                    ? "border-blue-600 text-blue-600 font-bold"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <MonitorSmartphone className="w-4 h-4" />
                            <span>Perangkat Milik Pelanggan ({customer?.perangkat?.length || 0})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("riwayat")}
                            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === "riwayat"
                                    ? "border-blue-600 text-blue-600 font-bold"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span>Riwayat Servis ({customer?.riwayat_servis?.length || 0})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("profil")}
                            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === "profil"
                                    ? "border-blue-600 text-blue-600 font-bold"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <HeartHandshake className="w-4 h-4" />
                            <span>Profil Karakteristik & Kontak</span>
                        </button>
                    </div>

                    {customer && (
                        <div className="hidden sm:flex items-center gap-2 pb-2 shrink-0">
                            <Link
                                to={`/perangkat/tambah?customer_id=${customer.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-all border border-blue-200"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Perangkat</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                            <p className="text-xs font-medium">Memuat data pelanggan...</p>
                        </div>
                    ) : !customer ? (
                        <div className="text-center py-16 text-slate-500">
                            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-slate-700">Data pelanggan tidak ditemukan</p>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: PERANGKAT MILIK PELANGGAN */}
                            {activeTab === "perangkat" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500">
                                            Daftar seluruh unit komputer/perangkat milik <strong>{customer.nama}</strong>:
                                        </p>
                                        <Link
                                            to={`/perangkat/tambah?customer_id=${customer.id}`}
                                            className="sm:hidden inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Tambah Unit</span>
                                        </Link>
                                    </div>

                                    {!customer.perangkat || customer.perangkat.length === 0 ? (
                                        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200">
                                            <MonitorSmartphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <h4 className="text-sm font-semibold text-slate-900">Belum Ada Perangkat</h4>
                                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                                                Pelanggan ini belum memiliki perangkat yang terdaftar di bengkel.
                                            </p>
                                            <Link
                                                to={`/perangkat/tambah?customer_id=${customer.id}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Daftarkan Perangkat Baru</span>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {customer.perangkat.map((p) => {
                                                const IconComp = getDeviceIcon(p.jenis_perangkat);
                                                const ticketCount = p._count?.tiket_servis || p.tiket_servis?.length || 0;

                                                return (
                                                    <div 
                                                        key={p.id}
                                                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                                                        <IconComp className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-slate-900 text-sm leading-tight">
                                                                            {p.merek} {p.model}
                                                                        </h4>
                                                                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                                                            {p.jenis_perangkat}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                                                    ticketCount > 0 
                                                                        ? "bg-blue-50 text-blue-700 border-blue-200" 
                                                                        : "bg-slate-50 text-slate-500 border-slate-200"
                                                                }`}>
                                                                    {ticketCount}x Servis
                                                                </span>
                                                            </div>

                                                            <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 mb-4">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-slate-500">Serial Number:</span>
                                                                    <span className="font-mono font-medium text-slate-800">{p.serial_number || "-"}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-slate-500">Tanggal Daftar:</span>
                                                                    <span>{formatDate(p.created_at)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (onSelectPerangkat) {
                                                                        onSelectPerangkat(p);
                                                                    }
                                                                }}
                                                                className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                                                            >
                                                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                                                <span>Rekam Medis</span>
                                                            </button>

                                                            <Link
                                                                to={`/tiket-servis/tambah?perangkat_id=${p.id}&customer_id=${customer.id}`}
                                                                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                                                                title="Buat tiket servis baru untuk perangkat ini"
                                                            >
                                                                <Wrench className="w-3.5 h-3.5" />
                                                                <span>Buat Tiket</span>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: RIWAYAT TIKET SERVIS */}
                            {activeTab === "riwayat" && (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-500">
                                        Seluruh riwayat tiket servis dan perbaikan unit milik <strong>{customer.nama}</strong>:
                                    </p>

                                    {!customer.riwayat_servis || customer.riwayat_servis.length === 0 ? (
                                        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200">
                                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <h4 className="text-sm font-semibold text-slate-900">Belum Ada Riwayat Servis</h4>
                                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                                Pelanggan ini belum pernah melakukan servis perangkat di bengkel.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                                            <div className="overflow-x-auto overflow-y-auto max-h-[380px] custom-scrollbar">
                                                <table className="w-full text-xs text-left whitespace-nowrap">
                                                    <thead className="sticky top-0 bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold z-10 shadow-[0_1px_0_0_#e2e8f0]">
                                                        <tr>
                                                            <th className="py-3 px-4">No. Tiket</th>
                                                            <th className="py-3 px-4">Perangkat</th>
                                                            <th className="py-3 px-4">Tanggal Masuk</th>
                                                            <th className="py-3 px-4">Status</th>
                                                            <th className="py-3 px-4">Keluhan</th>
                                                            <th className="py-3 px-4">Teknisi</th>
                                                            <th className="py-3 px-4 text-right">Total Biaya</th>
                                                            <th className="py-3 px-4 text-center">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {customer.riwayat_servis.map((t) => {
                                                            const statusInfo = STATUS_LABELS[t.status] || { label: t.status, color: "bg-slate-100 text-slate-700" };
                                                            const tglDiambil = t.tgl_diambil ? new Date(t.tgl_diambil) : null;
                                                            const diffDays = tglDiambil ? Math.ceil((new Date() - tglDiambil) / (1000 * 60 * 60 * 24)) : 0;
                                                            const diffMonths = Math.floor(diffDays / 30);
                                                            const isDueMaintenance = t.status === "diambil" && diffMonths >= 6;

                                                            return (
                                                                <tr 
                                                                    key={t.id} 
                                                                    onClick={(e) => {
                                                                        if (e.target.closest('button, a, input, select, textarea, label, [role="button"]')) return;
                                                                        navigate(`/tiket-servis/${t.id}`);
                                                                        if (onClose) onClose();
                                                                    }}
                                                                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                                                                >
                                                                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                                                                        <Link to={`/tiket-servis/${t.id}`} className="hover:underline flex items-center gap-1">
                                                                            {t.nomor_tiket}
                                                                            <ExternalLink className="w-3 h-3 text-slate-400" />
                                                                        </Link>
                                                                    </td>
                                                                    <td className="py-3 px-4 font-semibold text-slate-800">
                                                                        {t.perangkat_merek} {t.perangkat_model}
                                                                        {t.perangkat_sn && <span className="block text-[10px] font-mono text-slate-400">SN: {t.perangkat_sn}</span>}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-slate-600">
                                                                        {formatDate(t.created_at)}
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <div className="flex flex-col gap-1 items-start">
                                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${statusInfo.color}`}>
                                                                                {statusInfo.label}
                                                                            </span>
                                                                            {t.is_revisi_acc && (
                                                                                <span 
                                                                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1"
                                                                                    title={t.alasan_revisi_acc ? `Alasan Revisi ACC: ${t.alasan_revisi_acc}` : "Pernah direvisi ACC"}
                                                                                >
                                                                                    <RotateCcw className="w-2.5 h-2.5 text-amber-600" />
                                                                                    1x Revisi ACC
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-slate-700 max-w-[200px] truncate" title={t.keluhan}>
                                                                        {t.keluhan || "-"}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-slate-600 font-medium">
                                                                        {t.teknisi?.nama || <span className="italic text-slate-400">Belum di-assign</span>}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                                        {t.invoice?.total_biaya ? formatRupiah(t.invoice.total_biaya) : "-"}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <div className="flex items-center justify-center gap-1.5">
                                                                            <Link 
                                                                                to={`/tiket-servis/${t.id}`}
                                                                                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-[11px] font-semibold transition-colors"
                                                                            >
                                                                                Detail
                                                                            </Link>
                                                                            {isDueMaintenance && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setSelectedRecallTiketId(t.id);
                                                                                        setIsMaintenanceModalOpen(true);
                                                                                    }}
                                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs"
                                                                                    title={`Ingatkan Servis Berkala (Unit diservis ${diffMonths} bulan lalu)`}
                                                                                >
                                                                                    <Calendar className="w-3 h-3 text-blue-600" />
                                                                                    <span>Recall ({diffMonths} bln)</span>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: PROFIL KARAKTERISTIK & KONTAK */}
                            {activeTab === "profil" && (
                                <div className="space-y-4">
                                    {/* Profil Karakteristik Pelanggan Card */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <HeartHandshake className="w-4 h-4 text-blue-600" />
                                                <h4 className="text-sm font-bold text-slate-900">
                                                    Tipologi Karakter & Rekomendasi Pelayanan
                                                </h4>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${personality.badge}`}>
                                                Tipe: {personality.label}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                                                    Karakteristik Komunikasi:
                                                </span>
                                                <p className="text-slate-700 font-medium leading-relaxed">
                                                    "{personality.trait}"
                                                </p>
                                            </div>

                                            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-1">
                                                <span className="font-bold text-blue-900 block text-[11px] uppercase tracking-wider">
                                                    Panduan Pendekatan Pelayanan:
                                                </span>
                                                <p className="text-blue-950 font-medium leading-relaxed">
                                                    {personality.panduan}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detail Kontak & Domisili */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                                            Informasi Kontak & Domisili
                                        </h4>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                                <span className="text-slate-400 block font-medium">Nama Lengkap</span>
                                                <span className="font-semibold text-slate-800 text-sm block">{customer.nama}</span>
                                            </div>

                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                                <span className="text-slate-400 block font-medium">Nomor WhatsApp / Telepon</span>
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-800 font-mono text-sm">{customer.nomor_telepon || "-"}</span>
                                                    {customer.nomor_telepon && (
                                                        <a 
                                                            href={waLink} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="text-emerald-600 font-semibold hover:underline flex items-center gap-1 text-xs"
                                                        >
                                                            <span>Chat WA</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 sm:col-span-2">
                                                <span className="text-slate-400 block font-medium">Alamat Domisili</span>
                                                <p className="font-medium text-slate-800 leading-relaxed">
                                                    {customer.alamat || "Tidak ada alamat tercatat"}
                                                </p>
                                            </div>

                                            {customer.catatan_khusus && (
                                                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1 sm:col-span-2">
                                                    <span className="text-amber-800 font-semibold block text-[11px] uppercase tracking-wider">
                                                        Catatan Khusus Pelanggan
                                                    </span>
                                                    <p className="text-amber-950 leading-relaxed font-medium">
                                                        {customer.catatan_khusus}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 sm:col-span-2 text-slate-500">
                                                <span>Terdaftar pada sistem sejak: </span>
                                                <strong className="text-slate-700">{formatDate(customer.created_at)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-400 hidden sm:inline">
                        Yangversa Computer Service Management
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all ml-auto sm:ml-0"
                    >
                        Tutup
                    </button>
                </div>
            </div>

            {/* Maintenance Recall Modal */}
            <MaintenanceRecallModal
                isOpen={isMaintenanceModalOpen}
                onClose={() => setIsMaintenanceModalOpen(false)}
                initialSelectedId={selectedRecallTiketId}
            />
        </div>
    );
}
