import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import bookingService from "../services/bookingService";
import type {
  ListBookingsQuery,
  BookingIdParam,
} from "../validators/bookingValidator";

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingService.list(
    req.user!.id,
    req.user!.role,
    req.validatedQuery as ListBookingsQuery
  );
  return sendSuccess(res, 200, "Bookings retrieved successfully.", result);
});

export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as BookingIdParam;
  const booking = await bookingService.getById(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Booking retrieved successfully.", booking);
});

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.create(req.user!.id, req.body);
  return sendSuccess(res, 201, "Booking created successfully.", booking);
});

export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as BookingIdParam;
  const booking = await bookingService.update(id, req.user!.id, req.user!.role, req.body);
  return sendSuccess(res, 200, "Booking updated successfully.", booking);
});

export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as BookingIdParam;
  await bookingService.remove(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Booking deleted successfully.");
});
