const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
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
    uploadFotoDiagnosis
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

router.get("/", getAll);
router.get("/warranty/expiring", getExpiringWarranties);
router.get("/maintenance/due", getMaintenanceDue);
router.get("/unclaimed/due", getUnclaimedDue);
router.get("/:id", getById);
router.post("/", authorize("admin"), upload.array("foto_kondisi", 10), tiketValidation, validate, create);
router.post("/:id/foto-selesai", authorize("admin", "teknisi"), upload.array("foto_selesai", 15), uploadFotoSelesai);
router.post("/:id/foto-diagnosis", authorize("admin", "teknisi"), upload.array("foto_diagnosis", 25), uploadFotoDiagnosis);
router.post("/:id/claim-garansi", authorize("admin"), createWarrantyClaim);
router.post("/:id/reminder-garansi", authorize("admin", "teknisi"), markWarrantyFollowUp);
router.post("/:id/reminder-maintenance", authorize("admin", "teknisi"), markMaintenanceFollowUp);
router.post("/:id/reminder-unclaimed", authorize("admin", "teknisi"), markUnclaimedFollowUp);
router.patch("/:id/defect-map", authorize("admin", "teknisi"), updateDefectMap);
router.put("/:id/defect-map", authorize("admin", "teknisi"), updateDefectMap);
router.put("/:id", authorize("admin", "teknisi"), update);
router.put("/:id/reminder", authorize("admin"), updateReminder);

module.exports = router;
