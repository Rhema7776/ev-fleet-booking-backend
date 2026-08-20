import { Prisma, VehicleCategory, BookingMode } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import type {
  CreateBookingInput,
  UpdateBookingInput,
  ListBookingsQuery,
} from "../validators/bookingValidator";

const MS_PER_HOUR = 1000 * 60 * 60;

// Minimum wallet balance required to make a Reserve-mode booking. Read
// directly off the "Insufficient wallet balance" screen ("You need a
// minimum of NGN50,000 in your wallet to reserve a car."). Not currently
// sourced from anywhere configurable — hardcoded until/unless product
// wants this tunable without a code change.
const RESERVE_MIN_WALLET_BALANCE = 50_000;

// INFERRED, not confirmed by an explicit spec: the mode-selection screen
// showed "From N10,000/hr" (Straight), "From N15,000/hr" (Reserve),
// "From N20,000/hr" (Dedicated) for the same economy tier — exactly a
// 1x / 1.5x / 2x ratio over the base per-vehicle rate. Modeled as a
// multiplier over Vehicle.pricePerHour rather than a separate rate table,
// since no independent Reserve/Dedicated pricing source was shown
// anywhere. Flag this assumption if it turns out rates are actually set
// independently per mode rather than derived this way.
const MODE_RATE_MULTIPLIER: Record<BookingMode, number> = {
  STRAIGHT: 1,
  RESERVE: 1.5,
  DEDICATED: 2,
};

class BookingService {
  private isPrivileged(role: string | undefined) {
    return role === "ADMIN" || role === "MASTER_AGENT";
  }

  /**
   * Straight/Regular mode: books against CURRENT live availability. Rate
   * is the cheapest currently-AVAILABLE vehicle's own pricePerHour
   * (multiplier is 1x for STRAIGHT, so this is unchanged from before).
   */
  private async resolveStraightRate(category: VehicleCategory, vehicleCount: number) {
    const availableCount = await prisma.vehicle.count({
      where: { category, status: "AVAILABLE" },
    });

    if (availableCount < vehicleCount) {
      throw ApiError.badRequest(
        `Only ${availableCount} ${category.toLowerCase()} vehicle(s) available, but ${vehicleCount} were requested.`
      );
    }

    const cheapest = await prisma.vehicle.findFirst({
      where: { category, status: "AVAILABLE" },
      orderBy: { pricePerHour: "asc" },
    });

    if (!cheapest) {
      throw ApiError.badRequest(`No available vehicles in category ${category}.`);
    }

    return Number(cheapest.pricePerHour);
  }

  /**
   * Reserve mode: "No availability check needed on the day" (shown on the
   * pending-reservation confirmation screen) — the guarantee is made NOW,
   * at booking time, not re-checked at pickup. So this checks against
   * total fleet inventory in the category, minus vehicles already
   * committed to any OTHER non-cancelled booking whose time window
   * overlaps the requested startTime/endTime — not just live `status`,
   * since a vehicle might show AVAILABLE today but already be reserved
   * for the requested future slot.
   *
   * Rate uses the category's base pricing (cheapest vehicle in the fleet,
   * regardless of current live status — a reservation is about the fleet
   * that will exist on that date, not today's live status) times the
   * RESERVE multiplier.
   */
  private async resolveReserveRateAndSlot(
    category: VehicleCategory,
    vehicleCount: number,
    startTime: Date,
    endTime: Date
  ) {
    const totalInCategory = await prisma.vehicle.count({ where: { category } });

    const overlapping = await prisma.booking.aggregate({
      _sum: { vehicleCount: true },
      where: {
        vehicleCategory: category,
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
        // Half-open interval overlap: two ranges overlap iff
        // startA < endB AND endA > startB.
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    const alreadyCommitted = overlapping._sum.vehicleCount ?? 0;
    const availableForSlot = totalInCategory - alreadyCommitted;

    if (availableForSlot < vehicleCount) {
      throw ApiError.badRequest(
        `Only ${Math.max(availableForSlot, 0)} ${category.toLowerCase()} vehicle(s) available for that time slot, but ${vehicleCount} were requested.`
      );
    }

    const cheapest = await prisma.vehicle.findFirst({
      where: { category },
      orderBy: { pricePerHour: "asc" },
    });

    if (!cheapest) {
      throw ApiError.badRequest(`No vehicles exist in category ${category}.`);
    }

    return Number(cheapest.pricePerHour) * MODE_RATE_MULTIPLIER.RESERVE;
  }

  /**
   * "Insufficient wallet balance" screen: Reserve mode requires the
   * booking agent's own wallet to hold a minimum balance before a
   * reservation can be made — auto-provisions a wallet (balance 0) if the
   * agent has never funded one, same as walletService.getOrCreateForUser.
   */
  private async assertReserveWalletBalance(userId: number) {
    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    if (Number(wallet.balance) < RESERVE_MIN_WALLET_BALANCE) {
      throw ApiError.badRequest(
        `Insufficient wallet balance. You need a minimum of NGN${RESERVE_MIN_WALLET_BALANCE.toLocaleString()} in your wallet to reserve a car. Current balance: NGN${Number(wallet.balance).toLocaleString()}.`
      );
    }
  }

  async create(agentId: number, data: CreateBookingInput) {
    if (data.bookingMode === "DEDICATED") {
      // Recognized as a valid mode (so it validates and the field exists),
      // but no business logic has been built for it yet — see
      // BOOKING_STATUS.md. Honest failure rather than silently accepting
      // a booking type nobody has scoped.
      throw new ApiError(
        501,
        "Booking mode DEDICATED is not yet implemented. STRAIGHT and RESERVE bookings are currently supported."
      );
    }

    let ratePerHour: number;

    if (data.bookingMode === "RESERVE") {
      await this.assertReserveWalletBalance(agentId);
      ratePerHour = await this.resolveReserveRateAndSlot(
        data.vehicleCategory,
        data.vehicleCount,
        data.startTime,
        data.endTime
      );
    } else {
      ratePerHour = await this.resolveStraightRate(data.vehicleCategory, data.vehicleCount);
    }

    const hoursBooked = (data.endTime.getTime() - data.startTime.getTime()) / MS_PER_HOUR;
    const totalAmount = ratePerHour * hoursBooked * data.vehicleCount;

    return prisma.booking.create({
      data: {
        bookingMode: data.bookingMode,
        vehicleCategory: data.vehicleCategory,
        vehicleCount: data.vehicleCount,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        startTime: data.startTime,
        endTime: data.endTime,
        pickupTime: data.pickupTime,
        dropoffTime: data.dropoffTime,
        hoursBooked,
        ratePerHour,
        totalAmount,
        priority: data.priority,
        agentId,
      },
    });
  }

  async list(userId: number, role: string | undefined, query: ListBookingsQuery) {
    const { status, bookingMode, page, limit } = query;

    const where: Prisma.BookingWhereInput = {
      ...(this.isPrivileged(role) ? {} : { agentId: userId }),
      ...(status ? { status } : {}),
      ...(bookingMode ? { bookingMode } : {}),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { driver: true },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: number, userId: number, role: string | undefined) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { driver: true },
    });

    if (!booking) {
      throw ApiError.notFound("Booking not found.");
    }

    if (!this.isPrivileged(role) && booking.agentId !== userId) {
      throw ApiError.forbidden("You do not have permission to access this booking.");
    }

    return booking;
  }

  /**
   * Status and driver assignment are ops decisions — ADMIN/MASTER_AGENT
   * only. The owning agent can still adjust `priority`.
   */
  async update(id: number, userId: number, role: string | undefined, data: UpdateBookingInput) {
    const booking = await this.getById(id, userId, role);

    if (!this.isPrivileged(role)) {
      if (data.status !== undefined || data.driverId !== undefined) {
        throw ApiError.forbidden(
          "Only an admin or master agent can change booking status or assign a driver."
        );
      }
    }

    if (data.driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
      if (!driver) {
        throw ApiError.badRequest("Driver not found.");
      }
    }

    return prisma.booking.update({ where: { id: booking.id }, data });
  }

  async remove(id: number, userId: number, role: string | undefined) {
    const booking = await this.getById(id, userId, role);
    await prisma.booking.delete({ where: { id: booking.id } });
    return { id: booking.id };
  }
}

export default new BookingService();
