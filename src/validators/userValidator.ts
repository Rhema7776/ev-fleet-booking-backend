import { z } from "zod";

const ROLES = [
  "ADMIN",
  "FLEET_OWNER",
  "MASTER_AGENT",
  "SUB_AGENT",
  "INDIVIDUAL_PARTNER",
  "ENTERPRISE_PARTNER",
] as const;

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(7).optional(),
  // Role/active-status changes are ADMIN-only — enforced in the service,
  // not here (the schema alone can't know who's calling).
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
});

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid user id."),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(ROLES).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
