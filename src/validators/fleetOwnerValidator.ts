import { z } from "zod";

export const createFleetOwnerSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is too short."),
  contactPerson: z.string().trim().min(2, "Contact person is required."),
  email: z.string().trim().toLowerCase().email("Invalid email address."),
  phone: z.string().trim().min(7, "Invalid phone number."),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  rcNumber: z.string().trim().min(2, "RC number is required."),
  // Creation is ADMIN/MASTER_AGENT-only (preserved from the original route's
  // authorize() check) — the creator is provisioning this profile for
  // someone else, so the target user must be specified explicitly.
  userId: z.coerce.number().int().positive("A target userId is required."),
});

// Self-service version — same fields, minus userId (comes from the
// authenticated session, not client input). This is what
// FleetOwnerRegistration -> FleetProfile actually needs: a real fleet
// owner creating their OWN profile during their own signup, matching
// how Enterprise already correctly works. The existing admin-only
// createFleetOwnerSchema above stays as-is for its own real use case
// (an admin following up on an account flagged by automatic vetting).
export const createSelfFleetOwnerSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is too short."),
  contactPerson: z.string().trim().min(2, "Contact person is required."),
  email: z.string().trim().toLowerCase().email("Invalid email address."),
  phone: z.string().trim().min(7, "Invalid phone number."),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  rcNumber: z.string().trim().min(2, "RC number is required."),
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
export type CreateSelfFleetOwnerInput = z.infer<typeof createSelfFleetOwnerSchema>;
export type UpdateFleetOwnerInput = z.infer<typeof updateFleetOwnerSchema>;
export type FleetOwnerIdParam = z.infer<typeof fleetOwnerIdParamSchema>;
export type ListFleetOwnersQuery = z.infer<typeof listFleetOwnersQuerySchema>;