import { useState, useEffect } from "react";
import { Bluetooth, RefreshCw, X, CheckCircle2, AlertCircle, Signal, Printer, Radio, ChevronRight, Check } from "lucide-react";
import { BluetoothService, isNativePlatform } from "../services/nativeServices";
import toast from "react-hot-toast";

export default function BluetoothModal({ isOpen, onClose }) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [devices, setDevices] = useState([]);
    const [connectedDeviceId, setConnectedDeviceId] = useState(null);
    const [connectingId, setConnectingId] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");

    const checkStatus = async () => {
        try {
            const enabled = await BluetoothService.isEnabled();
            setIsEnabled(enabled);
            setStatusMessage(enabled ? "Bluetooth Aktif & Siap Digunakan" : "Bluetooth Non-aktif / Dimatikan");
        } catch (e) {
            setIsEnabled(false);
            setStatusMessage("Gagal memeriksa status modul Bluetooth");
        }
    };

    useEffect(() => {
        if (isOpen) {
            checkStatus();
        } else {
            setScanning(false);
        }
    }, [isOpen]);

    const handleEnable = async () => {
        try {
            const ok = await BluetoothService.requestEnable();
            if (ok) {
                setIsEnabled(true);
                setStatusMessage("Bluetooth Aktif & Siap Digunakan");
                toast.success("Bluetooth berhasil diaktifkan");
            } else {
                toast.error("Gagal mengaktifkan Bluetooth. Mohon aktifkan manual di pengaturan perangkat.");
            }
        } catch (err) {
            toast.error(err.message || "Error saat mengaktifkan Bluetooth");
        }
    };

    const handleScan = async () => {
        setScanning(true);
        setDevices([]);
        const toastId = toast.loading("Memindai perangkat Bluetooth terdekat (6 detik)...");
        try {
            const found = await BluetoothService.scanDevices(6000);
            setDevices(found);
            if (found.length === 0) {
                toast("Tidak ada perangkat Bluetooth ditemukan dalam jangkauan.", { id: toastId, icon: "ℹ️" });
            } else {
                toast.success(`Ditemukan ${found.length} perangkat Bluetooth`, { id: toastId });
            }
        } catch (err) {
            toast.error(err.message || "Gagal memindai Bluetooth", { id: toastId });
        } finally {
            setScanning(false);
        }
    };

    const handleConnect = async (device) => {
        setConnectingId(device.deviceId);
        try {
            if (connectedDeviceId === device.deviceId) {
                await BluetoothService.disconnect(device.deviceId);
                setConnectedDeviceId(null);
                toast.success(`Terputus dari ${device.name}`);
            } else {
                const ok = await BluetoothService.connect(device.deviceId, () => {
                    setConnectedDeviceId(null);
                    toast("Koneksi Bluetooth terputus", { icon: "🔌" });
                });
                if (ok) {
                    setConnectedDeviceId(device.deviceId);
                    toast.success(`Terhubung ke ${device.name}`);
                } else {
                    toast.success(`Perangkat ${device.name} siap dipasangkan`);
                }
            }
        } catch (err) {
            toast.error(err.message || "Gagal menghubungkan ke perangkat");
        } finally {
            setConnectingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <Bluetooth className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 truncate">Diagnostik & Printer Bluetooth</h3>
                            <p className="text-2xs text-slate-500 truncate">Pindai & pasangkan modul printer thermal / periferal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Tutup Modal"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1">
                    
                    {/* Status Card */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${isEnabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                            <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 block">Adaptor Bluetooth</span>
                                <p className="text-2xs text-slate-500 truncate">{statusMessage}</p>
                            </div>
                        </div>

                        {!isEnabled && isNativePlatform() && (
                            <button
                                onClick={handleEnable}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                            >
                                Aktifkan
                            </button>
                        )}
                    </div>

                    {/* Scan Action */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                        <div>
                            <span className="text-xs font-bold text-slate-900">Perangkat Terdeteksi ({devices.length})</span>
                            <p className="text-3xs text-slate-500">Printer Thermal ESC/POS, Barcode Scanner, dll</p>
                        </div>
                        <button
                            onClick={handleScan}
                            disabled={scanning}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
                            <span>{scanning ? "Memindai..." : "Pindai Perangkat"}</span>
                        </button>
                    </div>

                    {/* Device List */}
                    <div className="space-y-2">
                        {scanning && devices.length === 0 && (
                            <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <Radio className="w-8 h-8 text-blue-500 animate-pulse mx-auto mb-2" />
                                <p className="text-xs font-semibold text-slate-700">Mencari sinyal Bluetooth di sekitar...</p>
                                <p className="text-3xs text-slate-400 mt-1">Pastikan perangkat target dalam mode pairing</p>
                            </div>
                        )}

                        {!scanning && devices.length === 0 && (
                            <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <Bluetooth className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-medium text-slate-500">Belum ada perangkat dipindai</p>
                                <p className="text-3xs text-slate-400 mt-0.5">Klik "Pindai Perangkat" untuk memulai pencarian</p>
                            </div>
                        )}

                        {devices.map((device, idx) => {
                            const isConnected = connectedDeviceId === device.deviceId;
                            const isConnecting = connectingId === device.deviceId;
                            const isPrinter = (device.name || "").toLowerCase().includes("printer") || 
                                              (device.name || "").toLowerCase().includes("pos") ||
                                              (device.name || "").toLowerCase().includes("rpp") ||
                                              (device.name || "").toLowerCase().includes("mpt");

                            return (
                                <div
                                    key={device.deviceId || idx}
                                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                        isConnected
                                            ? "border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-500/10"
                                            : "border-slate-200 hover:border-blue-300 bg-white"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                            isConnected
                                                ? "bg-emerald-100 text-emerald-700"
                                                : isPrinter
                                                ? "bg-indigo-50 text-indigo-600"
                                                : "bg-slate-100 text-slate-600"
                                        }`}>
                                            {isPrinter ? <Printer className="w-4 h-4" /> : <Bluetooth className="w-4 h-4" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-bold text-slate-900 truncate">{device.name}</p>
                                                {isPrinter && (
                                                    <span className="px-1.5 py-0.2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-4xs font-bold rounded">
                                                        PRINTER
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-3xs text-slate-500 font-mono">
                                                <span className="truncate">{device.deviceId}</span>
                                                {device.rssi !== null && (
                                                    <span className="inline-flex items-center gap-0.5 font-sans font-semibold text-slate-600 shrink-0">
                                                        <Signal className="w-2.5 h-2.5 text-blue-500" />
                                                        {device.rssi} dBm
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleConnect(device)}
                                        disabled={isConnecting}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                            isConnected
                                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                                : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200"
                                        }`}
                                    >
                                        {isConnecting ? (
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : isConnected ? (
                                            "Putuskan"
                                        ) : (
                                            "Pasangkan"
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-3xs text-slate-500">
                        {isNativePlatform() ? "Modul Native BLE Android Aktif" : "Web Bluetooth Mode"}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
