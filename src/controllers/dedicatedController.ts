import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import dedicatedService from "../services/dedicatedService";
import type { ClaimVehicleInput } from "../validators/dedicatedValidator";

export const claimVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId } = req.body as ClaimVehicleInput;

  const result = await dedicatedService.claimVehicle(req.user!.id, vehicleId);

  return sendSuccess(res, 201, "Redirect the user to authorizationUrl to complete payment.", result);
});

export const getMySubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const subscriptions = await dedicatedService.getUserActiveSubscriptions(req.user!.id);

  return sendSuccess(res, 200, "Active subscriptions retrieved successfully.", subscriptions);
});

export const paystackWebhook = asyncHandler(async (req: Request, res: Response) => {
  const event = req.body;

  if (event?.event === "charge.success" && event?.data?.reference) {
    await dedicatedService.handleSuccessfulPayment(event.data.reference);
  }

  res.sendStatus(200);
});