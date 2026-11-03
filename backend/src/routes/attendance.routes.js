const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { uploadAttendance, uploadLeave } = require("../middleware/upload");

// Semua route attendance membutuhkan login aktif
router.use(authenticate);

// 1. Kebijakan & Pengaturan Absensi
router.get("/policy", attendanceController.getPolicy);
router.put("/policy", authorize("admin"), attendanceController.updatePolicy);

// 2. Presensi Harian Karyawan (Check-In & Check-Out Mandiri)
router.get("/today", attendanceController.getTodayStatus);
router.post("/check-in", uploadAttendance.single("foto"), attendanceController.checkIn);
router.post("/check-out", uploadAttendance.single("foto"), attendanceController.checkOut);
router.get("/my-history", attendanceController.getMyHistory);

// 3. Supervisi & Rekapitulasi (Admin / Pimpinan / Owner)
router.get("/daily-all", authorize("admin", "pimpinan"), attendanceController.getDailyAll);
router.get("/recap", authorize("admin", "pimpinan"), attendanceController.getMonthlyRecap);
router.post("/adjust", authorize("admin"), attendanceController.adjustAttendance);
router.post("/adjust-bulk", authorize("admin"), attendanceController.adjustAttendanceBulk);
router.get("/pending-reviews", authorize("admin", "pimpinan"), attendanceController.getPendingReviews);
router.put("/:id/review", authorize("admin", "pimpinan"), attendanceController.reviewAttendance);

// 4. Pengajuan Izin / Cuti / Sakit
router.get("/leaves", attendanceController.getLeaves);
router.post("/leaves", uploadLeave.single("lampiran"), attendanceController.createLeave);
router.put("/leaves/:id/review", authorize("admin", "pimpinan"), attendanceController.reviewLeave);

module.exports = router;

