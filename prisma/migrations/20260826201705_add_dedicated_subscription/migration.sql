-- CreateEnum
CREATE TYPE "DedicatedSubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- AlterEnum
ALTER TYPE "VehicleStatus" ADD VALUE 'DEDICATED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "dedicatedSubscriptionId" INTEGER;

-- CreateTable
CREATE TABLE "DedicatedSubscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "monthlyRate" DECIMAL(65,30) NOT NULL,
    "status" "DedicatedSubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "startDate" TIMESTAMP(3),
    "nextPaymentDate" TIMESTAMP(3),
    "paystackReference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DedicatedSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DedicatedSubscription_paystackReference_key" ON "DedicatedSubscription"("paystackReference");

-- AddForeignKey
ALTER TABLE "DedicatedSubscription" ADD CONSTRAINT "DedicatedSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DedicatedSubscription" ADD CONSTRAINT "DedicatedSubscription_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_dedicatedSubscriptionId_fkey" FOREIGN KEY ("dedicatedSubscriptionId") REFERENCES "DedicatedSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
