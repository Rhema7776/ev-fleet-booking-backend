import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import vehicleService from "../services/vehicleService";
import { uploadVehicleImage as uploadToStorage } from "../lib/supabaseStorage";
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
  const vehicle = await vehicleService.create(req.user!.id, req.user!.role, req.body);
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

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const uploadVehicleImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as VehicleIdParam;

  if (!req.file) {
    throw ApiError.badRequest("No image file provided.");
  }

  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    throw ApiError.badRequest("Image must be JPEG, PNG, or WebP.");
  }

  const imageUrl = await uploadToStorage(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  const vehicle = await vehicleService.attachImage(
    id,
    req.user!.id,
    req.user!.role,
    imageUrl
  );

  return sendSuccess(res, 200, "Vehicle image uploaded successfully.", vehicle);
});
