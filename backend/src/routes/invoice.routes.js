const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, requirePermission } = require("../middleware/auth");
const { getAll, create, update, getById, getReport, saveCustomerSignature, saveAdminSignature } = require("../controllers/invoice.controller");

const router = express.Router();

router.use(authenticate);

const invoiceValidation = [
    body("tiket_id").notEmpty().withMessage("Tiket wajib dipilih"),
    body("biaya_jasa").isNumeric().withMessage("Biaya jasa harus berupa angka"),
];

router.get("/report", requirePermission("invoices.report"), getReport);
router.get("/", requirePermission("invoices.view"), getAll);
router.get("/:id", requirePermission("invoices.view"), getById);
router.post("/", requirePermission("invoices.manage"), invoiceValidation, validate, create);
router.put("/:id", requirePermission("invoices.manage"), update);
router.post("/:id/signature", requirePermission("invoices.manage"), saveCustomerSignature);
router.post("/:id/admin-signature", requirePermission("invoices.manage"), saveAdminSignature);

module.exports = router;
