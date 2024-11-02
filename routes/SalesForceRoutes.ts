import { Router } from "express";
import SalesforceController from "../controllers/SalesforceController";
import SalesforceHandler from "../handlers/SalesForceHandler";
import { PrismaClient } from "@prisma/client";
import AuthController from "../controllers/AuthController";
import AuthHandler from "../handlers/AuthHandler";
import UserHandler from "../handlers/UserHandler";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

const prisma = new PrismaClient();
const authHandler = new AuthHandler(prisma, JWT_SECRET as string);
const authController = new AuthController(authHandler);
const userHandler = new UserHandler(prisma);
const salesforceHandler = new SalesforceHandler(prisma);
await salesforceHandler.initializeConnection();
const salesforceController = new SalesforceController(
  salesforceHandler,
  userHandler
);

// Base route for Salesforce API
router.get("/", salesforceController.baseRoute.bind(salesforceController));

// Get the authenticated user's Salesforce account details
router.get(
  "/myaccount",
  authController.authMiddleware.bind(authController),
  salesforceController.getSalesforceAccount.bind(salesforceController)
);

// Create a new Salesforce account for the authenticated user
router.post(
  "/accounts/new",
  authController.authMiddleware.bind(authController),
  salesforceController.createSalesforceAccount.bind(salesforceController)
);

// Update an existing Salesforce account by ID
router.post(
  "/accounts/update/:accountId",
  authController.authMiddleware.bind(authController),
  salesforceController.updateSalesforceAccount.bind(salesforceController)
);

export default router;
