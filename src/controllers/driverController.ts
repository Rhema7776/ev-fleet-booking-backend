import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import driverService from "../services/driverService";
import type { ListDriversQuery, DriverIdParam } from "../validators/driverValidator";

export const getDrivers = asyncHandler(async (req: Request, res: Response) => {
  const result = await driverService.list(req.validatedQuery as ListDriversQuery);
  return sendSuccess(res, 200, "Drivers retrieved successfully.", result);
});

export const getDriverById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as DriverIdParam;
  const driver = await driverService.getById(id);
  return sendSuccess(res, 200, "Driver retrieved successfully.", driver);
});

export const createDriver = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driverService.create(req.user!.id, req.body);
  return sendSuccess(res, 201, "Driver created successfully.", driver);
});

export const updateDriver = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as DriverIdParam;
  const driver = await driverService.update(id, req.user!.id, req.user!.role, req.body);
  return sendSuccess(res, 200, "Driver updated successfully.", driver);
});

export const deleteDriver = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as DriverIdParam;
  await driverService.remove(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Driver deleted successfully.");
});
