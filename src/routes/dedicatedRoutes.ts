import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import { paystackWebhookAuth } from "../middleware/paystackWebhookAuth";
import { claimVehicleSchema } from "../validators/dedicatedValidator";
import { claimVehicle, getMySubscriptions, paystackWebhook } from "../controllers/dedicatedController";

const router = Router();

/**
 * @swagger
 * /api/v1/dedicated/claim:
 *   post:
 *     tags:
 *       - Dedicated
 *     summary: Claim exclusive access to a specific vehicle
 *     description: >
 *       Starts a Dedicated subscription for a specific, currently AVAILABLE
 *       vehicle. Creates a PENDING_PAYMENT subscription and a real Paystack
 *       transaction. The vehicle isn't actually locked to the caller (and
 *       DEDICATED bookings against it aren't possible) until Paystack
 *       confirms payment via the webhook — redirect the user to the
 *       returned authorizationUrl to complete payment.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *             properties:
 *               vehicleId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Subscription created, redirect user to authorizationUrl to pay
 *       404:
 *         description: User or vehicle not found
 *       409:
 *         description: Vehicle isn't currently AVAILABLE to claim
 */
router.post("/claim", authenticate, validateRequest(claimVehicleSchema), claimVehicle);

/**
 * @swagger
 * /api/v1/dedicated/my-subscriptions:
 *   get:
 *     tags:
 *       - Dedicated
 *     summary: List the caller's active dedicated subscriptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active subscriptions retrieved successfully
 */
router.get("/my-subscriptions", authenticate, getMySubscriptions);

/**
 * @swagger
 * /api/v1/dedicated/webhook/paystack:
 *   post:
 *     tags:
 *       - Dedicated
 *     summary: Paystack payment webhook (Paystack calls this directly, not user-facing)
 *     description: >
 *       Verified via HMAC SHA512 signature (x-paystack-signature header),
 *       not a login token — this request comes from Paystack's own
 *       servers. On charge.success, activates the matching
 *       DedicatedSubscription and marks the vehicle DEDICATED. Register
 *       this exact URL in your Paystack dashboard under Settings > API
 *       Keys & Webhooks.
 *     responses:
 *       200:
 *         description: Always returns 200 once the signature is valid, regardless of event type
 *       401:
 *         description: Invalid or missing webhook signature
 */
router.post("/webhook/paystack", paystackWebhookAuth, paystackWebhook);

export default router;