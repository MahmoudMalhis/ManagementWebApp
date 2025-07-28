const multer = require('multer');
const path = require('path');

// Set storage engine
const fs = require('fs');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads/');
    
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allow images, pdfs, docs, and excel files
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Only images, PDFs, and Office documents are allowed!');
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10000000 }, // 10MB max file size
  fileFilter
});

module.exports = upload;