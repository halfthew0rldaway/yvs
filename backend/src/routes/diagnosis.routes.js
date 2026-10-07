const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { create, getByTiketId } = require("../controllers/diagnosis.controller");

const router = express.Router();

router.use(authenticate);

const diagnosisValidation = [
    body("tiket_id").notEmpty().withMessage("Tiket wajib dipilih"),
    body("masalah").notEmpty().withMessage("Masalah wajib diisi"),
    body("solusi").notEmpty().withMessage("Solusi wajib diisi"),
    body("estimasi_biaya").notEmpty().withMessage("Estimasi biaya wajib diisi"),
];

router.post("/", authorize("teknisi"), diagnosisValidation, validate, create);
router.get("/:id", getByTiketId);

module.exports = router;
