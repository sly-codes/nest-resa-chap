/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[provider,providerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."Provider" AS ENUM ('LOCAL', 'GOOGLE', 'GITHUB');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider" "public"."Provider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "hashedPassword" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "public"."User"("provider", "providerId");
