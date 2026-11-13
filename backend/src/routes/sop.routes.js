const express = require("express");
const { authenticate, requirePermission } = require("../middleware/auth");
const {
    getAll,
    getById,
    create,
    update,
    remove
} = require("../controllers/sop.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", requirePermission("wiki.view"), getAll);
router.get("/:id", requirePermission("wiki.view"), getById);
router.post("/", requirePermission("wiki.manage"), create);
router.put("/:id", requirePermission("wiki.manage"), update);
router.delete("/:id", requirePermission("wiki.manage"), remove);

module.exports = router;

