import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
    Download, 
    Send, 
    Search, 
    ArrowLeft, 
    Link2, 
    Ticket, 
    MonitorSmartphone, 
    Wrench, 
    User, 
    Lock,
    Clock,
    FileText,
    Share2,
    CheckCheck,
    ChevronDown,
    MessageSquare,
    Sparkles,
    X
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import useRealtimeEvent from "../../hooks/useRealtime";
import InsertReferenceModal from "./InsertReferenceModal";

function formatTimestamp(value) {
    if (!value) return "";
    try {
        return new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(value));
    } catch {
        return "";
    }
}

function formatDateDivider(dateStr) {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return "Hari ini";
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
        return new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(d);
    } catch {
        return "";
    }
}

function formatMessageSnippet(body) {
    if (!body) return "Mulai percakapan baru...";
    return body
        .replace(/\[\[ticket:[^|\]]+(?:\|([^\]]+))?\]\]/g, (_, label) => label ? `🎫 ${label}` : "🎫 Tiket")
        .replace(/\[\[device:[^|\]]+(?:\|([^\]]+))?\]\]/g, (_, label) => label ? `💻 ${label}` : "💻 Perangkat")
        .replace(/\[\[part:[^|\]]+(?:\|([^\]]+))?\]\]/g, (_, label) => label ? `🔧 ${label}` : "🔧 Part")
        .replace(/\[\[user:[^|\]]+(?:\|([^\]]+))?\]\]/g, (_, label) => label ? `@${label}` : "@Staf");
}

function playNotificationChime() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, now + 0.08);
        osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);
    } catch (_) {}
}

const references = {
    ticket: ["tickets.view", "/tiket-servis/"],
    device: ["devices.view", "/perangkat"],
    part: ["inventory.view", "/sparepart"],
    user: [null, "/chat"]
};

function MessageBody({ body, hasPermission, startChat, isOwnMessage }) {
    // Matches tokens like [[ticket:123]], [[ticket:123|SRV-2026-005]], [[device:45|Asus]], [[part:67|SSD]], [[user:89|Budi]]
    const parts = body.split(/(\[\[(?:ticket|device|part|user):[a-zA-Z0-9_\-\.]+(?:\|[^\]\n]+)?\]\])/g);

    return (
        <span className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">
            {parts.map((piece, index) => {
                const match = /^\[\[(ticket|device|part|user):([a-zA-Z0-9_\-\.]+)(?:\|([^\]\n]+))?\]\]$/.exec(piece);
                if (!match) return <span key={index}>{piece}</span>;

                const [_, type, id, rawLabel] = match;

                if (type === "user") {
                    const displayUser = rawLabel ? `@${rawLabel}` : `@Staf #${id}`;
                    return (
                        <button
                            type="button"
                            key={index}
                            onClick={() => startChat(Number(id))}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 my-0.5 rounded-lg text-2xs sm:text-xs font-semibold transition-all cursor-pointer ${
                                isOwnMessage
                                    ? "bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-2xs"
                                    : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs"
                            }`}
                            title={`Buka chat dengan staf #${id}`}
                        >
                            <User className="w-3 h-3 shrink-0" />
                            <span>{displayUser}</span>
                        </button>
                    );
                }

                const [permission, base] = references[type];
                const isPermitted = !permission || hasPermission(permission);

                if (!isPermitted) {
                    const fallbackLabel = rawLabel || `#${id}`;
                    return (
                        <span
                            key={index}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 my-0.5 rounded-lg text-2xs sm:text-xs italic cursor-not-allowed opacity-80 ${
                                isOwnMessage
                                    ? "bg-black/20 text-blue-100 border border-white/20"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                            title="Akses terbatas: Anda tidak memiliki izin untuk melihat modul ini"
                        >
                            <Lock className="w-2.5 h-2.5 shrink-0" />
                            <span>[{type.toUpperCase()} {fallbackLabel}]</span>
                        </span>
                    );
                }

                if (type === "ticket") {
                    const displayTicket = rawLabel ? `Tiket ${rawLabel}` : `Tiket #${id}`;
                    return (
                        <Link
                            key={index}
                            to={`${base}${id}`}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-lg text-2xs sm:text-xs font-bold transition-all ${
                                isOwnMessage
                                    ? "bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-2xs"
                                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs"
                            }`}
                            title={`Buka detail tiket servis ${id}`}
                        >
                            <Ticket className="w-3 h-3 shrink-0" />
                            <span>{displayTicket}</span>
                        </Link>
                    );
                }

                if (type === "device") {
                    const displayDevice = rawLabel ? `Perangkat ${rawLabel}` : `Perangkat #${id}`;
                    const targetUrl = rawLabel ? `${base}?search=${encodeURIComponent(rawLabel)}` : base;
                    return (
                        <Link
                            key={index}
                            to={targetUrl}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-lg text-2xs sm:text-xs font-bold transition-all ${
                                isOwnMessage
                                    ? "bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-2xs"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs"
                            }`}
                            title="Buka master perangkat"
                        >
                            <MonitorSmartphone className="w-3 h-3 shrink-0" />
                            <span>{displayDevice}</span>
                        </Link>
                    );
                }

                if (type === "part") {
                    const displayPart = rawLabel ? `Part ${rawLabel}` : `Part #${id}`;
                    const targetUrl = rawLabel ? `${base}?search=${encodeURIComponent(rawLabel)}` : base;
                    return (
                        <Link
                            key={index}
                            to={targetUrl}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-lg text-2xs sm:text-xs font-bold transition-all ${
                                isOwnMessage
                                    ? "bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-2xs"
                                    : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs"
                            }`}
                            title="Buka katalog suku cadang"
                        >
                            <Wrench className="w-3 h-3 shrink-0" />
                            <span>{displayPart}</span>
                        </Link>
                    );
                }

                return <span key={index}>{piece}</span>;
            })}
        </span>
    );
}

export default function Chat() {
    const { user, hasPermission } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [chats, setChats] = useState([]);
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(() => {
        const idParam = searchParams.get("id");
        return idParam && Number.isSafeInteger(Number(idParam)) ? Number(idParam) : null;
    });
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [query, setQuery] = useState("");
    const [older, setOlder] = useState(false);
    const [busy, setBusy] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [unreadBelowCount, setUnreadBelowCount] = useState(0);

    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const activeChatIdRef = useRef(selected);
    activeChatIdRef.current = selected;

    const handleSelectChat = useCallback((chatId) => {
        setSelected(chatId);
        if (chatId) {
            setSearchParams({ id: String(chatId) }, { replace: true });
        } else {
            setSearchParams({}, { replace: true });
        }
    }, [setSearchParams]);

    useEffect(() => {
        const idParam = searchParams.get("id");
        if (idParam && Number.isSafeInteger(Number(idParam))) {
            const parsed = Number(idParam);
            if (parsed !== activeChatIdRef.current) {
                setSelected(parsed);
            }
        }
    }, [searchParams]);

    const refreshChats = useCallback(async () => {
        try {
            const res = await api.get("/chat", { skipCache: true });
            setChats(res.data || []);
        } catch {
            toast.error("Gagal memuat percakapan tim");
        }
    }, []);

    const scrollToBottom = (behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
        setUnreadBelowCount(0);
        setShowScrollBottom(false);
    };

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const isScrolledUp = distanceFromBottom > 140;
        setShowScrollBottom(isScrolledUp);
        if (!isScrolledUp) {
            setUnreadBelowCount(0);
        }
    };

    const loadMessages = useCallback(async (id, before = null) => {
        if (!id) return;
        if (before) setLoadingOlder(true);

        const scrollContainer = messagesContainerRef.current;
        const previousScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0;

        try {
            const res = await api.get(`/chat/${id}/messages`, {
                params: before ? { before } : {},
                skipCache: true
            });
            const rows = res.data || [];

            if (before) {
                setMessages(prev => [...rows, ...prev]);
                setOlder(rows.length === 50);

                // Preserve scroll position when older messages are prepended
                setTimeout(() => {
                    if (scrollContainer) {
                        scrollContainer.scrollTop = scrollContainer.scrollHeight - previousScrollHeight;
                    }
                }, 20);
            } else {
                setMessages(rows);
                setOlder(rows.length === 50);

                // Auto-scroll to bottom on first load
                setTimeout(() => {
                    scrollToBottom("smooth");
                }, 50);

                // Mark read
                await api.patch(`/chat/${id}/read`);
                setChats(prev => prev.map(c => c.id === id ? { ...c, isUnread: false, unreadCount: 0, lastReadAt: new Date().toISOString() } : c));
            }
        } catch {
            toast.error("Gagal memuat riwayat pesan");
        } finally {
            if (before) setLoadingOlder(false);
        }
    }, []);

    useEffect(() => {
        refreshChats();
    }, [refreshChats]);

    useEffect(() => {
        if (selected) {
            loadMessages(selected);
        } else {
            setMessages([]);
        }
    }, [selected, loadMessages]);

    useEffect(() => {
        let active = true;
        api.get("/chat/users", { params: { q: query }, skipCache: true })
            .then(res => {
                if (active) setUsers(res.data || []);
            })
            .catch(() => {});
        return () => { active = false; };
    }, [query]);

    // Reactive realtime sync for chat events
    useRealtimeEvent("chat:updated", (data) => {
        refreshChats();
        if (activeChatIdRef.current && data.chatId === activeChatIdRef.current) {
            loadMessages(activeChatIdRef.current);
            const container = messagesContainerRef.current;
            const isScrolledUp = container ? (container.scrollHeight - container.scrollTop - container.clientHeight > 140) : false;
            if (isScrolledUp && data.senderId !== user?.id) {
                setUnreadBelowCount(prev => prev + 1);
            }
        } else if (data.senderId && data.senderId !== user?.id) {
            // Received a message in another chat
            playNotificationChime();
            toast((t) => (
                <div 
                    onClick={() => { handleSelectChat(data.chatId); toast.dismiss(t.id); }}
                    className="cursor-pointer max-w-xs"
                >
                    <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{data.senderName || "Rekan Kerja"}</span>
                    </p>
                    <p className="text-2xs text-slate-600 mt-0.5 line-clamp-2">
                        {formatMessageSnippet(data.bodySnippet)}
                    </p>
                </div>
            ), { duration: 4000, id: `chat-notif-${data.chatId}` });
        }
    });

    const startChat = async (targetUserId) => {
        try {
            const res = await api.post("/chat", { user_id: targetUserId });
            await refreshChats();
            handleSelectChat(res.data.id);
            setQuery("");
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal membuka percakapan");
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const trimmed = draft.trim();
        if (!trimmed || busy || !selected) return;

        setBusy(true);
        try {
            await api.post(`/chat/${selected}/messages`, { body: trimmed });
            setDraft("");
            await loadMessages(selected);
            await refreshChats();
            setTimeout(() => {
                scrollToBottom("smooth");
            }, 50);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mengirim pesan");
        } finally {
            setBusy(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleInsertReference = ({ type, id, label }) => {
        const token = label ? `[[${type}:${id}|${label}]]` : `[[${type}:${id}]]`;
        setDraft(prev => {
            const cursor = textareaRef.current?.selectionStart || prev.length;
            const before = prev.slice(0, cursor);
            const after = prev.slice(cursor);
            const spaceBefore = before.length > 0 && !before.endsWith(" ") ? " " : "";
            const spaceAfter = after.length > 0 && !after.startsWith(" ") ? " " : " ";
            return `${before}${spaceBefore}${token}${spaceAfter}${after}`;
        });
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const exportChat = async (format) => {
        try {
            const res = await api.get(`/chat/${selected}/export`, {
                params: { format },
                responseType: "blob",
                skipCache: true
            });
            const filename = `yvs-chat-${selected}.${format}`;
            const file = new File([res.data], filename, {
                type: format === "json" ? "application/json" : "text/plain"
            });

            // Native Share Check (Capacitor Android / Mobile Web)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Ekspor Chat YVS #${selected}`,
                        text: `Salinan arsip percakapan tim Yangversa Computer #${selected}`
                    });
                    toast.success("Dokumen chat berhasil dibagikan!");
                    return;
                } catch (shareErr) {
                    if (shareErr.name === "AbortError") return;
                }
            }

            // Standard Web Fallback Download
            const url = URL.createObjectURL(res.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 1000);
            toast.success(`Arsip chat .${format.toUpperCase()} berhasil diunduh!`);
        } catch {
            toast.error("Gagal mengekspor riwayat percakapan");
        }
    };

    const currentChat = chats.find(c => c.id === selected);
    const otherUser = currentChat?.other;

    return (
        <div className="w-full h-[calc(100dvh-7.25rem)] sm:h-[calc(100dvh-7.75rem)] lg:h-[calc(100dvh-8rem)] min-h-[520px] flex flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            {/* Sidebar List (Left Panel - Wide on Desktop) */}
            <aside className={`w-full md:w-80 lg:w-88 xl:w-96 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 flex-col bg-white ${selected ? "hidden md:flex" : "flex"}`}>
                <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <div>
                                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                                    Chat Internal
                                </h1>
                                <p className="text-3xs text-slate-500 font-medium">Koordinasi Staf & Tim</p>
                            </div>
                        </div>
                        <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200/60 shadow-2xs">
                            1-on-1 Direct
                        </span>
                    </div>

                    <div className="relative mt-3">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-2xs"
                            placeholder="Cari nama staf atau username..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Conversation / User List */}
                <div className="overflow-y-auto flex-1 min-h-0 divide-y divide-slate-100 custom-scrollbar">
                    {query ? (
                        users.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <User className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                <p className="text-xs font-semibold">Staf tidak ditemukan</p>
                                <p className="text-3xs text-slate-400 mt-0.5">Pastikan ejaan nama atau username sudah benar.</p>
                            </div>
                        ) : (
                            users.map((person) => (
                                <button
                                    key={person.id}
                                    type="button"
                                    onClick={() => startChat(person.id)}
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50/70 transition-colors flex items-center gap-3 cursor-pointer group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs group-hover:scale-105 transition-transform">
                                        {person.nama ? person.nama.charAt(0).toUpperCase() : "U"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                                            {person.nama}
                                        </p>
                                        <p className="text-3xs text-slate-500 truncate mt-0.5">
                                            @{person.username || "staf"} &bull; <span className="uppercase font-semibold">{person.role || "Staf"}</span>
                                        </p>
                                    </div>
                                </button>
                            ))
                        )
                    ) : chats.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-bold text-slate-700">Belum ada percakapan aktif</p>
                            <p className="text-3xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                                Gunakan kolom pencarian di atas untuk memulai koordinasi dengan rekan kerja.
                            </p>
                        </div>
                    ) : (
                        chats.map((chat) => {
                            const isCurrent = selected === chat.id;
                            const partnerName = chat.other?.nama || "Mantan Staf";
                            const snippet = formatMessageSnippet(chat.lastMessage?.body);
                            const unreadCount = chat.unreadCount || (chat.isUnread ? 1 : 0);

                            return (
                                <button
                                    key={chat.id}
                                    type="button"
                                    onClick={() => handleSelectChat(chat.id)}
                                    className={`w-full text-left px-3.5 sm:px-4 py-3 transition-all flex items-center gap-3 cursor-pointer relative group ${
                                        isCurrent 
                                            ? "bg-blue-50/90 border-l-4 border-blue-600 shadow-2xs" 
                                            : "hover:bg-slate-50 border-l-4 border-transparent"
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-10 h-10 rounded-full font-extrabold text-xs flex items-center justify-center border shadow-2xs transition-transform group-hover:scale-105 ${
                                            isCurrent
                                                ? "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/20"
                                                : "bg-slate-100 text-slate-700 border-slate-200"
                                        }`}>
                                            {partnerName.charAt(0).toUpperCase()}
                                        </div>
                                        {chat.isUnread && (
                                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white animate-pulse" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <p className={`text-xs truncate ${chat.isUnread ? "font-black text-slate-900" : isCurrent ? "font-bold text-blue-900" : "font-bold text-slate-800"}`}>
                                                {partnerName}
                                            </p>
                                            <span className="text-4xs font-mono text-slate-400 shrink-0">
                                                {formatTimestamp(chat.updatedAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-3xs truncate ${chat.isUnread ? "font-bold text-slate-900" : "text-slate-500"}`}>
                                                {snippet}
                                            </p>
                                            {chat.isUnread && (
                                                <span className="shrink-0 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-4xs font-black shadow-xs animate-pulse">
                                                    {unreadCount > 99 ? "99+" : unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* Conversation Window (Right Panel - Wide Edge-to-Edge) */}
            <section className={`flex-1 min-w-0 flex flex-col bg-slate-50/50 relative ${selected ? "flex" : "hidden md:flex"}`}>
                {selected ? (
                    <>
                        {/* Conversation Header */}
                        <header className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0 shadow-2xs z-10">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <button
                                    type="button"
                                    onClick={() => handleSelectChat(null)}
                                    className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                    title="Kembali ke daftar percakapan"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>

                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                    {otherUser?.nama ? otherUser.nama.charAt(0).toUpperCase() : "U"}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                        {otherUser?.nama || "Percakapan Tim"}
                                    </h2>
                                    <p className="text-3xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                                        <span>@{otherUser?.username || "staf"}</span>
                                        <span>&bull;</span>
                                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold uppercase text-4xs">
                                            {otherUser?.role || "Staf"}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Export Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => exportChat("txt")}
                                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-1 font-semibold cursor-pointer border border-transparent hover:border-blue-200"
                                    title="Unduh Salinan Chat Teks (.TXT)"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">TXT</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => exportChat("json")}
                                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-1 font-semibold cursor-pointer border border-transparent hover:border-blue-200"
                                    title="Unduh Salinan Chat Data (.JSON)"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">JSON</span>
                                </button>
                            </div>
                        </header>

                        {/* Messages Stream Container */}
                        <div
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar relative"
                        >
                            {older && (
                                <div className="text-center pb-2">
                                    <button
                                        type="button"
                                        disabled={loadingOlder}
                                        onClick={() => loadMessages(selected, messages[0]?.id)}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-2xs hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {loadingOlder ? "Memuat..." : "Muat riwayat pesan lebih lama"}
                                    </button>
                                </div>
                            )}

                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700">Belum ada riwayat pesan</p>
                                    <p className="text-3xs text-slate-400 mt-1">Sapa rekan Anda untuk memulai koordinasi teknis.</p>
                                </div>
                            ) : (
                                messages.map((m, index) => {
                                    const isOwn = m.sender_id === user?.id;
                                    const prevMessage = messages[index - 1];
                                    const dateDivider = formatDateDivider(m.created_at);
                                    const prevDateDivider = prevMessage ? formatDateDivider(prevMessage.created_at) : null;
                                    const showDivider = dateDivider && dateDivider !== prevDateDivider;

                                    return (
                                        <div key={m.id} className="space-y-3.5">
                                            {showDivider && (
                                                <div className="flex items-center justify-center my-3">
                                                    <span className="px-3 py-1 bg-white/90 text-slate-500 text-3xs font-bold rounded-full border border-slate-200 shadow-2xs backdrop-blur-xs select-none">
                                                        {dateDivider}
                                                    </span>
                                                </div>
                                            )}

                                            {isOwn ? (
                                                // Balon Chat: Pesan Sendiri (Tail di kanan bawah, gradient modern)
                                                <div className="ml-auto max-w-[86%] sm:max-w-[75%] md:max-w-[65%] group">
                                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-3 sm:p-3.5 rounded-2xl rounded-br-xs shadow-sm shadow-blue-600/15 transition-all">
                                                        <MessageBody
                                                            body={m.body}
                                                            hasPermission={hasPermission}
                                                            startChat={startChat}
                                                            isOwnMessage={true}
                                                        />
                                                        <div className="flex items-center justify-end gap-1.5 mt-1 pt-0.5 select-none">
                                                            <span className="text-4xs font-mono text-blue-100/90">
                                                                {formatTimestamp(m.created_at)}
                                                            </span>
                                                            <CheckCheck className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Balon Chat: Pesan Rekan (Tail di kiri bawah, avatar pendamping)
                                                <div className="mr-auto max-w-[86%] sm:max-w-[75%] md:max-w-[65%] flex items-end gap-2 group">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 font-extrabold text-3xs flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs mb-0.5">
                                                        {m.sender_name ? m.sender_name.charAt(0).toUpperCase() : "U"}
                                                    </div>
                                                    <div className="bg-white text-slate-800 border border-slate-200/90 p-3 sm:p-3.5 rounded-2xl rounded-bl-xs shadow-xs transition-all">
                                                        <span className="text-3xs font-extrabold text-blue-700 block mb-1">
                                                            {m.sender_name}
                                                        </span>
                                                        <MessageBody
                                                            body={m.body}
                                                            hasPermission={hasPermission}
                                                            startChat={startChat}
                                                            isOwnMessage={false}
                                                        />
                                                        <div className="flex items-center justify-end gap-1 mt-1 pt-0.5 select-none">
                                                            <span className="text-4xs font-mono text-slate-400">
                                                                {formatTimestamp(m.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Floating Scroll to Bottom Indicator */}
                        {showScrollBottom && (
                            <button
                                type="button"
                                onClick={() => scrollToBottom("smooth")}
                                className="absolute bottom-20 right-6 z-20 px-3 py-2 rounded-full bg-white border border-slate-200/90 shadow-md text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer animate-bounce"
                                title="Gulir ke pesan terbaru"
                            >
                                <ChevronDown className="w-4 h-4" />
                                {unreadBelowCount > 0 ? (
                                    <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-4xs font-black">
                                        {unreadBelowCount} Baru
                                    </span>
                                ) : (
                                    <span className="text-3xs">Pesan Terkini</span>
                                )}
                            </button>
                        )}

                        {/* Composer Form */}
                        <form
                            onSubmit={handleSendMessage}
                            className="p-3 sm:p-3.5 border-t border-slate-200 bg-white flex items-end gap-2 shrink-0 z-10"
                        >
                            <button
                                type="button"
                                onClick={() => setIsReferenceModalOpen(true)}
                                className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0 cursor-pointer border border-slate-200 hover:border-blue-300"
                                title="Tautkan Tiket, Perangkat, Suku Cadang, atau Rekan Staf"
                            >
                                <Link2 className="w-5 h-5" />
                            </button>

                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={handleKeyDown}
                                maxLength={4000}
                                rows={2}
                                placeholder="Tulis pesan untuk tim... Tekan Enter untuk kirim, Shift+Enter untuk baris baru"
                                className="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                            />

                            <button
                                type="submit"
                                disabled={busy || !draft.trim()}
                                className="h-10 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0 cursor-pointer shadow-xs flex items-center justify-center gap-1.5 font-bold text-xs"
                                aria-label="Kirim Pesan"
                                title="Kirim Pesan (Enter)"
                            >
                                <span className="hidden sm:inline">Kirim</span>
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </>
                ) : (
                    // Rich Empty State When No Chat is Selected (Wide Edge-to-Edge)
                    <div className="m-auto text-center p-6 sm:p-10 max-w-lg">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-200/60">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                            Koordinasi & Chat Internal Tim
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Pilih salah satu percakapan di bilah kiri atau gunakan kolom pencarian untuk memulai chat 1-on-1 dengan rekan teknisi dan pimpinan.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-2xs font-semibold shadow-2xs">
                                <Ticket className="w-3.5 h-3.5 text-blue-600" /> Tautkan Tiket Servis
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-2xs font-semibold shadow-2xs">
                                <Wrench className="w-3.5 h-3.5 text-amber-600" /> Cek Stok Suku Cadang
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-2xs font-semibold shadow-2xs">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Notifikasi Realtime SSE
                            </span>
                        </div>
                    </div>
                )}
            </section>

            {/* Insert Reference Data Modal */}
            <InsertReferenceModal
                isOpen={isReferenceModalOpen}
                onClose={() => setIsReferenceModalOpen(false)}
                onSelect={handleInsertReference}
            />
        </div>
    );
}
