import http from "http";
import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client";
import AuthController from "./controllers/AuthController";
import TemplateController from "./controllers/TemplateController";
import AuthHandler from "./handlers/AuthHandler";
import UserHandler from "./handlers/UserHandler";
import UserController from "./controllers/UserController";
import { FormHandler } from "./handlers/FormHandler";
import { FormController } from "./controllers/FormController";
import TemplateHandler from "./handlers/TemplateHandler";

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
app.use(express.json());

// CORS Configuration
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Initialize AuthHandler and AuthController
const authHandler = new AuthHandler(prisma, JWT_SECRET);
const authController = new AuthController(authHandler);
const templateController = new TemplateController(prisma);
const userHandler = new UserHandler(prisma);
const userController = new UserController(userHandler);
const formHandler = new FormHandler(prisma);
const formController = new FormController(formHandler, prisma);

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

app.get(
  "/templates",
  templateController.getPublicTemplates.bind(templateController)
);

app.delete(
  "/templates/:id",
  authController.authMiddleware.bind(authController),
  templateController.deleteTemplate.bind(templateController)
);

app.put(
  "/templates/admins/:id",
  authController.authMiddleware.bind(authController),
  templateController.updateTemplateAdmins.bind(templateController)
);

// User Management Routes
app.get(
  "/users/search",
  authController.authMiddleware.bind(authController),
  userController.findUsers.bind(userController)
);

app.get(
  "/users/stats",
  authController.authMiddleware.bind(authController),
  userController.getUserStats.bind(userController)
);

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

// Form Routes
app.post(
  "/forms/new",
  authController.authMiddleware.bind(authController),
  formController.createForm.bind(formController)
);

app.get(
  "/forms/user",
  authController.authMiddleware.bind(authController),
  formController.getFormsByUser.bind(formController)
);

app.get(
  "/forms/template/:templateId",
  authController.authMiddleware.bind(authController),
  formController.getAllForms.bind(formController)
);

app.get(
  "/forms/get/:formId",
  authController.authMiddleware.bind(authController),
  formController.getForm.bind(formController)
);

app.get(
  "/forms/submissions",
  authController.authMiddleware.bind(authController),
  formController.getAllSubmissions.bind(formController)
);

app.delete(
  "/forms/delete/:formId",
  authController.authMiddleware.bind(authController),
  formController.deleteForm.bind(formController)
);

app.put(
  "/forms/update/:formId",
  authController.authMiddleware.bind(authController),
  formController.updateForm.bind(formController)
);

// Start the Server and listen to incoming requests
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
