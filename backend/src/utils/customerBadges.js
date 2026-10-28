/**
 * Utility untuk Menghitung Statistik dan Badge Reputasi Pelanggan
 * Berdasarkan akumulasi rekam jejak servis di seluruh unit perangkat miliknya
 */

function computeCustomerStatsAndBadges({ totalPerangkat = 0, tikets = [], totalBelanja = 0 }) {
    const validTikets = tikets.filter(t => t.status !== "dibatalkan");
    const totalTiket = validTikets.length;
    const tiketSelesai = validTikets.filter(t => t.status === "selesai" || t.status === "diambil").length;
    const totalRevisiAcc = tikets.filter(t => t.is_revisi_acc || (t.jml_revisi_acc && t.jml_revisi_acc > 0)).length;
    const revisiRate = totalTiket > 0 ? Math.round((totalRevisiAcc / totalTiket) * 100) : 0;

    const badges = [];

    // 1. Badge Peringatan: Sering Revisi ACC (Perhatian Khusus)
    // Syarat: Pernah revisi ACC >= 2x, ATAU 1x revisi dari total tiket <= 3, ATAU rasio revisi >= 30%
    if (totalRevisiAcc >= 2 || (totalRevisiAcc >= 1 && (totalTiket <= 3 || revisiRate >= 30))) {
        badges.push({
            id: "revisi_acc_risk",
            label: "Perhatian: Sering Revisi ACC",
            shortLabel: "Sering Revisi ACC",
            icon: "AlertTriangle",
            colorClass: "bg-rose-50 text-rose-700 border-rose-200",
            dotColor: "bg-rose-500",
            priority: 1, // Prioritas paling atas agar langsung terlihat
            description: `Pelanggan memiliki akumulasi ${totalRevisiAcc}x revisi ACC setelah pengerjaan selesai (${revisiRate}% dari total tiket).`,
            sopGuidance: "Wajibkan konfirmasi tertulis / SPK fisik atau uang muka (DP) minimal 50% sebelum teknisi memulai pengerjaan fisik."
        });
    }

    // 2. Badge Loyal VIP Customer
    if (tiketSelesai >= 5 || totalBelanja >= 5000000) {
        badges.push({
            id: "vip_loyal",
            label: "Loyal VIP Customer",
            shortLabel: "VIP Customer",
            icon: "Crown",
            colorClass: "bg-purple-50 text-purple-700 border-purple-200",
            dotColor: "bg-purple-500",
            priority: 2,
            description: `Pelanggan setia bengkel dengan total ${tiketSelesai} tiket selesai dikerjakan.`,
            sopGuidance: "Prioritaskan antrean pengerjaan, tawarkan diskon loyalitas, dan berikan layanan garansi fleksibel."
        });
    }

    // 3. Badge Repeat Customer
    if (tiketSelesai >= 2 && tiketSelesai < 5) {
        badges.push({
            id: "repeat_customer",
            label: "Repeat Customer",
            shortLabel: "Langganan",
            icon: "RotateCw",
            colorClass: "bg-blue-50 text-blue-700 border-blue-200",
            dotColor: "bg-blue-500",
            priority: 3,
            description: `Telah mempercayakan ${tiketSelesai}x servis perangkat di bengkel.`,
            sopGuidance: "Apresiasi repeat order pelanggan dan berikan saran perawatan berkala untuk perangkat lainnya."
        });
    }

    // 4. Badge Pelanggan Kooperatif (Reliable)
    if (tiketSelesai >= 2 && totalRevisiAcc === 0) {
        badges.push({
            id: "reliable_customer",
            label: "Pelanggan Kooperatif",
            shortLabel: "Kooperatif",
            icon: "ShieldCheck",
            colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
            dotColor: "bg-emerald-500",
            priority: 4,
            description: "Selalu konsisten dengan persetujuan penawaran tanpa pernah membatalkan atau merevisi ACC.",
            sopGuidance: "Pertahankan transparansi estimasi dan berikan estimasi waktu yang akurat."
        });
    }

    // 5. Badge Multi-Device Owner
    if (totalPerangkat >= 3) {
        badges.push({
            id: "multi_device",
            label: "Multi-Device Client",
            shortLabel: `${totalPerangkat} Unit Terdaftar`,
            icon: "Layers",
            colorClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
            dotColor: "bg-cyan-500",
            priority: 5,
            description: `Memiliki ${totalPerangkat} perangkat yang terdaftar di database bengkel.`,
            sopGuidance: "Potensi klien kantor/korporat/keluarga. Tawarkan paket bundling servis berkala."
        });
    }

    // 6. Badge Pelanggan Baru
    if (totalTiket <= 1 && totalRevisiAcc === 0) {
        badges.push({
            id: "new_customer",
            label: "Pelanggan Baru",
            shortLabel: "Pelanggan Baru",
            icon: "UserPlus",
            colorClass: "bg-slate-50 text-slate-700 border-slate-200",
            dotColor: "bg-slate-400",
            priority: 6,
            description: "Pelanggan baru terdaftar yang sedang dalam tahap pengenalan layanan servis bengkel.",
            sopGuidance: "Berikan impresi terbaik, sambut ramah, dan jelaskan rincian SOP garansi dengan transparan."
        });
    }

    // Urutkan badges berdasarkan prioritas
    badges.sort((a, b) => a.priority - b.priority);

    return {
        stats: {
            total_perangkat: totalPerangkat,
            total_tiket: totalTiket,
            tiket_selesai: tiketSelesai,
            total_revisi_acc: totalRevisiAcc,
            revisi_rate: revisiRate,
            total_belanja: totalBelanja
        },
        badges
    };
}

module.exports = {
    computeCustomerStatsAndBadges
};
