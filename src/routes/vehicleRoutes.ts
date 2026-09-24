import express from "express";
import multer from "multer";
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleImage,
} from "../controllers/vehicleController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  listVehiclesQuerySchema,
} from "../validators/vehicleValidator";

const router = express.Router();

// Memory storage, not disk — Render's free-tier filesystem is ephemeral
// (wiped on every redeploy/spin-down), so anything written to local disk
// would be lost. The buffer goes straight to Supabase Storage instead
// (see uploadVehicleImage in the controller); nothing is ever persisted
// to this server's own disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matching the frontend's own limit
});

router.use(authenticate);

/**
 * @swagger
 * /api/v1/vehicles:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: List vehicles
 *     description: Returns a paginated list of vehicles, optionally filtered by status or category.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, ACTIVE, RESERVED, BOOKED, UNAVAILABLE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [ECONOMY, EXECUTIVE, VIP]
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
 *         description: Vehicles retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", validateRequest(listVehiclesQuerySchema, "query"), getVehicles);

/**
 * @swagger
 * /api/v1/vehicles/{id}:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Get a single vehicle
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
 *         description: Vehicle retrieved successfully
 *       404:
 *         description: Vehicle not found
 */
router.get("/:id", validateRequest(vehicleIdParamSchema, "params"), getVehicleById);

/**
 * @swagger
 * /api/v1/vehicles:
 *   post:
 *     tags:
 *       - Vehicles
 *     summary: Create a vehicle
 *     description: Fleet owners add a vehicle to their fleet.
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
 *               - plate
 *               - category
 *               - pricePerHour
 *             properties:
 *               name:
 *                 type: string
 *               plate:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [ECONOMY, EXECUTIVE, VIP]
 *               pricePerHour:
 *                 type: number
 *               isElectric:
 *                 type: boolean
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       403:
 *         description: Missing fleet owner profile or insufficient role
 *       409:
 *         description: Plate number already exists
 */
router.post(
  "/",
  authorize("FLEET_OWNER", "ADMIN"),
  validateRequest(createVehicleSchema),
  createVehicle
);

/**
 * @swagger
 * /api/v1/vehicles/{id}:
 *   put:
 *     tags:
 *       - Vehicles
 *     summary: Update a vehicle
 *     description: Only the owning fleet owner (or an admin) can update a vehicle.
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
 *         description: Vehicle updated successfully
 *       403:
 *         description: Not the owning fleet owner
 *       404:
 *         description: Vehicle not found
 */
router.put(
  "/:id",
  authorize("FLEET_OWNER", "ADMIN"),
  validateRequest(vehicleIdParamSchema, "params"),
  validateRequest(updateVehicleSchema),
  updateVehicle
);

/**
 * @swagger
 * /api/v1/vehicles/{id}:
 *   delete:
 *     tags:
 *       - Vehicles
 *     summary: Delete a vehicle
 *     description: Fails with 409 if the vehicle has existing bookings.
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
 *         description: Vehicle deleted successfully
 *       403:
 *         description: Not the owning fleet owner
 *       404:
 *         description: Vehicle not found
 *       409:
 *         description: Vehicle has existing bookings
 */
router.delete(
  "/:id",
  authorize("FLEET_OWNER", "ADMIN"),
  validateRequest(vehicleIdParamSchema, "params"),
  deleteVehicle
);

/**
 * @swagger
 * /api/v1/vehicles/{id}/image:
 *   post:
 *     tags:
 *       - Vehicles
 *     summary: Upload a vehicle photo
 *     description: Attaches a real photo to an already-created vehicle. Only the owning fleet owner (or an admin) can do this.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Vehicle image uploaded successfully
 *       400:
 *         description: Missing or invalid image file
 *       403:
 *         description: Not the owning fleet owner
 *       404:
 *         description: Vehicle not found
 */
router.post(
  "/:id/image",
  authorize("FLEET_OWNER", "ADMIN"),
  validateRequest(vehicleIdParamSchema, "params"),
  upload.single("image"),
  uploadVehicleImage
);

export default router;
