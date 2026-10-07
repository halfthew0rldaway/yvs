const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { getAll, getById, create, update, remove } = require("../controllers/customer.controller");

const router = express.Router();

router.use(authenticate);

const customerValidation = [
    body("nama")
        .notEmpty().withMessage("Nama wajib diisi")
        .isLength({ min: 3, max: 100 }).withMessage("Nama harus 3-100 karakter")
        .trim(),
    body("nomor_telepon")
        .notEmpty().withMessage("Nomor telepon wajib diisi")
        .matches(/^[0-9]{10,13}$/).withMessage("No telepon harus berupa angka, 10-13 digit"),
    body("alamat")
        .optional()
        .isLength({ max: 255 }).withMessage("Alamat maksimal 255 karakter")
        .trim()
];

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", authorize("admin"), customerValidation, validate, create);
router.put("/:id", authorize("admin"), customerValidation, validate, update);
router.delete("/:id", authorize("admin"), remove);

module.exports = router;
