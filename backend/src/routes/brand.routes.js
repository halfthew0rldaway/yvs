const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brand.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.get("/", brandController.getAll);
router.post("/", authorize("admin"), brandController.create);

module.exports = router;
