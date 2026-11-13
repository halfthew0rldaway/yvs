const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, requirePermission } = require("../middleware/auth");
const { getAll, create, update, remove, use, removeUsage, restock, getUsageHistory, getRestockHistory, getAllRestockLogs, getRestockManifest, reminderRestock } = require("../controllers/sparepart.controller");

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

router.get("/", requirePermission("inventory.view"), getAll);
router.get("/restock-manifest", requirePermission("inventory.view"), getRestockManifest);
router.get("/restock-logs/all", requirePermission("inventory.view"), getAllRestockLogs);
router.get("/:id/usage-history", requirePermission("inventory.view"), getUsageHistory);
router.get("/:id/restock-history", requirePermission("inventory.view"), getRestockHistory);
router.post("/", requirePermission("inventory.manage"), sparepartValidation, validate, create);
router.post("/:id/restock", requirePermission("inventory.manage"), restock);
router.post("/:id/reminder-restock", requirePermission("inventory.view"), reminderRestock);
router.put("/:id", requirePermission("inventory.manage"), update);
router.delete("/:id", requirePermission("inventory.manage"), remove);
router.post("/use", requirePermission("inventory.use"), useValidation, validate, use);
router.delete("/use/:id", requirePermission("inventory.use"), removeUsage);

module.exports = router;

