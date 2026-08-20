import express from "express";
import {
  getFleetOwners,
  getFleetOwnerById,
  createFleetOwner,
  updateFleetOwner,
  deleteFleetOwner,
} from "../controllers/fleetOwnerController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import {
  createFleetOwnerSchema,
  updateFleetOwnerSchema,
  fleetOwnerIdParamSchema,
  listFleetOwnersQuerySchema,
} from "../validators/fleetOwnerValidator";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/fleet-owners:
 *   get:
 *     tags:
 *       - Fleet Owners
 *     summary: List fleet owners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
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
 *         description: Fleet owners retrieved successfully
 */
router.get("/", validateRequest(listFleetOwnersQuerySchema, "query"), getFleetOwners);

/**
 * @swagger
 * /api/v1/fleet-owners/{id}:
 *   get:
 *     tags:
 *       - Fleet Owners
 *     summary: Get fleet owner by ID
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
 *         description: Fleet owner retrieved successfully
 *       404:
 *         description: Fleet owner not found
 */
router.get("/:id", validateRequest(fleetOwnerIdParamSchema, "params"), getFleetOwnerById);

/**
 * @swagger
 * /api/v1/fleet-owners:
 *   post:
 *     tags:
 *       - Fleet Owners
 *     summary: Provision a fleet owner profile
 *     description: ADMIN/MASTER_AGENT only — creates a FleetOwner profile for a target user (userId in the body).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - contactPerson
 *               - email
 *               - phone
 *               - userId
 *             properties:
 *               companyName:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               userId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Fleet owner created successfully
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: User already has a fleet owner profile, or email already in use
 */
router.post(
  "/",
  authorize("ADMIN", "MASTER_AGENT"),
  validateRequest(createFleetOwnerSchema),
  createFleetOwner
);

/**
 * @swagger
 * /api/v1/fleet-owners/{id}:
 *   put:
 *     tags:
 *       - Fleet Owners
 *     summary: Update fleet owner
 *     description: The owning user (or an admin) can update profile fields. Only an admin can change isVerified/isActive.
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
 *         description: Fleet owner updated successfully
 *       403:
 *         description: Not the owning user, or attempted a status change without admin rights
 *       404:
 *         description: Fleet owner not found
 */
router.put(
  "/:id",
  validateRequest(fleetOwnerIdParamSchema, "params"),
  validateRequest(updateFleetOwnerSchema),
  updateFleetOwner
);

/**
 * @swagger
 * /api/v1/fleet-owners/{id}:
 *   delete:
 *     tags:
 *       - Fleet Owners
 *     summary: Delete fleet owner
 *     description: Fails with 409 if the fleet owner still has vehicles or drivers attached.
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
 *         description: Fleet owner deleted successfully
 *       403:
 *         description: Not the owning user
 *       404:
 *         description: Fleet owner not found
 *       409:
 *         description: Fleet owner still has vehicles or drivers attached
 */
router.delete("/:id", validateRequest(fleetOwnerIdParamSchema, "params"), deleteFleetOwner);

export default router;
