const express = require("express");
const { authenticate, requirePermission } = require("../middleware/auth");
const { getAll, create, remove } = require("../controllers/staffSignature.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", requirePermission("invoices.view"), getAll);
router.post("/", requirePermission("invoices.manage"), create);
router.delete("/:id", requirePermission("invoices.manage"), remove);

module.exports = router;

