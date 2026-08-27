import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { verifyFleetOwner } from "./verificationService";
import type {
  CreateFleetOwnerInput,
  CreateSelfFleetOwnerInput,
  UpdateFleetOwnerInput,
  ListFleetOwnersQuery,
} from "../validators/fleetOwnerValidator";

class FleetOwnerService {
  async list(query: ListFleetOwnersQuery) {
    const { isVerified, page, limit } = query;

    const where: Prisma.FleetOwnerWhereInput = {
      ...(isVerified !== undefined ? { isVerified } : {}),
    };

    const [fleetOwners, total] = await Promise.all([
      prisma.fleetOwner.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.fleetOwner.count({ where }),
    ]);

    return {
      fleetOwners,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: number) {
    const fleetOwner = await prisma.fleetOwner.findUnique({ where: { id } });

    if (!fleetOwner) {
      throw ApiError.notFound("Fleet owner not found.");
    }

    return fleetOwner;
  }

  /** ADMIN/MASTER_AGENT provisions a FleetOwner profile for a target user. */
  async create(data: CreateFleetOwnerInput) {
    const targetUser = await prisma.user.findUnique({ where: { id: data.userId } });

    if (!targetUser) {
      throw ApiError.badRequest("Target user not found.");
    }

    const existingForUser = await prisma.fleetOwner.findUnique({
      where: { userId: data.userId },
    });

    if (existingForUser) {
      throw ApiError.conflict("This user already has a fleet owner profile.");
    }

    const existingEmail = await prisma.fleetOwner.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw ApiError.conflict("A fleet owner with this email already exists.");
    }

    return prisma.fleetOwner.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        rcNumber: data.rcNumber,
        userId: data.userId,
      },
    });
  }

  /**
   * Self-service — a real fleet owner creating their OWN profile during
   * their own signup. Mirrors Enterprise's existing self-service create()
   * pattern exactly, since that's the correct, already-established
   * approach for this kind of thing.
   */
  async createSelf(userId: number, data: CreateSelfFleetOwnerInput) {
    const existingForUser = await prisma.fleetOwner.findUnique({ where: { userId } });

    if (existingForUser) {
      throw ApiError.conflict("You already have a fleet owner profile.");
    }

    const existingEmail = await prisma.fleetOwner.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw ApiError.conflict("A fleet owner with this email already exists.");
    }

    const fleetOwner = await prisma.fleetOwner.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        rcNumber: data.rcNumber,
        userId,
      },
    });

    // Fire-and-forget — verification shouldn't make the registration
    // response wait on a third-party API call. Errors here are caught
    // and logged inside verifyFleetOwner itself via the provider's own
    // try/catch (a failed check just leaves verificationStatus at its
    // PENDING default, not an unhandled rejection).
    verifyFleetOwner(fleetOwner.id).catch((error) => {
      console.error("Fleet owner verification failed to run:", error);
    });

    return fleetOwner;
  }

  async update(
    id: number,
    userId: number,
    role: string | undefined,
    data: UpdateFleetOwnerInput
  ) {
    const fleetOwner = await this.getById(id);

    if (role !== "ADMIN") {
      if (fleetOwner.userId !== userId) {
        throw ApiError.forbidden("You do not have permission to modify this fleet owner.");
      }
      if (data.isVerified !== undefined || data.isActive !== undefined) {
        throw ApiError.forbidden(
          "Only an admin can change verification or active status."
        );
      }
    }

    if (data.email && data.email !== fleetOwner.email) {
      const existing = await prisma.fleetOwner.findUnique({ where: { email: data.email } });
      if (existing) {
        throw ApiError.conflict("A fleet owner with this email already exists.");
      }
    }

    return prisma.fleetOwner.update({ where: { id }, data });
  }

  async remove(id: number, userId: number, role: string | undefined) {
    const fleetOwner = await this.getById(id);

    if (role !== "ADMIN" && fleetOwner.userId !== userId) {
      throw ApiError.forbidden("You do not have permission to delete this fleet owner.");
    }

    try {
      await prisma.fleetOwner.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw ApiError.conflict(
          "This fleet owner still has vehicles or drivers attached and cannot be deleted."
        );
      }
      throw error;
    }

    return { id };
  }
}

export default new FleetOwnerService();