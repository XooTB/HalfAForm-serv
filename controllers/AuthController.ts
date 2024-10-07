import type { NextFunction, Request, Response } from "express";
import AuthHandler from "../handlers/AuthHandler";

export default class AuthController {
  private authHandler: AuthHandler;

  constructor(authHandler: AuthHandler) {
    this.authHandler = authHandler;
  }

  async register(req: Request, res: Response) {
    try {
      const { email, name, password } = req.body;
      const result = await this.authHandler.register(email, name, password);
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

  async protected(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new Error("No token provided");
      }
      const userId = this.authHandler.verifyToken(token);
      res.json({ message: "Access granted", userId });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new Error("No token provided");
      }

      const userId = this.authHandler.verifyToken(token);

      const user = { id: userId };

      (req as any).user = user;

      next();
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
}
