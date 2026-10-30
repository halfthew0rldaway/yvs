import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import useRealtimeEvent from "../hooks/useRealtime";
import { Bell, CheckCheck, Send, MessageSquare, AlertTriangle, Info, Wrench, X } from "lucide-react";
import toast from "react-hot-toast";

export default function NotificationBell() {
    const { user, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [memoTitle, setMemoTitle] = useState("");
    const [memoMessage, setMemoMessage] = useState("");
    const [submittingMemo, setSubmittingMemo] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch unread count & notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get("/notifications");
            if (res.data) {
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            }
        } catch (_) {}
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Slow fallback (120s) in case network briefly stalled
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchNotifications();
            }
        }, 120000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Real-Time SSE: Langsung terima notifikasi baru atau pembaruan status baca tanpa menunggu polling
    useRealtimeEvent(["notification:new", "notification:updated"], (data, eventName) => {
        fetchNotifications();
        if (eventName === "notification:new" && data?.judul) {
            toast.custom((t) => (
                <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-sm w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 border border-blue-100`}>
                    <div className="flex-1 w-0">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <Bell className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-xs font-bold text-slate-900">{data.judul}</p>
                                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{data.pesan || "Notifikasi baru masuk"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 4000 });
        }
    });

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (notif) => {
        if (notif.is_read) return;
        try {
            await api.patch(`/notifications/${notif.id}/read`);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (_) {}
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success("Semua notifikasi ditandai dibaca");
        } catch (_) {}
    };

    const handleSendMemo = async (e) => {
        e.preventDefault();
        if (!memoTitle.trim() || !memoMessage.trim()) {
            toast.error("Judul dan pesan memo wajib diisi");
            return;
        }

        setSubmittingMemo(true);
        try {
            await api.post("/notifications/send", {
                recipient_role: isAdmin ? "teknisi" : "admin",
                tipe: "memo",
                judul: memoTitle.trim(),
                pesan: memoMessage.trim()
            });
            toast.success(isAdmin ? "Memo terkirim ke seluruh Teknisi" : "Memo terkirim ke Admin");
            setMemoTitle("");
            setMemoMessage("");
            setIsMemoModalOpen(false);
            fetchNotifications();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengirim memo");
        } finally {
            setSubmittingMemo(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                title="Notifikasi & Memo"
            >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-[10px] font-bold text-white bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:w-96 max-w-[calc(100vw-24px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden popover-surface">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">Notifikasi & Memo</span>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 rounded-full border border-red-200">
                                    {unreadCount} baru
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllRead}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors text-xs flex items-center gap-1"
                                    title="Tandai Semua Dibaca"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-medium hidden sm:inline">Baca Semua</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => { setIsOpen(false); setIsMemoModalOpen(true); }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                                title="Tulis memo baru"
                            >
                                <Send className="w-3 h-3" />
                                <span>Kirim Memo</span>
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                                Belum ada notifikasi atau memo masuk
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const isRestock = notif.tipe === "restock_sparepart";
                                const isMemo = notif.tipe === "memo";

                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleMarkAsRead(notif)}
                                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start ${
                                            notif.is_read ? "opacity-75" : "bg-blue-50/30"
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                            isRestock 
                                                ? "bg-amber-100 text-amber-700" 
                                                : isMemo 
                                                    ? "bg-blue-100 text-blue-700" 
                                                    : "bg-slate-100 text-slate-700"
                                        }`}>
                                            {isRestock ? <Wrench className="w-4 h-4" /> : isMemo ? <MessageSquare className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <h4 className={`text-xs truncate ${notif.is_read ? "font-semibold text-slate-800" : "font-bold text-slate-900"}`}>
                                                    {notif.judul}
                                                </h4>
                                                {!notif.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                {notif.pesan}
                                            </p>
                                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                                                <span>Dari: {notif.sender_nama}</span>
                                                <span>{new Date(notif.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Modal Kirim Memo Kolaborasi */}
            {isMemoModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <Send className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-900">
                                    {isAdmin ? "Kirim Memo ke Teknisi" : "Kirim Memo ke Admin"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMemoModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSendMemo} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Perihal / Judul Singkat</label>
                                <input
                                    type="text"
                                    value={memoTitle}
                                    onChange={(e) => setMemoTitle(e.target.value)}
                                    placeholder="Contoh: Butuh konfirmasi penawaran tiket SRV-..."
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Pesan Memo</label>
                                <textarea
                                    value={memoMessage}
                                    onChange={(e) => setMemoMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Tuliskan catatan, instruksi, atau pertanyaan operasional..."
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 resize-none"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsMemoModalOpen(false)}
                                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingMemo}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>{submittingMemo ? "Mengirim..." : "Kirim Memo"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

