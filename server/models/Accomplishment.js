const mongoose = require("mongoose");

const AccomplishmentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      // required: true,
    },
    files: [
      {
        fileName: String,
        filePath: String,
        fileType: String,
      },
    ],
    originalDescription: { type: String }, // وصف المدير الأساسي
    originalFiles: [
      {
        fileName: String,
        filePath: String,
        fileType: String,
      },
    ],
    employeeDescription: { type: String }, // وصف الموظف عند بدء المهمة
    employeeFiles: [
      {
        fileName: String,
        filePath: String,
        fileType: String,
      },
    ],
    status: {
      type: String,
      enum: ["assigned", "pending", "reviewed", "needs_modification"],
      default: "pending",
    },
    lastContentModifiedAt: {
      type: Date,
      default: Date.now,
    },
    taskTitle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskTitle",
      required: true, // إذا كان لازم المهمة يكون إلها عنوان
    },
    previousVersions: [
      {
        description: String,
        files: [
          {
            fileName: String,
            filePath: String,
            fileType: String,
          },
        ],
        modifiedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        text: String,
        commentedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        isReply: {
          type: Boolean,
          default: false,
        },
        replyTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Comment",
          default: null,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        versionIndex: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Accomplishment", AccomplishmentSchema);
