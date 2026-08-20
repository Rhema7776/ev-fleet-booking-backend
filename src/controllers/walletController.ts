import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import walletService from "../services/walletService";
import type {
  WalletIdParam,
  ListTransactionsQuery,
  ListWalletsQuery,
} from "../validators/walletValidator";

export const getMyWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.getOrCreateForUser(req.user!.id);
  return sendSuccess(res, 200, "Wallet retrieved successfully.", wallet);
});

export const getWallets = asyncHandler(async (req: Request, res: Response) => {
  const result = await walletService.listAll(req.validatedQuery as ListWalletsQuery);
  return sendSuccess(res, 200, "Wallets retrieved successfully.", result);
});

export const getWalletById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as WalletIdParam;
  const wallet = await walletService.getById(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Wallet retrieved successfully.", wallet);
});

export const fundWallet = asyncHandler(async (req: Request, res: Response) => {
  const result = await walletService.fund(req.user!.id, req.body);
  return sendSuccess(res, 201, "Wallet funded successfully.", result);
});

export const debitWallet = asyncHandler(async (req: Request, res: Response) => {
  const result = await walletService.debit(req.user!.id, req.body);
  return sendSuccess(res, 201, "Wallet debited successfully.", result);
});

export const getWalletTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as WalletIdParam;
  const result = await walletService.listTransactions(
    id,
    req.user!.id,
    req.user!.role,
    req.validatedQuery as ListTransactionsQuery
  );
  return sendSuccess(res, 200, "Wallet transactions retrieved successfully.", result);
});
