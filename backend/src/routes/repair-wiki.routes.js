const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const {
    getAll,
    getSuggestions,
    getById,
    create,
    createFromTicket,
    update,
    remove
} = require("../controllers/repair-wiki.controller");

const router = express.Router();

router.use(authenticate);

router.get("/suggestions", getSuggestions);
router.get("/", getAll);
router.get("/:id", getById);
router.post("/from-tiket/:tiketId", authorize("admin", "teknisi"), createFromTicket);
router.post("/", authorize("admin", "teknisi"), create);
router.put("/:id", authorize("admin", "teknisi"), update);
router.delete("/:id", authorize("admin", "teknisi"), remove);

module.exports = router;

