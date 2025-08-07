const { validationResult } = require("express-validator");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const Accomplishment = require("../models/Accomplishment");
const Notification = require("../models/Notification");
const TaskTitle = require("../models/TaskTitle");
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
    const { description, taskTitle, employee } = req.body;

    // تحديد الموظف المستهدف: الموظف الحالي أو الموظف الذي اختاره المدير
    const employeeId = req.user.role === "manager" ? employee : req.user.id;

    // معالجة الملفات (إذا وجدت)
    const files = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        files.push({
          fileName: file.originalname,
          filePath: `/uploads/${file.filename}`,
          fileType: file.mimetype,
        });
      });
    }

    // إنشاء الإنجاز
    const accomplishment = await Accomplishment.create({
      description,
      taskTitle,
      employee: employeeId,
      files,
      status: req.user.role === "manager" ? "assigned" : "pending",
      originalDescription:
        req.user.role === "manager" ? description : undefined,
      originalFiles: req.user.role === "manager" ? files : [],
      employeeDescription:
        req.user.role === "employee" ? description : undefined,
      employeeFiles: req.user.role === "employee" ? files : [],
    });

    // جلب اسم عنوان المهمة (اختياري للرسالة)
    let taskTitleName = "";
    try {
      const titleObj = await TaskTitle.findById(taskTitle);
      taskTitleName = titleObj ? titleObj.name : "";
    } catch (e) {}

    // إنشاء إشعار للموظف المستهدف
    await Notification.create({
      user: employeeId,
      type: "new_task",
      message: `تم تعيين مهمة جديدة لك: ${taskTitleName}`,
      data: { accomplishmentId: accomplishment._id, taskTitle: taskTitleName },
    });

    // إرسال إشعار socket.io للموظف مباشرة إذا متصل
    if (io) {
      io.to(employeeId).emit("notification", {
        type: "new_task",
        message: `تم تعيين مهمة جديدة لك: ${taskTitleName}`,
        data: {
          accomplishmentId: accomplishment._id,
          taskTitle: taskTitleName,
        },
      });
    }

    if (req.user.role === "employee") {
      const managers = await User.find({ role: "manager" });
      for (const manager of managers) {
        await Notification.create({
          user: manager._id,
          type: "new_task",
          message: `قام الموظف ${req.user.name} بإضافة مهمة جديدة بعنوان "${taskTitleName}"`,
          data: {
            accomplishmentId: accomplishment._id,
            taskTitle: taskTitleName,
          },
        });
        if (io) {
          io.to(manager._id.toString()).emit("notification", {
            type: "new_task",
            message: `قام الموظف ${req.user.name} بإضافة مهمة جديدة بعنوان "${taskTitleName}"`,
            data: {
              accomplishmentId: accomplishment._id,
              taskTitle: taskTitleName,
            },
          });
        }
      }
    }

    // جلب الإنجاز مع تفاصيل المستخدم (اختياري)
    const populatedAccomplishment = await Accomplishment.findById(
      accomplishment._id
    )
      .populate("employee", "name email")
      .populate("taskTitle", "name");

    res.status(201).json({
      success: true,
      data: populatedAccomplishment,
    });
  } catch (err) {
    console.error(err);
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
      .populate("employee", "name")
      .populate("comments.commentedBy", "name role")
      .populate("taskTitle", "name")
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
    const { text, versionIndex } = req.body;

    const accomplishment = await Accomplishment.findById(req.params.id);
    if (!accomplishment) {
      return res.status(404).json({ message: "Accomplishment not found" });
    }

    const comment = {
      text,
      commentedBy: req.user.id,
      versionIndex: versionIndex || accomplishment.previousVersions.length, // إذا لم يتم تحديده، افترض أنه التعليق على الإصدار الحالي
    };

    accomplishment.comments.unshift(comment);
    await accomplishment.save();

    if (req.user.role === "manager") {
      await Notification.create({
        user: accomplishment.employee,
        type: "comment",
        message: "تم إضافة تعليق جديد على مهمتك",
        data: { accomplishmentId: accomplishment._id, commentText: text },
      });
      if (io) {
        io.to(accomplishment.employee.toString()).emit("notification", {
          type: "comment",
          message: "تم إضافة تعليق جديد على مهمتك",
          data: { accomplishmentId: accomplishment._id, commentText: text },
        });
      }
    }
    // إذا الموظف أضاف تعليق، أرسل إشعار للمدراء
    if (req.user.role === "employee") {
      // جلب بيانات الموظف
      const User = require("../models/User");
      const employeeUser = await User.findById(req.user.id);
      if (!employeeUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const managers = await User.find({ role: "manager" });
      for (const manager of managers) {
        await Notification.create({
          user: manager._id,
          type: "comment",
          message: `قام الموظف ${req.user.name} بإضافة تعليق على المهمة "${accomplishment.description}"`,
          data: { accomplishmentId: accomplishment._id, commentText: text },
        });
        if (io) {
          io.to(manager._id.toString()).emit("notification", {
            type: "comment",
            message: `قام الموظف ${req.user.name} بإضافة تعليق على المهمة "${accomplishment.description}"`,
            data: { accomplishmentId: accomplishment._id, commentText: text },
          });
        }
      }
    }

    const updatedAccomplishment = await Accomplishment.findById(req.params.id)
      .populate("employee", "name email")
      .populate("comments.commentedBy", "name role");

    res.json({ success: true, data: updatedAccomplishment });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
    console.error(err);
  }
};

// @route PUT /api/accomplishments/:id/start
// @access Private/Employee
exports.startAccomplishment = async (req, res) => {
  const accomplishment = await Accomplishment.findById(req.params.id);
  if (!accomplishment)
    return res.status(404).json({ message: "Accomplishment not found" });

  if (accomplishment.employee.toString() !== req.user.id)
    return res.status(403).json({ message: "Not authorized" });

  // فقط إذا لم يبدأها الموظف بعد
  if (accomplishment.status !== "assigned")
    return res.status(400).json({ message: "Task already started" });

  // حفظ وصف الموظف في حقل منفصل (اختياري)
  accomplishment.employeeDescription = req.body.description;
  // أضف ملفات الموظف فقط في حقل منفصل
  accomplishment.employeeFiles =
    req.files?.map((f) => ({
      fileName: f.originalname,
      filePath: `/uploads/${f.filename}`,
      fileType: f.mimetype,
    })) || [];
  // اجمع كل الملفات (أصلي + موظف)
  accomplishment.files = [...accomplishment.employeeFiles];
  accomplishment.description = accomplishment.employeeDescription;
  accomplishment.status = "pending";
  accomplishment.lastContentModifiedAt = Date.now();
  await accomplishment.save();

  const managers = await User.find({ role: "manager" });
  for (const manager of managers) {
    await Notification.create({
      user: manager._id,
      type: "accomplishment_started",
      message: `قام الموظف ${req.user.name} ببدء العمل على المهمة "${accomplishment.description}"`,
      data: { accomplishmentId: accomplishment._id },
    });

    if (io) {
      io.to(manager._id.toString()).emit("notification", {
        type: "accomplishment_started",
        message: `قام الموظف ${req.user.name} بعمل على المهمة "${accomplishment.description}"`,
        data: { accomplishmentId: accomplishment._id },
      });
    }
  }

  const updatedAccomplishment = await Accomplishment.findById(req.params.id)
    .populate("employee", "name email")
    .populate("comments.commentedBy", "name role");
  res.json({ success: true, data: updatedAccomplishment });
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
    if (
      accomplishment.employee.toString() !== req.user.id &&
      req.user.role !== "manager"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reply to this accomplishment",
      });
    }

    // جلب التعليق نفسه وليس فقط التحقق بوجوده
    const comment = accomplishment.comments.find(
      (c) => c._id.toString() === commentId
    );
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // إشعار صاحب التعليق إذا كان غير نفس الموظف الحالي
    if (comment.commentedBy.toString() !== req.user.id) {
      await Notification.create({
        user: comment.commentedBy,
        type: "reply",
        message: `قام ${req.user.name} بالرد على تعليقك في المهمة`,
        data: { accomplishmentId: accomplishment._id, replyText: text },
      });
      if (io) {
        io.to(comment.commentedBy.toString()).emit("notification", {
          type: "reply",
          message: `قام ${req.user.name} بالرد على تعليقك في المهمة`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });
      }
    }

    // إشعار جميع المدراء بأن هناك رد جديد
    if (req.user.role === "employee") {
      const managers = await User.find({ role: "manager" });
      for (const manager of managers) {
        await Notification.create({
          user: manager._id, // يجب أن تضع id المدير هنا!
          type: "reply",
          message: `قام الموظف ${req.user.name} بالرد على تعليق في المهمة "${accomplishment.description}"`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });
      }
      // إرسال مرة واحدة لغرفة المدراء بالسوكيت
      if (io) {
        io.to("managers").emit("notification", {
          type: "reply",
          message: `قام الموظف ${req.user.name} بالرد على تعليق في المهمة "${accomplishment.description}"`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });
      }
    }

    // إشعار جميع المدراء إذا كان المرسل موظف (باستثناء إذا كان المدير هو صاحب الرد السابق)
    if (req.user.role === "employee") {
      const managers = await User.find({ role: "manager" });
      for (const manager of managers) {
        // لا ترسل للمدير إذا هو نفسه صاحب التعليق السابق وأخذ إشعار أصلاً
        if (comment.commentedBy.toString() === manager._id.toString()) continue;
        await Notification.create({
          user: manager._id,
          type: "reply",
          message: `قام الموظف ${req.user.name} بالرد على تعليق في المهمة "${accomplishment.description}"`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });
      }
      if (io) {
        io.to("managers").emit("notification", {
          type: "reply",
          message: `قام الموظف ${req.user.name} بالرد على تعليق في المهمة "${accomplishment.description}"`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });
      }
    }

    // إشعار جميع الموظفين إذا كان المرسل مدير (باستثناء إذا كان الموظف نفسه صاحب التعليق السابق وأخذ إشعار أصلاً)
    if (req.user.role === "manager") {
      // إذا كان هناك موظف صاحب الإنجاز وليس نفس صاحب الرد السابق
      if (
        accomplishment.employee.toString() !== req.user.id &&
        comment.commentedBy.toString() !== accomplishment.employee.toString()
      ) {
        await Notification.create({
          user: accomplishment.employee,
          type: "reply",
          message: `قام المدير ${req.user.name} بالرد على تعليقك في المهمة "${accomplishment.description}"`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });
        if (io) {
          io.to(accomplishment.employee.toString()).emit("notification", {
            type: "reply",
            message: `قام المدير ${req.user.name} بالرد على تعليقك في المهمة "${accomplishment.description}"`,
            data: { accomplishmentId: accomplishment._id, replyText: text },
          });
        }
      }
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
    accomplishment.isReviewed = status === "reviewed";

    // Add a comment if provided
    if (comment && comment.trim() !== "") {
      accomplishment.comments.unshift({
        text: comment,
        commentedBy: req.user.id,
      });
    }

    await accomplishment.save();

    if (status === "reviewed") {
      await Notification.create({
        user: accomplishment.employee,
        type: "reviewed",
        message: "تم اعتماد إنجازك من قبل المدير",
        data: { accomplishmentId: accomplishment._id },
      });
      if (io) {
        io.to(accomplishment.employee.toString()).emit("notification", {
          type: "reviewed",
          message: "تم اعتماد إنجازك من قبل المدير",
          data: { accomplishmentId: accomplishment._id },
        });
      }
    }

    if (status === "needs_modification") {
      // إشعار الموظف في قاعدة البيانات
      await Notification.create({
        user: accomplishment.employee,
        type: "modification_request",
        message: "تم طلب تعديل على مهمتك",
        data: { accomplishmentId: accomplishment._id },
      });
      // إشعار socket.io لو كان متصل
      if (io) {
        io.to(accomplishment.employee.toString()).emit("notification", {
          type: "modification_request",
          message: "تم طلب تعديل على مهمتك",
          data: { accomplishmentId: accomplishment._id },
        });
      }
    }

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
    const accomplishment = await Accomplishment.findById(req.params.id);
    if (!accomplishment) {
      return res.status(404).json({ message: "Accomplishment not found" });
    }

    // احفظ النسخة القديمة أولاً
    accomplishment.previousVersions.push({
      description: accomplishment.description,
      files: accomplishment.files,
      modifiedAt: accomplishment.updatedAt || accomplishment.createdAt,
    });

    // حدّث الوصف
    accomplishment.description = req.body.description;

    // حدّث الملفات، فقط ملفات التعديل الجديد!
    if (req.files && req.files.length > 0) {
      accomplishment.files = req.files.map((file) => ({
        fileName: file.originalname,
        filePath: `/uploads/${file.filename}`,
        fileType: file.mimetype,
      }));
    } else {
      accomplishment.files = []; // إذا ما في ملفات جديدة، خليها فاضية
    }

    accomplishment.status = "pending";
    accomplishment.lastContentModifiedAt = Date.now();
    await accomplishment.save();

    // جلب النسخة بعد التعديل
    const updatedAccomplishment = await Accomplishment.findById(req.params.id)
      .populate("employee", "name email")
      .populate("comments.commentedBy", "name role");

    // إشعار المدراء إذا يوجد socket.io
    if (io) {
      io.to("managers").emit("accomplishmentModified", {
        accomplishmentId: updatedAccomplishment._id,
        employeeName: updatedAccomplishment.employee.name,
        employeeId: updatedAccomplishment.employee._id,
      });
    }

    const managers = await User.find({ role: "manager" });
    const notificationPromises = managers.map((manager) =>
      Notification.create({
        user: manager._id,
        type: "modification",
        message: `قام الموظف ${req.user.name} بتعديل المهمة "${updatedAccomplishment.description}"`,
        data: { accomplishmentId: updatedAccomplishment._id },
      })
    );
    await Promise.all(notificationPromises);

    // إشعار Socket.io لكل المدراء (إرسال واحد يكفي لأنهم في نفس الغرفة)
    if (io) {
      io.to("managers").emit("notification", {
        type: "modification",
        message: `قام الموظف ${req.user.name} بتعديل المهمة "${updatedAccomplishment.description}"`,
        data: { accomplishmentId: updatedAccomplishment._id },
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedAccomplishment,
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
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

    // Create Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Accomplishments");

    // Add headers
    worksheet.columns = [
      { header: "التاريخ", key: "date", width: 15 },
      { header: "اسم الموظف", key: "employeeName", width: 20 },
      { header: "تفاصيل المهمة", key: "description", width: 50 },
      { header: "تم المراجعة", key: "isReviewed", width: 10 },
      { header: "عدد الملفات", key: "filesCount", width: 10 },
      { header: "عدد التعليقات", key: "commentsCount", width: 10 },
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
