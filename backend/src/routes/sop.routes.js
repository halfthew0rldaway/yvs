const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const {
    getAll,
    getById,
    create,
    update,
    remove
} = require("../controllers/sop.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", authorize("admin", "pimpinan"), create);
router.put("/:id", authorize("admin", "pimpinan"), update);
router.delete("/:id", authorize("admin", "pimpinan"), remove);

module.exports = router;

