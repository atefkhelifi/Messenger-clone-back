const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();

const mongoose = require("mongoose");
const cors = require("cors");

// Routes
const usersRoutes = require("./routes/user");
const conversationRoutes = require("./routes/conversation");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");
require("dotenv/config");

app.use(cors());
app.options("*", cors());

// Middleware
app.use(express.json());
app.use(authJwt());
app.use(errorHandler);

const api = process.env.API_URL;
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/conversations`, conversationRoutes);

// Socket.IO integration
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200", // Update to your Angular app's URL
    methods: ["GET", "POST"],
  },
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for chat messages
  socket.on("chat message", (msg) => {
    console.log("Message received:", msg);
    // Broadcast message to all connected clients
    io.emit("chat message", msg);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// MongoDB connection
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "Messenger",
  })
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });

// Default route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(api);
  console.log(`Server is running on http://localhost:${PORT}`);
});
