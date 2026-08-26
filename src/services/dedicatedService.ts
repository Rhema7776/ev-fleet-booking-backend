import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import paymentService from "./paymentService";

// Confirmed from Figma review: a flat monthly rate regardless of
// specific vehicle, at least for now. If pricing should later vary by
// category or vehicle, this is the one place to change.
const DEDICATED_MONTHLY_RATE = 1_500_000;

interface ClaimVehicleResult {
  subscriptionId: number;
  authorizationUrl: string;
  reference: string;
}

async function claimVehicle(userId: number, vehicleId: number): Promise<ClaimVehicleResult> {
  const [user, vehicle] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
  ]);

  if (!user) {
    throw ApiError.notFound("User not found.");
  }

  if (!vehicle) {
    throw ApiError.notFound("Vehicle not found.");
  }

  if (vehicle.status !== "AVAILABLE") {
    throw ApiError.conflict(
      `This vehicle isn't available to claim right now (current status: ${vehicle.status}).`
    );
  }

  const reference = `dedicated_${userId}_${vehicleId}_${Date.now()}`;

  // Create the subscription as PENDING_PAYMENT first, before touching
  // Paystack — if Paystack's API call below fails, we're left with an
  // inert, harmless PENDING_PAYMENT row rather than a paid transaction
  // with no matching record.
  const subscription = await prisma.dedicatedSubscription.create({
    data: {
      userId,
      vehicleId,
      monthlyRate: DEDICATED_MONTHLY_RATE,
      status: "PENDING_PAYMENT",
      paystackReference: reference,
    },
  });

  const { authorizationUrl } = await paymentService.initializeTransaction({
    email: user.email,
    amountNaira: DEDICATED_MONTHLY_RATE,
    reference,
    metadata: {
      type: "dedicated_subscription",
      subscriptionId: subscription.id,
      userId,
      vehicleId,
    },
  });

  return {
    subscriptionId: subscription.id,
    authorizationUrl,
    reference,
  };
}

/**
 * Called from the Paystack webhook route after signature verification.
 * Deliberately re-verifies the transaction directly with Paystack's own
 * verify endpoint rather than trusting the webhook payload's status
 * field at face value — the signature proves the request came from
 * Paystack, but re-verification is the standard defense-in-depth step
 * against a compromised or buggy webhook payload.
 */
async function handleSuccessfulPayment(reference: string): Promise<void> {
  const verified = await paymentService.verifyTransaction(reference);

  if (verified.status !== "success") {
    return;
  }

  const subscription = await prisma.dedicatedSubscription.findUnique({
    where: { paystackReference: reference },
  });

  if (!subscription) {
    return;
  }

  if (subscription.status === "ACTIVE") {
    return;
  }

  const startDate = new Date();
  const nextPaymentDate = new Date(startDate);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

  await prisma.$transaction([
    prisma.dedicatedSubscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE", startDate, nextPaymentDate },
    }),
    prisma.vehicle.update({
      where: { id: subscription.vehicleId },
      data: { status: "DEDICATED" },
    }),
  ]);
}

async function getActiveSubscriptionForVehicle(vehicleId: number) {
  return prisma.dedicatedSubscription.findFirst({
    where: { vehicleId, status: "ACTIVE" },
  });
}

async function getUserActiveSubscriptions(userId: number) {
  return prisma.dedicatedSubscription.findMany({
    where: { userId, status: "ACTIVE" },
    include: { vehicle: true },
  });
}

export default {
  claimVehicle,
  handleSuccessfulPayment,
  getActiveSubscriptionForVehicle,
  getUserActiveSubscriptions,
};