import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import vehicleService from "../services/vehicleService";
import type { ListVehiclesQuery, VehicleIdParam } from "../validators/vehicleValidator";

export const getVehicles = asyncHandler(async (req: Request, res: Response) => {
  // validateRequest(schema, "query") stores the coerced/validated result on
  // req.validatedQuery, not req.query — see validateRequest.ts for why
  // (Express 5 recomputes req.query fresh on every access, so writes to it
  // don't persist; req.query.page would still be the raw string "1" here).
  const result = await vehicleService.list(req.validatedQuery as ListVehiclesQuery);
  return sendSuccess(res, 200, "Vehicles retrieved successfully.", result);
});

export const getVehicleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as VehicleIdParam;
  const vehicle = await vehicleService.getById(id);
  return sendSuccess(res, 200, "Vehicle retrieved successfully.", vehicle);
});

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.create(req.user!.id, req.body);
  return sendSuccess(res, 201, "Vehicle created successfully.", vehicle);
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as VehicleIdParam;
  const vehicle = await vehicleService.update(
    id,
    req.user!.id,
    req.user!.role,
    req.body
  );
  return sendSuccess(res, 200, "Vehicle updated successfully.", vehicle);
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as VehicleIdParam;
  await vehicleService.remove(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Vehicle deleted successfully.");
});
