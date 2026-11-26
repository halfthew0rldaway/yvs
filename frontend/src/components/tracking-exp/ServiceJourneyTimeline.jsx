import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardList,
    Search,
    CheckSquare,
    Wrench,
    PackageCheck,
    ArrowRight,
} from "lucide-react";
import { MaskedLines, usePrefersReducedMotion, smoothScrollToTarget } from "./MotionPrimitives";

const JOURNEY_STEPS = [
    {
        num: "01",
        status: "Diterima",
        badgeCls: "bg-blue-50 text-blue-700 border-blue-200",
        title: "Unit dicatat & difoto saat masuk",
        desc: "Keluhan, kelengkapan seperti charger atau tas, serta foto kondisi fisik perangkat dicatat di meja penerimaan. Anda langsung mendapat nomor servis untuk melacaknya.",
        whatYouSee: "Nomor servis aktif, daftar kelengkapan yang dititipkan, dan foto kondisi awal perangkat.",
        icon: ClipboardList,
    },
    {
        num: "02",
        status: "Diperiksa",
        badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
        title: "Teknisi mengecek sumber kendala",
        desc: "Perangkat diperiksa secara bertahap untuk mengetahui bagian yang bermasalah dan apakah perlu penggantian suku cadang atau cukup perbaikan.",
        whatYouSee: "Catatan temuan awal teknisi dan status pengerjaan diperbarui di portal pelacakan.",
        icon: Search,
    },
    {
        num: "03",
        status: "Menunggu Persetujuan",
        badgeCls: "bg-amber-50 text-amber-800 border-amber-200",
        title: "Estimasi biaya dikonfirmasi dulu",
        desc: "Sebelum pengerjaan dilanjutkan, kami menghubungi Anda dengan perkiraan biaya dan opsi penanganannya. Perbaikan baru berjalan setelah Anda setuju.",
        whatYouSee: "Rincian estimasi biaya dan pilihan suku cadang jika ada bagian yang perlu diganti.",
        icon: CheckSquare,
    },
    {
        num: "04",
        status: "Dalam Perbaikan",
        badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200",
        title: "Pengerjaan & pengecekan ulang",
        desc: "Teknisi mengerjakan perbaikan sesuai kesepakatan, lalu memeriksa kembali fungsi-fungsi utama perangkat sebelum unit dinyatakan siap diambil.",
        whatYouSee: "Riwayat tindakan perbaikan, daftar suku cadang yang dipakai, dan foto hasil pengerjaan.",
        icon: Wrench,
    },
    {
        num: "05",
        status: "Selesai & Diambil",
        badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        title: "Serah terima, nota & garansi tercatat",
        desc: "Unit diuji bersama saat pengambilan. Nota pembayaran dan catatan garansi sesuai jenis perbaikan tersimpan rapi di nomor servis Anda.",
        whatYouSee: "Faktur pembayaran, kartu garansi digital, dan kolom penilaian untuk layanan kami.",
        icon: PackageCheck,
    },
];

export default function ServiceJourneyTimeline() {
    const [activeIdx, setActiveIdx] = useState(0);
    const reducedMotion = usePrefersReducedMotion();
    const current = JOURNEY_STEPS[activeIdx];
    const ActiveIcon = current.icon;

    return (
        <section
            id="alur-servis"
            className="w-full bg-white border-b border-slate-200 py-16 sm:py-24 scroll-mt-16 overflow-x-clip"
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
                {/* Editorial Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end pb-8 sm:pb-10 mb-8 sm:mb-10 border-b border-slate-200">
                    <div className="lg:col-span-7 space-y-2.5">
                        <span className="font-mono text-xs text-blue-600 font-semibold block">
                            01 / ALUR PENGERJAAN
                        </span>
                        <MaskedLines
                            as="h2"
                            lines={["Dari masuk sampai selesai,", "setiap tahap bisa dipantau."]}
                            className="font-display font-extrabold text-2xl sm:text-4xl lg:text-[2.65rem] text-slate-950 tracking-[-0.03em] leading-[1.12]"
                        />
                    </div>
                    <div className="lg:col-span-5">
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                            Status di halaman pelacakan mengikuti alur kerja bengkel secara langsung, jadi Anda tahu posisi perangkat tanpa perlu menebak-nebak.
                        </p>
                    </div>
                </div>

                {/* Horizontal Step Selector Rail (Scrollable cleanly on mobile, 5 columns on desktop) */}
                <div
                    role="tablist"
                    aria-label="Tahapan alur servis"
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6"
                >
                    {JOURNEY_STEPS.map((step, idx) => {
                        const isActive = idx === activeIdx;
                        const Icon = step.icon;
                        return (
                            <button
                                key={step.num}
                                role="tab"
                                aria-selected={isActive}
                                type="button"
                                onClick={() => setActiveIdx(idx)}
                                className={`relative text-left p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer min-w-0 ${
                                    isActive
                                        ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                                        : "bg-slate-50 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span
                                        className={`font-mono text-xs font-bold ${
                                            isActive ? "text-blue-400" : "text-slate-400"
                                        }`}
                                    >
                                        {step.num}
                                    </span>
                                    <Icon
                                        className={`w-4 h-4 shrink-0 ${
                                            isActive ? "text-blue-400" : "text-slate-400"
                                        }`}
                                    />
                                </div>
                                <span className="font-display font-bold text-xs sm:text-sm block leading-snug">
                                    {step.status}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Stage Editorial Panel */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 sm:p-8 lg:p-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current.num}
                            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center"
                        >
                            {/* Left Explanation */}
                            <div className="lg:col-span-7 space-y-3.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="font-mono text-xs font-bold text-slate-400">
                                        TAHAP {current.num} / 05
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${current.badgeCls}`}
                                    >
                                        <ActiveIcon className="w-3.5 h-3.5 shrink-0" />
                                        <span>{current.status}</span>
                                    </span>
                                </div>

                                <h3 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-slate-950 tracking-tight leading-snug">
                                    {current.title}
                                </h3>
                                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                                    {current.desc}
                                </p>

                                <div className="pt-2 flex flex-wrap items-center gap-4">
                                    {activeIdx < JOURNEY_STEPS.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => setActiveIdx(activeIdx + 1)}
                                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                                        >
                                            <span>Lihat tahap berikutnya ({JOURNEY_STEPS[activeIdx + 1].status})</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => smoothScrollToTarget("track-lookup", -80)}
                                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                                        >
                                            <span>Coba lacak nomor servis Anda sekarang</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right Clean Preview Card: What appears on the tracking portal */}
                            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
                                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                    <span className="font-mono text-xs text-slate-400">
                                        Yang tampil di portal pelacakan
                                    </span>
                                    <span className="font-mono text-xs font-semibold text-slate-800">
                                        {current.num} / 05
                                    </span>
                                </div>

                                {/* Progress Stepper Bar */}
                                <div className="flex items-center gap-1.5" aria-hidden="true">
                                    {JOURNEY_STEPS.map((s, i) => (
                                        <span
                                            key={s.num}
                                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                i <= activeIdx ? "bg-blue-600" : "bg-slate-200"
                                            }`}
                                        />
                                    ))}
                                </div>

                                <p className="text-sm text-slate-700 leading-relaxed">
                                    {current.whatYouSee}
                                </p>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <span>Status saat ini</span>
                                    <span className="font-semibold text-slate-900">{current.status}</span>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
