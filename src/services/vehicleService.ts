import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  ListVehiclesQuery,
} from "../validators/vehicleValidator";

class VehicleService {
  /** Resolves the FleetOwner profile for a given User id, or throws. */
  private async requireFleetOwner(userId: number) {
    const fleetOwner = await prisma.fleetOwner.findUnique({ where: { userId } });

    if (!fleetOwner) {
      throw ApiError.forbidden(
        "You need a fleet owner profile before you can manage vehicles."
      );
    }

    return fleetOwner;
  }

  async list(query: ListVehiclesQuery) {
    const { status, category, page, limit } = query;

    const where: Prisma.VehicleWhereInput = {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
    };

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return {
      vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });

    if (!vehicle) {
      throw ApiError.notFound("Vehicle not found.");
    }

    return vehicle;
  }

  async create(userId: number, data: CreateVehicleInput) {
    const fleetOwner = await this.requireFleetOwner(userId);

    const existingPlate = await prisma.vehicle.findUnique({
      where: { plate: data.plate },
    });

    if (existingPlate) {
      throw ApiError.conflict("A vehicle with this plate number already exists.");
    }

    return prisma.vehicle.create({
      data: {
        name: data.name,
        plate: data.plate,
        category: data.category,
        pricePerHour: data.pricePerHour,
        isElectric: data.isElectric,
        imageUrl: data.imageUrl,
        fleetOwnerId: fleetOwner.id,
      },
    });
  }

  /**
   'role' belongs to the authenticated user attempting the write.
    ADMIN can update any vehicle; a FLEET OWNER can only update their own.
   */
  async update(
    id: number,
    userId: number,
    role: string | undefined,
    data: UpdateVehicleInput
  ) {
    const vehicle = await this.getById(id);
    await this.assertOwnershipOrAdmin(vehicle.fleetOwnerId, userId, role);

    if (data.plate && data.plate !== vehicle.plate) {
      const existingPlate = await prisma.vehicle.findUnique({
        where: { plate: data.plate },
      });
      if (existingPlate) {
        throw ApiError.conflict("A vehicle with this plate number already exists.");
      }
    }

    return prisma.vehicle.update({ where: { id }, data });
  }

  async remove(id: number, userId: number, role: string | undefined) {
    const vehicle = await this.getById(id);
    await this.assertOwnershipOrAdmin(vehicle.fleetOwnerId, userId, role);

    try {
      await prisma.vehicle.delete({ where: { id } });
    } catch (error) {
      // Prisma FK constraint violation :  vehicle still has bookings
      // referencing it (Booking.vehicleId is required, no cascade delete).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw ApiError.conflict(
          "This vehicle has existing bookings and cannot be deleted. Consider marking it UNAVAILABLE instead."
        );
      }
      throw error;
    }

    return { id };
  }

  private async assertOwnershipOrAdmin(
    vehicleFleetOwnerId: number,
    userId: number,
    role: string | undefined
  ) {
    if (role === "ADMIN") return;

    const fleetOwner = await this.requireFleetOwner(userId);

    if (fleetOwner.id !== vehicleFleetOwnerId) {
      throw ApiError.forbidden("You do not have permission to modify this vehicle.");
    }
  }
}

export default new VehicleService();
