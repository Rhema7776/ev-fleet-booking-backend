import { z } from "zod";

export const fundWalletSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive."),
  reference: z.string().trim().min(1, "A unique reference is required."),
  description: z.string().trim().optional(),
});

export const debitWalletSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive."),
  reference: z.string().trim().min(1, "A unique reference is required."),
  description: z.string().trim().optional(),
});

export const walletIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid wallet id."),
});

export const listTransactionsQuerySchema = z.object({
  type: z.enum(["CREDIT", "DEBIT"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const listWalletsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type FundWalletInput = z.infer<typeof fundWalletSchema>;
export type DebitWalletInput = z.infer<typeof debitWalletSchema>;
export type WalletIdParam = z.infer<typeof walletIdParamSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type ListWalletsQuery = z.infer<typeof listWalletsQuerySchema>;
