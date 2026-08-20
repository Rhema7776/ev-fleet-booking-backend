import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import notificationService from "../services/notificationService";
import type {
  ListNotificationsQuery,
  NotificationIdParam,
} from "../validators/notificationValidator";

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.list(
    req.user!.id,
    req.user!.role,
    req.validatedQuery as ListNotificationsQuery
  );
  return sendSuccess(res, 200, "Notifications retrieved successfully.", result);
});

export const getNotificationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as NotificationIdParam;
  const notification = await notificationService.getById(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Notification retrieved successfully.", notification);
});

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.create(req.body);
  return sendSuccess(res, 201, "Notification created successfully.", notification);
});

export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as NotificationIdParam;
  const notification = await notificationService.markAsRead(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Notification marked as read.", notification);
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as NotificationIdParam;
  await notificationService.remove(id, req.user!.id, req.user!.role);
  return sendSuccess(res, 200, "Notification deleted successfully.");
});
