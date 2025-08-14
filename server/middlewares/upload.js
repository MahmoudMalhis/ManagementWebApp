// upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// نفس المتغير المستخدم في server.js
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.resolve(__dirname, "../../uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// نقبل كل الملفات
function fileFilter(req, file, cb) {
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
});

module.exports = upload;
