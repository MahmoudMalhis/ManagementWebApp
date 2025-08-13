// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const connectDB = require("./config/db"); // تأكد أن هذا يُصدّر دالة connectDB()
const taskTitlesRoutes = require("./routes/taskTitles");
const Notifications = require("./routes/notifications");
const comparisonsRoutes = require("./routes/comparisons");
const auth = require("./routes/auth");
const accomplishments = require("./routes/accomplishments");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== CORS إعدادات ======
const allowedOrigins = [
  "http://localhost:5173",                   // التطوير
  "https://management-1-paub.onrender.com",  
  "https://managementwebapp-1.onrender.com",
];

const corsOptions = {
  origin(origin, cb) {
    // اسمح لطلبات بدون Origin (مثل health checks / curl)
    if (!origin) return cb(null, true);
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error("Not allowed by CORS"));
  },
  credentials: true, // اتركها true إذا تستخدم كوكيز/جلسات
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// طبّق CORS قبل أي routes
app.use(cors(corsOptions));
// اسمح بالـ preflight بنفس الخيارات (مهم)
app.options("*", cors(corsOptions));

// Static files (الرفع)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// ====== HTTP + Socket.IO ======
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});
module.exports = { io };

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join room based on role and user id
  socket.on("joinRoom", ({ userId, role }) => {
    if (role === "manager") socket.join("managers");
    socket.join(String(userId));
    console.log(`User ${userId} joined as ${role}`);
  });

  // Notify all managers about new accomplishment
  socket.on("newAccomplishment", (data) => {
    socket.to("managers").emit("newAccomplishmentAlert", data);
  });

  // Status change notification to a specific employee
  socket.on(
    "accomplishmentStatusChanged",
    ({ accomplishmentId, employeeId, status }) => {
      socket
        .to(String(employeeId))
        .emit("accomplishmentStatusChangedAlert", { accomplishmentId, status });
    }
  );

  // New comment notification
  socket.on("newComment", ({ accomplishmentId, employeeId }) => {
    socket.to(String(employeeId)).emit("newCommentAlert", { accomplishmentId });
  });

  // Employee reply notification to a manager
  socket.on("newReply", ({ accomplishmentId, managerId }) => {
    socket.to(String(managerId)).emit("newReplyAlert", { accomplishmentId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ====== API Routes ======
app.use("/api/auth", auth);
app.use("/api/accomplishments", accomplishments);
app.use("/api/task-titles", taskTitlesRoutes);
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/notifications", Notifications);
app.use("/api/comparisons", comparisonsRoutes);

// ====== Global Error Handler ======
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server Error" });
});

// ====== Start server ======
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
