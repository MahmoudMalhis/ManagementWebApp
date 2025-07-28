const mongoose = require("mongoose");

const AccomplishmentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  files: [
    {
      fileName: String,
      filePath: String,
      fileType: String,
    },
  ],
  status: {
    type: String,
    enum: ["pending", "reviewed", "needs_modification"],
    default: "pending",
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
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Accomplishment", AccomplishmentSchema);
