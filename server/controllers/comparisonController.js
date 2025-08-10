// controllers/comparisonController.js
const { validationResult } = require("express-validator");
const SavedComparison = require("../models/SavedComparison");

/**
 * POST /api/comparisons
 * body: { name?, employeeIds[], notes?, range?, startDate?, endDate? }
 */
exports.createComparison = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const {
      name = "",
      employeeIds = [],
      notes = "",
      range = "all",
      startDate,
      endDate,
    } = req.body;

    const comparison = await SavedComparison.create({
      name,
      employeeIds,
      notes,
      range,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: comparison });
  } catch (err) {
    console.error("createComparison error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * GET /api/comparisons
 * يعرض فقط مقارنات المستخدم الحالي (المدير الذي أنشأها)
 */
exports.listComparisons = async (req, res) => {
  try {
    const items = await SavedComparison.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error("listComparisons error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * GET /api/comparisons/:id
 */
exports.getComparison = async (req, res) => {
  try {
    const item = await SavedComparison.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!item)
      return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: item });
  } catch (err) {
    console.error("getComparison error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * PUT /api/comparisons/:id
 * body: أي من الحقول التالية: { name, notes, range, startDate, endDate, employeeIds }
 */
exports.updateComparison = async (req, res) => {
  try {
    const updates = {};
    const allow = [
      "name",
      "notes",
      "range",
      "startDate",
      "endDate",
      "employeeIds",
    ];
    for (const k of allow) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const item = await SavedComparison.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      updates,
      { new: true }
    );
    if (!item)
      return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: item });
  } catch (err) {
    console.error("updateComparison error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * DELETE /api/comparisons/:id
 */
exports.deleteComparison = async (req, res) => {
  try {
    const del = await SavedComparison.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!del)
      return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteComparison error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
