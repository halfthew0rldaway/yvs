const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");

router.get("/", authenticate, authorize("admin"), userController.getAllUsers);
router.get("/performance", authenticate, authorize("admin"), userController.getTechnicianPerformance);
router.post("/", authenticate, authorize("admin"), userController.createUser);
router.put("/:id", authenticate, authorize("admin"), userController.updateUser);
router.put("/:id/photo", authenticate, authorize("admin"), uploadAvatar.single("foto_profile"), userController.uploadUserPhoto);
router.delete("/:id", authenticate, authorize("admin"), userController.deleteUser);

module.exports = router;
