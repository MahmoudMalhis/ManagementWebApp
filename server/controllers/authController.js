const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Accomplishment = require("../models/Accomplishment");
const Notification = require("../models/Notification");

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
      role: user.role,
    },
  });
};

// @desc    Login user (creates manager if not exist and first login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, password } = req.body;

    // Check for user
    let user = await User.findOne({ name });

    // إذا لم يوجد مستخدم، تحقق إذا يوجد أي مدير بالنظام
    if (!user) {
      const anyManager = await User.findOne({ role: "manager" });
      if (!anyManager) {
        // إذا لا يوجد أي مدير، أنشئ أول حساب كمدير
        user = await User.create({
          name,
          password,
          role: "manager",
        });

        if (user.status === "archived" || user.disabledLogin) {
          return res.status(403).json({
            success: false,
            message: "Account is archived/disabled",
          });
        }

        return sendTokenResponse(user, 200, res);
      } else {
        // يوجد مدير بالنظام، لا تنشئ حساب جديد!
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }

    // التحقق من حالة الحساب للمستخدم الموجود
    if (user.status === "archived" || user.disabledLogin) {
      return res.status(403).json({
        success: false,
        message: "Account is archived/disabled",
      });
    }

    // التحقق من كلمة المرور للمستخدم الموجود
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // إذا كل شيء صحيح، إرجاع الرد الناجح
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

    const { name, password } = req.body;

    // تحقق من وجود مستخدم بنفس الاسم
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // إنشاء المستخدم الجديد
    const user = await User.create({
      name,
      password,
      role: "employee",
    });

    // إرجاع الاستجابة بدون كلمة المرور
    const userResponse = {
      id: user._id,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      user: userResponse,
    });
  } catch (err) {
    console.error("Error registering employee:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
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
// controllers/authController.js
exports.getEmployees = async (req, res) => {
  try {
    const { status } = req.query; // optional: 'active' | 'archived'
    const filter = { role: "employee" };
    if (status === "archived") filter.status = "archived";
    if (status === "active") filter.status = "active";

    const employees = await User.find(filter)
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
        role: employee.role,
        createdAt: employee.createdAt,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete employee (manager only)
// @route   DELETE /api/auth/employees/:id
// @access  Private/Manager
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const mode = (req.query.mode || "archive").toLowerCase(); // 'hard' | 'archive'

    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (user.role !== "employee") {
      return res.status(400).json({
        success: false,
        message: "Only employees can be deleted/archived",
      });
    }

    if (mode === "hard") {
      // حذف كل ما يتعلق بالموظف ثم حذف الحساب
      await Promise.all([
        Accomplishment.deleteMany({ employee: id }),
        Notification.deleteMany({ user: id }),
      ]);
      await User.deleteOne({ _id: id });
      return res.json({
        success: true,
        message: "Employee and related data deleted",
      });
    }

    // archive (الإفتراضي): إبقاء البيانات وتعطيل الدخول
    user.status = "archived";
    user.disabledLogin = true;
    await user.save();

    return res.json({
      success: true,
      message: "Employee archived",
      data: { id: user._id },
    });
  } catch (err) {
    console.error("deleteEmployee error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// controllers/authController.js
exports.unarchiveEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const emp = await User.findById(id);
    if (!emp)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (emp.role !== "employee")
      return res
        .status(400)
        .json({ success: false, message: "Only employees can be unarchived" });

    emp.status = "active";
    emp.disabledLogin = false;
    await emp.save();

    res.json({
      success: true,
      message: "Employee restored",
      data: {
        id: emp._id,
        name: emp.name,
        role: emp.role,
        status: emp.status,
      },
    });
  } catch (err) {
    console.error("unarchiveEmployee error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
