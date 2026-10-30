import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, MessageSquare, Copy, Check, ExternalLink, Sparkles, ShieldAlert, CheckCircle2, Clock, ShieldCheck, HeartHandshake, BellRing } from "lucide-react";
import api from "../services/api";

function formatRupiah(num) {
    if (!num) return "Rp 0";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

const MAINTENANCE_TIPS_PLAIN = {
    "Baterai": [
        "Hindari menggunakan laptop di atas kasur atau bantal agar sirkulasi udara tidak tersumbat.",
        "Cobalah untuk tidak mengisi daya terus-menerus saat baterai sudah terisi 100%.",
        "Jangan biarkan baterai habis total hingga 0 persen terlalu sering."
    ],
    "SSD / Storage": [
        "Sisakan kapasitas penyimpanan minimal 15-20 persen agar kecepatan SSD tetap optimal.",
        "Hindari mematikan perangkat secara paksa melalui tombol power saat proses penyimpanan data.",
        "Lakukan backup berkala untuk dokumen dan data penting Anda."
    ],
    "Layar / LCD": [
        "Bersihkan layar menggunakan kain microfiber halus (hindari cairan berbahan alkohol keras).",
        "Hindari menutup layar laptop dengan benda keras seperti pulpen atau earphone di atas keyboard.",
        "Buka dan tutup engsel layar dari bagian tengah, bukan dari salah satu sudut."
    ],
    "Pembersihan & Thermal Paste": [
        "Bersihkan debu pada ventilasi udara secara berkala.",
        "Disarankan melakukan pembersihan debu dan penggantian pasta termal setiap 6-12 bulan.",
        "Pastikan kipas pendingin berputar lancar saat perangkat digunakan untuk beban kerja berat."
    ],
    "Software / OS": [
        "Rutin lakukan pembaruan sistem operasi dan gunakan antivirus terpercaya.",
        "Hindari mengunduh file atau software dari sumber yang tidak resmi.",
        "Bersihkan file sampah dan cache sementara secara berkala."
    ],
    "Umum": [
        "Gunakan adaptor charger original atau yang sesuai dengan spesifikasi voltase perangkat.",
        "Simpan perangkat di tempat yang kering dan terhindar dari paparan sinar matahari langsung.",
        "Gunakan tas laptop bermaterial tebal saat bepergian untuk meredam benturan."
    ]
};

export default function SopWaModal({ isOpen, onClose, tiket, initialScenario }) {
    if (!isOpen || !tiket) return null;

    const customer = tiket.perangkat?.customer;
    const customerPersonality = customer?.tipe_kepribadian || "Netral";
    
    // Scenarios: "penawaran", "izin_tambahan", "selesai", "garansi_tips", "pengingat", "pengingat_garansi"
    const [scenario, setScenario] = useState(
        initialScenario || (
            tiket.status === "menunggu_persetujuan" 
                ? "penawaran" 
                : tiket.status === "selesai" 
                    ? "selesai" 
                    : tiket.status === "diambil" 
                        ? (tiket.warranty_status?.sisaHari <= 7 && tiket.warranty_status?.sisaHari >= 0 ? "pengingat_garansi" : "garansi_tips")
                        : "penawaran"
        )
    );

    const [personalityMode, setPersonalityMode] = useState(customerPersonality);
    const [tindakanTambahan, setTindakanTambahan] = useState("Reball Chipset / Flash BIOS");
    const [risikoTambahan, setRisikoTambahan] = useState("Potensi motherboard mati total jika jalur PCB sudah rapuh");
    const [biayaTambahan, setBiayaTambahan] = useState("150000");
    const [reminderPeriod, setReminderPeriod] = useState("30");
    const [messageText, setMessageText] = useState("");
    const [copied, setCopied] = useState(false);

    // Synchronize scenario on open or initialScenario change
    useEffect(() => {
        if (isOpen) {
            if (initialScenario) {
                setScenario(initialScenario);
            } else if (tiket?.status === "menunggu_persetujuan") {
                setScenario("penawaran");
            } else if (tiket?.status === "selesai") {
                setScenario("selesai");
            } else if (tiket?.status === "diambil") {
                setScenario(tiket?.warranty_status?.sisaHari <= 7 && tiket?.warranty_status?.sisaHari >= 0 ? "pengingat_garansi" : "garansi_tips");
            }
        }
    }, [isOpen, initialScenario, tiket]);

    // Synchronize personality if ticket customer personality changes
    useEffect(() => {
        if (customer?.tipe_kepribadian && customer.tipe_kepribadian !== "Netral") {
            setPersonalityMode(customer.tipe_kepribadian);
        } else {
            setPersonalityMode("Netral");
        }
    }, [customer]);

    // Build message strictly complying with Service Excellent standards (No emojis, polite, clear, structured)
    useEffect(() => {
        const namaCust = customer?.nama || "Pelanggan";
        const merekModel = `${tiket.perangkat?.merek || ""} ${tiket.perangkat?.model || ""}`.trim() || "Perangkat";
        const noTiket = tiket.nomor_tiket || "-";
        const estimasiBiaya = formatRupiah(tiket.diagnosis?.estimasi_biaya || 0);
        const estimasiWaktu = tiket.diagnosis?.estimasi_waktu || "1-2 hari kerja";
        const temuanMasalah = tiket.diagnosis?.masalah || tiket.keluhan || "Kendala komponen internal";
        const solusiTeknis = tiket.diagnosis?.solusi || "Pengerjaan perbaikan dan penggantian komponen";

        let text = "";

        if (scenario === "penawaran") {
            if (personalityMode === "Koleris") {
                // Koleris (tegas, cepat, to the point)
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Hasil pengecekan unit ${merekModel} (No. Tiket: ${noTiket}) telah selesai.
Penyebab: ${temuanMasalah}.
Solusi: ${solusiTeknis}.
Biaya: ${estimasiBiaya}.
Estimasi pengerjaan: ${estimasiWaktu}.

Apakah perbaikan kami lanjutkan sekarang? Mohon konfirmasinya. Terima kasih.
- Tim Servis YVS`;
            } else if (personalityMode === "Sanguinis") {
                // Sanguinis (ramah, ekspresif, hangat)
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Kabar baik, pengecekan untuk perangkat ${merekModel} dengan nomor tiket ${noTiket} sudah selesai dilakukan oleh teknisi kami.

Penyebab kendalanya sudah kami temukan, yaitu pada bagian: ${temuanMasalah}.
Hal ini dapat kami atasi dengan: ${solusiTeknis}.
Estimasi biaya sebesar ${estimasiBiaya} dengan estimasi waktu pengerjaan sekitar ${estimasiWaktu}.

Foto dan dokumentasi kondisi unit terlampir agar Bapak/Ibu dapat melihat langsung. Bagaimana Bapak/Ibu, apakah perbaikannya dapat kami lanjutkan?

Terima kasih atas kepercayaannya kepada kami.
- Tim Servis YVS`;
            } else if (personalityMode === "Plegmatis") {
                // Plegmatis (tenang, sabar, suportif)
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Kami ingin mengabarkan hasil pengecekan untuk perangkat ${merekModel} (No. Tiket: ${noTiket}). Tidak perlu terburu-buru ya, Bapak/Ibu.

Hasil pemeriksaan menunjukkan kendala pada: ${temuanMasalah}.
Kami menyarankan solusi: ${solusiTeknis}.
Estimasi biaya adalah ${estimasiBiaya} dan estimasi pengerjaan ${estimasiWaktu}.

Apabila Bapak/Ibu ingin mempertimbangkan terlebih dahulu atau ada hal teknis yang ingin ditanyakan, silakan hubungi kami; tim kami siap membantu kapan pun. Jika sudah mantap untuk melanjutkan, cukup kabari kami dan selebihnya teknisi kami yang akan menangani.

Terima kasih dan semoga harinya menyenangkan.
- Tim Servis YVS`;
            } else if (personalityMode === "Melankolis") {
                // Melankolis (teliti, detail, transparan)
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Berikut kami sampaikan laporan hasil pengecekan lengkap untuk unit ${merekModel} (No. Tiket: ${noTiket}):

1. Temuan Pemeriksaan: ${temuanMasalah} (dokumentasi terlampir)
2. Rencana Tindakan: ${solusiTeknis}
3. Estimasi Total Biaya: ${estimasiBiaya}
4. Estimasi Waktu Penyelesaian: ${estimasiWaktu}
5. Ketentuan Garansi: Garansi toko berlaku sesuai ketentuan servis dan nota resmi setelah unit selesai.

Silakan dicermati terlebih dahulu. Apabila ada bagian penjelasan teknis atau rincian biaya yang ingin diperjelas, kami siap memberikan penjelasan detail dengan senang hati.

Terima kasih.
- Tim Servis YVS`;
            } else {
                // Standar / Netral
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Terkait perbaikan perangkat ${merekModel} dengan nomor tiket ${noTiket}, teknisi kami telah selesai melakukan tahap diagnosa awal.

Hasil Pemeriksaan:
Kendala: ${temuanMasalah}
Solusi yang disarankan: ${solusiTeknis}
Estimasi Biaya: ${estimasiBiaya}
Estimasi Waktu: ${estimasiWaktu}

Apakah pengerjaan perbaikan ini dapat kami lanjutkan? Mohon konfirmasi dari Bapak/Ibu.

Terima kasih telah mempercayakan perbaikan kepada YVS.
- Tim Servis YVS`;
            }
        } else if (scenario === "izin_tambahan") {
            // Izin Tindakan Tambahan Berisiko
            const biayaTambahanFormatted = formatRupiah(Number(biayaTambahan) || 0);
            text = `Selamat siang Bapak/Ibu ${namaCust}.

Kami dari tim teknisi YVS ingin menginformasikan perkembangan perbaikan unit ${merekModel} (No. Tiket: ${noTiket}).

Dalam proses perbaikan, kami menemukan bahwa unit memerlukan tindakan teknis tambahan, yaitu:
Tindakan: ${tindakanTambahan}
Risiko Teknis: ${risikoTambahan}
Tambahan Biaya: ${biayaTambahanFormatted}

Sesuai standar perlindungan dan persetujuan pelanggan di workshop kami, tindakan berisiko ini hanya akan kami jalankan setelah mendapatkan izin tertulis dari Bapak/Ibu.

Apakah Bapak/Ibu menyetujui langkah tindakan tersebut? Mohon konfirmasi dari Bapak/Ibu.

Terima kasih atas pengertian dan kerja samanya.
- Tim Servis YVS`;
        } else if (scenario === "selesai") {
            // Unit Selesai & QC
            const totalTagihan = tiket.invoice ? formatRupiah(tiket.invoice.total_biaya) : estimasiBiaya;
            text = `Selamat siang Bapak/Ibu ${namaCust}.

Kami menginformasikan bahwa proses perbaikan unit ${merekModel} dengan nomor tiket ${noTiket} telah selesai dikerjakan dan telah lolos tahap uji fungsi (Quality Control).

Rincian Tagihan: ${totalTagihan}
Status Unit: Siap diambil di workshop YVS

Unit dapat diambil pada jam operasional kami:
Senin - Sabtu, pukul 09.00 - 20.00 WIB.
Mohon menunjukkan pesan ini atau nomor tiket saat serah terima unit di toko.

Terima kasih atas kepercayaan Bapak/Ibu kepada layanan kami.
- Tim Servis YVS`;
        } else if (scenario === "garansi_tips") {
            // Serah Terima, Garansi & Perawatan
            const kategori = tiket.kategori_perbaikan || "Umum";
            const durasi = tiket.durasi_garansi || "1 Bulan";
            const tipsList = MAINTENANCE_TIPS_PLAIN[kategori] || MAINTENANCE_TIPS_PLAIN["Umum"];
            const tipsText = tipsList.map((tip, idx) => `${idx + 1}. ${tip}`).join("\n");
            
            let expiredInfo = "";
            if (tiket.garansi_berakhir_at) {
                const expDateStr = new Date(tiket.garansi_berakhir_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                expiredInfo = `\nMasa Garansi Berlaku Hingga: ${expDateStr}`;
            }

            text = `Selamat siang Bapak/Ibu ${namaCust}.

Terima kasih telah melakukan perbaikan perangkat ${merekModel} (No. Tiket: ${noTiket}) di workshop YVS.

Informasi Garansi Perbaikan:
Durasi Garansi: ${durasi}${expiredInfo}
Ketentuan: Garansi mencakup fungsi perbaikan dan suku cadang yang diganti sesuai nota resmi.

Tips Perawatan Perangkat (${kategori}):
${tipsText}

Apabila terdapat kendala atau pertanyaan selama masa garansi, silakan hubungi kami kembali. Semoga perangkat Bapak/Ibu senantiasa awet dan lancar digunakan.

Terima kasih.
- Tim Servis YVS`;
        } else if (scenario === "pengingat") {
            // Skenario Reminder Pengambilan Unit
            if (reminderPeriod === "90") {
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Pemberitahuan penting dari YVS Computer mengenai unit ${merekModel} dengan nomor tiket ${noTiket}.

Perbaikan unit Bapak/Ibu telah selesai sejak 90 hari yang lalu dan saat ini unit masih tersimpan di workshop kami. Kami telah menyampaikan konfirmasi sebelumnya pada hari ke-30 dan ke-60.

Sesuai ketentuan penyimpanan unit servis workshop kami, mohon kesediaan Bapak/Ibu untuk segera mengambil unit tersebut dalam waktu 7 hari kerja ke depan, atau segera menghubungi kami apabila ada kendala tertentu.

Mohon konfirmasi waktu pengambilan dari Bapak/Ibu. Terima kasih.
- Tim Servis YVS`;
            } else if (reminderPeriod === "60") {
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Kami dari YVS Computer ingin mengonfirmasi kembali terkait perangkat ${merekModel} milik Bapak/Ibu dengan nomor tiket ${noTiket}.

Unit telah selesai diperbaiki sejak 60 hari yang lalu dan saat ini masih berada di tempat kami. Kami mengimbau agar unit dapat segera diambil pada jam operasional kami agar kondisi penyimpanan tetap optimal.

Apabila Bapak/Ibu berhalangan atau memerlukan layanan pengantaran, silakan hubungi tim kami untuk kami bantu solusinya.

Terima kasih atas perhatian dan kerja samanya.
- Tim Servis YVS`;
            } else {
                // 30 hari
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Semoga Bapak/Ibu dalam keadaan sehat. Kami dari YVS Computer ingin mengingatkan kembali mengenai unit ${merekModel} dengan nomor tiket ${noTiket}.

Unit telah selesai diperbaiki sejak 30 hari yang lalu dan siap untuk diambil kapan pun pada jam operasional workshop kami (Senin - Sabtu, 09.00 - 20.00 WIB).

Apabila Bapak/Ibu membutuhkan informasi lebih lanjut mengenai pengambilan atau pelunasan, silakan hubungi kami.

Terima kasih banyak atas perhatiannya.
- Tim Servis YVS`;
            }
        } else if (scenario === "pengingat_garansi") {
            const expDateStr = tiket.garansi_berakhir_at 
                ? new Date(tiket.garansi_berakhir_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                : "beberapa hari ke depan";
            const sisaHari = (tiket.warranty_status?.sisaHari !== undefined && tiket.warranty_status?.sisaHari !== null)
                ? tiket.warranty_status.sisaHari 
                : 3;

            if (personalityMode === "Koleris") {
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Menginfokan masa garansi perbaikan unit ${merekModel} (No. Tiket: ${noTiket}) akan berakhir pada tanggal ${expDateStr} (${sisaHari} hari lagi).

Apabila ada kendala fungsi perangkat, mohon segera hubungi kami sebelum masa garansi habis agar dapat kami tangani segera. Terima kasih.
- Tim Servis YVS`;
            } else if (personalityMode === "Sanguinis") {
                text = `Halo Kak ${namaCust}! Semoga kabarnya selalu sehat dan harinya menyenangkan.

Sekadar mengingatkan dengan ramah, masa garansi perbaikan unit ${merekModel} (No. Tiket: ${noTiket}) tersisa ${sisaHari} hari lagi nih, hingga tanggal ${expDateStr}.

Bagaimana performa unitnya selama ini kak, lancar dan memuaskan kan? Jika ada kendala kecil atau hal yang ingin dikonsultasikan, jangan sungkan kabari kami ya kak, tim kami siap bantu dengan senang hati!

Terima kasih banyak atas kepercayaannya pada YVS.
- Tim Servis YVS`;
            } else if (personalityMode === "Plegmatis") {
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Kami dari YVS Computer ingin menanyakan kabar dan memastikan unit ${merekModel} milik Bapak/Ibu berfungsi dengan baik tanpa kendala.

Sebagai informasi purna jual kami, masa garansi servis (No. Tiket: ${noTiket}) akan berakhir dalam ${sisaHari} hari pada tanggal ${expDateStr}. Bila Bapak/Ibu merasakan ada hal yang kurang nyaman pada performa unit, silakan kabari kami agar dapat kami bantu cek kembali dengan tenang.

Terima kasih banyak atas waktu dan kepercayaan Bapak/Ibu.
- Tim Servis YVS`;
            } else if (personalityMode === "Melankolis") {
                text = `Yth. Bapak/Ibu ${namaCust},

Menindaklanjuti status purna jual tiket perbaikan No. ${noTiket} untuk perangkat ${merekModel}:

Masa perlindungan garansi perbaikan (${tiket.durasi_garansi || "1 Bulan"}) yang mencakup pengerjaan ${temuanMasalah} akan resmi berakhir pada:
Tanggal: ${expDateStr} (${sisaHari} hari tersisa).

Mohon lakukan evaluasi terhadap performa perangkat sebelum masa garansi berakhir. Apabila ada ketidaksesuaian fungsi teknis, silakan konfirmasikan kepada kami beserta nomor tiket ini untuk verifikasi sistem garansi.

Terima kasih atas kerja sama dan kepercayaan Anda.
- Tim Servis YVS`;
            } else {
                // Netral
                text = `Selamat siang Bapak/Ibu ${namaCust}.

Kami dari tim layanan pelanggan YVS Computer ingin memastikan bahwa perangkat ${merekModel} (No. Tiket: ${noTiket}) berfungsi dengan baik setelah perbaikan.

Kami menginformasikan bahwa masa garansi perbaikan unit Anda akan berakhir dalam ${sisaHari} hari pada tanggal ${expDateStr}.

Apabila terdapat kendala atau pertanyaan sebelum masa garansi berakhir, silakan hubungi tim kami. Kami siap membantu Anda.

Terima kasih atas kepercayaan Anda kepada YVS.
- Tim Servis YVS`;
            }
        }

        setMessageText(text);
    }, [scenario, personalityMode, tindakanTambahan, risikoTambahan, biayaTambahan, reminderPeriod, tiket]);

    function handleCopy() {
        navigator.clipboard.writeText(messageText);
        setCopied(true);
        toast.success("Pesan berhasil disalin ke clipboard!");
        setTimeout(() => setCopied(false), 2000);
    }

    function handleSendWhatsApp() {
        let phone = customer?.nomor_telepon || "";
        if (phone.startsWith("0")) phone = "62" + phone.substring(1);
        if (!phone) {
            toast.error("Nomor telepon customer tidak tersedia");
            return;
        }

        if (scenario === "pengingat_garansi") {
            api.post(`/tiket-servis/${tiket.id}/reminder-garansi`, {
                catatan: `Follow-up pengingat garansi H-3 dikirimkan via WhatsApp (${personalityMode})`
            }).then(() => {
                toast.success("Log follow-up garansi berhasil dicatat!");
            }).catch(() => {});
        }

        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* 60fps Hardware-Accelerated Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs modal-backdrop" 
                onClick={onClose} 
            />

            <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden modal-surface z-10">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Generator Pesan WhatsApp Pelanggan</h2>
                            <p className="text-xs text-slate-500">
                                Standar komunikasi pelayanan prima (Sopan, terstruktur, tanpa singkatan)
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
                    {/* Scenario Tabs */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                            Pilih Skenario Komunikasi
                        </label>
                        <div className="flex flex-wrap sm:flex-nowrap gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setScenario("penawaran")}
                                className={`flex-1 min-w-[120px] sm:min-w-0 py-2 px-2.5 rounded-lg transition-all text-center ${
                                    scenario === "penawaran" 
                                        ? "bg-white text-blue-600 shadow-sm" 
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Diagnosis & Penawaran
                            </button>
                            <button
                                type="button"
                                onClick={() => setScenario("izin_tambahan")}
                                className={`flex-1 min-w-[120px] sm:min-w-0 py-2 px-2.5 rounded-lg transition-all text-center ${
                                    scenario === "izin_tambahan" 
                                        ? "bg-white text-blue-600 shadow-sm" 
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Izin Tindakan Berisiko
                            </button>
                            <button
                                type="button"
                                onClick={() => setScenario("selesai")}
                                className={`flex-1 min-w-[100px] sm:min-w-0 py-2 px-2.5 rounded-lg transition-all text-center ${
                                    scenario === "selesai" 
                                        ? "bg-white text-blue-600 shadow-sm" 
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Unit Selesai
                            </button>
                            <button
                                type="button"
                                onClick={() => setScenario("garansi_tips")}
                                className={`flex-1 min-w-[110px] sm:min-w-0 py-2 px-2.5 rounded-lg transition-all text-center ${
                                    scenario === "garansi_tips" 
                                        ? "bg-white text-blue-600 shadow-sm" 
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Garansi & Tips
                            </button>
                            <button
                                type="button"
                                onClick={() => setScenario("pengingat")}
                                className={`flex-1 min-w-[110px] sm:min-w-0 py-2 px-2.5 rounded-lg transition-all text-center ${
                                    scenario === "pengingat" 
                                        ? "bg-white text-blue-600 shadow-sm" 
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Pengingat Unit
                            </button>
                            <button
                                type="button"
                                onClick={() => setScenario("pengingat_garansi")}
                                className={`flex-1 min-w-[120px] sm:min-w-0 py-2 px-2.5 rounded-lg transition-all text-center ${
                                    scenario === "pengingat_garansi" 
                                        ? "bg-white text-blue-600 shadow-sm" 
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Garansi H-3 CRM
                            </button>
                        </div>
                    </div>

                    {/* Scenario Context Fields */}
                    {(scenario === "penawaran" || scenario === "pengingat_garansi") && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                    Adaptasi Gaya Bahasa Pelanggan
                                </span>
                                {customer?.tipe_kepribadian && (
                                    <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                        Profil: {customer.tipe_kepribadian}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 pt-1">
                                {["Koleris", "Sanguinis", "Plegmatis", "Melankolis", "Netral"].map((tone) => (
                                    <button
                                        key={tone}
                                        type="button"
                                        onClick={() => setPersonalityMode(tone)}
                                        className={`flex-1 min-w-[70px] sm:min-w-0 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border text-center ${
                                            personalityMode === tone
                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        {tone}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-slate-500 pt-0.5">
                                {personalityMode === "Koleris" && "Gaya ringkas, tegas, to the point, langsung biaya dan waktu pengerjaan."}
                                {personalityMode === "Sanguinis" && "Gaya hangat, ramah, antusias, apresiatif, sertakan foto unit."}
                                {personalityMode === "Plegmatis" && "Gaya tenang, sabar, suportif, tanpa mendesak keputusan."}
                                {personalityMode === "Melankolis" && "Gaya teliti, detail teknis lengkap dengan rincian biaya transparan."}
                                {personalityMode === "Netral" && "Gaya standar profesional: Sopan, terstruktur, ramah, dan solutif."}
                            </p>
                        </div>
                    )}

                    {scenario === "izin_tambahan" && (
                        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-amber-600" />
                                Parameter Tindakan Berisiko Tinggi
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tindakan</label>
                                    <input
                                        type="text"
                                        value={tindakanTambahan}
                                        onChange={(e) => setTindakanTambahan(e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                        placeholder="Misal: Flash BIOS / Reball"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Potensi Risiko</label>
                                    <input
                                        type="text"
                                        value={risikoTambahan}
                                        onChange={(e) => setRisikoTambahan(e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                        placeholder="Risiko unit / data"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tambahan Biaya (Rp)</label>
                                    <input
                                        type="number"
                                        value={biayaTambahan}
                                        onChange={(e) => setBiayaTambahan(e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {scenario === "pengingat" && (
                        <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex items-center justify-between gap-3 text-xs">
                            <span className="font-bold text-blue-900 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-blue-600" />
                                Periode Pengingat Penyimpanan Unit:
                            </span>
                            <div className="flex gap-2">
                                {["30", "60", "90"].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setReminderPeriod(p)}
                                        className={`px-3 py-1 rounded-lg font-bold transition-all border ${
                                            reminderPeriod === p 
                                                ? "bg-blue-600 text-white border-blue-600" 
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        {p} Hari
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message Preview and Editor */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Teks Pesan WhatsApp (Dapat Diedit Langsung)
                            </label>
                            <span className="text-[11px] text-slate-400">
                                Ditujukan ke: <span className="font-semibold text-slate-700">{customer?.nama} ({customer?.nomor_telepon})</span>
                            </span>
                        </div>
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            rows={9}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                    >
                        Tutup
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                            <span>{copied ? "Tersalin" : "Salin Pesan"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleSendWhatsApp}
                            className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-green-500/20"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Buka di WhatsApp</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

