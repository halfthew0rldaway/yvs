const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { getAll, create, update, getById, getReport, saveCustomerSignature, saveAdminSignature } = require("../controllers/invoice.controller");

const router = express.Router();

router.use(authenticate);

const invoiceValidation = [
    body("tiket_id").notEmpty().withMessage("Tiket wajib dipilih"),
    body("biaya_jasa").isNumeric().withMessage("Biaya jasa harus berupa angka"),
];

router.get("/report", authorize("admin"), getReport);
router.get("/", authorize("admin", "frontman", "teknisi"), getAll);
router.get("/:id", authorize("admin", "frontman", "teknisi"), getById);
router.post("/", authorize("admin", "frontman"), invoiceValidation, validate, create);
router.put("/:id", authorize("admin", "frontman"), update);
router.post("/:id/signature", authorize("admin", "frontman", "teknisi"), saveCustomerSignature);
router.post("/:id/admin-signature", authorize("admin", "frontman", "teknisi"), saveAdminSignature);

module.exports = router;
