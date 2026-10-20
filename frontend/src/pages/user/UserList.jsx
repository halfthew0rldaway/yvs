import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import {
    Users,
    ShieldCheck,
    Wrench,
    Trophy,
    Plus,
    Search,
    Edit2,
    Trash2,
    Key,
    Clock,
    DollarSign,
    CheckCircle2,
    X,
    TrendingUp,
    UserCheck,
    Briefcase
} from "lucide-react";
import TableContainer from "../../components/common/TableContainer";
import Pagination from "../../components/common/Pagination";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableLoadingState from "../../components/common/TableLoadingState";

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("users"); // 'users' | 'performance'
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    // Standardized Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        nama: "",
        email: "",
        password: "",
        role: "teknisi"
    });
    const [submitting, setSubmitting] = useState(false);

    // Reset Password Modal
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        fetchData();
    }, [currentPage, pageSize, roleFilter]);

    async function fetchData(targetSearch = searchTerm, page = currentPage) {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pageSize,
            };
            if (roleFilter) params.role = roleFilter;
            if (targetSearch.trim()) params.search = targetSearch.trim();

            const [usersRes, perfRes] = await Promise.all([
                api.get("/users", { params }),
                api.get("/users/performance")
            ]);

            if (usersRes.data && usersRes.data.pagination) {
                setUsers(usersRes.data.data);
                setTotalItems(usersRes.data.pagination.total);
                setTotalPages(usersRes.data.pagination.totalPages);
            } else if (Array.isArray(usersRes.data)) {
                let filtered = usersRes.data;
                if (roleFilter) filtered = filtered.filter(u => u.role === roleFilter);
                if (targetSearch.trim()) {
                    const q = targetSearch.toLowerCase();
                    filtered = filtered.filter(u => u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
                }
                setTotalItems(filtered.length);
                setTotalPages(Math.ceil(filtered.length / pageSize) || 1);
                const start = (page - 1) * pageSize;
                setUsers(filtered.slice(start, start + pageSize));
            }

            setPerformance(perfRes.data);
        } catch (err) {
            console.error(err);
            toast.error("Gagal memuat data pengguna & performa");
        } finally {
            setLoading(false);
        }
    }

    // Handlers
    function handleOpenCreateModal() {
        setModalMode("create");
        setSelectedUser(null);
        setFormData({ nama: "", email: "", password: "", role: "teknisi" });
        setIsModalOpen(true);
    }

    function handleOpenEditModal(user) {
        setModalMode("edit");
        setSelectedUser(user);
        setFormData({
            nama: user.nama,
            email: user.email,
            password: "",
            role: user.role
        });
        setIsModalOpen(true);
    }

    function handleOpenResetModal(user) {
        setSelectedUser(user);
        setNewPassword("");
        setIsResetModalOpen(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!formData.nama || !formData.email) {
            toast.error("Nama dan email wajib diisi");
            return;
        }

        setSubmitting(true);
        try {
            if (modalMode === "create") {
                if (!formData.password) {
                    toast.error("Password wajib diisi untuk user baru");
                    setSubmitting(false);
                    return;
                }
                const res = await api.post("/users", formData);
                toast.success(res.data.message || "User berhasil ditambahkan");
            } else {
                const res = await api.put(`/users/${selectedUser.id}`, formData);
                toast.success(res.data.message || "User berhasil diperbarui");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleResetPasswordSubmit(e) {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password minimal 6 karakter");
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.put(`/users/${selectedUser.id}`, { password: newPassword });
            toast.success("Password berhasil direset!");
            setIsResetModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal mereset password");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id, nama) {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${nama}"?`)) return;

        try {
            const res = await api.delete(`/users/${id}`);
            toast.success(res.data.message || "User berhasil dihapus");
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Gagal menghapus user");
        }
    }

    // Derived Statistics
    const totalUsersCount = users.length;
    const adminCount = users.filter(u => u.role === "admin").length;
    const teknisiCount = users.filter(u => u.role === "teknisi").length;
    const topPerformer = performance.length > 0 ? performance[0] : null;

    // Filtered Users
    const filteredUsers = users.filter(u => {
        if (roleFilter && u.role !== roleFilter) return false;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            return u.nama.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
        }
        return true;
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen Staf & Performa</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola akun staf, teknisi, dan pantau indikator kinerja (KPI)</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah User</span>
                </button>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Staf</p>
                        <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalUsersCount}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin System</p>
                        <p className="text-2xl font-bold text-slate-900 mt-0.5">{adminCount}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teknisi Aktif</p>
                        <p className="text-2xl font-bold text-slate-900 mt-0.5">{teknisiCount}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Performer</p>
                        <p className="text-base font-bold text-slate-900 mt-0.5 truncate">
                            {topPerformer ? topPerformer.nama : "-"}
                        </p>
                        {topPerformer && (
                            <p className="text-[11px] text-emerald-600 font-semibold">{topPerformer.completedCount} tiket selesai</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === "users"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <UserCheck className="w-4 h-4" />
                    <span>Daftar Akun User</span>
                </button>
                <button
                    onClick={() => setActiveTab("performance")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === "performance"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    <span>Analitik Performa Teknisi</span>
                </button>
            </div>

            {/* TAB 1: USER LIST */}
            {activeTab === "users" && (
                <div className="space-y-4">
                    {/* Controls Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nama atau email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setRoleFilter("")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                                    !roleFilter ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"
                                }`}
                            >
                                Semua Role
                            </button>
                            <button
                                onClick={() => setRoleFilter("admin")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                                    roleFilter === "admin" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"
                                }`}
                            >
                                Admin
                            </button>
                            <button
                                onClick={() => setRoleFilter("teknisi")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                                    roleFilter === "teknisi" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"
                                }`}
                            >
                                Teknisi
                            </button>
                        </div>
                    </div>

                    <TableContainer
                        footer={
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                pageSize={pageSize}
                                onPageChange={(p) => setCurrentPage(p)}
                                onPageSizeChange={(size) => {
                                    setPageSize(size);
                                    setCurrentPage(1);
                                }}
                                unitLabel="user"
                                disabled={loading}
                            />
                        }
                    >
                        {loading ? (
                            <TableLoadingState message="Memuat daftar pengguna & staf..." />
                        ) : users.length === 0 ? (
                            <TableEmptyState
                                icon={Users}
                                title="Pengguna Tidak Ditemukan"
                                description="Tidak ada data akun user yang cocok dengan kriteria filter atau pencarian Anda."
                                actionLabel={searchTerm || roleFilter ? "Reset Filter" : "Tambah User Baru"}
                                onAction={searchTerm || roleFilter ? () => { setSearchTerm(""); setRoleFilter(""); setCurrentPage(1); } : handleOpenCreateModal}
                            />
                        ) : (
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 shadow-[0_1px_0_0_#e2e8f0]">
                                    <tr>
                                        <th className="px-6 py-3.5">User</th>
                                        <th className="px-6 py-3.5">Email</th>
                                        <th className="px-6 py-3.5">Role</th>
                                        <th className="px-6 py-3.5">Statistik Tiket</th>
                                        <th className="px-6 py-3.5">Tgl Dibuat</th>
                                        <th className="px-6 py-3.5 text-right w-28">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                                                        u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"
                                                    }`}>
                                                        {u.nama.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-slate-900">{u.nama}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-mono text-xs">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                    u.role === "admin"
                                                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                                }`}>
                                                    {u.role === "admin" ? <ShieldCheck className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                                                    <span className="capitalize">{u.role}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600">
                                                {u.role === "teknisi" ? (
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                                                            Assigned: {u.stats?.totalAssigned || 0}
                                                        </span>
                                                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                                                            Selesai: {u.stats?.completedCount || 0}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Administrator</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {new Date(u.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenResetModal(u)}
                                                        title="Reset Password"
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(u)}
                                                        title="Edit User"
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(u.id, u.nama)}
                                                        title="Hapus User"
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </TableContainer>
                </div>
            )}

            {/* TAB 2: TECHNICIAN PERFORMANCE ANALYTICS */}
            {activeTab === "performance" && (
                <div className="space-y-6">
                    {/* Performance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {performance.map((item, idx) => (
                            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                                {idx === 0 && (
                                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                        <Trophy className="w-3 h-3" /> #1 Top Performer
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                            {item.nama.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-base">{item.nama}</h3>
                                            <p className="text-xs text-slate-500">{item.email}</p>
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                                        <div className="bg-slate-50 p-2.5 rounded-xl">
                                            <span className="text-slate-400 block font-medium">Total Ditugaskan</span>
                                            <span className="text-sm font-bold text-slate-800">{item.totalAssigned} Tiket</span>
                                        </div>

                                        <div className="bg-emerald-50 p-2.5 rounded-xl">
                                            <span className="text-emerald-600 block font-medium">Tiket Selesai</span>
                                            <span className="text-sm font-bold text-emerald-700">{item.completedCount} Tiket</span>
                                        </div>

                                        <div className="bg-indigo-50 p-2.5 rounded-xl">
                                            <span className="text-indigo-600 block font-medium">Dalam Perbaikan</span>
                                            <span className="text-sm font-bold text-indigo-700">{item.inProgressCount} Tiket</span>
                                        </div>

                                        <div className="bg-amber-50 p-2.5 rounded-xl">
                                            <span className="text-amber-600 block font-medium">Nilai Pekerjaan</span>
                                            <span className="text-xs font-bold text-amber-800">{formatCurrency(item.totalRevenue)}</span>
                                        </div>
                                    </div>

                                    {/* Completion Rate Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                                            <span className="text-slate-600">Tingkat Penyelesaian</span>
                                            <span className="font-bold text-blue-600">{item.completionRate}%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: `${item.completionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Speed Metric */}
                                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span>Rata-rata Waktu Perbaikan:</span>
                                    </div>
                                    <span className="font-semibold text-slate-800">
                                        {item.avgRepairHours > 0 ? `${item.avgRepairHours} jam` : "N/A"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CREATE / EDIT USER MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {modalMode === "create" ? "Tambah Staf / User Baru" : "Edit Data User"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Budi Santoso"
                                    value={formData.nama}
                                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="nama@workshop.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    {modalMode === "create" ? "Password" : "Password Baru (Kosongkan jika tidak diubah)"}
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Peran</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="teknisi">Teknisi (Operasional Perbaikan)</option>
                                    <option value="admin">Admin (Akses Full Manajerial)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
                                >
                                    {submitting ? "Simpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL */}
            {isResetModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Reset Password User</h3>
                            <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-4">
                            <p className="text-xs text-slate-500">
                                Masukkan password baru untuk user <span className="font-semibold text-slate-800">{selectedUser?.nama}</span>.
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Password Baru</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="Minimal 6 karakter"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsResetModalOpen(false)}
                                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm disabled:opacity-50"
                                >
                                    {submitting ? "Mereset..." : "Reset Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
