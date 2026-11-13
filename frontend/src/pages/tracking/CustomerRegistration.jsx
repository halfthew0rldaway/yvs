import { useState } from "react";
import { Link } from "react-router-dom";
import {
    CheckCircle2, ShieldCheck, Wrench, UserRound, Laptop, Monitor,
    Printer, Smartphone, HardDrive, Gamepad2, Boxes, MessageSquareText
} from "lucide-react";
import api from "../../services/api";

const DEVICE_TYPES = [
    { value: "Laptop", label: "Laptop", icon: Laptop },
    { value: "Desktop PC", label: "PC Desktop", icon: Monitor },
    { value: "Printer", label: "Printer", icon: Printer },
    { value: "Smartphone", label: "Smartphone", icon: Smartphone },
    { value: "Penyimpanan (HDD/SSD)", label: "HDD / SSD", icon: HardDrive },
    { value: "Konsol Game", label: "Konsol Game", icon: Gamepad2 },
    { value: "Lainnya", label: "Lainnya", icon: Boxes }
];
const emptyForm = {
    nama: "", nomor_telepon: "", alamat: "", jenis_perangkat: "Laptop",
    merek: "", model: "", keluhan: "", harapan: ""
};
const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-normal text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function CustomerRegistration() {
    const [status, setStatus] = useState("ready");
    const [form, setForm] = useState(emptyForm);
    const [website, setWebsite] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

    async function submit(e) {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        setError("");
        try {
            await api.post("/customer-registration/submit", { ...form, website });
            setStatus("done");
        } catch (err) {
            setError(err.response?.data?.message || "Gagal mengirim data. Silakan coba lagi.");
        } finally {
            setSaving(false);
        }
    }

    const field = (name, label, options = {}) => (
        <label className="block text-sm font-semibold text-slate-700" key={name}>
            {label}{options.required && <span className="text-red-500"> *</span>}
            <input
                className={inputClass}
                value={form[name]}
                onChange={(e) => setField(name, e.target.value)}
                required={options.required}
                maxLength={options.maxLength}
                type={options.type || "text"}
                autoComplete={options.autoComplete}
                placeholder={options.placeholder}
            />
        </label>
    );

    return (
        <main className="min-h-screen bg-slate-50 px-3 py-5 sm:px-5 sm:py-8 lg:px-8">
            <div className="w-full">
                <header className="mb-5 flex items-center gap-3 sm:mb-7">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                        <Wrench size={21} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-slate-900 sm:text-2xl">Data Pelanggan & Perangkat</h1>
                        <p className="text-xs text-slate-500 sm:text-sm">Yangversa Computer · Persiapan penerimaan servis</p>
                    </div>
                </header>

                {status === "done" ? (
                    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
                        <CheckCircle2 className="mx-auto mb-3 text-emerald-600" size={40} />
                        <h2 className="text-lg font-bold text-slate-900">Data berhasil dikirim</h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Petugas akan memeriksa data Anda sebelum menyimpannya sebagai pelanggan dan perangkat. Belum ada tiket servis yang dibuat.</p>
                    </section>
                ) : (
                    <form onSubmit={submit}>
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700 sm:text-sm">
                            <ShieldCheck size={17} className="mt-0.5 shrink-0" />
                            <span>Isi data sebelum menyerahkan perangkat. Petugas akan memeriksanya terlebih dahulu.</span>
                        </div>
                        <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                            Situs web<input name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
                        </label>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
                            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-4">
                                <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <UserRound size={18} className="text-blue-600" />
                                    <h2 className="text-base font-bold text-slate-900">Data Anda</h2>
                                </div>
                                <div className="space-y-4">
                                    {field("nama", "Nama lengkap", { required: true, maxLength: 100, autoComplete: "name" })}
                                    {field("nomor_telepon", "Nomor WhatsApp / telepon", { required: true, maxLength: 20, type: "tel", autoComplete: "tel", placeholder: "08..." })}
                                    {field("alamat", "Alamat", { required: true, maxLength: 255, autoComplete: "street-address" })}
                                </div>
                            </section>

                            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-4">
                                <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <Laptop size={18} className="text-blue-600" />
                                    <h2 className="text-base font-bold text-slate-900">Perangkat Anda</h2>
                                </div>
                                <fieldset>
                                    <legend className="mb-2 text-sm font-semibold text-slate-700">Jenis perangkat <span className="text-red-500">*</span></legend>
                                    <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                                        {DEVICE_TYPES.map(({ value, label, icon: Icon }) => (
                                            <button
                                                type="button"
                                                key={value}
                                                aria-pressed={form.jenis_perangkat === value}
                                                onClick={() => setField("jenis_perangkat", value)}
                                                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${form.jenis_perangkat === value
                                                    ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/40"}`}
                                            >
                                                <Icon size={18} strokeWidth={1.8} />
                                                <span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                                    {field("merek", "Merek / brand", { required: true, maxLength: 100, placeholder: "Contoh: ASUS" })}
                                    {field("model", "Model / seri", { required: true, maxLength: 100, placeholder: "Contoh: VivoBook 14" })}
                                </div>
                                <p className="mt-3 text-xs text-slate-500">Nomor seri akan dicatat petugas saat pemeriksaan unit.</p>
                            </section>

                            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:col-span-2 lg:col-span-4">
                                <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <MessageSquareText size={18} className="text-blue-600" />
                                    <h2 className="text-base font-bold text-slate-900">Kebutuhan Servis</h2>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { name: "keluhan", label: "Keluhan / masalah", required: true, placeholder: "Jelaskan masalah yang dialami perangkat (minimal 10 karakter)" },
                                        { name: "harapan", label: "Hasil yang diharapkan (opsional)", required: false, placeholder: "Contoh: data tetap aman, ingin selesai sebelum Jumat" }
                                    ].map(item => (
                                        <label key={item.name} className="block text-sm font-semibold text-slate-700">
                                            {item.label}{item.required && <span className="text-red-500"> *</span>}
                                            <textarea
                                                className={`${inputClass} min-h-28 resize-y`}
                                                value={form[item.name]}
                                                onChange={(e) => setField(item.name, e.target.value)}
                                                required={item.required}
                                                minLength={item.required ? 10 : undefined}
                                                maxLength={1000}
                                                placeholder={item.placeholder}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                            <div>
                                {error && <p role="alert" className="mb-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                                <p className="text-xs text-slate-500">Petugas tetap memeriksa unit, kelengkapan, dan persetujuan servis secara langsung.</p>
                            </div>
                            <button type="submit" disabled={saving} className="shrink-0 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60">
                                {saving ? "Mengirim..." : "Kirim data ke petugas"}
                            </button>
                        </div>
                    </form>
                )}
                <div className="mt-5 text-center">
                    <Link to="/tracking" className="text-xs font-semibold text-blue-600 hover:underline">Kembali ke pelacakan servis</Link>
                </div>
            </div>
        </main>
    );
}
