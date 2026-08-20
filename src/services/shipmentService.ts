import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { encodeShipmentId } from "../utils/generateTrackingCode";
import type {
  CreateShipmentInput,
  UpdateShipmentInput,
  ListShipmentsQuery,
  
} from "../validators/shipmentValidator";

type TxClient = Prisma.TransactionClient;

const PUBLIC_TRACK_SELECT = {
  trackingCode: true,
  status: true,
  pickupLocation: true,
  destination: true,
  createdAt: true,
  updatedAt: true,
  driver: { select: { name: true, status: true } },
} satisfies Prisma.ShipmentSelect;

class ShipmentService {
  private async assertDriverExists(driverId: number) {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw ApiError.badRequest("Driver not found.");
    }
  }

  private isPrivileged(role: string | undefined) {
    return role === "ADMIN" || role === "MASTER_AGENT";
  }

  /** Regular agents see their own shipments; ADMIN/MASTER_AGENT see all. */
  async list(userId: number, role: string | undefined, query: ListShipmentsQuery) {
    const { status, page, limit } = query;

    const where: Prisma.ShipmentWhereInput = {
      ...(this.isPrivileged(role) ? {} : { agentId: userId }),
      ...(status ? { status } : {}),
    };

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { driver: true },
      }),
      prisma.shipment.count({ where }),
    ]);

    return {
      shipments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: number, userId: number, role: string | undefined) {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: { driver: true },
    });

    if (!shipment) {
      throw ApiError.notFound("Shipment not found.");
    }

    this.assertOwnershipOrPrivileged(shipment.agentId, userId, role);

    return shipment;
  }

  async trackByCode(trackingCode: string, phone: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingCode },
      select: { ...PUBLIC_TRACK_SELECT, customerPhone: true },
    });

    if (!shipment || !shipment.customerPhone) {
      // Same message whether the code doesn't exist or has no phone on
      // file — don't reveal which, that itself is information leakage.
      throw ApiError.notFound("No shipment found for that tracking code and phone number.");
    }

    if (shipment.customerPhone !== phone) {
      throw ApiError.notFound("No shipment found for that tracking code and phone number.");
    }

    const { customerPhone, ...publicFields } = shipment;
    return publicFields;
  }

  async create(agentId: number, data: CreateShipmentInput) {
    if (data.driverId) {
      await this.assertDriverExists(data.driverId);
    }

    return prisma.$transaction(async (tx: TxClient) => {
     
      const [{ nextval }] = await tx.$queryRaw<{ nextval: bigint }[]>`
        SELECT nextval(pg_get_serial_sequence('"Shipment"', 'id')) AS nextval
      `;
      const id = Number(nextval);
      const trackingCode = encodeShipmentId(id);

      return tx.shipment.create({
        data: {
          id,
          trackingCode,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          pickupLocation: data.pickupLocation,
          destination: data.destination,
          driverId: data.driverId,
          agentId,
        },
      });
    });
  }

  async update(id: number, userId: number, role: string | undefined, data: UpdateShipmentInput) {
    const shipment = await this.getById(id, userId, role);

    if (data.driverId) {
      await this.assertDriverExists(data.driverId);
    }

    return prisma.shipment.update({ where: { id: shipment.id }, data });
  }

  async remove(id: number, userId: number, role: string | undefined) {
    const shipment = await this.getById(id, userId, role);

    await prisma.shipment.delete({ where: { id: shipment.id } });
    return { id: shipment.id };
  }

  private assertOwnershipOrPrivileged(
    shipmentAgentId: number,
    userId: number,
    role: string | undefined
  ) {
    if (this.isPrivileged(role)) return;

    if (shipmentAgentId !== userId) {
      throw ApiError.forbidden("You do not have permission to access this shipment.");
    }
  }
}

export default new ShipmentService();
