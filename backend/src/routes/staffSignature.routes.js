const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const { getAll, create, remove } = require("../controllers/staffSignature.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin", "teknisi"), getAll);
router.post("/", authorize("admin", "teknisi"), create);
router.delete("/:id", authorize("admin"), remove);

module.exports = router;

