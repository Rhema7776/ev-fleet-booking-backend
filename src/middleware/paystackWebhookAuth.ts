import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import paymentService from "../services/paymentService";

export function paystackWebhookAuth(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers["x-paystack-signature"] as string | undefined;

  if (!req.rawBody || !paymentService.verifyWebhookSignature(req.rawBody, signature)) {
    throw ApiError.unauthorized("Invalid webhook signature.");
  }

  next();
}