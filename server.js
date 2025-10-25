import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://web-iqy7xiem0-muhammad-techs-projects.vercel.app"],
    methods: ["GET", "POST"]
  }
});

io.on("connection", socket => {
  socket.on("join-room", roomId => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined");
    socket.on("offer", data => socket.to(roomId).emit("offer", data));
    socket.on("answer", data => socket.to(roomId).emit("answer", data));
    socket.on("ice-candidate", data => socket.to(roomId).emit("ice-candidate", data));
    socket.on("chat-message", text => socket.to(roomId).emit("chat-message", { from: socket.id, text }));
    socket.on("disconnect", () => socket.to(roomId).emit("user-left"));
  });
});

server.listen(3000, () => console.log("Signaling server ishga tushdi!"));