import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";
import type { Template, TemplateBlock } from "../types/Template";
import { AppError } from "../utils/AppError";

export default class TemplateHandler {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createTemplate(
    name: string,
    description: string,
    blocks: TemplateBlock[],
    userId: string,
    status: "draft" | "published" | "restricted" = "draft",
    image?: string
  ) {
    // Create a new template object
    const data = {
      id: uuid(),
      name,
      description,
      status,
      blocks: JSON.stringify(blocks), // Convert blocks array to JSON string for storage
      authorId: userId,
      version: 1,
      image,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create the record in the database
    const template = await this.prisma.template.create({ data });

    return template;
  }

  async getTemplate(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new AppError(404, "Template not found");
    }

    return template;
  }

  async updateTemplate(id: string, templateData: Template) {
    const data = {
      ...templateData,
      blocks: JSON.stringify(templateData.blocks),
      updatedAt: new Date(),
      version: templateData.version + 1,
    };

    const template = await this.prisma.template.update({
      where: { id },
      data,
    });

    return template;
  }

  async deleteTemplate(id: string) {
    await this.prisma.template.delete({
      where: { id },
    });
  }

  async getTemplatesByUser(userId: string) {
    const templates = await this.prisma.template.findMany({
      where: { authorId: userId },
    });
    return templates;
  }

  async getTemplatesByAuthor(authorId: string) {
    const templates = await this.prisma.template.findMany({
      where: { authorId },
    });

    return templates;
  }

  async getTemplates() {
    const templates = await this.prisma.template.findMany();
    return templates;
  }
}
