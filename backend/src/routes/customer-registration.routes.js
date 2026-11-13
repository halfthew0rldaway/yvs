const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticate, requirePermission } = require("../middleware/auth");
const registration = require("../controllers/customer-registration.controller");

const router = express.Router();
const publicLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
    message: { message: "Terlalu banyak pendaftaran dari jaringan ini. Silakan hubungi petugas." }
});

router.post("/submit", publicLimiter, registration.submit);

router.use(authenticate, requirePermission("tickets.intake"));
router.get("/pending", registration.pending);
router.get("/pending/:id", registration.getOne);
router.post("/pending/:id/accept", registration.accept);
router.post("/pending/:id/reject", registration.reject);

module.exports = router;
