const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
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
router.get("/", getAll);
router.get("/:id", getById);

// Admin & Pimpinan can manage suppliers
router.post("/", authorize("admin", "pimpinan"), create);
router.put("/:id", authorize("admin", "pimpinan"), update);
router.delete("/:id", authorize("admin", "pimpinan"), deleteSupplier);

module.exports = router;

