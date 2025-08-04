// routes/gallery.js
const express = require("express");
const router = express.Router();
const GalleryFolder = require("../models/GalleryFolder");
const { protect } = require("../middlewares/auth");

// جلب كل المجلدات مع عدد الملفات فقط
router.get("/folders", protect, async (req, res) => {
  const folders = await GalleryFolder.find({}, "name createdAt files").lean();
  res.json({
    folders: folders.map((f) => ({
      _id: f._id,
      name: f.name,
      filesCount: f.files.length,
    })),
  });
});

// جلب محتوى مجلد معين
router.get("/folders/:id", protect, async (req, res) => {
  const folder = await GalleryFolder.findById(req.params.id).lean();
  if (!folder) return res.status(404).json({ message: "Folder not found" });
  res.json({ folder });
});

// إضافة ملفات إلى مجلد (جديد أو قديم)
router.post("/add-files", protect, async (req, res) => {
  const { files, folderName } = req.body; // files: array of {fileName, filePath, fileType, fromAccomplishment}
  let folder;

  if (!folderName)
    return res.status(400).json({ message: "folderName required" });
  // تحقق إذا كان هناك مجلد بنفس الاسم
  folder = await GalleryFolder.findOne({ name: folderName });
  if (!folder) {
    // مجلد جديد
    folder = await GalleryFolder.create({
      name: folderName,
      createdBy: req.user._id,
      files: files,
    });
  } else {
    // أضف الملفات فقط الجديدة (لا تكرر)
    const existingPaths = folder.files.map((f) => f.filePath);
    const newFiles = files.filter((f) => !existingPaths.includes(f.filePath));
    folder.files = folder.files.concat(newFiles);
    await folder.save();
  }

  res.json({ success: true, folder });
});

module.exports = router;
