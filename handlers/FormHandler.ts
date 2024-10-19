import { PrismaClient, Prisma } from "@prisma/client";
import type { Form } from "../types/Form";
import { AppError } from "../utils/AppError";
import { v4 as uuid } from "uuid";

export class FormHandler {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create a new form in the database
  async createForm(formData: Form) {
    // Get the current date
    const currentDate = new Date();

    // Create the form object
    const form = {
      ...formData,
      id: uuid(),
      answers: JSON.stringify(formData.answers),
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    // Create the form in the database
    const newForm = await this.prisma.form.create({
      data: form,
    });

    // If the form is not created, throw an error
    if (!newForm) {
      throw new AppError(500, "Failed to create form, Please try again.");
    }

    return newForm;
  }

  // Fetch all the forms for a specific template.
  async getAllForms(templateId: string) {
    const forms = await this.prisma.form.findMany({
      where: {
        templateId,
      },
    });

    if (!forms) {
      throw new AppError(404, "No forms found for this template");
    }

    return forms;
  }

  // Fetch a specific form
  async getForm(formId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new AppError(404, "Form not found");
    }

    return form;
  }
}
