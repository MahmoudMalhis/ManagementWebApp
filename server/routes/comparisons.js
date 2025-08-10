// routes/comparisons.js
const express = require("express");
const { check } = require("express-validator");
const {
  createComparison,
  listComparisons,
  getComparison,
  updateComparison,
  deleteComparison,
} = require("../controllers/comparisonController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

// كل المسارات محمية وللمدير فقط (عدّل لو بدك صلاحيات أوسع)
router.use(protect, authorize("manager"));

router.get("/", listComparisons);

router.post(
  "/",
  [
    check(
      "employeeIds",
      "employeeIds is required and must be a non-empty array"
    ).isArray({ min: 1 }),
    check("range").optional().isIn(["all", "week", "month", "year", "custom"]),
    check("startDate").optional().isISO8601().toDate(),
    check("endDate").optional().isISO8601().toDate(),
  ],
  createComparison
);

router.get("/:id", getComparison);

router.put(
  "/:id",
  [
    check("range").optional().isIn(["all", "week", "month", "year", "custom"]),
    check("startDate").optional().isISO8601().toDate(),
    check("endDate").optional().isISO8601().toDate(),
    check("employeeIds").optional().isArray(),
  ],
  updateComparison
);

router.delete("/:id", deleteComparison);

module.exports = router;
