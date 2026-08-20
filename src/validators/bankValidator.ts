import { z } from "zod";

export const searchBanksQuerySchema = z.object({
  country: z.string().trim().min(2, "Country code is required."),
  search: z.string().trim().optional().default(""),
  page: z.coerce.number().int().positive().optional().default(1),
});

export const resolveAccountQuerySchema = z.object({
  accountNumber: z.string().trim().min(1, "Account number is required."),
  bankCode: z.string().trim().min(1, "Bank code is required."),
});

export type SearchBanksQuery = z.infer<typeof searchBanksQuerySchema>;
export type ResolveAccountQuery = z.infer<typeof resolveAccountQuerySchema>;
