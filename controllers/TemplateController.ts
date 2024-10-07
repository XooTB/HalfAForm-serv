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
      const { name, description, blocks } = req.body;

      if (!name || !description || !blocks) {
        throw new AppError(400, "Missing required fields");
      }

      for (let block of blocks) {
        TemplateBlockSchema.parse(block);
      }

      const userId = (req as any).user.id;

      if (!userId) {
        throw new AppError(401, "User is not authenticated");
      }

      const template = await this.templateHandler.createTemplate(
        name,
        description,
        blocks as TemplateBlock[],
        userId
      );

      res.status(201).json(template);
    } catch (error: any | ZodError) {
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
      const userId = (req as any).user.id;

      // Extract template data from request body
      const { template } = req.body;
      TemplateSchema.parse(template);

      // Fetch the existing template record
      const record = await this.templateHandler.getTemplate(id);

      // Ensure the user is the author of the template
      if (record.authorId !== userId) {
        throw new AppError(401, "User is not the author of the template");
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
      const userId = (req as any).user.id;

      // Fetch the existing template record
      const record = await this.templateHandler.getTemplate(id);

      // Ensure the user is the author of the template
      if (record.authorId !== userId) {
        throw new AppError(401, "User is not the author of the template");
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
      const userId = (req as any).user.id;

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
}
