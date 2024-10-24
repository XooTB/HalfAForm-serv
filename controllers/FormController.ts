import type { Request, Response } from "express";
import { FormHandler } from "../handlers/FormHandler";
import { PrismaClient, type Template } from "@prisma/client";
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
  private async checkTemplate(templateId: string, published: boolean = true) {
    const template = await this.templateHandler.getTemplate(templateId);

    if (template.status !== "published" && published) {
      throw new AppError(400, "The template is not published");
    }
    return template;
  }

  // Ensure template blocks ID match form answers ID and required fields are answered
  private matchTemplateBlocks(
    templateBlocks: TemplateBlock[],
    formAnswers: FormAnswers[]
  ) {
    // Check all required template blocks have answers
    for (const block of templateBlocks) {
      if (block.required) {
        const formAnswer = formAnswers.find(
          (answer) => answer.questionId === block.id
        );
        if (!formAnswer) {
          throw new AppError(
            400,
            `Required question "${block.question}" is not answered`
          );
        }
      }
    }

    // Check all form answers correspond to a template block
    for (const answer of formAnswers) {
      const templateBlock = templateBlocks.find(
        (block) => block.id === answer.questionId
      );
      if (!templateBlock) {
        throw new AppError(400, "The answer does not match the template block");
      }
    }
  }

  private validatePermissions(
    admins: string[],
    templateAuthor: string,
    userId: string
  ) {
    if (!admins.includes(userId) && templateAuthor !== userId) {
      throw new AppError(
        401,
        "The user is not authorized to interact with this form"
      );
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
      const template = await this.checkTemplate(templateId, false);

      // Check if the user is the owner of the template or the Admin
      if (template.authorId !== userId && role !== "admin") {
        throw new AppError(
          401,
          "The user is not authorized to fetch forms for this template"
        );
      }

      // Fetch all the forms
      const forms = await this.formHandler.getAllForms(templateId);

      const parsedForms = forms.map((form) => ({
        ...form,
        answers: JSON.parse(form.answers as string),
      }));

      // Return the forms
      res.status(200).json(parsedForms);
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

  // Delete a specific form
  async deleteForm(req: Request, res: Response) {
    try {
      const formId = req.params.formId;
      const { userId, role } = this.validateUser(req);

      // Fetch the form
      const form = await this.formHandler.getForm(formId);
      const template = await this.templateHandler.getTemplate(form.templateId);

      // Check if the user is the owner of the form or the owner of the template or the Admin
      if (
        form.userId !== userId &&
        template.authorId !== userId &&
        role !== "admin"
      ) {
        throw new AppError(
          401,
          "The user is not authorized to delete this form"
        );
      }

      // Delete the form
      const deletedForm = await this.formHandler.deleteForm(formId);

      // Return the deleted form
      res.status(200).json({
        message: "Form deleted successfully",
        form: deletedForm,
      });
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

  // Update a specific form
  async updateForm(req: Request, res: Response) {
    try {
      const { userId, role } = this.validateUser(req);
      const formId = req.params.formId;

      // Fetch the form and the template
      const form = await this.formHandler.getForm(formId);
      const template = await this.templateHandler.getTemplate(form.templateId);

      // Check if the user is the owner of the form or the Admin
      if (form.userId !== userId && role !== "admin") {
        throw new AppError(
          401,
          "The user is not authorized to update this form"
        );
      }

      // Extract the partial form data from the request body
      const partialForm = req.body;

      // Merge the form with the partial form.
      const newForm: Form = {
        ...form,
        ...partialForm,
        templateId: form.templateId,
      };

      // Validate the answers
      this.validateAnswers(partialForm.answers);

      // Validate the full form.
      FormSchema.parse(newForm);

      // Match the template blocks with the form answers
      const blocks = JSON.parse(template.blocks as string) as TemplateBlock[];
      this.matchTemplateBlocks(blocks, partialForm.answers);

      // Update the form
      const updatedForm = await this.formHandler.updateForm(newForm);

      // Return the updated form
      res.status(200).json(updatedForm);
    } catch (error: AppError | ZodError | any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
      } else if (error instanceof ZodError) {
        res.status(400).json({
          message: fromError(error).toString(),
        });
      } else {
        res.status(500).json({
          message: "An unexpected error occurred",
        });
      }
    }
  }

  // Get all the forms for a specific user
  async getFormsByUser(req: Request, res: Response) {
    const { userId } = this.validateUser(req);

    try {
      // Get all the forms for the user
      const forms = await this.formHandler.getFormsByUser(userId);

      // Return the forms
      res.status(200).json(forms);
    } catch (error: AppError | ZodError | any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
      }
    }
  }

  async getAllSubmissions(req: Request, res: Response) {
    try {
      const { userId } = this.validateUser(req);

      const submissions = await this.formHandler.getAllSubmissions(userId);

      const parsedSubmissions = submissions.map((submission) => ({
        ...submission,
        answers: JSON.parse(submission.answers as string),
      }));

      res.status(200).json(parsedSubmissions);
    } catch (error: AppError | ZodError | any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
      }
    }
  }
}
