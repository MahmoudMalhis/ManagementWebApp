// models/GalleryFolder.js
const mongoose = require("mongoose");

const GalleryFolderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  files: [
    {
      fileName: String,
      filePath: String,
      fileType: String,
      fromAccomplishment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Accomplishment",
      },
    },
  ],
});

module.exports = mongoose.model("GalleryFolder", GalleryFolderSchema);
