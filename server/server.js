import express from "express";
import * as http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { pool } from "./db";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

io.on("connection", (socket) => {
  console.log("Novo usuário conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("Usuário desconectado:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});