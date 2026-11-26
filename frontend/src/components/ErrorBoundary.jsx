import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return typeof this.props.fallback === "function" 
                    ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
                    : this.props.fallback;
            }

            const errorMessage = this.state.error?.message || String(this.state.error || "");
            const isChunkLoadError = 
                errorMessage.includes("dynamically imported module") ||
                errorMessage.includes("Importing a module script failed") ||
                errorMessage.includes("Loading chunk");

            return (
                <div className="min-h-[50vh] flex items-center justify-center p-6 w-full">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-8 text-center space-y-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${
                            isChunkLoadError ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}>
                            {isChunkLoadError ? <RefreshCw className="w-7 h-7 animate-spin-slow" /> : <AlertTriangle className="w-7 h-7" />}
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                {isChunkLoadError 
                                    ? "Pembaruan Versi Sistem Terdeteksi" 
                                    : (this.props.title || "Terjadi Kendala Memuat Tampilan")}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                                {isChunkLoadError
                                    ? "Aplikasi Yangversa baru saja diperbarui ke versi terbaru di server. Silakan klik tombol di bawah untuk menyegarkan tampilan ke versi terbaru."
                                    : (this.props.description || "Komponen ini mengalami kendala rendering data. Anda dapat mencoba memuat ulang tampilan atau kembali ke halaman utama.")}
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-600 max-h-28 overflow-y-auto break-all">
                                {this.state.error.message || String(this.state.error)}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            {isChunkLoadError ? (
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Muat Versi Terbaru Sekarang</span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={this.handleReset}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Coba Lagi</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window.location.reload()}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Muat Ulang Halaman</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

