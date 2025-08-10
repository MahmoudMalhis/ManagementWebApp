// controllers/notifications.js
const Notification = require("../models/Notification");

/**
 * GET /api/notifications?page=&limit=
 * يرجّع:
 * { success, data, totalCount, totalPages, currentPage }
 */
exports.getNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "20", 10), 1);

    const filter = { user: req.user.id };
    const [totalCount, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

    return res.json({
      success: true,
      data: notifications,
      totalCount,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("getNotifications error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * POST /api/notifications/mark-all-read
 */
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("markAllRead error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * PUT /api/notifications/:id/read
 */
exports.markNotificationRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!notif) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
    if (!notif.isRead) {
      notif.isRead = true;
      await notif.save();
    }
    return res.json({ success: true, data: notif });
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
