const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { track } = require("../controllers/tracking.controller");

const router = express.Router();

// Tracking tanpa autentikasi
router.post(
    "/",
    [
        body().custom((value, { req }) => {
            if (!req.body.nomorTelepon && !req.body.nomorTiket) {
                throw new Error("Masukkan nomor telepon atau nomor tiket");
            }
            return true;
        }),
    ],
    validate,
    track
);

module.exports = router;
