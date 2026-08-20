import { z } from "zod";

const STATUSES = ["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED"] as const;

export const createShipmentSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name is too short."),
  customerPhone: z.string().trim().min(7).optional(),
  pickupLocation: z.string().trim().min(2, "Pickup location is required."),
  destination: z.string().trim().min(2, "Destination is required."),
  driverId: z.coerce.number().int().positive().optional(),
});

export const updateShipmentSchema = z.object({
  customerName: z.string().trim().min(2).optional(),
  customerPhone: z.string().trim().min(7).optional(),
  pickupLocation: z.string().trim().min(2).optional(),
  destination: z.string().trim().min(2).optional(),
  status: z.enum(STATUSES).optional(),
  driverId: z.coerce.number().int().positive().nullable().optional(),
});

export const shipmentIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid shipment id."),
});

export const listShipmentsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const trackShipmentParamSchema = z.object({
  trackingCode: z.string().trim().min(1, "Tracking code is required."),
});

export const trackShipmentQuerySchema = z.object({
  phone: z.string().trim().min(7, "Phone number is required to verify identity."),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type ShipmentIdParam = z.infer<typeof shipmentIdParamSchema>;
export type ListShipmentsQuery = z.infer<typeof listShipmentsQuerySchema>;
export type TrackShipmentParam = z.infer<typeof trackShipmentParamSchema>;
export type TrackShipmentQuery = z.infer<typeof trackShipmentQuerySchema>;
