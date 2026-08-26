import axios from "axios";
import crypto from "crypto";
import { ApiError } from "../utils/ApiError";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  },
});

interface InitializeTransactionParams {
  email: string;
  amountNaira: number;
  reference: string;
  metadata?: Record<string, unknown>;
}

interface InitializeTransactionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Starts a real Paystack transaction. Paystack expects amounts in kobo
 * (Naira's smallest unit), hence the x100 — a genuinely easy mistake to
 * make, and one that silently charges 100x too little if missed.
 */
async function initializeTransaction({
  email,
  amountNaira,
  reference,
  metadata,
}: InitializeTransactionParams): Promise<InitializeTransactionResult> {
  const response = await paystackClient.post("/transaction/initialize", {
    email,
    amount: Math.round(amountNaira * 100),
    reference,
    metadata,
  });

  const { authorization_url, access_code } = response.data.data;

  return {
    authorizationUrl: authorization_url,
    accessCode: access_code,
    reference,
  };
}

interface VerifyTransactionResult {
  status: "success" | "failed" | "abandoned" | string;
  reference: string;
  amountNaira: number;
  paidAt: string | null;
}

async function verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
  const response = await paystackClient.get(`/transaction/verify/${encodeURIComponent(reference)}`);

  const data = response.data.data;

  if (!data) {
    throw ApiError.badRequest("No transaction found for this reference.");
  }

  return {
    status: data.status,
    reference: data.reference,
    amountNaira: data.amount / 100,
    paidAt: data.paid_at ?? null,
  };
}

/**
 * Paystack signs every webhook request body with your secret key, using
 * HMAC SHA512 over the RAW (unparsed) request body. This is the only
 * reliable way to confirm a webhook request genuinely came from Paystack
 * and wasn't spoofed by a third party hitting your endpoint directly —
 * skipping this check would mean anyone who discovers your webhook URL
 * could fake a "payment succeeded" event.
 *
 * Requires the raw request body bytes, not the JSON-parsed object — see
 * app.ts's express.json() verify callback, which captures this
 * specifically for this purpose.
 */
function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison — a plain === comparison here would leak
  // timing information an attacker could use to guess the correct
  // signature byte-by-byte. Buffers must be equal length or timingSafeEqual
  // throws, so check that first.
  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signatureHeader, "hex");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

export default {
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
};