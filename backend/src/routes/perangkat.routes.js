const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, requirePermission } = require("../middleware/auth");
const { getAll, getById, create, update, remove } = require("../controllers/perangkat.controller");
const { normalizeBrand, normalizeDeviceType, normalizeSerialNumber, normalizeText } = require("../utils/normalize");

const router = express.Router();

router.use(authenticate);

const perangkatValidation = [
    body("customer_id").notEmpty().withMessage("Customer wajib dipilih"),
    body("jenis_perangkat")
        .notEmpty().withMessage("Jenis perangkat wajib diisi")
        .customSanitizer(val => normalizeDeviceType(val)),
    body("merek")
        .notEmpty().withMessage("Merek wajib diisi")
        .customSanitizer(val => normalizeBrand(val)),
    body("model")
        .notEmpty().withMessage("Model wajib diisi")
        .customSanitizer(val => normalizeText(val))
        .isLength({ max: 100 }).withMessage("Maksimal 100 karakter"),
    body("serial_number")
        .optional({ checkFalsy: true })
        .customSanitizer(val => normalizeSerialNumber(val))
];

router.get("/", requirePermission("devices.view"), getAll);
router.get("/:id", requirePermission("devices.view"), getById);
router.post("/", requirePermission("devices.manage"), perangkatValidation, validate, create);
router.put("/:id", requirePermission("devices.manage"), perangkatValidation, validate, update);
router.delete("/:id", requirePermission("devices.manage"), remove);

module.exports = router;
