const express = require("express");
const { authenticate, requirePermission } = require("../middleware/auth");
const {
    getAll,
    getStats,
    getById,
    create,
    update,
    remove
} = require("../controllers/rma.controller");

const router = express.Router();

router.use(authenticate);

router.get("/stats", requirePermission("suppliers.view"), getStats);
router.get("/:id", requirePermission("suppliers.view"), getById);
router.get("/", requirePermission("suppliers.view"), getAll);
router.post("/", requirePermission("suppliers.manage"), create);
router.put("/:id", requirePermission("suppliers.manage"), update);
router.delete("/:id", requirePermission("suppliers.manage"), remove);

module.exports = router;

