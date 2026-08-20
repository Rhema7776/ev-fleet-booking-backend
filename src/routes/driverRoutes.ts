import express from "express";
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} from "../controllers/driverController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import {
  createDriverSchema,
  updateDriverSchema,
  driverIdParamSchema,
  listDriversQuerySchema,
} from "../validators/driverValidator";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/drivers:
 *   get:
 *     tags:
 *       - Drivers
 *     summary: List drivers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, ON_TRIP, OFFLINE]
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
 *         description: Drivers retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", validateRequest(listDriversQuerySchema, "query"), getDrivers);

/**
 * @swagger
 * /api/v1/drivers/{id}:
 *   get:
 *     tags:
 *       - Drivers
 *     summary: Get a single driver
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
 *         description: Driver retrieved successfully
 *       404:
 *         description: Driver not found
 */
router.get("/:id", validateRequest(driverIdParamSchema, "params"), getDriverById);

/**
 * @swagger
 * /api/v1/drivers:
 *   post:
 *     tags:
 *       - Drivers
 *     summary: Add a driver
 *     description: Fleet owners register a driver to their fleet, optionally assigning a vehicle.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - licenseNumber
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               vehicleId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Driver created successfully
 *       403:
 *         description: Missing fleet owner profile or insufficient role
 *       409:
 *         description: Phone or license number already exists
 */
router.post(
  "/",
  authorize("FLEET_OWNER", "ADMIN"),
  validateRequest(createDriverSchema),
  createDriver
);

/**
 * @swagger
 * /api/v1/drivers/{id}:
 *   put:
 *     tags:
 *       - Drivers
 *     summary: Update a driver
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
 *         description: Driver updated successfully
 *       403:
 *         description: Not the owning fleet owner
 *       404:
 *         description: Driver not found
 */
router.put(
  "/:id",
  authorize("FLEET_OWNER", "ADMIN"),
  validateRequest(driverIdParamSchema, "params"),
  validateRequest(updateDriverSchema),
  updateDriver
);

/**
 * @swagger
 * /api/v1/drivers/{id}:
 *   delete:
 *     tags:
 *       - Drivers
 *     summary: Delete a driver
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
 *         description: Driver deleted successfully
 *       403:
 *         description: Not the owning fleet owner
 *       404:
 *         description: Driver not found
 */
router.delete(
  "/:id",
  authorize("FLEET_OWNER", "ADMIN"),
  validateRequest(driverIdParamSchema, "params"),
  deleteDriver
);

export default router;
