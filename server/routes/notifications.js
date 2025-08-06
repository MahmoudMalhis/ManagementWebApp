const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notifications"); // عدّل المسار حسب مشروعك
const { protect } = require("../middlewares/auth"); // تأكد أنك تستعمل الميدل وير الصحيح

router.get("/", protect, notificationsController.getNotifications);
router.post("/mark-all-read", protect, notificationsController.markAllRead);
router.put("/:id/read", protect, notificationsController.markNotificationRead);

module.exports = router;
