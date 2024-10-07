import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import AuthHandler from "./handlers/AuthHandler";
import AuthController from "./controllers/AuthController";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

import http from "http";

const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Initialize AuthHandler and AuthController
const authHandler = new AuthHandler(prisma, JWT_SECRET);
const authController = new AuthController(authHandler);

// Register route
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/register", authController.register.bind(authController));

// Login route
app.post("/login", authController.login.bind(authController));

// Protected route example
app.get("/protected", authController.protected.bind(authController));

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
