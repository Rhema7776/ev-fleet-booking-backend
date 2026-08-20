import express from "express";
import {
  getEnterprises,
  getEnterpriseById,
  createEnterprise,
  updateEnterprise,
  deleteEnterprise,
} from "../controllers/enterpriseController";
import { authenticate } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import {
  createEnterpriseSchema,
  updateEnterpriseSchema,
  enterpriseIdParamSchema,
  listEnterprisesQuerySchema,
} from "../validators/enterpriseValidator";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/enterprises:
 *   get:
 *     tags:
 *       - Enterprises
 *     summary: List enterprises
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, SUSPENDED]
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
 *         description: Enterprises retrieved successfully
 */
router.get("/", validateRequest(listEnterprisesQuerySchema, "query"), getEnterprises);

/**
 * @swagger
 * /api/v1/enterprises/{id}:
 *   get:
 *     tags:
 *       - Enterprises
 *     summary: Get a single enterprise
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
 *         description: Enterprise retrieved successfully
 *       404:
 *         description: Enterprise not found
 */
router.get("/:id", validateRequest(enterpriseIdParamSchema, "params"), getEnterpriseById);

/**
 * @swagger
 * /api/v1/enterprises:
 *   post:
 *     tags:
 *       - Enterprises
 *     summary: Register an enterprise profile
 *     description: A user with an ENTERPRISE_PARTNER account creates their enterprise profile (one per user).
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
 *               - contactEmail
 *             properties:
 *               name:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Enterprise created successfully
 *       409:
 *         description: Enterprise profile or contact email already exists
 */
router.post("/", validateRequest(createEnterpriseSchema), createEnterprise);

/**
 * @swagger
 * /api/v1/enterprises/{id}:
 *   put:
 *     tags:
 *       - Enterprises
 *     summary: Update an enterprise
 *     description: The owning user (or an admin) can update it. Only an admin can change `status`.
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
 *         description: Enterprise updated successfully
 *       403:
 *         description: Not the owning user, or attempted a status change without admin rights
 *       404:
 *         description: Enterprise not found
 */
router.put(
  "/:id",
  validateRequest(enterpriseIdParamSchema, "params"),
  validateRequest(updateEnterpriseSchema),
  updateEnterprise
);

/**
 * @swagger
 * /api/v1/enterprises/{id}:
 *   delete:
 *     tags:
 *       - Enterprises
 *     summary: Delete an enterprise
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
 *         description: Enterprise deleted successfully
 *       403:
 *         description: Not the owning user
 *       404:
 *         description: Enterprise not found
 */
router.delete(
  "/:id",
  validateRequest(enterpriseIdParamSchema, "params"),
  deleteEnterprise
);

export default router;
