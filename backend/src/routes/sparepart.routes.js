const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { getAll, create, update, remove, use, removeUsage, restock, getUsageHistory, getRestockHistory, getAllRestockLogs, getRestockManifest } = require("../controllers/sparepart.controller");

const router = express.Router();

router.use(authenticate);

const sparepartValidation = [
    body("nama")
        .notEmpty().withMessage("Nama sparepart wajib diisi")
        .isLength({ min: 3, max: 100 }).withMessage("Nama maksimal 100 karakter")
        .trim(),
    body("stok")
        .isInt({ min: 0 }).withMessage("Stok harus berupa angka positif"),
    body("harga")
        .isInt({ min: 0 }).withMessage("Harga harus berupa angka positif"),
];

const useValidation = [
    body("tiket_id").notEmpty().withMessage("Tiket wajib dipilih"),
    body("sparepart_id").notEmpty().withMessage("Sparepart wajib dipilih"),
    body("jumlah").isInt({ min: 1 }).withMessage("Jumlah minimal 1"),
];

router.get("/", getAll);
router.get("/restock-manifest", getRestockManifest);
router.get("/restock-logs/all", getAllRestockLogs);
router.get("/:id/usage-history", getUsageHistory);
router.get("/:id/restock-history", getRestockHistory);
router.post("/", authorize("admin"), sparepartValidation, validate, create);
router.post("/:id/restock", authorize("admin"), restock);
router.put("/:id", authorize("admin"), update);
router.delete("/:id", authorize("admin"), remove);
router.post("/use", authorize("teknisi", "admin"), useValidation, validate, use);
router.delete("/use/:id", authorize("teknisi", "admin"), removeUsage);

module.exports = router;

