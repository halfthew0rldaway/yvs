import React from "react";
import { 
    AlertTriangle, 
    Crown, 
    RotateCw, 
    ShieldCheck, 
    Layers, 
    UserPlus,
    Sparkles,
    CheckCircle2
} from "lucide-react";

export const BADGE_DEFINITIONS = {
    revisi_acc_risk: {
        id: "revisi_acc_risk",
        label: "Perhatian: Sering Revisi ACC",
        shortLabel: "Sering Revisi ACC",
        icon: AlertTriangle,
        colorClass: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
        dotColor: "bg-rose-500",
        badgeTone: "rose",
        criteria: "Akumulasi revisi ACC >= 2x, ATAU 1x revisi dari total tiket <= 3, ATAU rasio revisi >= 30%.",
        description: "Pelanggan memiliki rekam jejak membatalkan atau merubah kesepakatan persetujuan (ACC) setelah perbaikan selesai dikerjakan.",
        sopGuidance: "Wajibkan konfirmasi tertulis / SPK bertandatangan atau DP minimal 50% di awal sebelum teknisi memulai pengerjaan fisik unit."
    },
    vip_loyal: {
        id: "vip_loyal",
        label: "Loyal VIP Customer",
        shortLabel: "VIP Customer",
        icon: Crown,
        colorClass: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
        dotColor: "bg-purple-500",
        badgeTone: "purple",
        criteria: "Histori tiket servis selesai >= 5 tiket, ATAU total transaksi >= Rp 5.000.000.",
        description: "Pelanggan prioritas tinggi dengan loyalitas dan rekam jejak servis paling sering di Serv.io.",
        sopGuidance: "Prioritaskan antrean pengerjaan unit, berikan diskon jasa loyalitas, dan penanganan garansi yang fleksibel."
    },
    repeat_customer: {
        id: "repeat_customer",
        label: "Repeat Customer",
        shortLabel: "Langganan",
        icon: RotateCw,
        colorClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
        dotColor: "bg-blue-500",
        badgeTone: "blue",
        criteria: "Histori tiket servis selesai antara 2 hingga 4 tiket.",
        description: "Pelanggan reguler yang telah mempercayakan perbaikan perangkat lebih dari 1 kali.",
        sopGuidance: "Apresiasi repeat order pelanggan, jaga konsistensi kualitas, dan rekomendasikan servis berkala perangkat lainnya."
    },
    reliable_customer: {
        id: "reliable_customer",
        label: "Pelanggan Kooperatif",
        shortLabel: "Kooperatif",
        icon: ShieldCheck,
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
        dotColor: "bg-emerald-500",
        badgeTone: "emerald",
        criteria: "Minimal 2 tiket servis selesai dan 0x riwayat revisi ACC.",
        description: "Pelanggan sangat tertib, konsisten dengan estimasi awal, tanpa pernah membatalkan atau merevisi persetujuan ACC.",
        sopGuidance: "Pertahankan transparansi estimasi biaya dan berikan timeline pengerjaan yang presisi."
    },
    multi_device: {
        id: "multi_device",
        label: "Multi-Device Client",
        shortLabel: "Multi Unit",
        icon: Layers,
        colorClass: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
        dotColor: "bg-sky-500",
        badgeTone: "sky",
        criteria: "Memiliki 3 unit perangkat atau lebih yang terdaftar di database bengkel.",
        description: "Pelanggan mengelola banyak perangkat sekaligus (kategori kantor, korporasi, UMKM, atau keluarga).",
        sopGuidance: "Tawarkan program corporate maintenance atau paket diskon bundling servis multi-unit."
    },
    new_customer: {
        id: "new_customer",
        label: "Pelanggan Baru",
        shortLabel: "Baru",
        icon: UserPlus,
        colorClass: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
        dotColor: "bg-slate-400",
        badgeTone: "slate",
        criteria: "Maksimal 1 tiket servis dan 0x revisi ACC.",
        description: "Pelanggan baru terdaftar yang sedang merasakan standar layanan Serv.io untuk pertama kalinya.",
        sopGuidance: "Berikan impresi terbaik, sambut ramah, dan jelaskan SOP garansi serta alur pengerjaan secara transparan."
    }
};

/**
 * Helper fallback untuk kalkulasi di frontend jika data stats/badges belum disediakan dari backend
 */
export function computeCustomerBadges(customer) {
    if (!customer) return [];
    
    // Jika admin telah mengatur badge secara manual (array, bisa kosong [] atau berisi list ID badge)
    if (customer.custom_badges !== undefined && customer.custom_badges !== null) {
        const badgeKeys = Array.isArray(customer.custom_badges) 
            ? customer.custom_badges 
            : (typeof customer.custom_badges === "string" ? JSON.parse(customer.custom_badges) : []);
        
        return badgeKeys.map(k => BADGE_DEFINITIONS[k]).filter(Boolean);
    }

    if (customer.badges && Array.isArray(customer.badges)) {
        return customer.badges;
    }

    const perangkatList = customer.perangkat || [];
    const totalPerangkat = customer.stats?.total_perangkat ?? perangkatList.length;
    
    let allTikets = [];
    perangkatList.forEach(p => {
        if (p.tiket_servis && Array.isArray(p.tiket_servis)) {
            allTikets = allTikets.concat(p.tiket_servis);
        }
    });

    const totalTiket = customer.stats?.total_tiket ?? allTikets.filter(t => t.status !== "dibatalkan").length;
    const tiketSelesai = customer.stats?.tiket_selesai ?? allTikets.filter(t => t.status === "selesai" || t.status === "diambil").length;
    const totalRevisiAcc = customer.stats?.total_revisi_acc ?? allTikets.filter(t => t.is_revisi_acc || (t.jml_revisi_acc && t.jml_revisi_acc > 0)).length;
    const totalBelanja = customer.stats?.total_belanja ?? 0;
    const revisiRate = totalTiket > 0 ? Math.round((totalRevisiAcc / totalTiket) * 100) : 0;

    const badges = [];

    if (totalRevisiAcc >= 2 || (totalRevisiAcc >= 1 && (totalTiket <= 3 || revisiRate >= 30))) {
        badges.push({
            ...BADGE_DEFINITIONS.revisi_acc_risk,
            description: `Pelanggan memiliki akumulasi ${totalRevisiAcc}x revisi ACC setelah pengerjaan selesai (${revisiRate}% dari total tiket).`
        });
    }

    if (tiketSelesai >= 5 || totalBelanja >= 5000000) {
        badges.push(BADGE_DEFINITIONS.vip_loyal);
    }

    if (tiketSelesai >= 2 && tiketSelesai < 5) {
        badges.push(BADGE_DEFINITIONS.repeat_customer);
    }

    if (tiketSelesai >= 2 && totalRevisiAcc === 0) {
        badges.push(BADGE_DEFINITIONS.reliable_customer);
    }

    if (totalPerangkat >= 3) {
        badges.push({
            ...BADGE_DEFINITIONS.multi_device,
            shortLabel: `${totalPerangkat} Unit`
        });
    }

    if (totalTiket <= 1 && totalRevisiAcc === 0) {
        badges.push(BADGE_DEFINITIONS.new_customer);
    }

    return badges;
}

