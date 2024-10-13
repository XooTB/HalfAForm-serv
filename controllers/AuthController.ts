import type { NextFunction, Request, Response } from "express";
import AuthHandler from "../handlers/AuthHandler";

export default class AuthController {
  private authHandler: AuthHandler;

  constructor(authHandler: AuthHandler) {
    this.authHandler = authHandler;
  }

  async register(req: Request, res: Response) {
    try {
      const { email, name, password, role } = req.body;
      const result = await this.authHandler.register(
        email,
        name,
        password,
        role
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.authHandler.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new Error("No token provided");
      }

      const userData = await this.authHandler.verifyToken(token);

      const user = {
        id: userData.userId,
        role: userData.userRole,
        status: userData.userStatus,
      };

      (req as any).user = user;

      next();
    } catch (error: any) {
      res.status(error.statusCode).json({ error: error.message });
    }
  }
}
