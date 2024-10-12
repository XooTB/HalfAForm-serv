import type { Request, Response } from "express";
import TemplateHandler from "../handlers/TemplateHandler";
import { PrismaClient } from "@prisma/client";
import type { TemplateBlock } from "../types/Template";
import { TemplateBlockSchema, TemplateSchema } from "../types/Template";
import { ZodError } from "zod";
import { fromError } from "zod-validation-error";
import { AppError } from "../utils/AppError";

/**
 * TemplateController handles HTTP requests related to template operations.
 * It acts as an intermediary between the HTTP layer and the TemplateHandler,
 * which contains the business logic for template management.
 *
 * This controller is responsible for:
 * - Validating incoming request data
 * - Calling appropriate methods on the TemplateHandler
 * - Handling errors and sending appropriate HTTP responses
 * - Ensuring user authentication for protected routes
 *
 * It uses Zod for request data validation and AppError for consistent error handling.
 */
export default class TemplateController {
  private templateHandler: TemplateHandler;

  constructor(prisma: PrismaClient) {
    this.templateHandler = new TemplateHandler(prisma);
  }

  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      // Extract template data from request body
      const { name, description, blocks } = req.body;

      // Validate required fields
      if (!name || !description || !blocks) {
        throw new AppError(400, "Missing required fields");
      }

      // Validate blocks
      for (let block of blocks) {
        TemplateBlockSchema.parse(block);
      }

      // Extract user ID and role from request
      const { id: userId, role } = (req as any).user;

      // Validate user authentication
      if (!userId) {
        throw new AppError(401, "User is not authenticated");
      }

      // Validate user role
      if (role !== "admin" && role !== "regular") {
        throw new AppError(401, "User is not authorized");
      }

      // Create the template
      const template = await this.templateHandler.createTemplate(
        name,
        description,
        blocks as TemplateBlock[],
        userId
      );

      // Send the created template as a response
      res.status(201).json(template);
    } catch (error: any | ZodError) {
      // Handle validation errors
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      // Extract template ID from request parameters
      const { id } = req.params;
      const { id: userId, role } = (req as any).user;

      // Extract template data from request body
      const { template } = req.body;
      TemplateSchema.parse(template);

      // Fetch the existing template record
      const record = await this.templateHandler.getTemplate(id);

      // Ensure the user is either the author of the template or an admin
      if (record.authorId !== userId && role !== "admin") {
        throw new AppError(401, "User is not authorized for this action");
      }

      // Update the template
      const data = await this.templateHandler.updateTemplate(
        id,
        template.name,
        template.description,
        template.blocks as TemplateBlock[]
      );

      res.json(data);
    } catch (error: any | ZodError) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      // Extract template ID from request parameters
      const { id } = req.params;
      const { id: userId, role } = (req as any).user;

      // Fetch the existing template record
      const record = await this.templateHandler.getTemplate(id);

      // Ensure the user is either the author of the template or an admin
      if (record.authorId !== userId && role !== "admin") {
        throw new AppError(401, "User is not authorized for this action");
      }

      // Delete the template
      await this.templateHandler.deleteTemplate(id);

      res.status(204).send();
    } catch (error: any | ZodError) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await this.templateHandler.getTemplate(id);

      res.json(template);
    } catch (error: any | ZodError) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async getTemplatesByUser(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId, role } = (req as any).user;

      if (!userId) {
        throw new AppError(401, "User is not authenticated");
      }

      const templates = await this.templateHandler.getTemplatesByUser(userId);

      res.json(templates);
    } catch (error: any | ZodError) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await this.templateHandler.getTemplates();

      res.json(templates);
    } catch (error: any | ZodError) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}
