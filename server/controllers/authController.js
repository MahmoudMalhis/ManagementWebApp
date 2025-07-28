const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Register user (only for manager to create employee accounts)
// @route   POST /api/auth/register
// @access  Private/Manager
exports.registerEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: "employee", // Always create as employee
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all employees (for manager)
// @route   GET /api/auth/employees
// @access  Private/Manager
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get single employee by ID
// @route   GET /api/auth/employees/:id
// @access  Private/Manager
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findOne({
      _id: req.params.id,
      role: "employee",
    }).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee not found`,
      });
    }

    res.json({
      success: true,
      data: {
        // غيّر هذا الجزء ليكون متسقاً مع ما تتوقعه الواجهة
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        createdAt: employee.createdAt,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
