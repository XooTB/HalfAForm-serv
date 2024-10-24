import type { Request, Response, NextFunction } from "express";
import UserHandler from "../handlers/UserHandler";
import { AppError } from "../utils/AppError";

export default class UserController {
  private userHandler: UserHandler;

  constructor(userHandler: UserHandler) {
    this.userHandler = userHandler;
  }

  async getUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;

      if (!userId) {
        throw new AppError(400, "User ID is required");
      }

      const user = await this.userHandler.getUser(userId);

      res.json(user);
    } catch (error: any | AppError) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const { role } = (req as any).user;

      if (role !== "admin") {
        throw new AppError(403, "Only admins can access this resource");
      }

      const users = await this.userHandler.getAllUsers();
      res.json(users);
    } catch (error: any | AppError) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { role } = (req as any).user;

      if (role !== "admin") {
        throw new AppError(403, "Only admins can update users");
      }

      const userId = req.params.id;
      const updateData = req.body;

      const updatedUser = await this.userHandler.updateUser(userId, updateData);

      res.json(updatedUser);
    } catch (error: any | AppError) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { role } = (req as any).user;

      if (role !== "admin") {
        throw new AppError(403, "Only admins can delete users");
      }

      const userId = req.params.id;

      const deletedUser = await this.userHandler.deleteUser(userId);

      res.json(deletedUser);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async findUsers(req: Request, res: Response) {
    try {
      const { name, email } = req.query;

      if (!name && !email) {
        throw new AppError(
          400,
          "At least one search parameter (name or email) is required"
        );
      }

      const users = await this.userHandler.findUsers({
        name: name as string,
        email: email as string,
      });

      res.json(users);
    } catch (error: any | AppError) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async getUserStats(req: Request, res: Response) {
    try {
      const { id: userId } = (req as any).user;

      // Fetch the user stats including total templates, total public templates,
      // total submission count on those templates, and his own forms
      const stats = await this.userHandler.getUserStats(userId);

      const {
        totalTemplatesCount,
        publicTemplatesCount,
        submissionCount,
        ownFormsCount,
      } = stats;

      res.json({
        totalTemplates: totalTemplatesCount,
        totalPublicTemplates: publicTemplatesCount,
        totalSubmissionCount: submissionCount,
        ownFormsCount: ownFormsCount,
      });
    } catch (error: any | AppError) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}
