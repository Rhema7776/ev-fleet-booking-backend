import { z } from "zod";

const STATUSES = ["AVAILABLE", "ON_TRIP", "OFFLINE"] as const;

export const createDriverSchema = z.object({
  name: z.string().trim().min(2, "Driver name is too short."),
  phone: z.string().trim().min(7, "Invalid phone number."),
  licenseNumber: z.string().trim().min(2, "License number is required."),
  vehicleId: z.coerce.number().int().positive().optional(),
});

export const updateDriverSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(7).optional(),
  licenseNumber: z.string().trim().min(2).optional(),
  status: z.enum(STATUSES).optional(),
  vehicleId: z.coerce.number().int().positive().nullable().optional(),
});

export const driverIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid driver id."),
});

export const listDriversQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type DriverIdParam = z.infer<typeof driverIdParamSchema>;
export type ListDriversQuery = z.infer<typeof listDriversQuerySchema>;
