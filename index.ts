import http from "http";
import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client";
import AuthController from "./controllers/AuthController";
import TemplateController from "./controllers/TemplateController";
import AuthHandler from "./handlers/AuthHandler";
import UserHandler from "./handlers/UserHandler";
import UserController from "./controllers/UserController";

// Initialize the Express Application, Server and Prisma Client
const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Check if JWT_SECRET is set
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AuthHandler and AuthController
const authHandler = new AuthHandler(prisma, JWT_SECRET);
const authController = new AuthController(authHandler);
const templateController = new TemplateController(prisma);
const userHandler = new UserHandler(prisma);
const userController = new UserController(userHandler);

// Register route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Auth Routes
app.post("/register", authController.register.bind(authController));
app.post("/login", authController.login.bind(authController));

// Template Routes
app.post(
  "/templates/new",
  authController.authMiddleware.bind(authController),
  templateController.createTemplate.bind(templateController)
);

app.post(
  "/templates/update/:id",
  authController.authMiddleware.bind(authController),
  templateController.updateTemplate.bind(templateController)
);

app.get(
  "/templates/user",
  authController.authMiddleware.bind(authController),
  templateController.getTemplatesByUser.bind(templateController)
);

app.get(
  "/templates/:id",
  templateController.getTemplate.bind(templateController)
);

app.get("/templates", templateController.getTemplates.bind(templateController));

app.delete(
  "/templates/:id",
  authController.authMiddleware.bind(authController),
  templateController.deleteTemplate.bind(templateController)
);

// User Management Routes
app.get("/users/:id", userController.getUser.bind(userController));

app.get(
  "/users",
  authController.authMiddleware.bind(authController),
  userController.getAllUsers.bind(userController)
);

app.put(
  "/users/:id",
  authController.authMiddleware.bind(authController),
  userController.updateUser.bind(userController)
);

app.delete(
  "/users/:id",
  authController.authMiddleware.bind(authController),
  userController.deleteUser.bind(userController)
);

// Start the Server and listen to incoming requests
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
