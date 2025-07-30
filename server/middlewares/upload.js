const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../public/uploads/");
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// File filter to accept all files
function fileFilter(req, file, cb) {
  // Always accept all files
  return cb(null, true);
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter, // Explicitly set fileFilter
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit, adjust if needed
});

module.exports = upload;
