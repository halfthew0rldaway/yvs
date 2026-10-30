const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { login, logout, me, updateProfile, uploadProfilePhoto, removeProfilePhoto } = require("../controllers/auth.controller");
const { uploadAvatar } = require("../middleware/upload");

const router = express.Router();

router.post(
    "/login",
    authLimiter,
    [
        body("email").notEmpty().withMessage("Email wajib diisi"),
        body("password").notEmpty().withMessage("Password wajib diisi"),
    ],
    validate,
    login
);

router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.put(
    "/profile", 
    authenticate, 
    [
        body("email").optional().isEmail().withMessage("Format email tidak valid").trim(),
        body("nama")
            .optional()
            .notEmpty().withMessage("Nama tidak boleh kosong")
            .isLength({ min: 3, max: 100 }).withMessage("Nama harus 3-100 karakter")
            .trim()
    ],
    validate,
    updateProfile
);

// Profile photo management
router.post("/profile/photo", authenticate, uploadAvatar.single("foto_profile"), uploadProfilePhoto);
router.delete("/profile/photo", authenticate, removeProfilePhoto);

module.exports = router;
