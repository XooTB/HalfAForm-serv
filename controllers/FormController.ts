import type { Request, Response } from "express";
import { FormHandler } from "../handlers/FormHandler";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/AppError";
import {
  FormAnswersSchema,
  FormSchema,
  type Form,
  type FormAnswers,
} from "../types/Form";
import { ZodError } from "zod";
import { fromError } from "zod-validation-error";
import TemplateHandler from "../handlers/TemplateHandler";
import type { TemplateBlock } from "../types/Template";

export class FormController {
  private formHandler: FormHandler;
  private templateHandler: TemplateHandler;

  constructor(formHandler: FormHandler, prisma: PrismaClient) {
    this.formHandler = formHandler;
    this.templateHandler = new TemplateHandler(prisma);
  }

  // Validate user authorization
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

  // Validate form answers
  private validateAnswers(answers: FormAnswers[]) {
    if (
      !answers.every((answer) => FormAnswersSchema.safeParse(answer).success)
    ) {
      throw new AppError(400, "Invalid form answers");
    }
  }

  // Check if the template is published
  private async checkTemplate(templateId: string) {
    const template = await this.templateHandler.getTemplate(templateId);

    if (template.status !== "published") {
      throw new AppError(400, "The template is not published");
    }
    return template;
  }

  // Ensure template blocks ID match form answers ID
  private matchTemplateBlocks(
    templateBlocks: TemplateBlock[],
    formAnswers: FormAnswers[]
  ) {
    if (templateBlocks.length !== formAnswers.length) {
      throw new AppError(400, "The template and form answers do not match");
    }

    for (const block of templateBlocks) {
      const formAnswer = formAnswers.find(
        (answer) => answer.questionId === block.id
      );
      if (!formAnswer) {
        throw new AppError(
          400,
          "The form answer does not match the template block"
        );
      }
    }
  }

  async createForm(req: Request, res: Response) {
    try {
      // Validate the user and get their ID
      const { userId } = this.validateUser(req);

      // Extract form data from the request body and assign the user ID
      const formData: Form = req.body;
      formData.userId = userId;

      // Validate the form answers
      this.validateAnswers(formData.answers);

      // Validate the entire form structure using Zod schema
      FormSchema.parse(formData);

      // Validate the template
      const template = await this.checkTemplate(formData.templateId);

      // Match the template blocks with the form answers
      const blocks = JSON.parse(template.blocks as string) as TemplateBlock[];
      this.matchTemplateBlocks(blocks, formData.answers);

      // If everything is ok, create the new form.
      const newForm = await this.formHandler.createForm(formData);

      // Return the new form
      res.status(201).json({
        ...newForm,
      });
    } catch (error) {
      // Handle different types of errors
      if (error instanceof AppError) {
        // Custom application errors
        res.status(error.statusCode).json({
          message: error.message,
        });
      } else if (error instanceof ZodError) {
        // Zod validation errors
        res.status(400).json({
          message: fromError(error).toString(),
        });
      } else {
        // Unexpected errors
        res.status(500).json({
          message: "An unexpected error occurred",
        });
      }
    }
  }

  // Fetch all the Forms.
  async getAllForms(req: Request, res: Response) {
    try {
      // Validate the user and get their ID
      const { userId, role } = this.validateUser(req);

      // Extract the template ID from the request parameters
      const templateId = req.params.templateId;

      // Check if the template exists and is published
      const template = await this.checkTemplate(templateId);

      // Check if the user is the owner of the template or the Admin
      if (template.authorId !== userId && role !== "admin") {
        throw new AppError(
          401,
          "The user is not authorized to fetch forms for this template"
        );
      }

      // Fetch all the forms
      const forms = await this.formHandler.getAllForms(templateId);

      // Return the forms
      res.status(200).json(forms);
    } catch (error: AppError | ZodError | any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: "An unexpected error occurred",
        });
      }
    }
  }

  // Fetch a specific form
  async getForm(req: Request, res: Response) {
    try {
      const formId = req.params.formId;
      const { userId, role } = this.validateUser(req);

      // Fetch the form
      const form = await this.formHandler.getForm(formId);

      // Check if the user is the owner of the form or the Admin
      if (form.userId !== userId && role !== "admin") {
        throw new AppError(
          401,
          "The user is not authorized to fetch this form"
        );
      }

      // If everything is ok, return the form
      res.status(200).json(form);
    } catch (error: AppError | ZodError | any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
      } else {
        res.status(500).json({
          message: "An unexpected error occurred",
        });
      }
    }
  }
}
