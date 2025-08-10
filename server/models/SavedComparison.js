// models/SavedComparison.js
const mongoose = require("mongoose");

const SavedComparisonSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    employeeIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    notes: { type: String, default: "" },
    range: {
      type: String,
      enum: ["all", "week", "month", "year", "custom"],
      default: "all",
    },
    startDate: Date,
    endDate: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavedComparison", SavedComparisonSchema);
