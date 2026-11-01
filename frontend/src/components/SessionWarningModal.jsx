import { useEffect } from "react";
import { AlertCircle, Clock, ShieldCheck, LogOut } from "lucide-react";

/**
 * Dialog Peringatan Sesi Hampir Berakhir (Idle Warning Prompt)
 * 
 * Muncul beberapa menit sebelum sesi idle otomatis dikunci, memberikan kesempatan
 * bagi teknisi atau staf kasir untuk memperpanjang sesi dengan satu klik tanpa interupsi.
 */
export default function SessionWarningModal({
    isOpen,
    remainingSeconds = 120,
    onExtend,
    onLockNow
}) {
    if (!isOpen) return null;

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    // Hitung persentase progress (dari 120 detik)
    const maxSeconds = 120;
    const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / maxSeconds) * 100));

    return (
        <div 
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="warning-title"
        >
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
                {/* Visual Progress Bar on top */}
                <div className="w-full bg-amber-100 h-1.5">
                    <div 
                        className="bg-amber-500 h-1.5 transition-all duration-1000 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="p-6 text-center">
                    {/* Glowing Icon */}
                    <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm">
                        <Clock className="w-7 h-7 animate-pulse text-amber-500" />
                    </div>

                    <h3 id="warning-title" className="text-lg font-bold text-slate-900 mb-1">
                        Apakah Anda Masih di Sana?
                    </h3>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                        Sistem mendeteksi tidak ada aktivitas interaksi. Sesi Anda akan dikunci otomatis demi keamanan data dalam:
                    </p>

                    {/* Countdown Badge */}
                    <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                        <span className="font-mono text-2xl font-extrabold text-amber-700 tracking-wider">
                            {formattedTime}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2.5">
                        <button
                            type="button"
                            onClick={onExtend}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Tetap Masuk (Saya Masih Bekerja)</span>
                        </button>

                        <button
                            type="button"
                            onClick={onLockNow}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-xl text-xs transition-colors"
                        >
                            Kunci Sesi Sekarang
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
