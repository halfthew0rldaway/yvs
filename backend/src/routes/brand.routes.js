const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brand.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", brandController.getAll);
router.post("/", brandController.create);

module.exports = router;
