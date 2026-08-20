/*
  Warnings:

  - You are about to drop the column `batteryCapacity` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `make` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `plateNumber` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `rangeKm` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Vehicle` table. All the data in the column will be lost.
  - The `status` column on the `Vehicle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[plate]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plate` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerHour` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'ACTIVE', 'RESERVED', 'BOOKED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('ECONOMY', 'EXECUTIVE', 'VIP');

-- DropIndex
DROP INDEX "Vehicle_plateNumber_key";

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "batteryCapacity",
DROP COLUMN "color",
DROP COLUMN "hourlyRate",
DROP COLUMN "make",
DROP COLUMN "model",
DROP COLUMN "plateNumber",
DROP COLUMN "rangeKm",
DROP COLUMN "seats",
DROP COLUMN "year",
ADD COLUMN     "category" "VehicleCategory" NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isElectric" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "plate" TEXT NOT NULL,
ADD COLUMN     "pricePerHour" DECIMAL(65,30) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");
