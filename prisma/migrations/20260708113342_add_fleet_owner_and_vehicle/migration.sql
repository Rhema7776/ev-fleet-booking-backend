/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `FleetOwner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `FleetOwner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FleetOwner" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FleetOwner_userId_key" ON "FleetOwner"("userId");

-- AddForeignKey
ALTER TABLE "FleetOwner" ADD CONSTRAINT "FleetOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
