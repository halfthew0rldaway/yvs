const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
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

router.get("/stats", getStats);
router.get("/:id", getById);
router.get("/", getAll);
router.post("/", authorize("admin", "teknisi"), create);
router.put("/:id", authorize("admin", "teknisi"), update);
router.delete("/:id", authorize("admin"), remove);

module.exports = router;
