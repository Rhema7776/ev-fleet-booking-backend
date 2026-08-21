import { z } from "zod";

const CATEGORIES = ["ECONOMY", "EXECUTIVE", "VIP"] as const;
const STATUSES = ["AVAILABLE", "ACTIVE", "RESERVED", "BOOKED", "UNAVAILABLE"] as const;

export const createVehicleSchema = z.object({
  name: z.string().trim().min(2, "Vehicle name is too short."),
  plate: z.string().trim().min(2, "Plate number is required."),
  category: z.enum(CATEGORIES),
  pricePerHour: z.coerce.number().positive("Price per hour must be positive."),
  isElectric: z.boolean().optional().default(true),
  imageUrl: z.string().url("Invalid image URL.").optional(),
  fleetOwnerId: z.coerce.number().int().positive().optional(),
});

export const updateVehicleSchema = z.object({
  name: z.string().trim().min(2).optional(),
  plate: z.string().trim().min(2).optional(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  pricePerHour: z.coerce.number().positive().optional(),
  isElectric: z.boolean().optional(),
  imageUrl: z.string().url("Invalid image URL.").optional(),
});

export const vehicleIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid vehicle id."),
});

export const listVehiclesQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleIdParam = z.infer<typeof vehicleIdParamSchema>;
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;
