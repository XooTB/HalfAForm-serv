import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

export default class AuthHandler {
  private prisma: PrismaClient;
  private jwtSecret: string;

  constructor(prisma: PrismaClient, jwtSecret: string) {
    this.prisma = prisma;
    this.jwtSecret = jwtSecret;
  }

  async register(
    email: string,
    name: string,
    password: string,
    role: string = "regular"
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        id: uuid(),
        email,
        name,
        password: hashedPassword,
        role,
      },
    });

    const token = this.generateToken(user.id, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken(user.id, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  verifyToken(token: string): { userId: string; userRole: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as {
        userId: string;
        userRole: string;
      };
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  private generateToken(userId: string, userRole: string): string {
    return jwt.sign({ userId, userRole }, this.jwtSecret, { expiresIn: "1d" });
  }
}
