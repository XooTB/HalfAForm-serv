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
      include: {
        authored: {
          where: {
            status: "published",
          },
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const { password: _password, role: _role, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async updateUser(
    id: string,
    data: Partial<{ name: string; email: string; role: string; status: string }>
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

  async findUsers(query: { name?: string; email?: string }) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            name: query.name
              ? { contains: query.name, mode: "insensitive" }
              : undefined,
          },
          { email: query.email },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return users;
  }

  async getUserStats(authorId: string) {
    const totalTemplatesCount = await this.prisma.template.count({
      where: { authorId },
    });

    const publicTemplatesCount = await this.prisma.template.count({
      where: { authorId, status: "published" },
    });

    const submissionCount = await this.prisma.form.count({
      where: { template: { authorId } },
    });

    const ownFormsCount = await this.prisma.form.count({
      where: { userId: authorId },
    });

    return {
      totalTemplatesCount,
      publicTemplatesCount,
      submissionCount,
      ownFormsCount,
    };
  }

  async getSalesforceAccount(userId: string) {
    const account = await this.prisma.salesforceAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new AppError(404, "User does not have a Salesforce account");
    }

    return account;
  }
}
