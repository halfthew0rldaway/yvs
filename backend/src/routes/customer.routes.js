const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, requirePermission } = require("../middleware/auth");
const { getAll, getById, create, update, remove, restore, updateBadges } = require("../controllers/customer.controller");
const { normalizePhone, normalizeName, normalizeText } = require("../utils/normalize");

const router = express.Router();

router.use(authenticate);

const customerValidation = [
    body("nama")
        .notEmpty().withMessage("Nama wajib diisi")
        .customSanitizer(val => normalizeName(val))
        .isLength({ min: 3, max: 100 }).withMessage("Nama harus 3-100 karakter"),
    body("nomor_telepon")
        .notEmpty().withMessage("Nomor telepon wajib diisi")
        .customSanitizer(val => normalizePhone(val))
        .matches(/^0[0-9]{8,13}$/).withMessage("Nomor telepon tidak valid (contoh: 081234567890)"),
    body("alamat")
        .optional()
        .customSanitizer(val => normalizeText(val))
        .isLength({ max: 255 }).withMessage("Alamat maksimal 255 karakter")
];

router.get("/", requirePermission("customers.view"), getAll);
router.get("/:id", requirePermission("customers.view"), getById);
router.patch("/:id/badges", requirePermission("customers.manage"), updateBadges);
router.put("/:id/badges", requirePermission("customers.manage"), updateBadges);
router.post("/:id/restore", requirePermission("customers.manage"), restore);
router.put("/:id/restore", requirePermission("customers.manage"), restore);
router.post("/", requirePermission("customers.manage"), customerValidation, validate, create);
router.put("/:id", requirePermission("customers.manage"), customerValidation, validate, update);
router.delete("/:id", requirePermission("customers.manage"), remove);

module.exports = router;
