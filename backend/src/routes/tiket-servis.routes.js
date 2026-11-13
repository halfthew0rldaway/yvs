const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, requirePermission, requireTicketMutation } = require("../middleware/auth");
const { upload, compressMedia } = require("../middleware/upload");
const { 
    getAll, 
    getById, 
    create, 
    update, 
    updateDefectMap,
    updateReminder, 
    createWarrantyClaim, 
    getExpiringWarranties, 
    markWarrantyFollowUp,
    getMaintenanceDue,
    markMaintenanceFollowUp,
    getUnclaimedDue,
    markUnclaimedFollowUp,
    uploadFotoSelesai,
    uploadFotoDiagnosis,
    uploadFotoHandover,
    revisiAcc
} = require("../controllers/tiket-servis.controller");

const router = express.Router();

router.use(authenticate);

const tiketValidation = [
    body("perangkat_id").notEmpty().withMessage("Perangkat wajib dipilih"),
    body("keluhan")
        .notEmpty().withMessage("Keluhan wajib diisi")
        .isLength({ min: 10, max: 1000 }).withMessage("Keluhan harus antara 10-1000 karakter")
        .trim(),
    body("kelengkapan")
        .optional({ checkFalsy: true })
        .isLength({ max: 500 }).withMessage("Kelengkapan maksimal 500 karakter")
        .trim()
];

router.get("/", requirePermission("tickets.view"), getAll);
router.get("/warranty/expiring", requirePermission("crm.view"), getExpiringWarranties);
router.get("/maintenance/due", requirePermission("crm.view"), getMaintenanceDue);
router.get("/unclaimed/due", requirePermission("crm.view"), getUnclaimedDue);
router.get("/:id", requirePermission("tickets.view"), getById);
router.post("/", requirePermission("tickets.intake"), upload.array("foto_kondisi", 10), compressMedia, tiketValidation, validate, create);
router.post("/:id/foto-selesai", requirePermission("tickets.qc"), upload.array("foto_selesai", 15), compressMedia, uploadFotoSelesai);
router.post("/:id/foto-diagnosis", requirePermission("tickets.diagnosis"), upload.array("foto_diagnosis", 25), compressMedia, uploadFotoDiagnosis);
router.post("/:id/foto-handover", requirePermission("tickets.handover"), upload.array("foto_handover", 5), compressMedia, uploadFotoHandover);
router.post("/:id/claim-garansi", requirePermission("tickets.handover"), createWarrantyClaim);
router.post("/:id/reminder-garansi", requirePermission("crm.view"), markWarrantyFollowUp);
router.post("/:id/reminder-maintenance", requirePermission("crm.view"), markMaintenanceFollowUp);
router.post("/:id/reminder-unclaimed", requirePermission("crm.view"), markUnclaimedFollowUp);
router.post("/:id/revisi-acc", requirePermission("tickets.diagnosis"), revisiAcc);
router.patch("/:id/defect-map", requirePermission("tickets.intake", "tickets.repair"), updateDefectMap);
router.put("/:id/defect-map", requirePermission("tickets.intake", "tickets.repair"), updateDefectMap);
router.put("/:id", requireTicketMutation, update);
router.put("/:id/reminder", requirePermission("crm.view"), updateReminder);

module.exports = router;
