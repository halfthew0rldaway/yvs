const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { create, getByTiketId } = require("../controllers/log-perbaikan.controller");

const router = express.Router();

router.use(authenticate);

const logValidation = [
    body("tiket_id").notEmpty().withMessage("Tiket wajib dipilih"),
    body("catatan").notEmpty().withMessage("Catatan wajib diisi"),
];

router.post("/", authorize("teknisi"), logValidation, validate, create);
router.get("/:id", getByTiketId);

module.exports = router;
