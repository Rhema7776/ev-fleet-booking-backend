import { z } from "zod";

export const createFleetOwnerSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is too short."),
  contactPerson: z.string().trim().min(2, "Contact person is required."),
  email: z.string().trim().toLowerCase().email("Invalid email address."),
  phone: z.string().trim().min(7, "Invalid phone number."),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  // Creation is ADMIN/MASTER_AGENT-only (preserved from the original route's
  // authorize() check) — the creator is provisioning this profile for
  // someone else, so the target user must be specified explicitly.
  userId: z.coerce.number().int().positive("A target userId is required."),
});

export const updateFleetOwnerSchema = z.object({
  companyName: z.string().trim().min(2).optional(),
  contactPerson: z.string().trim().min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().min(7).optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  // Verification/activation status — admin only, enforced in the service.
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const fleetOwnerIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid fleet owner id."),
});

export const listFleetOwnersQuerySchema = z.object({
  isVerified: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateFleetOwnerInput = z.infer<typeof createFleetOwnerSchema>;
export type UpdateFleetOwnerInput = z.infer<typeof updateFleetOwnerSchema>;
export type FleetOwnerIdParam = z.infer<typeof fleetOwnerIdParamSchema>;
export type ListFleetOwnersQuery = z.infer<typeof listFleetOwnersQuerySchema>;
