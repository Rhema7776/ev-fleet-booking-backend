import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import type { UpdateUserInput, ListUsersQuery } from "../validators/userValidator";

// Never select `password` — these are real endpoints returning real user
// records now, unlike the mocked versions before. Selecting explicitly
// (rather than trusting future editors to remember to strip it) makes the
// exclusion structural, not a habit someone can forget.
const SAFE_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  authProvider: true,
  isVerified: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

class UserService {
  async list(query: ListUsersQuery) {
    const { role, isActive, page, limit } = query;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: SAFE_USER_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: number) {
    const user = await prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT });

    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    return user;
  }

  async update(id: number, callerId: number, callerRole: string | undefined, data: UpdateUserInput) {
    await this.getById(id); // 404s if missing, regardless of caller

    if (callerRole !== "ADMIN") {
      if (id !== callerId) {
        throw ApiError.forbidden("You do not have permission to modify this user.");
      }
      if (data.role !== undefined || data.isActive !== undefined) {
        throw ApiError.forbidden("Only an admin can change role or active status.");
      }
    }

    return prisma.user.update({ where: { id }, data, select: SAFE_USER_SELECT });
  }

  async deactivate(id: number) {
    await this.getById(id);
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: SAFE_USER_SELECT,
    });
  }
}

export default new UserService();
