import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";
import type { TemplateBlock } from "../types/Template";

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
    status: "draft" | "published" | "restricted" = "draft"
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
      throw new Error("Template not found");
    }

    return template;
  }

  async updateTemplate(
    id: string,
    name: string,
    description: string,
    blocks: TemplateBlock[]
  ) {
    const data = {
      name,
      description,
      blocks: JSON.stringify(blocks),
      updatedAt: new Date(), // Update the timestamp
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
