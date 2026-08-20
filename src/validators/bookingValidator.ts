import { z } from "zod";

const MODES = ["STRAIGHT", "RESERVE", "DEDICATED"] as const;
const CATEGORIES = ["ECONOMY", "EXECUTIVE", "VIP"] as const;
const STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

// Matches the "Enter booking details" / "Enter booking details 2" screens
// from both the Straight/Regular and Reserve economy flows.
export const createBookingSchema = z
  .object({
    bookingMode: z.enum(MODES).optional().default("STRAIGHT"),
    vehicleCategory: z.enum(CATEGORIES),
    vehicleCount: z.coerce.number().int().positive().optional().default(1),
    customerName: z.string().trim().min(2, "Client's full name is required."),
    customerPhone: z.string().trim().min(7, "Client's phone number is required."),
    pickupLocation: z.string().trim().min(2, "Pickup location is required."),
    dropoffLocation: z.string().trim().min(2, "Drop-off location is required."),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    // Trip-leg timestamps shown in the booking-details timeline, distinct
    // from the overall startTime/endTime rental window — see the note in
    // schema.prisma. Optional since they weren't present on every screen.
    pickupTime: z.coerce.date().optional(),
    dropoffTime: z.coerce.date().optional(),
    priority: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.endTime <= data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endTime must be after startTime.",
        path: ["endTime"],
      });
    }

    // "Reservations require a future date and time" — shown directly on
    // the Reserve booking-details screen. Straight mode has no such rule
    // (it's an immediate, subject-to-availability booking).
    if (data.bookingMode === "RESERVE" && data.startTime <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reservations require a future date and time.",
        path: ["startTime"],
      });
    }
  });

export const updateBookingSchema = z.object({
  status: z.enum(STATUSES).optional(),
  driverId: z.coerce.number().int().positive().nullable().optional(),
  priority: z.boolean().optional(),
});

export const bookingIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid booking id."),
});

export const listBookingsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  bookingMode: z.enum(MODES).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type BookingIdParam = z.infer<typeof bookingIdParamSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
