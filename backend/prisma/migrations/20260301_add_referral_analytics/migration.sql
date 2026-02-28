-- AlterEnum: Add SHORTLISTED and OFFERED to ApplicationStatus
ALTER TYPE "ApplicationStatus" ADD VALUE 'SHORTLISTED';
ALTER TYPE "ApplicationStatus" ADD VALUE 'OFFERED';

-- AlterTable: Add viewCount to referrals
ALTER TABLE "referrals" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
