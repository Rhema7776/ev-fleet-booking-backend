import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import shipmentService from "../services/shipmentService";
import type {
  ListShipmentsQuery,
  ShipmentIdParam,
  TrackShipmentParam,
  TrackShipmentQuery,
} from "../validators/shipmentValidator";

export const getShipments = asyncHandler(async (req: Request, res: Response) => {
  const result = await shipmentService.list(
    req.user!.id,
    req.user!.role,
    req.validatedQuery as ListShipmentsQuery
  );
  return sendSuccess(res, 200, "Shipments retrieved successfully.", result);
});

export const getShipmentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ShipmentIdParam;
  const shipment = await shipmentService.getById(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Shipment retrieved successfully.", shipment);
});

// Public — no auth. Mounted before the router's authenticate middleware.
export const trackShipment = asyncHandler(async (req: Request, res: Response) => {
  const { trackingCode } = req.params as unknown as TrackShipmentParam;
  const { phone } = req.validatedQuery as TrackShipmentQuery;
  const shipment = await shipmentService.trackByCode(trackingCode, phone);
  return sendSuccess(res, 200, "Shipment status retrieved successfully.", shipment);
});

export const createShipment = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await shipmentService.create(req.user!.id, req.body);
  return sendSuccess(res, 201, "Shipment created successfully.", shipment);
});

export const updateShipment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ShipmentIdParam;
  const shipment = await shipmentService.update(id, req.user!.id, req.user!.role, req.body);
  return sendSuccess(res, 200, "Shipment updated successfully.", shipment);
});

export const deleteShipment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ShipmentIdParam;
  await shipmentService.remove(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Shipment deleted successfully.");
});
