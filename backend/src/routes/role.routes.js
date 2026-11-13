const express = require("express");
const controller = require("../controllers/role.controller");
const { authenticate, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, requireSuperAdmin);
router.get("/permissions", controller.getCatalog);
router.get("/", controller.getAll);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
