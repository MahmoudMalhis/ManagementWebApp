const express = require("express");
const { check } = require("express-validator");
const {
  login,
  registerEmployee,
  getMe,
  getEmployees,
  getEmployeeById,
  deleteEmployee,
  unarchiveEmployee,
} = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

// Login route
router.post(
  "/login",
  [
    check("name", "Name is required").not().isEmpty(),
    check("password", "Password is required").exists(),
  ],
  login
);

// Register employee route (manager only)
router.post(
  "/register",
  [
    protect,
    authorize("manager"),
    check("name", "Name is required").not().isEmpty(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  registerEmployee
);

// Get current user
router.get("/me", protect, getMe);

// Get all employees (manager only)
router.get("/employees", protect, authorize("manager"), getEmployees);

router.get("/employees/:id", protect, authorize("manager"), getEmployeeById);

// Delete employee (manager only)
router.delete("/employees/:id", protect, authorize("manager"), deleteEmployee);

router.patch(
  "/employees/:id/unarchive",
  protect,
  authorize("manager"),
  unarchiveEmployee
);
module.exports = router;
