import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { 
    MonitorSmartphone, User, Phone, MapPin, X, ExternalLink, 
    Calendar, Wrench, ShieldCheck, History, ChevronDown, ChevronUp, 
    MessageCircle, Plus, Edit2, Laptop, Tv, Printer, Smartphone, FileText, AlertCircle 
} from "lucide-react";
import { PERSONALITY_TYPES } from "../constants/personalityTypes";

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

export default function PerangkatDetailModal({ perangkatId, isOpen, onClose, onSelectCustomer, onSelectPerangkat }) {
    const [perangkat, setPerangkat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedTiketIds, setExpandedTiketIds] = useState({});

    useEffect(() => {
        if (!isOpen || !perangkatId) {
            setPerangkat(null);
            return;
        }

        async function fetchPerangkatDetail() {
            setLoading(true);
            setExpandedTiketIds({});
            try {
                const pId = typeof perangkatId === "object" ? perangkatId.id : perangkatId;
                const res = await api.get(`/perangkat/${pId}`);
                setPerangkat(res.data);
                // Expand latest ticket by default
                if (res.data?.tiket_servis && res.data.tiket_servis.length > 0) {
                    setExpandedTiketIds({ [res.data.tiket_servis[0].id]: true });
                }
            } catch (err) {
                console.error("Gagal memuat detail perangkat:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchPerangkatDetail();
    }, [isOpen, perangkatId]);

    if (!isOpen) return null;

    function toggleExpandTiket(id) {
        setExpandedTiketIds(prev => ({ ...prev, [id]: !prev[id] }));
    }

    function handleExpandAll() {
        if (!perangkat?.tiket_servis) return;
        const all = {};
        perangkat.tiket_servis.forEach(t => { all[t.id] = true; });
        setExpandedTiketIds(all);
    }

    function handleCollapseAll() {
        setExpandedTiketIds({});
    }

    const customer = perangkat?.customer;
    const personality = customer ? (PERSONALITY_TYPES[customer.tipe_kepribadian] || PERSONALITY_TYPES["Netral"]) : PERSONALITY_TYPES["Netral"];
    const DeviceIcon = getDeviceIcon(perangkat?.jenis_perangkat);

    // WhatsApp direct link for owner
    let waLink = "#";
    if (customer?.nomor_telepon) {
        let phone = customer.nomor_telepon.replace(/[^0-9]/g, "");
        if (phone.startsWith("0")) phone = "62" + phone.substring(1);
        const text = `Halo kak ${customer.nama}, kami dari Yangversa Computer Service menginformasikan terkait perangkat Anda ${perangkat?.merek || ""} ${perangkat?.model || ""}.`;
        waLink = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
                onClick={onClose}
            ></div>

            {/* Modal Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 border border-slate-200 animate-fadeIn">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                            <DeviceIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-slate-900 leading-tight">
                                    {loading ? "Memuat..." : `${perangkat?.merek || ""} ${perangkat?.model || "Detail Perangkat"}`}
                                </h3>
                                {perangkat?.jenis_perangkat && (
                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                                        {perangkat.jenis_perangkat}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                <span className="font-mono">SN: {perangkat?.serial_number || "Tanpa Serial Number"}</span>
                                <span>•</span>
                                <span>Terdaftar: {formatDate(perangkat?.created_at)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {perangkat && (
                            <Link
                                to={`/perangkat/edit/${perangkat.id}${window.location.pathname ? `?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}` : ''}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Unit</span>
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

                {/* Content Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                            <p className="text-xs font-medium">Memuat detail perangkat & riwayat...</p>
                        </div>
                    ) : !perangkat ? (
                        <div className="text-center py-16 text-slate-500">
                            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-slate-700">Data perangkat tidak ditemukan</p>
                        </div>
                    ) : (
                        <>
                            {/* SECTION: PEMILIK PERANGKAT */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                                Pemilik Perangkat
                                            </span>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (onSelectCustomer && customer) {
                                                            onSelectCustomer(customer.id);
                                                        }
                                                    }}
                                                    className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-left"
                                                >
                                                    <span>{customer?.nama || "Pelanggan Tanpa Nama"}</span>
                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                                </button>
                                                {customer?.tipe_kepribadian && (
                                                    <span 
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${personality.badge}`}
                                                        title={personality.trait}
                                                    >
                                                        {personality.label}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {customer?.nomor_telepon && (
                                            <a
                                                href={waLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-all border border-emerald-200"
                                                title="Hubungi Customer via WhatsApp"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>WhatsApp</span>
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (onSelectCustomer && customer) {
                                                    onSelectCustomer(customer.id);
                                                }
                                            }}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                                        >
                                            <span>Lihat Profil Pelanggan</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Owner Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-slate-500 block mb-0.5 text-[11px]">Nomor Telepon:</span>
                                        <span className="font-semibold text-slate-800 font-mono flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                            {customer?.nomor_telepon || "-"}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-slate-500 block mb-0.5 text-[11px]">Alamat Domisili:</span>
                                        <span className="font-semibold text-slate-800 truncate block" title={customer?.alamat}>
                                            {customer?.alamat || "-"}
                                        </span>
                                    </div>

                                    {personality?.trait && (
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                                            <span className="text-slate-500 block mb-0.5 text-[11px]">Karakteristik Komunikasi Pelanggan:</span>
                                            <span className="font-medium text-slate-800 text-xs block">
                                                "{personality.trait}"
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Customer's other devices */}
                                {customer?.perangkat && customer.perangkat.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                                            Perangkat Lain Milik Pelanggan Ini ({customer.perangkat.length} Unit):
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {customer.perangkat.map((other) => {
                                                const OtherIcon = getDeviceIcon(other.jenis_perangkat);
                                                return (
                                                    <button
                                                        key={other.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (onSelectPerangkat) {
                                                                onSelectPerangkat(other);
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-all"
                                                        title={`Lihat rekam medis ${other.merek} ${other.model}`}
                                                    >
                                                        <OtherIcon className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{other.merek} {other.model}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SECTION: REKAM MEDIS & RIWAYAT SERVIS */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                            <History className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">Rekam Medis & Riwayat Servis</h4>
                                            <p className="text-xs text-slate-500">
                                                Riwayat kerusakan, diagnosis, dan tindakan servis unit ini
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {perangkat.tiket_servis && perangkat.tiket_servis.length > 0 && (
                                            <div className="flex items-center gap-1 mr-1">
                                                <button
                                                    onClick={handleExpandAll}
                                                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-600 transition-colors"
                                                >
                                                    Buka Semua
                                                </button>
                                                <button
                                                    onClick={handleCollapseAll}
                                                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-600 transition-colors"
                                                >
                                                    Tutup Semua
                                                </button>
                                            </div>
                                        )}
                                        <Link
                                            to={`/tiket-servis/tambah?perangkat_id=${perangkat.id}&customer_id=${customer?.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Buat Tiket Baru</span>
                                        </Link>
                                    </div>
                                </div>

                                {!perangkat.tiket_servis || perangkat.tiket_servis.length === 0 ? (
                                    <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl">
                                        <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <h5 className="text-xs font-bold text-slate-800">Belum Ada Riwayat Servis</h5>
                                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                                            Perangkat ini belum pernah didaftarkan ke tiket servis perbaikan.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {perangkat.tiket_servis.map((tiket, idx) => {
                                            const statusInfo = STATUS_LABELS[tiket.status] || { label: tiket.status, color: "bg-slate-100 text-slate-700" };
                                            const warranty = tiket.warranty_status;
                                            const isExpanded = !!expandedTiketIds[tiket.id];

                                            return (
                                                <div 
                                                    key={tiket.id}
                                                    className={`bg-white rounded-xl border transition-all ${
                                                        isExpanded ? 'border-slate-300 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {/* Header Card */}
                                                    <div 
                                                        onClick={() => toggleExpandTiket(tiket.id)}
                                                        className="p-4 cursor-pointer flex flex-wrap items-center justify-between gap-2.5 select-none hover:bg-slate-50/50 rounded-xl transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                                #{perangkat.tiket_servis.length - idx}
                                                            </div>
                                                            <span className="font-mono font-bold text-sm text-blue-600 hover:underline">
                                                                {tiket.nomor_tiket}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${statusInfo.color}`}>
                                                                {statusInfo.label}
                                                            </span>
                                                            {warranty?.status === "aktif" && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                                                    Garansi Aktif ({warranty.sisaHari} hari)
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                {formatDate(tiket.created_at)}
                                                            </span>
                                                            {tiket.invoice?.total_biaya && (
                                                                <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                                                    {formatRupiah(tiket.invoice.total_biaya)}
                                                                </span>
                                                            )}
                                                            <button type="button" className="p-1 text-slate-400 hover:text-slate-600">
                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Body */}
                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 text-xs">
                                                            <div>
                                                                <span className="font-semibold text-slate-700 block mb-0.5">Keluhan Awal:</span>
                                                                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-line">
                                                                    {tiket.keluhan}
                                                                </p>
                                                            </div>

                                                            {tiket.diagnosis && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                                                        <span className="font-semibold text-slate-700 block mb-0.5">Temuan Masalah (Diagnosis):</span>
                                                                        <p className="text-slate-800">{tiket.diagnosis.masalah}</p>
                                                                    </div>
                                                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                                                        <span className="font-semibold text-slate-700 block mb-0.5">Solusi Tindakan:</span>
                                                                        <p className="text-slate-800">{tiket.diagnosis.solusi}</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-slate-500">
                                                                <div>
                                                                    Teknisi: <strong className="text-slate-800">{tiket.teknisi?.nama || "Belum ditugaskan"}</strong>
                                                                </div>
                                                                <Link
                                                                    to={`/tiket-servis/${tiket.id}`}
                                                                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                                                                >
                                                                    <span>Buka Detail Tiket Servis</span>
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                        Yangversa Computer Service Management
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
