const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    sendMemo
} = require("../controllers/notification.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/send", sendMemo);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

module.exports = router;

