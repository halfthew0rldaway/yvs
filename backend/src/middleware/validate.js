const { validationResult } = require("express-validator");

// Memeriksa hasil validasi dari express-validator
function validate(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validasi gagal",
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }

    next();
}

module.exports = validate;
