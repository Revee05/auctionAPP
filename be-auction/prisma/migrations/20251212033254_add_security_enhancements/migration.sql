/*
  Warnings:

  - A unique constraint covering the columns `[verificationTokenHash]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "registrationIp" TEXT,
ADD COLUMN     "verificationIp" TEXT,
ADD COLUMN     "verificationTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationTokenHash_key" ON "User"("verificationTokenHash");

-- CreateIndex
CREATE INDEX "User_verificationTokenHash_idx" ON "User"("verificationTokenHash");
