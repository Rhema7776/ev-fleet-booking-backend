import express from "express";
import {
  getShipments,
  getShipmentById,
  trackShipment,
  createShipment,
  updateShipment,
  deleteShipment,
} from "../controllers/shipmentController";
import { authenticate } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import {
  createShipmentSchema,
  updateShipmentSchema,
  shipmentIdParamSchema,
  listShipmentsQuerySchema,
  trackShipmentParamSchema,
  trackShipmentQuerySchema,
} from "../validators/shipmentValidator";

const router = express.Router();

/**
 * @swagger
 * /api/v1/shipments/track/{trackingCode}:
 *   get:
 *     tags:
 *       - Shipments
 *     summary: Public shipment tracking
 *     description: No authentication required. Requires the customer's phone number as a lightweight identity check — a bare tracking code isn't enough on its own.
 *     parameters:
 *       - in: path
 *         name: trackingCode
 *         required: true
 *         schema:
 *           type: string
 *         example: SHP-7K9QXR
 *       - in: query
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipment status retrieved successfully
 *       404:
 *         description: No shipment found for that tracking code and phone number
 */
// Registered BEFORE router.use(authenticate) below — Express only applies
// middleware to routes registered after it, so this genuinely bypasses auth.
router.get(
  "/track/:trackingCode",
  validateRequest(trackShipmentParamSchema, "params"),
  validateRequest(trackShipmentQuerySchema, "query"),
  trackShipment
);

router.use(authenticate);

/**
 * @swagger
 * /api/v1/shipments:
 *   get:
 *     tags:
 *       - Shipments
 *     summary: List shipments
 *     description: Regular agents see their own shipments; ADMIN/MASTER_AGENT see all.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_TRANSIT, DELIVERED, CANCELLED]
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
 *         description: Shipments retrieved successfully
 */
router.get("/", validateRequest(listShipmentsQuerySchema, "query"), getShipments);

/**
 * @swagger
 * /api/v1/shipments/{id}:
 *   get:
 *     tags:
 *       - Shipments
 *     summary: Get a single shipment
 *     description: Only the owning agent, or ADMIN/MASTER_AGENT, can view it.
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
 *         description: Shipment retrieved successfully
 *       403:
 *         description: Not the owning agent
 *       404:
 *         description: Shipment not found
 */
router.get("/:id", validateRequest(shipmentIdParamSchema, "params"), getShipmentById);

/**
 * @swagger
 * /api/v1/shipments:
 *   post:
 *     tags:
 *       - Shipments
 *     summary: Create a shipment
 *     description: Any authenticated user creates it as the owning agent. A public trackingCode is generated automatically.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - pickupLocation
 *               - destination
 *             properties:
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               pickupLocation:
 *                 type: string
 *               destination:
 *                 type: string
 *               driverId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Shipment created successfully
 */
router.post("/", validateRequest(createShipmentSchema), createShipment);

/**
 * @swagger
 * /api/v1/shipments/{id}:
 *   put:
 *     tags:
 *       - Shipments
 *     summary: Update a shipment
 *     description: Only the owning agent, or ADMIN/MASTER_AGENT, can update it.
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
 *         description: Shipment updated successfully
 *       403:
 *         description: Not the owning agent
 *       404:
 *         description: Shipment not found
 */
router.put(
  "/:id",
  validateRequest(shipmentIdParamSchema, "params"),
  validateRequest(updateShipmentSchema),
  updateShipment
);

/**
 * @swagger
 * /api/v1/shipments/{id}:
 *   delete:
 *     tags:
 *       - Shipments
 *     summary: Delete a shipment
 *     description: Only the owning agent, or ADMIN/MASTER_AGENT, can delete it.
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
 *         description: Shipment deleted successfully
 *       403:
 *         description: Not the owning agent
 *       404:
 *         description: Shipment not found
 */
router.delete("/:id", validateRequest(shipmentIdParamSchema, "params"), deleteShipment);

export default router;
