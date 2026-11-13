const express = require("express");
const { authenticate, requirePermission } = require("../middleware/auth");
const {
    getAll,
    getById,
    create,
    update,
    deleteSupplier
} = require("../controllers/supplier.controller");

const router = express.Router();

router.use(authenticate);

// All authenticated roles (admin, teknisi) can view suppliers
router.get("/", requirePermission("suppliers.view"), getAll);
router.get("/:id", requirePermission("suppliers.view"), getById);

// Admin & Pimpinan can manage suppliers
router.post("/", requirePermission("suppliers.manage"), create);
router.put("/:id", requirePermission("suppliers.manage"), update);
router.delete("/:id", requirePermission("suppliers.manage"), deleteSupplier);

module.exports = router;

