const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { getAll, getById, create, update, updateReminder } = require("../controllers/tiket-servis.controller");

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
router.get("/:id", getById);
router.post("/", authorize("admin"), upload.array("foto_kondisi", 5), tiketValidation, validate, create);
router.put("/:id", authorize("admin", "teknisi"), update);
router.put("/:id/reminder", authorize("admin"), updateReminder);

module.exports = router;
