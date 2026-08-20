import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
} from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import { updateUserSchema, userIdParamSchema, listUsersQuerySchema } from "../validators/userValidator";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users (admin)
 *     description: Never returns password hashes — responses are built from an explicit safe field list.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
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
 *         description: Users retrieved successfully
 *       403:
 *         description: Admin only
 */
router.get(
  "/",
  authorize("ADMIN"),
  validateRequest(listUsersQuerySchema, "query"),
  getUsers
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get a user by id
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
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/:id", validateRequest(userIdParamSchema, "params"), getUserById);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update a user
 *     description: Self or admin can update fullName/phone. Only an admin can change role or isActive.
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
 *         description: User updated successfully
 *       403:
 *         description: Not the target user, or attempted a privileged change without admin rights
 *       404:
 *         description: User not found
 */
router.put(
  "/:id",
  validateRequest(userIdParamSchema, "params"),
  validateRequest(updateUserSchema),
  updateUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Deactivate a user (admin)
 *     description: Soft-delete only (isActive = false) — a User has too many dependent records (bookings, wallet, etc) for a hard delete to be safe.
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
 *         description: User deactivated successfully
 *       403:
 *         description: Admin only
 *       404:
 *         description: User not found
 */
router.delete("/:id", authorize("ADMIN"), validateRequest(userIdParamSchema, "params"), deactivateUser);

export default router;
