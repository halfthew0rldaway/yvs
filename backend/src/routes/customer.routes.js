const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { getAll, getById, create, update, remove, updateBadges } = require("../controllers/customer.controller");
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

router.get("/", getAll);
router.get("/:id", getById);
router.patch("/:id/badges", authorize("admin", "pimpinan", "teknisi"), updateBadges);
router.put("/:id/badges", authorize("admin", "pimpinan", "teknisi"), updateBadges);
router.post("/", authorize("admin"), customerValidation, validate, create);
router.put("/:id", authorize("admin"), customerValidation, validate, update);
router.delete("/:id", authorize("admin"), remove);

module.exports = router;
