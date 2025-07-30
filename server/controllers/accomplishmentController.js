const { validationResult } = require("express-validator");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const Accomplishment = require("../models/Accomplishment");
const User = require("../models/User");
let io;
try {
  io = require("../server").io;
} catch (err) {
  console.log(
    "Socket.io not initialized yet, will be available after server start"
  );
}

// @desc    Create new accomplishment
// @route   POST /api/accomplishments
// @access  Private
exports.createAccomplishment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description } = req.body;

    // Handle file uploads
    const files = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        files.push({
          fileName: file.originalname,
          filePath: file.path,
          fileType: file.mimetype,
        });
      });
    }

    const accomplishment = await Accomplishment.create({
      description,
      employee: req.user.id,
      files,
    });

    const populatedAccomplishment = await Accomplishment.findById(
      accomplishment._id
    ).populate("employee", "name email");

    res.status(201).json({
      success: true,
      data: populatedAccomplishment,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all accomplishments (filtered by employee for managers)
// @route   GET /api/accomplishments
// @access  Private
exports.getAccomplishments = async (req, res) => {
  try {
    let query;

    // If employee, only show their accomplishments
    if (req.user.role === "employee") {
      query = { employee: req.user.id };
    }
    // If manager, can filter by employee if provided
    else if (req.user.role === "manager") {
      if (req.query.employee) {
        query = { employee: req.query.employee };
      }
    }

    // Date filters
    if (req.query.startDate && req.query.endDate) {
      query = {
        ...query,
        createdAt: {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate),
        },
      };
    } else if (req.query.startDate) {
      query = {
        ...query,
        createdAt: { $gte: new Date(req.query.startDate) },
      };
    } else if (req.query.endDate) {
      query = {
        ...query,
        createdAt: { $lte: new Date(req.query.endDate) },
      };
    }

    const accomplishments = await Accomplishment.find(query)
      .populate("employee", "name email")
      .populate("comments.commentedBy", "name role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: accomplishments.length,
      data: accomplishments,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get single accomplishment
// @route   GET /api/accomplishments/:id
// @access  Private
exports.getAccomplishment = async (req, res) => {
  try {
    const accomplishment = await Accomplishment.findById(req.params.id)
      .populate("employee", "name email")
      .populate("comments.commentedBy", "name role");

    if (!accomplishment) {
      return res.status(404).json({
        success: false,
        message: "Accomplishment not found",
      });
    }

    // Check if user is authorized to view this accomplishment
    if (
      req.user.role !== "manager" &&
      accomplishment.employee._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this accomplishment",
      });
    }

    res.json({
      success: true,
      data: accomplishment,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Add comment to accomplishment
// @route   POST /api/accomplishments/:id/comments
// @access  Private/Manager
exports.addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;

    const accomplishment = await Accomplishment.findById(req.params.id);

    if (!accomplishment) {
      return res.status(404).json({
        success: false,
        message: "Accomplishment not found",
      });
    }

    const comment = {
      text,
      commentedBy: req.user.id,
    };

    accomplishment.comments.unshift(comment);
    await accomplishment.save();

    const updatedAccomplishment = await Accomplishment.findById(req.params.id)
      .populate("employee", "name email")
      .populate("comments.commentedBy", "name role");

    res.json({
      success: true,
      data: updatedAccomplishment,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Add employee reply to comment
// @route   POST /api/accomplishments/:id/comments/:commentId/reply
// @access  Private
exports.addEmployeeReply = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const { id, commentId } = req.params;

    const accomplishment = await Accomplishment.findById(id);

    if (!accomplishment) {
      return res.status(404).json({
        success: false,
        message: "Accomplishment not found",
      });
    }

    // Check if user is authorized (employee can only reply to their own accomplishments)
    if (accomplishment.employee.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reply to this accomplishment",
      });
    }

    // Check if the comment exists
    const commentExists = accomplishment.comments.some(
      (comment) => comment._id.toString() === commentId
    );

    if (!commentExists) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const reply = {
      text,
      commentedBy: req.user.id,
      isReply: true,
      replyTo: commentId,
    };

    accomplishment.comments.unshift(reply);
    await accomplishment.save();

    const updatedAccomplishment = await Accomplishment.findById(id)
      .populate("employee", "name email")
      .populate("comments.commentedBy", "name role");

    res.json({
      success: true,
      data: updatedAccomplishment,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update accomplishment status (reviewed or needs modification)
// @route   PUT /api/accomplishments/:id/review
// @access  Private/Manager
exports.reviewAccomplishment = async (req, res) => {
  try {
    const { status, comment } = req.body;

    if (!["reviewed", "needs_modification"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use "reviewed" or "needs_modification"',
      });
    }

    const accomplishment = await Accomplishment.findById(req.params.id);

    if (!accomplishment) {
      return res.status(404).json({
        success: false,
        message: "Accomplishment not found",
      });
    }

    accomplishment.status = status;
    accomplishment.isReviewed = status === "reviewed"; // <--- الحل هنا

    // Add a comment if provided
    if (comment && comment.trim() !== "") {
      accomplishment.comments.unshift({
        text: comment,
        commentedBy: req.user.id,
      });
    }

    await accomplishment.save();

    const updatedAccomplishment = await Accomplishment.findById(req.params.id)
      .populate("employee", "name email")
      .populate("comments.commentedBy", "name role");

    res.json({
      success: true,
      data: updatedAccomplishment,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Modify an accomplishment when requested by manager
// @route   PUT /api/accomplishments/:id/modify
// @access  Private/Employee
exports.modifyAccomplishment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const accomplishment = await Accomplishment.findById(req.params.id);

    if (!accomplishment) {
      return res.status(404).json({
        success: false,
        message: "Accomplishment not found",
      });
    }

    // تحقق مما إذا كان هذا إنجاز الموظف
    if (accomplishment.employee.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this accomplishment",
      });
    }

    // إزالة شرط التحقق من الحالة "needs_modification"
    // (أو جعله تحذيراً فقط بدلاً من منع التعديل)

    // حفظ النسخة الحالية في الإصدارات السابقة
    accomplishment.previousVersions.push({
      description: accomplishment.description,
      files: accomplishment.files,
      modifiedAt: Date.now(),
    });

    // تحديث الوصف
    accomplishment.description = req.body.description;

    // معالجة تحميل الملفات للإصدار الجديد
    const files = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        files.push({
          fileName: file.originalname,
          filePath: file.path.replace(/\\/g, "/"),
          fileType: file.mimetype,
        });
      });
      accomplishment.files = files;
    }

    // إعادة تعيين الحالة إلى pending
    accomplishment.status = "pending";

    await accomplishment.save();

    const updatedAccomplishment = await Accomplishment.findById(req.params.id)
      .populate("employee", "name email")
      .populate("comments.commentedBy", "name role");

    // إعلام المديرين بالتعديل
    if (io) {
      io.to("managers").emit("accomplishmentModified", {
        accomplishmentId: updatedAccomplishment._id,
        employeeName: updatedAccomplishment.employee.name,
        employeeId: updatedAccomplishment.employee._id,
      });
    }

    res.status(200).json({
      success: true,
      data: updatedAccomplishment,
    });
  } catch (err) {
    console.error("Error modifying accomplishment:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Export employee accomplishments to Excel
// @route   GET /api/accomplishments/export
// @access  Private/Manager
exports.exportAccomplishments = async (req, res) => {
  try {
    let query = {};

    // Apply filters if provided
    if (req.query.employee) {
      query.employee = req.query.employee;
    }

    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.startDate) {
      query.createdAt = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.createdAt = { $lte: new Date(req.query.endDate) };
    }

    // Get all accomplishments with employee details
    const accomplishments = await Accomplishment.find(query)
      .populate("employee", "name email")
      .sort({ createdAt: -1 });

    // Create Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Accomplishments");

    // Add headers
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Employee Name", key: "employeeName", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Description", key: "description", width: 50 },
      { header: "Reviewed", key: "isReviewed", width: 10 },
      { header: "Files Count", key: "filesCount", width: 10 },
      { header: "Comments", key: "commentsCount", width: 10 },
    ];

    // Add rows
    accomplishments.forEach((acc) => {
      worksheet.addRow({
        date: acc.createdAt.toISOString().split("T")[0],
        employeeName: acc.employee.name,
        email: acc.employee.email,
        description: acc.description,
        isReviewed: acc.status === "reviewed" ? "Yes" : "No",
        filesCount: acc.files.length,
        commentsCount: acc.comments.length,
      });
    });

    // Style headers
    worksheet.getRow(1).font = { bold: true };

    // Set filename
    const fileName = `accomplishments_export_${Date.now()}.xlsx`;

    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, "..", "..", "public/uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);

    // Write to file
    await workbook.xlsx.writeFile(filePath);

    res.json({
      success: true,
      filePath: `/uploads/${fileName}`,
      fileName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
