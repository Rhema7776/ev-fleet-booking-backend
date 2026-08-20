import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import type {
  CreateEnterpriseInput,
  UpdateEnterpriseInput,
  ListEnterprisesQuery,
} from "../validators/enterpriseValidator";

class EnterpriseService {
  async list(query: ListEnterprisesQuery) {
    const { status, page, limit } = query;

    const where: Prisma.EnterpriseWhereInput = { ...(status ? { status } : {}) };

    const [enterprises, total] = await Promise.all([
      prisma.enterprise.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.enterprise.count({ where }),
    ]);

    return {
      enterprises,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: number) {
    const enterprise = await prisma.enterprise.findUnique({ where: { id } });

    if (!enterprise) {
      throw ApiError.notFound("Enterprise not found.");
    }

    return enterprise;
  }

  /** A user will create their own enterprise profile . one for every user, like FleetOwner. */
  async create(userId: number, data: CreateEnterpriseInput) {
    const existingForUser = await prisma.enterprise.findUnique({ where: { userId } });

    if (existingForUser) {
      throw ApiError.conflict("You already have an enterprise profile.");
    }

    const existingEmail = await prisma.enterprise.findUnique({
      where: { contactEmail: data.contactEmail },
    });

    if (existingEmail) {
      throw ApiError.conflict("An enterprise with this contact email already exists.");
    }

    return prisma.enterprise.create({
      data: {
        name: data.name,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        userId,
      },
    });
  }

  async update(id: number, userId: number, role: string | undefined, data: UpdateEnterpriseInput) {
    const enterprise = await this.getById(id);

    if (role !== "ADMIN") {
      if (enterprise.userId !== userId) {
        throw ApiError.forbidden("You do not have permission to modify this enterprise.");
      }
      if (data.status) {
        throw ApiError.forbidden("Only an admin can change an enterprise's status.");
      }
    }

    if (data.contactEmail && data.contactEmail !== enterprise.contactEmail) {
      const existing = await prisma.enterprise.findUnique({
        where: { contactEmail: data.contactEmail },
      });
      if (existing) {
        throw ApiError.conflict("An enterprise with this contact email already exists.");
      }
    }

    return prisma.enterprise.update({ where: { id }, data });
  }

  async remove(id: number, userId: number, role: string | undefined) {
    const enterprise = await this.getById(id);

    if (role !== "ADMIN" && enterprise.userId !== userId) {
      throw ApiError.forbidden("You do not have permission to delete this enterprise.");
    }

    await prisma.enterprise.delete({ where: { id } });
    return { id };
  }
}

export default new EnterpriseService();
