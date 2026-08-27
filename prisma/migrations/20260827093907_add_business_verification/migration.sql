-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FLAGGED', 'MANUALLY_APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Enterprise" ADD COLUMN     "rcNumber" TEXT,
ADD COLUMN     "verificationCheckedAt" TIMESTAMP(3),
ADD COLUMN     "verificationNotes" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifiedBusinessName" TEXT;

-- AlterTable
ALTER TABLE "FleetOwner" ADD COLUMN     "rcNumber" TEXT,
ADD COLUMN     "verificationCheckedAt" TIMESTAMP(3),
ADD COLUMN     "verificationNotes" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifiedBusinessName" TEXT;
