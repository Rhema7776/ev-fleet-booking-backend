/*
  Warnings:

  - You are about to drop the column `bookingDate` on the `Booking` table. All the data it contains will be lost.
  - You are about to drop the column `destination` on the `Booking` table. All the data it contains will be lost.
  - You are about to drop the column `vehicleId` on the `Booking` table. All the data it contains will be lost.
  - Added the required columns `dropoffLocation`, `endTime`, `ratePerHour`, `startTime`, `vehicleCategory` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - `hoursBooked` changes type from INTEGER to DECIMAL(65,30), to support fractional durations (e.g. "3h 30m" = 3.5) that the source design actually shows.
  - `totalAmount` changes type from DOUBLE PRECISION to DECIMAL(65,30).

*/
-- CreateEnum
CREATE TYPE "BookingMode" AS ENUM ('STRAIGHT', 'RESERVE', 'DEDICATED');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_vehicleId_fkey";

-- AlterTable
ALTER TABLE "Booking"
  DROP COLUMN "bookingDate",
  DROP COLUMN "destination",
  DROP COLUMN "vehicleId",
  ADD COLUMN     "bookingMode" "BookingMode" NOT NULL DEFAULT 'STRAIGHT',
  ADD COLUMN     "vehicleCategory" "VehicleCategory" NOT NULL,
  ADD COLUMN     "vehicleCount" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN     "dropoffLocation" TEXT NOT NULL,
  ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
  ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
  ADD COLUMN     "pickupTime" TIMESTAMP(3),
  ADD COLUMN     "dropoffTime" TIMESTAMP(3),
  ADD COLUMN     "ratePerHour" DECIMAL(65,30) NOT NULL,
  ADD COLUMN     "priority" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "driverId" INTEGER,
  ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(65,30),
  ALTER COLUMN "hoursBooked" SET DATA TYPE DECIMAL(65,30);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
