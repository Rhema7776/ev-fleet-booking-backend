/*
  Warnings:

  - Added the required column `fleetOwnerId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "fleetOwnerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_fleetOwnerId_fkey" FOREIGN KEY ("fleetOwnerId") REFERENCES "FleetOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
