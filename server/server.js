// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ---- تحميل الإعدادات ----
dotenv.config();

// ---- اتصال قاعدة البيانات ----
const connectDB = require("./config/db");
connectDB();

// ---- الراوترات ----
const taskTitlesRoutes = require("./routes/taskTitles");
const Notifications = require("./routes/notifications");
const comparisonsRoutes = require("./routes/comparisons");
const auth = require("./routes/auth");
const accomplishments = require("./routes/accomplishments");

// ==== تطبيق Express ====
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==== CORS (عدّل الدومينات حسب واجهتك) ====
const allowedOrigins = [
  "http://localhost:5173",                    // تطوير
  "https://management-1-paub.onrender.com",   // واجهة على Render (عدّل حسب اسم خدمتك)
  "https://managementwebapp-1.onrender.com",  // إن كان عندك واجهة ثانية
];

const corsOptions = {
  origin(origin, cb) {
    // اسمح لطلبات بدون Origin (health checks/curl)
    if (!origin) return cb(null, true);
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error("Not allowed by CORS"));
  },
  credentials: true, // اتركها true إذا تستخدم كوكيز/جلسة
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// طبّق CORS قبل أي routes
app.use(cors(corsOptions));
// preflight بنفس الخيارات
app.options("*", cors(corsOptions));

// ==== إعداد مجلد الرفع الثابت ====
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.resolve(__dirname, "uploads"); // على Render استخدم Disk: /data/uploads
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// قدّم نفس المجلد كملفات ثابتة
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "7d",
  })
);

// ==== إعداد Multer للرفع إلى نفس المجلد ====
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  // اقبل كل الملفات (يمكنك تقييد النوع لاحقًا)
  fileFilter(req, file, cb) {
    cb(null, true);
  },
  limits: { fileSize: 500 * 1024 * 1024 },
});

// راوت رفع بسيط يرجّع URL مطلق صالح للعرض
app.post("/api/upload", upload.single("image"), (req, res) => {
  const base =
    process.env.API_PUBLIC_URL || "http://localhost:5000"; // على Render عرّف API_PUBLIC_URL = دومين الـ API
  const url = `${base}/uploads/${req.file.filename}`;
  res.json({ url });
});

// ==== HTTP + Socket.IO ====
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// اجعل io متاحًا للوحدات الأخرى لو احتجت
module.exports = { io };

// Socket.io events
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", ({ userId, role }) => {
    if (role === "manager") socket.join("managers");
    socket.join(String(userId));
    console.log(`User ${userId} joined as ${role}`);
  });

  socket.on("newAccomplishment", (data) => {
    socket.to("managers").emit("newAccomplishmentAlert", data);
  });

  socket.on(
    "accomplishmentStatusChanged",
    ({ accomplishmentId, employeeId, status }) => {
      socket
        .to(String(employeeId))
        .emit("accomplishmentStatusChangedAlert", { accomplishmentId, status });
    }
  );

  socket.on("newComment", ({ accomplishmentId, employeeId }) => {
    socket.to(String(employeeId)).emit("newCommentAlert", { accomplishmentId });
  });

  socket.on("newReply", ({ accomplishmentId, managerId }) => {
    socket.to(String(managerId)).emit("newReplyAlert", { accomplishmentId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ==== API Routes ====
app.use("/api/auth", auth);
app.use("/api/accomplishments", accomplishments);
app.use("/api/task-titles", taskTitlesRoutes);
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/notifications", Notifications);
app.use("/api/comparisons", comparisonsRoutes);

// ==== Global Error Handler ====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server Error" });
});

// ==== Start server ====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
