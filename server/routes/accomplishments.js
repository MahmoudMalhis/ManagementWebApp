const express = require("express");
const { check } = require("express-validator");
const {
  createAccomplishment,
  getAccomplishments,
  getAccomplishment,
  addComment,
  reviewAccomplishment,
  exportAccomplishments,
  addEmployeeReply,
  modifyAccomplishment,
} = require("../controllers/accomplishmentController");
const { protect, authorize } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const router = express.Router();

// Create accomplishment with file upload
router.post(
  "/",
  [
    protect,
    upload.array("files", 5), // Allow up to 5 files
    check("description", "Description is required").not().isEmpty(),
  ],
  createAccomplishment
);

router.get("/export", protect, authorize("manager"), exportAccomplishments);

// Get all accomplishments (filtered for employee/manager)
router.get("/", protect, getAccomplishments);

// Get single accomplishment
router.get("/:id", protect, getAccomplishment);

// Add comment to accomplishment (manager only)
router.post(
  "/:id/comments",
  [
    protect,
    authorize("manager"),
    check("text", "Comment text is required").not().isEmpty(),
  ],
  addComment
);

// Employee reply to manager comments
router.post(
  "/:id/comments/:commentId/reply",
  [protect, check("text", "Reply text is required").not().isEmpty()],
  addEmployeeReply
);

// Update accomplishment status (manager only)
router.put("/:id/review", protect, authorize("manager"), reviewAccomplishment);

// Submit modified version of an accomplishment (employee only)
router.put(
  "/:id/modify",
  [
    protect,
    upload.array("files", 5),
    check("description", "Description is required").not().isEmpty(),
  ],
  modifyAccomplishment
);

// Export accomplishments to Excel (manager only)

module.exports = router;
