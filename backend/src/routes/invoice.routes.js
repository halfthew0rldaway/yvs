const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { getAll, create, getById } = require("../controllers/invoice.controller");

const router = express.Router();

router.use(authenticate);

const invoiceValidation = [
    body("tiket_id").notEmpty().withMessage("Tiket wajib dipilih"),
    body("biaya_jasa").isNumeric().withMessage("Biaya jasa harus berupa angka"),
];

router.get("/", authorize("admin"), getAll);
router.get("/:id", authorize("admin"), getById);
router.post("/", authorize("admin"), invoiceValidation, validate, create);

module.exports = router;
