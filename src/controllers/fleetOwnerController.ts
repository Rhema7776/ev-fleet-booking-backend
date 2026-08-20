import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import fleetOwnerService from "../services/fleetOwnerService";
import type {
  ListFleetOwnersQuery,
  FleetOwnerIdParam,
} from "../validators/fleetOwnerValidator";

export const getFleetOwners = asyncHandler(async (req: Request, res: Response) => {
  const result = await fleetOwnerService.list(req.validatedQuery as ListFleetOwnersQuery);
  return sendSuccess(res, 200, "Fleet owners retrieved successfully.", result);
});

export const getFleetOwnerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as FleetOwnerIdParam;
  const fleetOwner = await fleetOwnerService.getById(id);
  return sendSuccess(res, 200, "Fleet owner retrieved successfully.", fleetOwner);
});

export const createFleetOwner = asyncHandler(async (req: Request, res: Response) => {
  const fleetOwner = await fleetOwnerService.create(req.body);
  return sendSuccess(res, 201, "Fleet owner created successfully.", fleetOwner);
});

export const updateFleetOwner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as FleetOwnerIdParam;
  const fleetOwner = await fleetOwnerService.update(
    id,
    req.user!.id,
    req.user!.role,
    req.body
  );
  return sendSuccess(res, 200, "Fleet owner updated successfully.", fleetOwner);
});

export const deleteFleetOwner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as FleetOwnerIdParam;
  await fleetOwnerService.remove(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Fleet owner deleted successfully.");
});
