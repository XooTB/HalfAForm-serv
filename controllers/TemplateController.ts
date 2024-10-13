import type { Request, Response } from "express";
import TemplateHandler from "../handlers/TemplateHandler";
import { PrismaClient } from "@prisma/client";
import type { TemplateBlock } from "../types/Template";
import { TemplateBlockSchema, TemplateSchema } from "../types/Template";
import { ZodError } from "zod";
import { fromError } from "zod-validation-error";
import { AppError } from "../utils/AppError";

export default class TemplateController {
  private templateHandler: TemplateHandler;

  constructor(prisma: PrismaClient) {
    this.templateHandler = new TemplateHandler(prisma);
  }

  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      // Extract template data from request body
      const { name, description, blocks, status: templateStatus } = req.body;

      // Validate required fields
      if (!name || !description || !blocks) {
        throw new AppError(400, "Missing required fields");
      }

      // Validate blocks
      for (let block of blocks) {
        TemplateBlockSchema.parse(block);
      }

      // Extract user ID and role from request
      const { id: userId, role, status } = (req as any).user;

      // Validate user authentication
      if (!userId) {
        throw new AppError(401, "User is not authenticated");
      }

      // Validate user role
      if (role !== "admin" && role !== "regular") {
        throw new AppError(401, "User is not authorized");
      }

      if (status !== "active") {
        throw new AppError(401, "User is not active");
      }

      // Create the template
      const template = await this.templateHandler.createTemplate(
        name,
        description,
        blocks as TemplateBlock[],
        userId,
        templateStatus
      );

      // Send the created template as a response
      res.status(201).json(template);
    } catch (error: any | ZodError) {
      // Handle validation errors
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(error.statusCode).json({ error: error.message });
      }
    }
  }

  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      // Extract template ID from request parameters
      const { id } = req.params;
      const { id: userId, role, status } = (req as any).user;

      // Extract template data from request body
      const partialTemplate = req.body;

      // Fetch the existing template record
      const existingTemplate = await this.templateHandler.getTemplate(id);

      // Ensure the user is either the author of the template or an admin
      if (existingTemplate.authorId !== userId && role !== "admin") {
        throw new AppError(401, "User is not authorized for this action");
      }

      // Make sure the user is active
      if (status !== "active") {
        throw new AppError(401, "User is not active");
      }

      // Merge existing template with partial update
      const updatedTemplate = {
        ...existingTemplate,
        ...partialTemplate,
        blocks: partialTemplate.blocks
          ? (JSON.parse(partialTemplate.blocks as string) as TemplateBlock[])
          : (JSON.parse(existingTemplate.blocks as string) as TemplateBlock[]),
      };

      // Validate the merged template
      TemplateSchema.parse(updatedTemplate);

      // Update the template
      const data = await this.templateHandler.updateTemplate(
        id,
        updatedTemplate.name,
        updatedTemplate.description,
        updatedTemplate.blocks as TemplateBlock[]
      );

      res.json(data);
    } catch (error: any | ZodError) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(error.statusCode || 500).json({ error: error.message });
      }
    }
  }

  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      // Extract template ID from request parameters
      const { id } = req.params;
      const { id: userId, role, status } = (req as any).user;

      // Fetch the existing template record
      const record = await this.templateHandler.getTemplate(id);

      // Ensure the user is either the author of the template or an admin
      if (record.authorId !== userId && role !== "admin") {
        throw new AppError(401, "User is not authorized for this action");
      }

      // Make sure the user is active
      if (status !== "active") {
        throw new AppError(401, "User is not active");
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
      const { id: userId } = (req as any).user;

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
