import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ExternalLink, Smartphone, RefreshCw } from "lucide-react";
import AppConfig from "../services/config";

const manifestUrl = "/downloads/servio-staging.json";
const apkUrl = "/downloads/servio-staging.apk";

export default function DownloadApp() {
    const [release, setRelease] = useState(null);
    const [loading, setLoading] = useState(!AppConfig.isNative);
    const [installPrompt, setInstallPrompt] = useState(null);

    useEffect(() => {
        if (AppConfig.isNative) return;
        const controller = new AbortController();
        fetch(manifestUrl, { cache: "no-store", signal: controller.signal })
            .then(response => {
                if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("APK unavailable");
                return response.json();
            })
            .then(data => {
                if (data?.commit && Number.isInteger(data.versionCode)) setRelease(data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        const onInstall = event => {
            event.preventDefault();
            setInstallPrompt(event);
        };
        window.addEventListener("beforeinstallprompt", onInstall);
        return () => {
            controller.abort();
            window.removeEventListener("beforeinstallprompt", onInstall);
        };
    }, []);

    const installPwa = async () => {
        if (!installPrompt) return;
        await installPrompt.prompt();
        setInstallPrompt(null);
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
            <div className="mx-auto max-w-2xl">
                <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700">← Kembali ke login</Link>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Smartphone size={22} /></div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Serv.io Staging</p>
                            <h1 className="text-xl font-bold text-slate-900">Pasang aplikasi staf</h1>
                        </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">Pilih aplikasi Android atau pasang versi web (PWA) dari browser. Keduanya menggunakan sistem staging yang sama.</p>

                    <section className="mt-7 rounded-xl border border-slate-200 p-4 sm:p-5">
                        <h2 className="font-semibold text-slate-900">Android APK</h2>
                        <p className="mt-1 text-sm text-slate-500">File APK dibangun ulang dari kode pada setiap deploy staging.</p>
                        {release && !AppConfig.isNative ? (
                            <>
                                <a href={`${apkUrl}?v=${encodeURIComponent(release.commit)}`} download="servio-staging.apk" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Download size={16} /> Unduh APK staging</a>
                                <p className="mt-2 text-xs text-slate-500">Build #{release.versionCode} · Commit {release.commit.slice(0, 7)}</p>
                            </>
                        ) : (
                            <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">{AppConfig.isNative ? "Buka halaman ini di browser untuk mengunduh APK." : loading ? <><RefreshCw size={15} className="animate-spin" /> Memeriksa APK…</> : "APK belum tersedia di server."}</p>
                        )}
                        <p className="mt-3 text-xs leading-5 text-amber-700">Versi staging masih memakai tanda tangan debug sementara. Hapus instalasi Serv.io lama sebelum memasang APK baru. Data lokal yang belum tersinkron akan hilang.</p>
                    </section>

                    <section className="mt-4 rounded-xl border border-slate-200 p-4 sm:p-5">
                        <h2 className="font-semibold text-slate-900">Web / PWA</h2>
                        <p className="mt-1 text-sm text-slate-500">Buka web staging untuk versi yang diperbarui saat deploy. Di Chrome Android, pilih menu ⋮ lalu “Tambahkan ke Layar utama” bila tombol pasang tidak muncul.</p>
                        {installPrompt ? (
                            <button type="button" onClick={installPwa} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Smartphone size={16} /> Pasang PWA</button>
                        ) : (
                            <Link to="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">Buka web staging <ExternalLink size={15} /></Link>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
