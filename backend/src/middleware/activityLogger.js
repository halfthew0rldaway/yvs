const jwt = require("jsonwebtoken");
const { recordActivity } = require("../services/activityLog.service");

const activityLogger = async (req, res, next) => {
    // Log all data mutations: POST, PUT, PATCH, DELETE
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        res.on("finish", async () => {
            // Only log successful actions
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const url = req.originalUrl.toLowerCase();
                    const method = req.method;

                    // Skip automatic background keepalive and file stream endpoints
                    if (url.includes("/auth/refresh")) return;
                    if (url.includes("/database/backup")) return;
                    if (url.includes("/tracking")) return;

                    // Try getting user from req.user or parse JWT from authorization header
                    let currentUser = req.user;
                    if (!currentUser && req.headers.authorization?.startsWith("Bearer ")) {
                        try {
                            const token = req.headers.authorization.split(" ")[1];
                            currentUser = jwt.verify(token, process.env.JWT_SECRET);
                        } catch (_) {}
                    }

                    // Handled explicitly in their respective controllers for detailed audit trails
                    if (url.includes("/auth/login") || url.includes("/auth/logout")) return;
                    if (url.includes("/attendance")) return;

                    if (!currentUser) return;

                    let actionName = "Melakukan aktivitas di sistem";
                    let entityName = "sistem";

                    if (url.includes("/auth/profile/photo")) {
                        actionName = method === "DELETE" ? "Menghapus foto profil akun" : "Memperbarui foto profil akun";
                        entityName = "user";
                    } else if (url.includes("/auth/profile")) {
                        actionName = "Memperbarui informasi profil akun";
                        entityName = "user";
                    } else if (url.includes("/claim-garansi")) {
                        actionName = "Menerbitkan tiket klaim garansi servis (re-work)";
                        entityName = "tiket";
                    } else if (url.includes("/revisi-acc")) {
                        actionName = "Melakukan revisi kesepakatan penawaran servis (Revisi ACC)";
                        entityName = "tiket";
                    } else if (url.includes("/foto-selesai")) {
                        actionName = "Mengunggah foto bukti unit selesai dikerjakan";
                        entityName = "tiket";
                    } else if (url.includes("/foto-diagnosis")) {
                        actionName = "Mengunggah foto bukti hasil diagnosis teknis";
                        entityName = "tiket";
                    } else if (url.includes("/defect-map")) {
                        actionName = "Memperbarui peta cacat fisik (defect map) unit";
                        entityName = "tiket";
                    } else if (url.includes("/reminder-garansi")) {
                        actionName = "Mengirim pesan pengingat garansi CRM ke pelanggan";
                        entityName = "tiket";
                    } else if (url.includes("/reminder-maintenance")) {
                        actionName = "Mengirim pesan pengingat servis berkala ke pelanggan";
                        entityName = "tiket";
                    } else if (url.includes("/reminder-unclaimed")) {
                        actionName = "Mengirim pesan pengingat unit belum diambil ke pelanggan";
                        entityName = "tiket";
                    } else if (url.includes("/reminder")) {
                        actionName = "Memperbarui preferensi pengingat tiket servis";
                        entityName = "tiket";
                    } else if (url.includes("/tiket-servis")) {
                        entityName = "tiket";
                        if (method === "POST") actionName = "Membuat tiket servis baru";
                        else if (method === "PUT" || method === "PATCH") actionName = "Mengubah status atau informasi tiket servis";
                        else if (method === "DELETE") actionName = "Membatalkan tiket servis";
                    } else if (url.includes("/customer")) {
                        entityName = "customer";
                        if (url.includes("/badges")) actionName = "Menyesuaikan badge reputasi pelanggan";
                        else if (method === "POST") actionName = "Menambahkan data pelanggan baru";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui data profil pelanggan";
                        else if (method === "DELETE") actionName = "Menghapus data pelanggan";
                    } else if (url.includes("/perangkat")) {
                        entityName = "perangkat";
                        if (method === "POST") actionName = "Mendaftarkan unit perangkat baru";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui spesifikasi unit perangkat";
                        else if (method === "DELETE") actionName = "Menghapus data unit perangkat";
                    } else if (url.includes("/diagnosis")) {
                        entityName = "diagnosis";
                        if (method === "POST") actionName = "Menyimpan hasil diagnosis & estimasi biaya";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui hasil diagnosis teknis";
                        else if (method === "DELETE") actionName = "Menghapus data diagnosis teknis";
                    } else if (url.includes("/log-perbaikan")) {
                        entityName = "tiket";
                        if (method === "POST") actionName = "Menambahkan catatan log pengerjaan teknisi";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui catatan log pengerjaan teknisi";
                        else if (method === "DELETE") actionName = "Menghapus catatan log pengerjaan";
                    } else if (url.includes("/sparepart")) {
                        entityName = "sparepart";
                        if (url.includes("/restock")) actionName = "Mencatat penambahan stok (restock) suku cadang";
                        else if (method === "POST") actionName = "Menambahkan suku cadang baru ke inventaris";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui stok atau harga suku cadang";
                        else if (method === "DELETE") actionName = "Menghapus suku cadang dari inventaris";
                    } else if (url.includes("/invoice")) {
                        entityName = "invoice";
                        if (url.includes("/send-wa")) actionName = "Mengirimkan nota invoice via WhatsApp ke pelanggan";
                        else if (method === "POST") actionName = "Menerbitkan faktur / nota pembayaran servis";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui status atau rincian pembayaran invoice";
                        else if (method === "DELETE") actionName = "Membatalkan nota invoice pembayaran";
                    } else if (url.includes("/rma")) {
                        entityName = "rma";
                        if (method === "POST") actionName = "Mengajukan klaim retur garansi RMA ke supplier";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui progres status klaim RMA";
                        else if (method === "DELETE") actionName = "Membatalkan pengajuan klaim RMA";
                    } else if (url.includes("/supplier")) {
                        entityName = "supplier";
                        if (method === "POST") actionName = "Menambahkan distributor / supplier baru";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui data distributor / supplier";
                        else if (method === "DELETE") actionName = "Menghapus data supplier";
                    } else if (url.includes("/loaner")) {
                        entityName = "loaner";
                        if (method === "POST") actionName = "Mencatat peminjaman unit pengganti (loaner)";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui status / pengembalian unit pinjaman";
                    } else if (url.includes("/repair-wiki")) {
                        entityName = "sistem";
                        if (method === "POST") actionName = "Mempublikasikan artikel panduan teknis Repair Wiki";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui artikel panduan Repair Wiki";
                        else if (method === "DELETE") actionName = "Menghapus artikel dari Repair Wiki";
                    } else if (url.includes("/staff-signatures")) {
                        entityName = "user";
                        if (method === "POST") actionName = "Menyimpan tanda tangan digital staff / teknisi";
                        else if (method === "DELETE") actionName = "Menghapus tanda tangan digital staff";
                    } else if (url.includes("/sop")) {
                        entityName = "sistem";
                        if (method === "POST") actionName = "Menambahkan dokumen Standar Operasional Prosedur (SOP)";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui dokumen SOP";
                        else if (method === "DELETE") actionName = "Menghapus dokumen SOP";
                    } else if (url.includes("/users")) {
                        entityName = "user";
                        if (method === "POST") actionName = "Mendaftarkan akun karyawan / teknisi baru";
                        else if (method === "PUT" || method === "PATCH") actionName = "Memperbarui hak akses atau profil karyawan";
                        else if (method === "DELETE") actionName = "Menonaktifkan akun karyawan";
                    } else if (url.includes("/database/cleanup-logs")) {
                        entityName = "sistem";
                        actionName = "Membersihkan riwayat log audit lama";
                    }

                    await recordActivity({
                        userId: currentUser.id ? Number(currentUser.id) : null,
                        userNama: currentUser.nama || currentUser.username || "Staff",
                        action: actionName,
                        entity: entityName
                    });
                } catch (err) {
                    console.error("Gagal mencatat log aktivitas:", err.message);
                }
            }
        });
    }
    next();
};

module.exports = activityLogger;
