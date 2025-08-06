const TaskTitle = require("../models/TaskTitle");

// جلب كل الأنواع (يستعملها الموظف والمدير)
exports.getTaskTitles = async (req, res) => {
  try {
    const titles = await TaskTitle.find().sort({ createdAt: -1 });
    res.json({ success: true, data: titles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// إضافة نوع جديد
exports.addTaskTitle = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ success: false, message: "العنوان مطلوب" });
    const exists = await TaskTitle.findOne({ name });
    if (exists)
      return res
        .status(409)
        .json({ success: false, message: "العنوان موجود مسبقاً" });
    const title = await TaskTitle.create({ name });
    res.status(201).json({ success: true, data: title });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// تعديل
exports.editTaskTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updated = await TaskTitle.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "العنوان غير موجود" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// حذف
exports.deleteTaskTitle = async (req, res) => {
  try {
    const { id } = req.params;
    await TaskTitle.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
