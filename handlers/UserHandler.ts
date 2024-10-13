import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/AppError";

export default class UserHandler {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const { password: _password, role: _role, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async updateUser(
    id: string,
    data: Partial<{ name: string; email: string; role: string }>
  ) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.delete({
      where: { id },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany();

    return users.map(({ password: _, ...user }) => user);
  }
}
