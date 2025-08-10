const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const connectDB = require("./config/db");
const taskTitlesRoutes = require("./routes/taskTitles");
const Notifications = require("./routes/notifications");
const comparisonsRoutes = require("./routes/comparisons");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const auth = require("./routes/auth");
const accomplishments = require("./routes/accomplishments");

const app = express();

// Create HTTP server and socket.io instance
const server = http.createServer(app);
const allowedOrigins = [
  "https://managementwebapp-1.onrender.com", // الفرونت على Render
  "http://localhost:5173", // للتجارب محليًا
];

// Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Express CORS (ضَعها قبل أي routes)
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// (اختياري بس مفيد للـ preflight)
app.options("*", cors());

// Set static folder for file uploads
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join room based on role and user id
  socket.on("joinRoom", ({ userId, role }) => {
    if (role === "manager") {
      socket.join("managers");
    }
    socket.join(userId);
    console.log(`User ${userId} joined room as ${role}`);
  });

  // Handle new accomplishment submission
  socket.on("newAccomplishment", (accomplishmentData) => {
    // Notify all managers
    socket.to("managers").emit("newAccomplishmentAlert", accomplishmentData);
  });

  // Handle status change notification (reviewed or needs modification)
  socket.on(
    "accomplishmentStatusChanged",
    ({ accomplishmentId, employeeId, status }) => {
      // Notify the specific employee
      socket
        .to(employeeId)
        .emit("accomplishmentStatusChangedAlert", { accomplishmentId, status });
    }
  );

  // Handle new comment notification
  socket.on("newComment", ({ accomplishmentId, employeeId }) => {
    // Notify the specific employee
    socket.to(employeeId).emit("newCommentAlert", { accomplishmentId });
  });

  // Handle employee reply notification
  socket.on("newReply", ({ accomplishmentId, managerId }) => {
    // Notify the manager
    socket.to(managerId).emit("newReplyAlert", { accomplishmentId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Mount routers
app.use("/api/auth", auth);
app.use("/api/accomplishments", accomplishments);
app.use("/api/task-titles", taskTitlesRoutes);
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/notifications", Notifications);
app.use("/api/comparisons", comparisonsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Server Error",
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the socket.io instance for other modules
module.exports = { io };
