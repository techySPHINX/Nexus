/*
  Warnings:

  - You are about to drop the column `studentId` on the `referral_applications` table. All the data in the column will be lost.
  - Added the required column `applicantId` to the `referral_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deadline` to the `referrals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."referral_applications" DROP CONSTRAINT "referral_applications_studentId_fkey";

-- AlterTable
ALTER TABLE "referral_applications" DROP COLUMN "studentId",
ADD COLUMN     "additionalLink" TEXT,
ADD COLUMN     "applicantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "referrals" ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "referralLink" TEXT;

-- AddForeignKey
ALTER TABLE "referral_applications" ADD CONSTRAINT "referral_applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
