import express from "express";
import {
  getNotifications,
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notificationController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import {
  createNotificationSchema,
  notificationIdParamSchema,
  listNotificationsQuerySchema,
} from "../validators/notificationValidator";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: List your notifications
 *     description: Returns the caller's own notifications. Admins see every notification.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BOOKING, PAYMENT, SYSTEM]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get("/", validateRequest(listNotificationsQuerySchema, "query"), getNotifications);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get a single notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
 *       403:
 *         description: Not your notification
 *       404:
 *         description: Notification not found
 */
router.get(
  "/:id",
  validateRequest(notificationIdParamSchema, "params"),
  getNotificationById
);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Send a notification to a user
 *     description: Admin-only — a notification is sent to a user by the system/an admin, not created by users for themselves.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - userId
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [BOOKING, PAYMENT, SYSTEM]
 *               userId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Recipient user not found
 */
router.post(
  "/",
  authorize("ADMIN"),
  validateRequest(createNotificationSchema),
  createNotification
);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark a notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       403:
 *         description: Not your notification
 *       404:
 *         description: Notification not found
 */
router.patch(
  "/:id/read",
  validateRequest(notificationIdParamSchema, "params"),
  markNotificationAsRead
);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete a notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       403:
 *         description: Not your notification
 *       404:
 *         description: Notification not found
 */
router.delete(
  "/:id",
  validateRequest(notificationIdParamSchema, "params"),
  deleteNotification
);

export default router;
