import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";
import type { TemplateBlock } from "../types/Template";

export default class TemplateHandler {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Creates a new template in the database.
   * @param name - The name of the template.
   * @param description - A brief description of the template.
   * @param blocks - An array of TemplateBlock objects representing the structure of the template.
   * @param userId - The ID of the user creating the template.
   * @returns The newly created template object.
   */
  async createTemplate(
    name: string,
    description: string,
    blocks: TemplateBlock[],
    userId: string
  ) {
    // Create a new template object
    const data = {
      id: uuid(),
      name,
      description,
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

  /**
   * Retrieves a template by its ID.
   * @param id - The ID of the template to retrieve.
   * @returns The template object if found.
   * @throws Error if the template is not found.
   */
  async getTemplate(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  }

  /**
   * Updates an existing template.
   * @param id - The ID of the template to update.
   * @param name - The new name for the template.
   * @param description - The new description for the template.
   * @param blocks - The new array of TemplateBlock objects.
   * @returns The updated template object.
   */
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

  /**
   * Deletes a template by its ID.
   * @param id - The ID of the template to delete.
   */
  async deleteTemplate(id: string) {
    await this.prisma.template.delete({
      where: { id },
    });
  }

  /**
   * Retrieves all templates created by a specific user.
   * @param userId - The ID of the user whose templates to retrieve.
   * @returns An array of template objects.
   */
  async getTemplatesByUser(userId: string) {
    const templates = await this.prisma.template.findMany({
      where: { authorId: userId },
    });
    return templates;
  }

  /**
   * Retrieves all templates created by a specific author.
   * @param authorId - The ID of the author whose templates to retrieve.
   * @returns An array of template objects.
   */
  async getTemplatesByAuthor(authorId: string) {
    const templates = await this.prisma.template.findMany({
      where: { authorId },
    });

    return templates;
  }
}
