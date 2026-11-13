import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness, ClipboardCheck, Crown, Headset, Package, Plus, Search, ShieldCheck, Trash2, UserRoundCheck, Users, Wrench, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import ConfirmModal from "../../components/ConfirmModal";

const emptyForm = () => ({ name: "", description: "", icon: undefined, permissionCodes: [] });
const asArray = value => Array.isArray(value) ? value : [];
const permissionCodes = role => asArray(role?.permissions).map(item => item?.code).filter(Boolean);
const sameCodes = (a, b) => a.length === b.length && a.every(code => b.includes(code));
const ICON_OPTIONS = [{ key: "shield", Icon: ShieldCheck }, { key: "briefcase", Icon: BriefcaseBusiness }, { key: "headset", Icon: Headset }, { key: "wrench", Icon: Wrench }, { key: "clipboard", Icon: ClipboardCheck }, { key: "package", Icon: Package }];

function RoleIcon({ role }) {
    const props = { className: "h-[18px] w-[18px]" };
    if (role.slug === "admin") return <ShieldCheck {...props} />;
    if (role.slug === "pimpinan") return <Crown {...props} />;
    if (role.slug === "frontman") return <UserRoundCheck {...props} />;
    if (role.slug === "teknisi") return <Wrench {...props} />;
    const Icon = ICON_OPTIONS.find(option => option.key === role.icon)?.Icon || ShieldCheck;
    return <Icon {...props} />;
}

export default function RoleManagement() {
    const [roles, setRoles] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [original, setOriginal] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [confirmation, setConfirmation] = useState(null);

    const load = async () => {
        try {
            setLoadError("");
            const [rolesResponse, catalogResponse] = await Promise.all([
                api.get("/roles", { skipCache: true }),
                api.get("/roles/permissions", { skipCache: true })
            ]);
            if (!Array.isArray(rolesResponse.data) || !Array.isArray(catalogResponse.data) || !catalogResponse.data.length) {
                throw new Error("Data peran atau daftar izin tidak tersedia. Coba muat ulang.");
            }
            setRoles(rolesResponse.data);
            setCatalog(catalogResponse.data.filter(item => item?.code && item?.module));
        } catch (error) {
            setLoadError(error.response?.data?.message || error.message || "Gagal memuat hak akses");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const groups = useMemo(() => {
        const query = search.trim().toLowerCase();
        return catalog.filter(item => !query || `${item.module} ${item.label} ${item.code}`.toLowerCase().includes(query))
            .reduce((result, item) => { (result[item.module] ||= []).push(item); return result; }, {});
    }, [catalog, search]);
    const dirty = form.name !== original.name || form.description !== original.description || form.icon !== original.icon || !sameCodes(form.permissionCodes, original.permissionCodes);
    const finishClose = () => { setOpen(false); setEditing(null); setForm(emptyForm()); setOriginal(emptyForm()); setSearch(""); setConfirmation(null); };
    const close = () => dirty ? setConfirmation({ action: "discard" }) : finishClose();
    const begin = role => {
        const next = role ? { name: role.name || "", description: role.description || "", icon: role.icon || "shield", permissionCodes: permissionCodes(role) } : emptyForm();
        setEditing(role || null);
        setForm(next);
        setOriginal({ ...next, permissionCodes: [...next.permissionCodes] });
        setSearch("");
        setOpen(true);
    };
    const toggle = code => setForm(current => ({ ...current, permissionCodes: current.permissionCodes.includes(code) ? current.permissionCodes.filter(value => value !== code) : [...current.permissionCodes, code] }));
    const toggleGroup = (items, enable) => setForm(current => {
        const codes = items.map(item => item.code);
        return { ...current, permissionCodes: enable ? [...new Set([...current.permissionCodes, ...codes])] : current.permissionCodes.filter(code => !codes.includes(code)) };
    });
    const saveRequest = event => {
        event.preventDefault();
        if (!catalog.length) return toast.error("Daftar izin belum tersedia. Muat ulang sebelum menyimpan.");
        if (!form.name.trim()) return toast.error("Nama peran wajib diisi");
        setConfirmation({ action: "save", step: 1 });
    };
    const save = async () => {
        setSaving(true);
        try {
            const payload = { ...form, name: form.name.trim(), description: form.description.trim(), permissionCodes: [...new Set(form.permissionCodes)] };
            if (editing) await api.put(`/roles/${editing.id}`, payload);
            else await api.post("/roles", payload);
            toast.success("Peran berhasil disimpan");
            finishClose();
            await load();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menyimpan peran");
        } finally { setSaving(false); }
    };
    const remove = async role => {
        setSaving(true);
        try { await api.delete(`/roles/${role.id}`); toast.success("Peran dihapus"); setConfirmation(null); await load(); }
        catch (error) { toast.error(error.response?.data?.message || "Peran tidak dapat dihapus"); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="p-4 text-sm text-slate-500">Memuat pengaturan akses…</div>;
    if (loadError) return <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-slate-800"><p>{loadError}</p><button type="button" className="btn-secondary mt-4" onClick={() => { setLoading(true); load(); }}>Coba lagi</button></div>;
    return <div className="mx-auto max-w-7xl space-y-4 p-3 sm:p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-2xs font-bold uppercase tracking-widest text-blue-600">Pengaturan sistem</p><h1 className="mt-1 text-xl font-bold text-slate-800">Peran & Hak Akses</h1><p className="mt-1 text-xs text-slate-500 sm:text-sm">Kelola peran dan akses tim secara aman.</p></div><button type="button" onClick={() => begin()} className="btn-primary w-full sm:w-auto"><Plus className="h-4 w-4" /> Tambah Peran</button></div></section>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{roles.map(role => <article key={role.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600"><RoleIcon role={role} /></span><div><h2 className="text-sm font-bold text-slate-800">{role.name}</h2>{role.is_system && <span className="mt-0.5 block text-3xs font-semibold tracking-wide text-slate-400">PERAN BAWAAN</span>}</div></div>{!role.is_system && <button type="button" onClick={() => setConfirmation({ action: "delete", step: 1, role })} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Hapus ${role.name}`}><Trash2 className="h-4 w-4" /></button>}</div><p className="mt-3 min-h-9 text-xs text-slate-500">{role.description || "Peran akses operasional."}</p><div className="mt-4 flex items-center border-t border-slate-100 pt-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {role._count?.users || 0} user</span><span className="ml-3">{permissionCodes(role).length} izin</span><button type="button" onClick={() => begin(role)} className="ml-auto rounded-md px-1.5 py-1 font-semibold text-blue-600 hover:bg-blue-50">Atur</button></div></article>)}</section>
        {open && createPortal(<div className="modal-shell z-[100] bg-slate-900/50"><form onSubmit={saveRequest} className="modal-panel h-[88dvh] max-h-[88dvh] max-w-5xl"><header className="modal-header flex items-center justify-between"><div><h2 className="font-bold text-slate-800">{editing ? `Atur ${editing.name}` : "Buat Peran Baru"}</h2><p className="text-xs text-slate-500">Atur informasi peran dan izin aksesnya.</p></div><button type="button" onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup"><X className="h-4 w-4" /></button></header><div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[280px_minmax(0,1fr)]"><aside className="max-h-[38%] shrink-0 overflow-y-auto lg:max-h-none lg:shrink border-b border-slate-200 bg-slate-50 p-4 custom-scrollbar lg:border-b-0 lg:border-r sm:p-5"><h3 className="text-sm font-bold text-slate-800">Informasi Peran</h3><label className="mt-4 block text-xs font-semibold text-slate-700">Nama Peran<input required maxLength="80" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className="input-base mt-1.5 w-full" /></label><label className="mt-3 block text-xs font-semibold text-slate-700">Deskripsi<input maxLength="255" value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} className="input-base mt-1.5 w-full" /></label><p className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800"><strong>{form.permissionCodes.length}</strong> izin dipilih</p></aside><section className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-bold text-slate-800">Konfigurasi Izin</h3><p className="text-xs text-slate-500">Pilih akses sesuai pekerjaan.</p></div><label className="relative sm:w-56"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} className="input-base w-full pl-9" placeholder="Cari izin…" /></label></div><div className="mt-4">{Object.entries(groups).map(([module, items]) => { const selected = items.filter(item => form.permissionCodes.includes(item.code)); const all = items.length > 0 && selected.length === items.length; return <section key={module} className="border-b border-slate-100 py-4 first:pt-0 last:border-0"><div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-semibold capitalize text-slate-800">{module}</h4><p className="text-xs text-slate-500">{selected.length} dari {items.length} izin</p></div><button type="button" onClick={() => toggleGroup(items, !all)} className="text-xs font-semibold text-blue-600">{all ? "Batalkan semua" : "Pilih semua"}</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{items.map(item => { const checked = form.permissionCodes.includes(item.code); return <label key={item.code} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-xs ${checked ? "border-blue-200 bg-blue-50 text-blue-900" : "border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100"}`}><input className="h-4 w-4 shrink-0 cursor-pointer accent-blue-600" type="checkbox" checked={checked} onChange={() => toggle(item.code)} /><span className="flex-1">{item.label}</span><span className="text-3xs font-semibold text-slate-400">{item.action === "view" ? "LIHAT" : "AKSI"}</span></label>; })}</div></section>; })}{!Object.keys(groups).length && <p className="py-10 text-center text-sm text-slate-500">Izin tidak ditemukan.</p>}</div></section></div><footer className="modal-footer"><button type="button" className="btn-secondary" onClick={close}>Batal</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan…" : "Simpan Peran"}</button></footer></form></div>, document.body)}
        <ConfirmModal isOpen={confirmation?.action === "save"} title={confirmation?.step === 1 ? "Tinjau perubahan peran" : "Verifikasi terakhir"} message={confirmation?.step === 1 ? `Peran “${form.name}” akan memiliki ${form.permissionCodes.length} izin. Lanjutkan untuk verifikasi akhir.` : "Anda akan menerapkan perubahan hak akses. Tindakan ini langsung berlaku untuk pengguna terkait."} confirmText={confirmation?.step === 1 ? "Lanjutkan" : "Ya, simpan perubahan"} onCancel={() => setConfirmation(null)} onConfirm={() => confirmation?.step === 1 ? setConfirmation({ action: "save", step: 2 }) : save()} loading={saving} variant={confirmation?.step === 2 ? "warning" : "primary"} />
        <ConfirmModal isOpen={confirmation?.action === "delete"} title={confirmation?.step === 1 ? "Hapus peran?" : "Verifikasi penghapusan"} message={confirmation?.step === 1 ? `Peran “${confirmation?.role?.name}” akan dihapus. Lanjutkan untuk verifikasi akhir.` : "Penghapusan peran tidak dapat dibatalkan."} confirmText={confirmation?.step === 1 ? "Lanjutkan" : "Ya, hapus peran"} onCancel={() => setConfirmation(null)} onConfirm={() => confirmation?.step === 1 ? setConfirmation(current => ({ ...current, step: 2 })) : remove(confirmation?.role)} loading={saving} isDanger />
        <ConfirmModal isOpen={confirmation?.action === "discard"} title="Buang perubahan?" message="Perubahan peran yang belum disimpan akan hilang. Anda yakin ingin menutup editor?" confirmText="Ya, buang perubahan" cancelText="Lanjut edit" onCancel={() => setConfirmation(null)} onConfirm={finishClose} variant="warning" />
    </div>;
}
