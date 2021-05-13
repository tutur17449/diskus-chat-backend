const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT;
const { checkUser, removeUser } = require("./utils");

app.use(cors());

// Store users in memory
let usersList = [];

// Retrieve all connected users
app.get("/api/users", (req, res) => {
  res.send({ usersList });
});

// Init socket
io.on("connection", (socket) => {
  const { id } = socket;
  console.log("Socket connected : " + id);

  // User login
  socket.on("userLogin", (user) => {
    const isExist = checkUser(user, usersList);
    if (isExist) {
      return socket.emit("socketError", "User already exist");
    }

    usersList = [
      {
        username: user,
        socketId: id,
      },
      ...usersList,
    ];

    socket.currentUser = user;

    io.emit("userOnline", {
      username: user,
      socketId: id,
    });
  });

  // Send message to user
  socket.on("sendMessage", (payload) => {
    const { receiver } = payload;
    socket.emit("newMessage", payload);
    io.to(receiver).emit("newMessage", payload);
  });

  // User logout
  socket.on("disconnect", () => {
    usersList = removeUser(id, usersList);
    io.emit("userLogout", id);
    console.log("Socket disconnected : " + id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log("App running on port " + PORT);
});
