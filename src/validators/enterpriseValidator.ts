import { z } from "zod";

const STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"] as const;

export const createEnterpriseSchema = z.object({
  name: z.string().trim().min(2, "Enterprise name is too short."),
  contactEmail: z.string().trim().toLowerCase().email("Invalid email address."),
  contactPhone: z.string().trim().min(7).optional(),
});

export const updateEnterpriseSchema = z.object({
  name: z.string().trim().min(2).optional(),
  contactEmail: z.string().trim().toLowerCase().email().optional(),
  contactPhone: z.string().trim().min(7).optional(),
  // Status transitions are ADMIN-only — enforced in the controller/route,
  // not here (the schema alone can't know who's calling).
  status: z.enum(STATUSES).optional(),
});

export const enterpriseIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid enterprise id."),
});

export const listEnterprisesQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateEnterpriseInput = z.infer<typeof createEnterpriseSchema>;
export type UpdateEnterpriseInput = z.infer<typeof updateEnterpriseSchema>;
export type EnterpriseIdParam = z.infer<typeof enterpriseIdParamSchema>;
export type ListEnterprisesQuery = z.infer<typeof listEnterprisesQuerySchema>;
