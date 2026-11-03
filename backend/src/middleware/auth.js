const jwt = require("jsonwebtoken");

// Memverifikasi token JWT
function authenticate(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ 
                message: "Sesi login Anda telah berakhir. Silakan login kembali.", 
                code: "TOKEN_EXPIRED" 
            });
        }
        return res.status(401).json({ message: "Token tidak valid", code: "INVALID_TOKEN" });
    }
}

// Memastikan role sesuai dengan pembagian kewenangan yang jelas:
// - Pimpinan (Manajerial / Owner): Supervisi strategis, rekapitulasi, review permohonan izin/tugas luar & audit
// - Admin: Operasional penuh sistem workshop & administrasi teknis
// - Keduanya mewarisi akses frontman (meja depan / kasir)
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Tidak terautentikasi" });
        }

        const userRole = req.user.role;
        const hasAccess = roles.includes(userRole)
            || ((userRole === "admin" || userRole === "pimpinan") && roles.includes("frontman"));

        if (!hasAccess) {
            return res.status(403).json({ message: "Tidak memiliki akses" });
        }

        next();
    };
}

module.exports = { authenticate, authorize };
