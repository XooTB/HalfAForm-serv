import { ZodError } from "zod";
import { fromError } from "zod-validation-error";

export class AppError extends Error {
  public statusCode: number;
  public message: string;

  constructor(statusCode: number, message: string) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
  }

  static fromZodError(error: ZodError) {
    return new AppError(400, fromError(error).toString());
  }
}
