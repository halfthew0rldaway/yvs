/**
 * Shared Motion System & Process Language Tokens for YVS Computer
 * Reused identically across the public landing experience and tracking result view.
 */

export const MOTION_TOKENS = {
    // Shared custom easing curves (GSAP CustomEase + CSS cubic-bezier equivalents)
    ease: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
        snappy: "cubic-bezier(0.16, 1, 0.3, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        gsapEditorial: "yvsEditorial",
        gsapSnappy: "yvsSnappy",
    },
    // Shared Framer / Motion spring configs for UI micro-interactions
    spring: {
        tab: { type: "spring", stiffness: 460, damping: 36 },
        card: { type: "spring", stiffness: 320, damping: 30 },
    },
    duration: {
        fast: 0.24,
        base: 0.55,
        slow: 0.85,
        preloader: 0.72,
    },
    stagger: {
        tight: 0.045,
        base: 0.08,
        relaxed: 0.12,
    },
};

/**
 * Canonical 5-Stage Process Language shared between Home (pinned scroll-scrub)
 * and Tracking Result (vertical SVG path + MotionPath progress).
 */
export const SHARED_PROCESS_STEPS = [
    {
        num: "01",
        key: "diterima",
        label: "Diterima",
        statuses: ["diterima"],
        shortDesc: "Unit dicatat, kelengkapan didata, dan kondisi fisik awal difoto.",
        title: "Unit dicatat & difoto saat masuk",
        desc: "Keluhan, kelengkapan seperti charger atau tas, serta foto kondisi fisik perangkat dicatat di meja penerimaan. Anda langsung mendapat nomor servis untuk melacaknya.",
        portalNote: "Nomor servis aktif, daftar kelengkapan yang dititipkan, dan foto kondisi awal perangkat.",
        sectionId: "section-intake",
    },
    {
        num: "02",
        key: "diagnosis",
        label: "Diagnosa",
        statuses: ["didiagnosis", "menunggu_persetujuan", "disetujui"],
        shortDesc: "Teknisi memeriksa sumber kendala dan mengirim estimasi biaya untuk persetujuan Anda.",
        title: "Pemeriksaan & konfirmasi biaya di awal",
        desc: "Teknisi mengecek bagian yang bermasalah lalu menyampaikan temuan beserta perkiraan biaya dan pilihan suku cadang. Pengerjaan baru berjalan setelah Anda setuju.",
        portalNote: "Catatan hasil diagnosa, estimasi biaya transparan, serta tombol setujui atau batalkan langsung dari ponsel.",
        sectionId: "section-diagnosis",
    },
    {
        num: "03",
        key: "perbaikan",
        label: "Pengerjaan",
        statuses: ["dalam_perbaikan"],
        shortDesc: "Teknisi mengerjakan perbaikan dan mencatat setiap suku cadang yang terpasang.",
        title: "Perbaikan unit & pencatatan suku cadang",
        desc: "Perbaikan dikerjakan sesuai kesepakatan awal. Setiap tindakan teknisi serta daftar komponen pengganti dicatat rapi di riwayat nomor servis Anda.",
        portalNote: "Riwayat tindakan teknisi, daftar suku cadang yang dipakai, dan foto dokumentasi pengerjaan.",
        sectionId: "section-repair",
    },
    {
        num: "04",
        key: "selesai",
        label: "QC",
        statuses: ["selesai"],
        shortDesc: "Fungsi utama perangkat diuji ulang secara menyeluruh sebelum dinyatakan siap.",
        title: "Pengecekan ulang & uji fungsi (QC)",
        desc: "Setelah perbaikan selesai, fungsi-fungsi utama perangkat diuji kembali dan didokumentasikan agar unit benar-benar layak dipakai sebelum dikabari ke pemilik.",
        portalNote: "Daftar hasil uji fungsi perangkat, foto hasil akhir, dan tips perawatan pasca servis.",
        sectionId: "section-qc",
    },
    {
        num: "05",
        key: "diambil",
        label: "Siap diambil",
        statuses: ["diambil"],
        shortDesc: "Unit diuji bersama saat serah terima, nota & kartu garansi tersimpan digital.",
        title: "Serah terima, nota & garansi tercatat",
        desc: "Unit diuji bersama saat pengambilan di toko. Nota resmi dan catatan garansi sesuai jenis perbaikan tersimpan di sistem dan bisa dibuka kembali kapan saja.",
        portalNote: "QR verifikasi pengambilan, faktur pembayaran, kartu garansi digital, dan hitung mundur masa garansi.",
        sectionId: "section-handover",
    },
];

/**
 * Lazy-loaded core GSAP + ScrollTrigger singleton so heavy animation scripts
 * never block initial LCP paint and avoid pulling unused plugins (SplitText/Flip/CustomEase).
 */
let gsapRuntimePromise = null;
let gsapMotionPathPromise = null;

export function loadGsapRuntime() {
    if (!gsapRuntimePromise) {
        gsapRuntimePromise = Promise.all([
            import("gsap"),
            import("gsap/ScrollTrigger"),
        ]).then(([gsapMod, scrollTriggerMod]) => {
            const gsap = gsapMod.default || gsapMod.gsap;
            const ScrollTrigger = scrollTriggerMod.ScrollTrigger || scrollTriggerMod.default;
            gsap.registerPlugin(ScrollTrigger);
            return { gsap, ScrollTrigger };
        });
    }
    return gsapRuntimePromise;
}

export function loadGsapMotionPathRuntime() {
    if (!gsapMotionPathPromise) {
        gsapMotionPathPromise = Promise.all([
            loadGsapRuntime(),
            import("gsap/MotionPathPlugin"),
        ]).then(([{ gsap, ScrollTrigger }, motionPathMod]) => {
            const MotionPathPlugin = motionPathMod.MotionPathPlugin || motionPathMod.default;
            gsap.registerPlugin(MotionPathPlugin);
            return { gsap, ScrollTrigger, MotionPathPlugin };
        });
    }
    return gsapMotionPathPromise;
}

/**
 * Smart ticket input mask helper:
 * Formats standard YVS ticket numbers (SRV-YYYY-NNN) gently while never blocking
 * legacy or custom alphanumeric codes.
 */
export function formatTicketInputMask(raw) {
    if (!raw) return "";
    const cleaned = String(raw).toUpperCase().replace(/[^A-Z0-9-]/g, "");
    // Only auto-insert dashes when user clearly types SRV prefix without dashes
    const noDash = cleaned.replace(/-/g, "");
    if (noDash.startsWith("SRV") && noDash.length > 3) {
        const rest = noDash.slice(3);
        if (/^\d+$/.test(rest)) {
            if (rest.length <= 4) return `SRV-${rest}`;
            return `SRV-${rest.slice(0, 4)}-${rest.slice(4, 9)}`;
        }
    }
    return cleaned.slice(0, 24);
}
