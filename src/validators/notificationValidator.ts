import { z } from "zod";

const TYPES = ["BOOKING", "PAYMENT", "SYSTEM"] as const;

// Creating notifications for other users is an internal/admin operation
// (e.g. the system notifying a user about their booking) — not something
// a regular user calls for themselves, hence `userId` is required here
// rather than inferred from the caller.
export const createNotificationSchema = z.object({
  title: z.string().trim().min(2, "Title is too short."),
  message: z.string().trim().min(2, "Message is too short."),
  type: z.enum(TYPES).optional().default("SYSTEM"),
  userId: z.coerce.number().int().positive("A recipient userId is required."),
});

export const notificationIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid notification id."),
});

export const listNotificationsQuerySchema = z.object({
  isRead: z.coerce.boolean().optional(),
  type: z.enum(TYPES).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
