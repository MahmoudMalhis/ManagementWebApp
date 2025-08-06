const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const connectDB = require("./config/db");
const taskTitlesRoutes = require("./routes/taskTitles");
const Notifications = require("./routes/notifications");

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
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production" ? false : ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Body parser
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? false : ["http://localhost:5173"],
    credentials: true,
  })
);

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
