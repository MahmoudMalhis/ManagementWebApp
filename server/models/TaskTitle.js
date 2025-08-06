// models/TaskTitle.js
const mongoose = require("mongoose");

const TaskTitleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaskTitle", TaskTitleSchema);
