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
        return res.status(401).json({ message: "Token tidak valid" });
    }
}

// Memastikan role sesuai
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Tidak terautentikasi" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Tidak memiliki akses" });
        }

        next();
    };
}

module.exports = { authenticate, authorize };
