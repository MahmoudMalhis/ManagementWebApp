const express = require("express");
const { check } = require("express-validator");
const {
  login,
  registerEmployee,
  getMe,
  getEmployees,
  getEmployeeById,
} = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

// Login route
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
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
    check("email", "Please include a valid email").isEmail(),
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

module.exports = router;
