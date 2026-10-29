const prisma = require("../config/database");
const jwt = require("jsonwebtoken");

const activityLogger = async (req, res, next) => {
    // Only log mutations
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
        res.on("finish", async () => {
            // Only log successful actions
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    // Try getting user from req.user or parse JWT from header
                    let currentUser = req.user;
                    if (!currentUser && req.headers.authorization?.startsWith("Bearer ")) {
                        try {
                            const token = req.headers.authorization.split(" ")[1];
                            currentUser = jwt.verify(token, process.env.JWT_SECRET);
                        } catch (_) {}
                    }

                    if (!currentUser) return;
                    
                    // Skip auth routes (login/logout/refresh)
                    if (req.originalUrl.includes("/auth")) return; 
                    // Skip database backup downloading/triggering
                    if (req.originalUrl.includes("/database/backup")) return;

                    let actionName = "Melakukan aktivitas di sistem";
                    let entityName = "sistem";
                    const url = req.originalUrl.toLowerCase();
                    const method = req.method;

                    if (url.includes("/claim-garansi")) {
                        actionName = "Menerbitkan tiket klaim garansi servis (re-work)";
                        entityName = "tiket";
                    } else if (url.includes("/revisi-acc")) {
                        actionName = "Melakukan revisi kesepakatan penawaran servis (Revisi ACC)";
                        entityName = "tiket";
                    } else if (url.includes("/tiket-servis")) {
                        entityName = "tiket";
                        if (method === "POST") actionName = "Membuat tiket servis baru";
                        else if (method === "PUT") actionName = "Mengubah data atau status pengerjaan tiket servis";
                        else if (method === "DELETE") actionName = "Membatalkan tiket servis";
                    } else if (url.includes("/customer")) {
                        entityName = "customer";
                        if (url.includes("/badges")) actionName = "Menyesuaikan badge reputasi pelanggan";
                        else if (method === "POST") actionName = "Menambahkan data pelanggan baru";
                        else if (method === "PUT") actionName = "Memperbarui informasi data pelanggan";
                        else if (method === "DELETE") actionName = "Menghapus data pelanggan";
                    } else if (url.includes("/perangkat")) {
                        entityName = "perangkat";
                        if (method === "POST") actionName = "Mendaftarkan unit perangkat baru";
                        else if (method === "PUT") actionName = "Memperbarui spesifikasi unit perangkat";
                        else if (method === "DELETE") actionName = "Menghapus unit perangkat";
                    } else if (url.includes("/diagnosis")) {
                        entityName = "diagnosis";
                        if (method === "POST") actionName = "Menyimpan hasil diagnosis & estimasi biaya";
                        else if (method === "PUT") actionName = "Memperbarui hasil diagnosis teknis";
                    } else if (url.includes("/log-perbaikan")) {
                        entityName = "log_perbaikan";
                        actionName = "Menambahkan catatan log pengerjaan teknisi";
                    } else if (url.includes("/sparepart")) {
                        entityName = "sparepart";
                        if (url.includes("/restock-alert")) actionName = "Mengirimkan sinyal pengingat restock sparepart";
                        else if (method === "POST") actionName = "Menambahkan suku cadang baru ke inventaris";
                        else if (method === "PUT") actionName = "Memperbarui stok atau harga suku cadang";
                        else if (method === "DELETE") actionName = "Menghapus suku cadang dari inventaris";
                    } else if (url.includes("/invoice")) {
                        entityName = "invoice";
                        if (method === "POST") actionName = "Menerbitkan nota / faktur pembayaran servis";
                        else if (method === "PUT") actionName = "Memperbarui rincian atau status pembayaran invoice";
                        else if (method === "DELETE") actionName = "Membatalkan invoice pembayaran";
                    } else if (url.includes("/rma")) {
                        entityName = "rma";
                        if (method === "POST") actionName = "Mengajukan klaim retur RMA ke supplier";
                        else if (method === "PUT") actionName = "Memperbarui progres status klaim RMA";
                    } else if (url.includes("/supplier")) {
                        entityName = "supplier";
                        if (method === "POST") actionName = "Menambahkan kontak distributor / supplier";
                        else if (method === "PUT") actionName = "Memperbarui data distributor / supplier";
                        else if (method === "DELETE") actionName = "Menghapus data supplier";
                    } else if (url.includes("/loaner")) {
                        entityName = "loaner";
                        if (method === "POST") actionName = "Mencatat peminjaman unit pengganti (loaner)";
                        else if (method === "PUT") actionName = "Memperbarui status / pengembalian unit pinjaman";
                    } else if (url.includes("/users")) {
                        entityName = "user";
                        if (method === "POST") actionName = "Mendaftarkan akun karyawan / teknisi baru";
                        else if (method === "PUT") actionName = "Memperbarui hak akses atau profil karyawan";
                        else if (method === "DELETE") actionName = "Menonaktifkan / menghapus akun karyawan";
                    }

                    await prisma.activityLog.create({
                        data: {
                            user_id: currentUser.id ? Number(currentUser.id) : null,
                            user_nama: currentUser.nama || currentUser.username || "Staff",
                            action: actionName,
                            entity: entityName,
                        }
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
