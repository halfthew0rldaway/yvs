import React, { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { 
    ShoppingCart, X, Search, Check, Copy, Send, Printer, 
    AlertCircle, Zap, Clock, Package, DollarSign, Filter, RefreshCw
} from "lucide-react";

function formatRupiah(num) {
    if (!num) return "Rp 0";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

export default function RestockManifestModal({ isOpen, onClose }) {
    const [loading, setLoading] = useState(false);
    const [manifestItems, setManifestItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [customSupplierPhone, setCustomSupplierPhone] = useState("");
    const [catatanPesanan, setCatatanPesanan] = useState("");
    const [copied, setCopied] = useState(false);
    
    // Filters & Selection inside Modal
    const [searchQuery, setSearchQuery] = useState("");
    const [urgencyFilter, setUrgencyFilter] = useState("all"); // "all" | "habis" | "menipis" | "urgent_tiket"
    const [selectedItemIds, setSelectedItemIds] = useState(new Set());
    const [orderQuantities, setOrderQuantities] = useState({});

    useEffect(() => {
        if (!isOpen) return;
        fetchManifest();
    }, [isOpen]);

    async function fetchManifest() {
        setLoading(true);
        try {
            const res = await api.get("/sparepart/restock-manifest");
            const items = res.data?.manifest_items || [];
            setManifestItems(items);
            setSuppliers(res.data?.suppliers || []);

            // Inisialisasi seleksi & kuantiti default
            const initialIds = new Set();
            const initialQtys = {};
            items.forEach(item => {
                initialIds.add(item.id);
                initialQtys[item.id] = item.suggested_qty || 5;
            });
            setSelectedItemIds(initialIds);
            setOrderQuantities(initialQtys);

            if (res.data?.suppliers?.length > 0 && !selectedSupplier) {
                setSelectedSupplier(res.data.suppliers[0]);
            }
        } catch (err) {
            console.error("Gagal memuat manifest belanja:", err);
            toast.error("Gagal memuat rekomendasi belanja sparepart");
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    // Toggle Item Selection
    function toggleItem(id) {
        const next = new Set(selectedItemIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedItemIds(next);
    }

    // Toggle All Selection
    function toggleAll(selectAll) {
        if (selectAll) {
            setSelectedItemIds(new Set(filteredItems.map(i => i.id)));
        } else {
            setSelectedItemIds(new Set());
        }
    }

    // Update Quantity
    function updateQty(id, newQty) {
        const val = Math.max(1, Number(newQty) || 1);
        setOrderQuantities(prev => ({ ...prev, [id]: val }));
    }

    // Filter Items
    const filteredItems = manifestItems.filter(item => {
        const matchSearch = (
            item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.brand_nama && item.brand_nama.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.kategori && item.kategori.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        let matchUrgency = true;
        if (urgencyFilter === "habis") matchUrgency = item.stok === 0;
        if (urgencyFilter === "menipis") matchUrgency = item.stok > 0 && item.stok <= 5;
        if (urgencyFilter === "urgent_tiket") matchUrgency = item.demand_active > 0;

        return matchSearch && matchUrgency;
    });

    // Summary Calculations for Selected Items
    const selectedItemsList = manifestItems.filter(i => selectedItemIds.has(i.id));
    const totalSelectedKinds = selectedItemsList.length;
    const totalSelectedUnits = selectedItemsList.reduce((sum, item) => sum + (orderQuantities[item.id] || item.suggested_qty || 1), 0);
    const totalEstimatedCapital = selectedItemsList.reduce((sum, item) => {
        const qty = orderQuantities[item.id] || item.suggested_qty || 1;
        const price = item.last_buy_price || item.harga_beli || 0;
        return sum + (price * qty);
    }, 0);

    // Format Pesan WhatsApp (Zero Emojis, Professional & Clean)
    function generateWhatsAppMessage() {
        const todayStr = new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        const suppName = selectedSupplier ? selectedSupplier : "Supplier / Distributor";

        let lines = [];
        lines.push(`*DAFTAR REORDER SUKU CADANG (MANIFEST BELANJA)*`);
        lines.push(`Toko: YVS Computer / Serv.io`);
        lines.push(`Tanggal: ${todayStr}`);
        lines.push(`Kepada Yth: ${suppName}`);
        lines.push(``);
        lines.push(`Halo, kami ingin melakukan pemesanan ulang suku cadang berikut:`);
        lines.push(``);

        selectedItemsList.forEach((item, index) => {
            const qty = orderQuantities[item.id] || item.suggested_qty || 1;
            const brandStr = item.brand_nama && item.brand_nama.toLowerCase() !== "umum" && item.brand_nama.toLowerCase() !== "lainnya" ? `[${item.brand_nama}] ` : "";
            lines.push(`${index + 1}. ${brandStr}${item.nama} - *${qty} pcs*`);
        });

        lines.push(``);
        lines.push(`*Total Pesanan:* ${totalSelectedKinds} jenis item (${totalSelectedUnits} pcs)`);
        if (totalEstimatedCapital > 0) {
            lines.push(`*Estimasi Nilai HPP Toko:* ${formatRupiah(totalEstimatedCapital)}`);
        }
        if (catatanPesanan.trim()) {
            lines.push(`*Catatan Khusus:* ${catatanPesanan.trim()}`);
        }
        lines.push(``);
        lines.push(`Mohon konfirmasikan ketersediaan stok fisik dan total tagihan faktur pembelian ya bos. Terima kasih.`);

        return lines.join("\n");
    }

    function handleCopyWaText() {
        const text = generateWhatsAppMessage();
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Daftar pesanan berhasil disalin ke clipboard!");
        setTimeout(() => setCopied(false), 2500);
    }

    function handleSendWhatsApp() {
        let phone = (customSupplierPhone || "").replace(/[^0-9]/g, "");
        if (phone.startsWith("0")) phone = "62" + phone.substring(1);

        const text = generateWhatsAppMessage();
        const url = phone 
            ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
            : `https://wa.me/?text=${encodeURIComponent(text)}`;

        window.open(url, "_blank");
    }

    function handlePrintManifest() {
        window.print();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs modal-backdrop" 
                onClick={onClose}
            ></div>

            {/* Modal Dialog (60fps Spring Modal Surface) */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden z-10 border border-slate-200 modal-surface">
                
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shrink-0">
                            <ShoppingCart className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-bold text-slate-900">Manifest Belanja Suku Cadang ke Supplier</h2>
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-3xs font-bold px-2.5 py-0.5 rounded-full">
                                    1-Click Restock Manifest
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Agregasi kebutuhan stok supplier berdasarkan stok habis, menipis, dan permintaan tiket servis aktif
                            </p>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header Toolbar: Supplier & Destination */}
                <div className="p-4 sm:p-5 bg-white border-b border-slate-100 space-y-3 shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Supplier Tujuan
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    list="supplier-options"
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                    placeholder="Ketik atau pilih nama supplier..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                />
                                <datalist id="supplier-options">
                                    {suppliers.map((s, idx) => (
                                        <option key={idx} value={s} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                No. WhatsApp Supplier (Opsional)
                            </label>
                            <input
                                type="text"
                                value={customSupplierPhone}
                                onChange={(e) => setCustomSupplierPhone(e.target.value)}
                                placeholder="Misal: 081234567890"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Catatan Tambahan Pemesanan
                            </label>
                            <input
                                type="text"
                                value={catatanPesanan}
                                onChange={(e) => setCatatanPesanan(e.target.value)}
                                placeholder="Misal: Kirim kurir instant / packing kayu..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Filter & Metric Counters */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        {/* Search & Urgency Pills */}
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                            <div className="relative min-w-[200px]">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari sparepart..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setUrgencyFilter("all")}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        urgencyFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    Semua ({manifestItems.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUrgencyFilter("habis")}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        urgencyFilter === "habis" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                    }`}
                                >
                                    Stok Habis ({manifestItems.filter(i => i.stok === 0).length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUrgencyFilter("urgent_tiket")}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        urgencyFilter === "urgent_tiket" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                    }`}
                                >
                                    Tiket Aktif ({manifestItems.filter(i => i.demand_active > 0).length})
                                </button>
                            </div>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex items-center gap-2 text-xs font-medium self-end sm:self-auto bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span>Item: <strong className="text-slate-900">{totalSelectedKinds}</strong> jenis</span>
                            <span className="text-slate-300">|</span>
                            <span>Qty: <strong className="text-slate-900">{totalSelectedUnits}</strong> pcs</span>
                            <span className="text-slate-300">|</span>
                            <span>Est. Modal: <strong className="text-emerald-700 font-bold">{formatRupiah(totalEstimatedCapital)}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                            <span>Menganalisis kebutuhan restok suku cadang...</span>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                        <th className="py-2.5 px-3 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                checked={filteredItems.length > 0 && filteredItems.every(i => selectedItemIds.has(i.id))}
                                                onChange={(e) => toggleAll(e.target.checked)}
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-2.5 px-3 font-bold">Nama Suku Cadang</th>
                                        <th className="py-2.5 px-3 font-bold">Kategori & Brand</th>
                                        <th className="py-2.5 px-3 font-bold text-center">Stok Toko</th>
                                        <th className="py-2.5 px-3 font-bold text-center">Kuantitas Pesan</th>
                                        <th className="py-2.5 px-3 font-bold text-right">Harga Beli Terakhir</th>
                                        <th className="py-2.5 px-3 font-bold text-right">Subtotal Modal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.map(item => {
                                        const isSelected = selectedItemIds.has(item.id);
                                        const qty = orderQuantities[item.id] || item.suggested_qty || 1;
                                        const unitPrice = item.last_buy_price || item.harga_beli || 0;
                                        const subtotal = qty * unitPrice;

                                        return (
                                            <tr 
                                                key={item.id} 
                                                className={`transition-colors hover:bg-slate-50/80 ${
                                                    isSelected ? "bg-white" : "bg-slate-50/40 opacity-60"
                                                }`}
                                            >
                                                <td className="py-2.5 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleItem(item.id)}
                                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800">{item.nama}</span>
                                                        {item.urgency === "urgent_tiket" && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                                                <Zap className="w-3 h-3 text-blue-600 fill-current" />
                                                                Dibutuhkan {item.demand_active}x Tiket
                                                            </span>
                                                        )}
                                                        {item.urgency === "habis" && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                                                Habis
                                                            </span>
                                                        )}
                                                        {item.urgency === "menipis" && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                <Clock className="w-3 h-3 text-amber-600" />
                                                                Menipis
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.last_supplier && (
                                                        <span className="text-3xs text-slate-400 block mt-0.5">
                                                            Supplier terakhir: {item.last_supplier}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600">
                                                    <span>{item.brand_nama} &bull; {item.kategori}</span>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                                        item.stok === 0 
                                                            ? "bg-rose-50 text-rose-700 border border-rose-200" 
                                                            : "bg-amber-50 text-amber-800 border border-amber-200"
                                                    }`}>
                                                        {item.stok}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <div className="inline-flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQty(item.id, qty - 1)}
                                                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors border-r border-slate-200"
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={qty}
                                                            onChange={(e) => updateQty(item.id, e.target.value)}
                                                            className="w-12 text-center text-xs font-bold text-slate-900 outline-none py-1"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQty(item.id, qty + 1)}
                                                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors border-l border-slate-200"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                                    {formatRupiah(unitPrice)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                                    {formatRupiah(subtotal)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-bold text-slate-700 text-xs">Semua Stok Suku Cadang Dalam Kondisi Aman</p>
                            <p className="text-slate-400 text-xs mt-0.5">Tidak ada item yang menipis atau dibutuhkan oleh tiket aktif saat ini.</p>
                        </div>
                    )}
                </div>

                {/* Footer Controls & WhatsApp Integration */}
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-slate-500">
                        {totalSelectedKinds > 0 ? (
                            <span>Siap memesan <strong>{totalSelectedKinds} item</strong> ({totalSelectedUnits} pcs) ke supplier.</span>
                        ) : (
                            <span className="text-rose-600">Pilih minimal 1 item untuk membuat manifest belanja.</span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={handleCopyWaText}
                            disabled={totalSelectedKinds === 0}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                            <span>{copied ? "Tersalin!" : "Salin Format WA"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSendWhatsApp}
                            disabled={totalSelectedKinds === 0}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-green-600/20 disabled:opacity-50"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim ke WhatsApp</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

