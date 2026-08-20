import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../controllers/bookingController";
import { authenticate } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import {
  createBookingSchema,
  updateBookingSchema,
  bookingIdParamSchema,
  listBookingsQuerySchema,
} from "../validators/bookingValidator";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: List bookings
 *     description: Regular agents see their own bookings; ADMIN/MASTER_AGENT see all.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: bookingMode
 *         schema:
 *           type: string
 *           enum: [STRAIGHT, RESERVE, DEDICATED]
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
 *         description: Bookings retrieved successfully
 */
router.get("/", validateRequest(listBookingsQuerySchema, "query"), getBookings);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: Get a single booking
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
 *         description: Booking retrieved successfully
 *       403:
 *         description: Not the owning agent
 *       404:
 *         description: Booking not found
 */
router.get("/:id", validateRequest(bookingIdParamSchema, "params"), getBookingById);

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Create a booking (STRAIGHT and RESERVE modes)
 *     description: >
 *       STRAIGHT books against current live vehicle availability, rate
 *       from the cheapest currently-available vehicle in the category.
 *       RESERVE requires a future startTime, a minimum wallet balance of
 *       NGN50,000, checks fleet availability against overlapping
 *       reservations (not just live status), and prices at a 1.5x
 *       multiplier over the base rate. DEDICATED is recognized but
 *       returns 501 — not yet implemented.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleCategory
 *               - customerName
 *               - customerPhone
 *               - pickupLocation
 *               - dropoffLocation
 *               - startTime
 *               - endTime
 *             properties:
 *               bookingMode:
 *                 type: string
 *                 enum: [STRAIGHT, RESERVE, DEDICATED]
 *                 default: STRAIGHT
 *               vehicleCategory:
 *                 type: string
 *                 enum: [ECONOMY, EXECUTIVE, VIP]
 *               vehicleCount:
 *                 type: integer
 *                 default: 1
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               pickupLocation:
 *                 type: string
 *               dropoffLocation:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               pickupTime:
 *                 type: string
 *                 format: date-time
 *               dropoffTime:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Insufficient available vehicles for the requested category/slot, or (RESERVE) insufficient wallet balance or a non-future startTime
 *       501:
 *         description: Booking mode not yet implemented (DEDICATED)
 */
router.post("/", validateRequest(createBookingSchema), createBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   put:
 *     tags:
 *       - Bookings
 *     summary: Update a booking
 *     description: The owning agent can update priority. Status changes and driver assignment require ADMIN/MASTER_AGENT.
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
 *         description: Booking updated successfully
 *       403:
 *         description: Not the owning agent, or attempted a privileged change without admin/master-agent rights
 *       404:
 *         description: Booking not found
 */
router.put(
  "/:id",
  validateRequest(bookingIdParamSchema, "params"),
  validateRequest(updateBookingSchema),
  updateBooking
);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   delete:
 *     tags:
 *       - Bookings
 *     summary: Delete a booking
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
 *         description: Booking deleted successfully
 *       403:
 *         description: Not the owning agent
 *       404:
 *         description: Booking not found
 */
router.delete("/:id", validateRequest(bookingIdParamSchema, "params"), deleteBooking);

export default router;
