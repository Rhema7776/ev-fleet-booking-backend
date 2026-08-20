import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import enterpriseService from "../services/enterpriseService";
import type {
  ListEnterprisesQuery,
  EnterpriseIdParam,
} from "../validators/enterpriseValidator";

export const getEnterprises = asyncHandler(async (req: Request, res: Response) => {
  const result = await enterpriseService.list(req.validatedQuery as ListEnterprisesQuery);
  return sendSuccess(res, 200, "Enterprises retrieved successfully.", result);
});

export const getEnterpriseById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as EnterpriseIdParam;
  const enterprise = await enterpriseService.getById(id);
  return sendSuccess(res, 200, "Enterprise retrieved successfully.", enterprise);
});

export const createEnterprise = asyncHandler(async (req: Request, res: Response) => {
  const enterprise = await enterpriseService.create(req.user!.id, req.body);
  return sendSuccess(res, 201, "Enterprise created successfully.", enterprise);
});

export const updateEnterprise = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as EnterpriseIdParam;
  const enterprise = await enterpriseService.update(
    id,
    req.user!.id,
    req.user!.role,
    req.body
  );
  return sendSuccess(res, 200, "Enterprise updated successfully.", enterprise);
});

export const deleteEnterprise = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as EnterpriseIdParam;
  await enterpriseService.remove(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Enterprise deleted successfully.");
});
