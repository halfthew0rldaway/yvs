/**
 * Utility untuk Menghitung Statistik dan Badge Reputasi Pelanggan
 * Berdasarkan akumulasi rekam jejak servis di seluruh unit perangkat miliknya
 * Mendukung kustomisasi manual oleh Admin (bisa dipilih lebih dari 1 atau dihilangkan)
 */

const ALL_BADGES = {
    revisi_acc_risk: {
        id: "revisi_acc_risk",
        label: "Perhatian: Sering Revisi ACC",
        shortLabel: "Sering Revisi ACC",
        icon: "AlertTriangle",
        colorClass: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
        dotColor: "bg-rose-500",
        priority: 1, // Prioritas paling atas agar langsung terlihat
        description: "Pelanggan memiliki rekam jejak membatalkan atau merubah kesepakatan persetujuan (ACC) setelah perbaikan selesai dikerjakan.",
        sopGuidance: "Wajibkan konfirmasi tertulis / SPK fisik atau uang muka (DP) minimal 50% sebelum teknisi memulai pengerjaan fisik."
    },
    vip_loyal: {
        id: "vip_loyal",
        label: "Loyal VIP Customer",
        shortLabel: "VIP Customer",
        icon: "Crown",
        colorClass: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
        dotColor: "bg-purple-500",
        priority: 2,
        description: "Pelanggan prioritas tinggi dengan loyalitas dan rekam jejak servis paling sering di Serv.io.",
        sopGuidance: "Prioritaskan antrean pengerjaan, tawarkan diskon loyalitas, dan berikan layanan garansi fleksibel."
    },
    repeat_customer: {
        id: "repeat_customer",
        label: "Repeat Customer",
        shortLabel: "Langganan",
        icon: "RotateCw",
        colorClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
        dotColor: "bg-blue-500",
        priority: 3,
        description: "Pelanggan reguler yang telah mempercayakan perbaikan perangkat lebih dari 1 kali.",
        sopGuidance: "Apresiasi repeat order pelanggan dan berikan saran perawatan berkala untuk perangkat lainnya."
    },
    reliable_customer: {
        id: "reliable_customer",
        label: "Pelanggan Kooperatif",
        shortLabel: "Kooperatif",
        icon: "ShieldCheck",
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
        dotColor: "bg-emerald-500",
        priority: 4,
        description: "Selalu konsisten dengan persetujuan penawaran tanpa pernah membatalkan atau merevisi ACC.",
        sopGuidance: "Pertahankan transparansi estimasi dan berikan estimasi waktu yang akurat."
    },
    multi_device: {
        id: "multi_device",
        label: "Multi-Device Client",
        shortLabel: "Multi Unit",
        icon: "Layers",
        colorClass: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
        dotColor: "bg-cyan-500",
        priority: 5,
        description: "Memiliki banyak unit perangkat yang terdaftar di database bengkel (kategori kantor/keluarga).",
        sopGuidance: "Potensi klien kantor/korporat/keluarga. Tawarkan paket bundling servis berkala."
    },
    new_customer: {
        id: "new_customer",
        label: "Pelanggan Baru",
        shortLabel: "Baru",
        icon: "UserPlus",
        colorClass: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
        dotColor: "bg-slate-400",
        priority: 6,
        description: "Pelanggan baru terdaftar yang sedang dalam tahap pengenalan layanan servis bengkel.",
        sopGuidance: "Berikan impresi terbaik, sambut ramah, dan jelaskan rincian SOP garansi dengan transparan."
    }
};

function computeCustomerStatsAndBadges({ totalPerangkat = 0, tikets = [], totalBelanja = 0, customBadges = null }) {
    const validTikets = tikets.filter(t => t.status !== "dibatalkan");
    const totalTiket = validTikets.length;
    const tiketSelesai = validTikets.filter(t => t.status === "selesai" || t.status === "diambil").length;
    const totalRevisiAcc = tikets.filter(t => t.is_revisi_acc || (t.jml_revisi_acc && t.jml_revisi_acc > 0)).length;
    const revisiRate = totalTiket > 0 ? Math.round((totalRevisiAcc / totalTiket) * 100) : 0;

    let badges = [];

    // Jika admin telah mengatur badge secara manual (array: bisa kosong [] untuk hilangkan semua, atau berisi ID badge)
    if (customBadges !== null && customBadges !== undefined) {
        const parsedBadgeKeys = Array.isArray(customBadges) 
            ? customBadges 
            : (typeof customBadges === "string" ? JSON.parse(customBadges) : []);

        badges = parsedBadgeKeys
            .map(key => {
                const def = ALL_BADGES[key];
                if (!def) return null;
                return {
                    ...def,
                    isManual: true
                };
            })
            .filter(Boolean);
    } else {
        // Otomatis kalkulasi berdasarkan histori rekam jejak
        if (totalRevisiAcc >= 2 || (totalRevisiAcc >= 1 && (totalTiket <= 3 || revisiRate >= 30))) {
            badges.push({
                ...ALL_BADGES.revisi_acc_risk,
                description: `Pelanggan memiliki akumulasi ${totalRevisiAcc}x revisi ACC setelah pengerjaan selesai (${revisiRate}% dari total tiket).`
            });
        }

        if (tiketSelesai >= 5 || totalBelanja >= 5000000) {
            badges.push(ALL_BADGES.vip_loyal);
        }

        if (tiketSelesai >= 2 && tiketSelesai < 5) {
            badges.push(ALL_BADGES.repeat_customer);
        }

        if (tiketSelesai >= 2 && totalRevisiAcc === 0) {
            badges.push(ALL_BADGES.reliable_customer);
        }

        if (totalPerangkat >= 3) {
            badges.push({
                ...ALL_BADGES.multi_device,
                shortLabel: `${totalPerangkat} Unit Terdaftar`
            });
        }

        if (totalTiket <= 1 && totalRevisiAcc === 0) {
            badges.push(ALL_BADGES.new_customer);
        }
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
    ALL_BADGES,
    computeCustomerStatsAndBadges
};
