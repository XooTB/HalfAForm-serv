import type { Request, Response } from "express";
import TemplateHandler from "../handlers/TemplateHandler";
import { PrismaClient } from "@prisma/client";
import type { Template, TemplateBlock } from "../types/Template";
import { TemplateBlockSchema, TemplateUpdateSchema } from "../types/Template";
import { ZodError } from "zod";
import { fromError } from "zod-validation-error";
import { AppError } from "../utils/AppError";

export default class TemplateController {
  private templateHandler: TemplateHandler;

  constructor(prisma: PrismaClient) {
    this.templateHandler = new TemplateHandler(prisma);
  }

  private validateUser(req: Request) {
    const { id: userId, role, status } = (req as any).user;
    if (
      !userId ||
      (role !== "admin" && role !== "regular") ||
      status !== "active"
    ) {
      throw new AppError(401, "The user is not authorized to create a form");
    }

    return { userId, role, status };
  }

  private validatePermissions(
    existingTemplate: any,
    userId: string,
    role: string
  ) {
    const admins = existingTemplate.admins.map((admin: any) => admin.id);
    if (
      existingTemplate.authorId !== userId &&
      !admins.includes(userId) &&
      role !== "admin"
    ) {
      throw new AppError(401, "User is not authorized for this action");
    }
  }

  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      // Extract template data from request body
      const {
        name,
        description,
        blocks,
        status: templateStatus,
        image,
      } = req.body;

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
        [userId],
        templateStatus,
        image
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
      const { userId, role } = this.validateUser(req);

      // Extract template data from request body
      const partialTemplate = req.body;

      // Fetch the existing template record
      const existingTemplate = await this.templateHandler.getTemplate(id);

      // Ensure the user is either the author of the template, admin, or one of the admins
      this.validatePermissions(existingTemplate, userId, role);
      const admins = existingTemplate.admins.map((admin: any) => admin.id);

      // Merge existing template with partial update
      const updatedTemplate: Template = {
        ...existingTemplate,
        ...partialTemplate,
        blocks: partialTemplate.blocks
          ? partialTemplate.blocks
          : JSON.parse(existingTemplate.blocks as string),
        admins: existingTemplate.admins.map((admin: any) => admin.id),
      };

      // Validate the merged template
      TemplateUpdateSchema.parse(updatedTemplate);

      // Update the template
      const data = await this.templateHandler.updateTemplate(
        id,
        updatedTemplate
      );

      data.blocks = JSON.parse(data.blocks as string);

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

  async getPublicTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await this.templateHandler.getPublicTemplates();

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
