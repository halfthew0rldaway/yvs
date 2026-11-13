const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, requirePermission } = require("../middleware/auth");
const { upload, compressMedia } = require("../middleware/upload");
const { create, getByTiketId } = require("../controllers/log-perbaikan.controller");

const router = express.Router();

router.use(authenticate);

const logValidation = [
    body("tiket_id").notEmpty().withMessage("Tiket wajib dipilih"),
    body("catatan").notEmpty().withMessage("Catatan wajib diisi"),
];

router.post("/", requirePermission("tickets.repair"), upload.single("foto"), compressMedia, logValidation, validate, create);
router.get("/:id", requirePermission("tickets.view"), getByTiketId);

module.exports = router;
