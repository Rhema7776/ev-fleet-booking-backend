import { z } from "zod";

export const claimVehicleSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
});

export type ClaimVehicleInput = z.infer<typeof claimVehicleSchema>;