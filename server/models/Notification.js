const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // لمن الإشعار
  type: { type: String, required: true }, // "new_task", "comment", "reply", "status_change", ...
  message: { type: String }, // نص مختصر للإشعار
  data: { type: Object }, // أي معلومات إضافية (id المهمة، اسم المرسل... إلخ)
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
