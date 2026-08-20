import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import type {
  CreateDriverInput,
  UpdateDriverInput,
  ListDriversQuery,
} from "../validators/driverValidator";

class DriverService {
  private async requireFleetOwner(userId: number) {
    const fleetOwner = await prisma.fleetOwner.findUnique({ where: { userId } });

    if (!fleetOwner) {
      throw ApiError.forbidden(
        "You need a fleet owner profile before you can manage drivers."
      );
    }

    return fleetOwner;
  }

  /** Confirms `vehicleId` exists and belongs to this fleet owner, if provided. */
  private async assertVehicleOwnership(vehicleId: number, fleetOwnerId: number) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });

    if (!vehicle) {
      throw ApiError.badRequest("Vehicle not found.");
    }

    if (vehicle.fleetOwnerId !== fleetOwnerId) {
      throw ApiError.forbidden("That vehicle does not belong to your fleet.");
    }
  }

  async list(query: ListDriversQuery) {
    const { status, page, limit } = query;

    const where: Prisma.DriverWhereInput = { ...(status ? { status } : {}) };

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { vehicle: true },
      }),
      prisma.driver.count({ where }),
    ]);

    return {
      drivers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: number) {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!driver) {
      throw ApiError.notFound("Driver not found.");
    }

    return driver;
  }

  async create(userId: number, data: CreateDriverInput) {
    const fleetOwner = await this.requireFleetOwner(userId);

    if (data.vehicleId) {
      await this.assertVehicleOwnership(data.vehicleId, fleetOwner.id);
    }

    const [existingPhone, existingLicense] = await Promise.all([
      prisma.driver.findUnique({ where: { phone: data.phone } }),
      prisma.driver.findUnique({ where: { licenseNumber: data.licenseNumber } }),
    ]);

    if (existingPhone) {
      throw ApiError.conflict("A driver with this phone number already exists.");
    }

    if (existingLicense) {
      throw ApiError.conflict("A driver with this license number already exists.");
    }

    return prisma.driver.create({
      data: {
        name: data.name,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        vehicleId: data.vehicleId,
        fleetOwnerId: fleetOwner.id,
      },
    });
  }

  async update(id: number, userId: number, role: string | undefined, data: UpdateDriverInput) {
    const driver = await this.getById(id);
    const fleetOwner = await this.assertOwnershipOrAdmin(driver.fleetOwnerId, userId, role);

    if (data.vehicleId && fleetOwner) {
      await this.assertVehicleOwnership(data.vehicleId, fleetOwner.id);
    }

    if (data.phone && data.phone !== driver.phone) {
      const existing = await prisma.driver.findUnique({ where: { phone: data.phone } });
      if (existing) {
        throw ApiError.conflict("A driver with this phone number already exists.");
      }
    }

    if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
      const existing = await prisma.driver.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });
      if (existing) {
        throw ApiError.conflict("A driver with this license number already exists.");
      }
    }

    return prisma.driver.update({ where: { id }, data });
  }

  async remove(id: number, userId: number, role: string | undefined) {
    const driver = await this.getById(id);
    await this.assertOwnershipOrAdmin(driver.fleetOwnerId, userId, role);

    await prisma.driver.delete({ where: { id } });
    return { id };
  }

  /** Will return the caller's FleetOwner profile (for later ownership checks), or ADMIN that is not defined. */
  private async assertOwnershipOrAdmin(
    driverFleetOwnerId: number,
    userId: number,
    role: string | undefined
  ) {
    if (role === "ADMIN") return undefined;

    const fleetOwner = await this.requireFleetOwner(userId);

    if (fleetOwner.id !== driverFleetOwnerId) {
      throw ApiError.forbidden("You do not have permission to modify this driver.");
    }

    return fleetOwner;
  }
}

export default new DriverService();
