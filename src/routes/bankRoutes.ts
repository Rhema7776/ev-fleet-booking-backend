import express from "express";
import { searchBanks, resolveAccount } from "../controllers/bankController";
import { validateRequest } from "../middleware/validateRequest";
import { searchBanksQuerySchema, resolveAccountQuerySchema } from "../validators/bankValidator";

const router = express.Router();

/**
 * @swagger
 * /api/banks/search:
 *   get:
 *     tags:
 *       - Banks
 *     summary: Search banks by country
 *     description: Proxies Paystack's bank list, filtered/paginated server-side (Paystack has no native search param).
 *     parameters:
 *       - in: query
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *         description: ISO country code (NG, GH, KE, ZA).
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Banks retrieved successfully
 *       400:
 *         description: Missing or unsupported country code
 */
router.get("/search", validateRequest(searchBanksQuerySchema, "query"), searchBanks);

/**
 * @swagger
 * /api/banks/resolve:
 *   get:
 *     tags:
 *       - Banks
 *     summary: Resolve a bank account number
 *     description: Verifies an account number against a bank via Paystack and returns the account holder's name.
 *     parameters:
 *       - in: query
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: bankCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account resolved successfully
 *       400:
 *         description: Could not resolve account number
 */
router.get("/resolve", validateRequest(resolveAccountQuerySchema, "query"), resolveAccount);

export default router;
