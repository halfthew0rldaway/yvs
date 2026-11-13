const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    sendMemo,
    getRecipientRoles
} = require("../controllers/notification.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.get("/recipient-roles", getRecipientRoles);
router.post("/send", sendMemo);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

module.exports = router;

