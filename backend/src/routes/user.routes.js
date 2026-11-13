const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticate, requireSuperAdmin } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");

router.use(authenticate, requireSuperAdmin);
router.get("/", userController.getAllUsers);
router.get("/performance", userController.getTechnicianPerformance);
router.get("/performance/:id", userController.getSingleTechnicianPerformanceDetail);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.put("/:id/roles", userController.updateUserRoles);
router.put("/:id/super-admin", userController.setSuperAdmin);
router.put("/:id/photo", uploadAvatar.single("foto_profile"), userController.uploadUserPhoto);
router.delete("/:id", userController.deleteUser);

module.exports = router;
