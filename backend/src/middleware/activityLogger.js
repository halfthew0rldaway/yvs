const prisma = require("../config/database");

const activityLogger = async (req, res, next) => {
    // Only log mutations
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
        res.on("finish", async () => {
            // Only log successful actions
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    // Only log actions performed by logged-in users
                    if (!req.user) return; 
                    
                    // Skip auth routes (login/logout)
                    if (req.originalUrl.includes("/auth")) return; 

                    let actionName = "Melakukan aktivitas di sistem";
                    const url = req.originalUrl;
                    const method = req.method;

                    // Basic heuristics
                    if (url.includes("/tiket-servis")) {
                        if (method === "POST") actionName = "Membuat tiket servis baru";
                        if (method === "PUT") actionName = "Mengubah data/status tiket servis";
                    } else if (url.includes("/customer")) {
                        if (method === "POST") actionName = "Menambahkan data customer baru";
                        if (method === "PUT") actionName = "Memperbarui data customer";
                        if (method === "DELETE") actionName = "Menghapus data customer";
                    } else if (url.includes("/perangkat")) {
                        if (method === "POST") actionName = "Mendaftarkan perangkat pelanggan";
                        if (method === "PUT") actionName = "Memperbarui data perangkat";
                    } else if (url.includes("/diagnosis")) {
                        if (method === "POST") actionName = "Memasukkan hasil diagnosis";
                    } else if (url.includes("/log-perbaikan")) {
                        if (method === "POST") actionName = "Menambahkan catatan log perbaikan";
                    } else if (url.includes("/sparepart")) {
                        if (method === "POST") actionName = "Menambahkan sparepart baru";
                        if (method === "PUT") actionName = "Memperbarui stok/data sparepart";
                        if (method === "DELETE") actionName = "Menghapus data sparepart";
                    } else if (url.includes("/invoice")) {
                        if (method === "POST") actionName = "Menerbitkan invoice pembayaran";
                    }

                    await prisma.activityLog.create({
                        data: {
                            user_id: req.user.id,
                            user_nama: req.user.nama,
                            action: actionName,
                            entity: url, 
                        }
                    });
                } catch (err) {
                    console.error("Gagal mencatat log aktivitas:", err);
                }
            }
        });
    }
    next();
};

module.exports = activityLogger;
