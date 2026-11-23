import React, { useState, useEffect, useRef } from "react";
import { X, Search, Ticket, MonitorSmartphone, Wrench, Users, Lock, ChevronRight } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
}

export default function InsertReferenceModal({ isOpen, onClose, onSelect }) {
    const { hasPermission } = useAuth();
    
    const canViewTickets = hasPermission("tickets.view");
    const canViewDevices = hasPermission("devices.view");
    const canViewParts = hasPermission("inventory.view");

    // Determine initial active tab based on permission
    const initialTab = canViewTickets ? "ticket" : canViewDevices ? "device" : canViewParts ? "part" : "user";
    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setResults([]);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen, activeTab]);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const debounceTimer = setTimeout(async () => {
            setLoading(true);
            try {
                if (activeTab === "ticket" && canViewTickets) {
                    const res = await api.get("/tiket-servis", {
                        params: { search: searchQuery.trim(), limit: 12 },
                        skipCache: true
                    });
                    if (isMounted) setResults(Array.isArray(res.data) ? res.data : res.data?.data || []);
                } else if (activeTab === "device" && canViewDevices) {
                    const res = await api.get("/perangkat", {
                        params: { search: searchQuery.trim(), limit: 12 },
                        skipCache: true
                    });
                    if (isMounted) setResults(Array.isArray(res.data) ? res.data : res.data?.data || []);
                } else if (activeTab === "part" && canViewParts) {
                    const res = await api.get("/sparepart", {
                        params: { search: searchQuery.trim(), limit: 12 },
                        skipCache: true
                    });
                    if (isMounted) setResults(Array.isArray(res.data) ? res.data : res.data?.data || []);
                } else if (activeTab === "user") {
                    const res = await api.get("/chat/users", {
                        params: { q: searchQuery.trim() },
                        skipCache: true
                    });
                    if (isMounted) setResults(Array.isArray(res.data) ? res.data : []);
                }
            } catch (err) {
                console.error("Gagal mencari referensi:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }, 200);

        return () => {
            isMounted = false;
            clearTimeout(debounceTimer);
        };
    }, [isOpen, activeTab, searchQuery, canViewTickets, canViewDevices, canViewParts]);

    if (!isOpen) return null;

    return (
        <div className="modal-shell z-[9999]">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs modal-backdrop" onClick={onClose} />
            <div className="modal-panel max-w-lg z-10 flex flex-col h-[520px] max-h-[90dvh]">
                <div className="modal-grabber" />

                {/* Header */}
                <div className="modal-header shrink-0 flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">Tautkan Data ke Pesan</h3>
                        <p className="text-3xs sm:text-2xs text-slate-500 mt-0.5">
                            Pilih tiket, perangkat, suku cadang, atau staf untuk disematkan
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200 shrink-0">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                        {canViewTickets && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("ticket")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                                    activeTab === "ticket"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                }`}
                            >
                                <Ticket className="w-3.5 h-3.5" />
                                <span>Tiket</span>
                            </button>
                        )}

                        {canViewDevices && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("device")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                                    activeTab === "device"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                }`}
                            >
                                <MonitorSmartphone className="w-3.5 h-3.5" />
                                <span>Perangkat</span>
                            </button>
                        )}

                        {canViewParts && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("part")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                                    activeTab === "part"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                }`}
                            >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>Suku Cadang</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setActiveTab("user")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                                activeTab === "user"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Rekan Staf</span>
                        </button>
                    </div>

                    {/* Search Field */}
                    <div className="relative mt-2">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={
                                activeTab === "ticket"
                                    ? "Cari no tiket, pelanggan, atau keluhan..."
                                    : activeTab === "device"
                                    ? "Cari merek, model, atau nomor seri..."
                                    : activeTab === "part"
                                    ? "Cari nama part atau kode SKU..."
                                    : "Cari nama staf atau username..."
                            }
                            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* List Body */}
                <div className="modal-body overflow-y-auto flex-1 p-2 sm:p-3 divide-y divide-slate-100 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Mencari data...</span>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p className="text-xs">Tidak ada data yang ditemukan.</p>
                        </div>
                    ) : (
                        results.map((item) => {
                            if (activeTab === "ticket") {
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect({
                                                type: "ticket",
                                                id: item.id,
                                                label: item.nomor_tiket
                                            });
                                            onClose();
                                        }}
                                        className="w-full p-2.5 text-left rounded-xl hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-xs text-blue-700">
                                                    {item.nomor_tiket}
                                                </span>
                                                <span className="text-3xs uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-800 font-medium truncate mt-0.5">
                                                {item.perangkat?.customer?.nama || item.customer_nama || "Pelanggan"} &bull; {item.perangkat?.merek} {item.perangkat?.model}
                                            </p>
                                            <p className="text-3xs text-slate-500 truncate mt-0.5">
                                                {item.keluhan || "-"}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                );
                            }

                            if (activeTab === "device") {
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect({
                                                type: "device",
                                                id: item.id,
                                                label: `${item.merek} ${item.model}`
                                            });
                                            onClose();
                                        }}
                                        className="w-full p-2.5 text-left rounded-xl hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-slate-900 truncate">
                                                    {item.merek} {item.model}
                                                </span>
                                                <span className="text-3xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                                    {item.jenis_perangkat}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 truncate mt-0.5">
                                                Pemilik: {item.customer?.nama || "-"}
                                            </p>
                                            <p className="text-3xs text-slate-400 font-mono mt-0.5">
                                                S/N: {item.serial_number || "-"}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                );
                            }

                            if (activeTab === "part") {
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect({
                                                type: "part",
                                                id: item.id,
                                                label: item.nama
                                            });
                                            onClose();
                                        }}
                                        className="w-full p-2.5 text-left rounded-xl hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-xs text-slate-900 truncate">
                                                    {item.nama}
                                                </span>
                                                <span className="font-mono font-bold text-xs text-blue-700 shrink-0">
                                                    {formatRupiah(item.harga)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-3xs text-slate-500">
                                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                                    SKU: {item.kode_sku || item.kode || `SP-${item.id}`}
                                                </span>
                                                <span>Stok: <strong className={item.stok > 0 ? "text-emerald-700" : "text-rose-700"}>{item.stok}</strong></span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                );
                            }

                            if (activeTab === "user") {
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect({
                                                type: "user",
                                                id: item.id,
                                                label: item.nama
                                            });
                                            onClose();
                                        }}
                                        className="w-full p-2.5 text-left rounded-xl hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                                    >
                                        <div className="min-w-0 flex-1 flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                {item.nama ? item.nama.charAt(0).toUpperCase() : "U"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-xs text-slate-900 truncate">{item.nama}</p>
                                                <p className="text-3xs text-slate-500 truncate">
                                                    @{item.username || "staf"} &bull; <span className="uppercase">{item.role || "Teknisi"}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                );
                            }

                            return null;
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary h-8 px-3 text-xs"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
