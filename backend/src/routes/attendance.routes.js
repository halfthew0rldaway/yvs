const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const { authenticate, requirePermission } = require("../middleware/auth");
const { uploadAttendance, uploadLeave } = require("../middleware/upload");

// Semua route attendance membutuhkan login aktif
router.use(authenticate);

// 1. Kebijakan & Pengaturan Absensi
router.get("/policy", requirePermission("attendance.self", "attendance.review", "attendance.adjust", "attendance.policy"), attendanceController.getPolicy);
router.put("/policy", requirePermission("attendance.policy"), attendanceController.updatePolicy);

// 2. Presensi Harian Karyawan (Check-In & Check-Out Mandiri)
router.get("/today", requirePermission("attendance.self"), attendanceController.getTodayStatus);
router.post("/check-in", requirePermission("attendance.self"), uploadAttendance.single("foto"), attendanceController.checkIn);
router.post("/check-out", requirePermission("attendance.self"), uploadAttendance.single("foto"), attendanceController.checkOut);
router.get("/my-history", requirePermission("attendance.self"), attendanceController.getMyHistory);

// 3. Supervisi & Rekapitulasi (Admin / Pimpinan / Owner)
router.get("/daily-all", requirePermission("attendance.review"), attendanceController.getDailyAll);
router.get("/recap", requirePermission("attendance.review"), attendanceController.getMonthlyRecap);
router.get("/adjust-staff", requirePermission("attendance.adjust"), attendanceController.getAdjustmentStaff);
router.post("/adjust", requirePermission("attendance.adjust"), attendanceController.adjustAttendance);
router.post("/adjust-bulk", requirePermission("attendance.adjust"), attendanceController.adjustAttendanceBulk);
router.get("/pending-reviews", requirePermission("attendance.review"), attendanceController.getPendingReviews);
router.put("/:id/review", requirePermission("attendance.review"), attendanceController.reviewAttendance);

// 4. Pengajuan Izin / Cuti / Sakit
router.get("/leaves", requirePermission("attendance.self"), attendanceController.getLeaves);
router.post("/leaves", requirePermission("attendance.self"), uploadLeave.single("lampiran"), attendanceController.createLeave);
router.put("/leaves/:id/review", requirePermission("attendance.review"), attendanceController.reviewLeave);

module.exports = router;

