import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import bankService from "../services/bankService";
import type { SearchBanksQuery, ResolveAccountQuery } from "../validators/bankValidator";

export const searchBanks = asyncHandler(async (req: Request, res: Response) => {
  const { country, search, page } = req.validatedQuery as SearchBanksQuery;

  const { data: banks } = await bankService.searchBanks({
    countryCode: country,
    searchTerm: search,
    page,
    perPage: 20,
  });

  const normalizedBanks = banks.map((bank) => ({ value: bank.code, label: bank.name }));
  return sendSuccess(res, 200, "Banks retrieved successfully.", { banks: normalizedBanks });
});

export const resolveAccount = asyncHandler(async (req: Request, res: Response) => {
  const { accountNumber, bankCode } = req.validatedQuery as ResolveAccountQuery;
  const result = await bankService.resolveAccountNumber({ accountNumber, bankCode });
  return sendSuccess(res, 200, "Account resolved successfully.", result);
});
