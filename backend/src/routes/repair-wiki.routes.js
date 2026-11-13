const express = require("express");
const { authenticate, requirePermission } = require("../middleware/auth");
const {
    getAll,
    getSuggestions,
    getById,
    create,
    createFromTicket,
    update,
    remove
} = require("../controllers/repair-wiki.controller");

const router = express.Router();

router.use(authenticate);

router.get("/suggestions", requirePermission("wiki.view"), getSuggestions);
router.get("/", requirePermission("wiki.view"), getAll);
router.get("/:id", requirePermission("wiki.view"), getById);
router.post("/from-tiket/:tiketId", requirePermission("wiki.manage"), createFromTicket);
router.post("/", requirePermission("wiki.manage"), create);
router.put("/:id", requirePermission("wiki.manage"), update);
router.delete("/:id", requirePermission("wiki.manage"), remove);

module.exports = router;

