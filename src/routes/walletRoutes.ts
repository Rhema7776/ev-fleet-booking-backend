import express from "express";
import {
  getMyWallet,
  getWallets,
  getWalletById,
  fundWallet,
  debitWallet,
  getWalletTransactions,
} from "../controllers/walletController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import {
  fundWalletSchema,
  debitWalletSchema,
  walletIdParamSchema,
  listTransactionsQuerySchema,
  listWalletsQuerySchema,
} from "../validators/walletValidator";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/wallet:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get your own wallet
 *     description: Auto-creates a wallet for the caller on first access.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 */
router.get("/", getMyWallet);

/**
 * @swagger
 * /api/v1/wallet/fund:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Fund your wallet
 *     description: Credits the caller's wallet and records a WalletTransaction. `reference` must be unique (idempotency key).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reference
 *             properties:
 *               amount:
 *                 type: number
 *               reference:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wallet funded successfully
 *       409:
 *         description: Reference already used
 */
router.post("/fund", validateRequest(fundWalletSchema), fundWallet);

/**
 * @swagger
 * /api/v1/wallet/debit:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Debit your wallet
 *     description: Debits the caller's wallet and records a WalletTransaction. Fails with 400 if balance is insufficient.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reference
 *             properties:
 *               amount:
 *                 type: number
 *               reference:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wallet debited successfully
 *       400:
 *         description: Insufficient balance
 *       409:
 *         description: Reference already used
 */
router.post("/debit", validateRequest(debitWalletSchema), debitWallet);
/*

 * @swagger
  * /api/v1 / wallet / { id } / transactions:
 * get:
 * tags:
 * - Wallet
  * summary: List a wallet's transactions
    * security:
 * - bearerAuth: []
  * parameters:
 * - in: path
  * name: id
    * required: true
      * schema:
 * type: integer
  * - in: query
    * name: type
      * schema:
 * type: string
  *           enum: [CREDIT, DEBIT]
    * responses:
 * 200:
 * description: Transactions retrieved successfully
  * 403:
 * description: Not your wallet
  * 404:
 * description: Wallet not found
  */
router.get(
  "/:id/transactions",
  validateRequest(walletIdParamSchema, "params"),
  validateRequest(listTransactionsQuerySchema, "query"),
  getWalletTransactions
);

/**
 * @swagger
 * /api/v1/wallet/{id}:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get a wallet by id
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
 *         description: Wallet retrieved successfully
 *       403:
 *         description: Not your wallet
 *       404:
 *         description: Wallet not found
 */
router.get("/:id", validateRequest(walletIdParamSchema, "params"), getWalletById);

/**
 * @swagger
 * /api/v1/wallet/admin/all:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: List all wallets (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallets retrieved successfully
 *       403:
 *         description: Admin only
 */
router.get(
  "/admin/all",
  authorize("ADMIN"),
  validateRequest(listWalletsQuerySchema, "query"),
  getWallets
);

export default router;
