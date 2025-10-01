/*
  Warnings:

  - You are about to drop the column `locataireContact` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `locataireEmail` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `locataireNom` on the `Reservation` table. All the data in the column will be lost.
  - Added the required column `locataireId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "public"."Status" ADD VALUE 'CONFIRMED';

-- AlterTable
ALTER TABLE "public"."Reservation" DROP COLUMN "locataireContact",
DROP COLUMN "locataireEmail",
DROP COLUMN "locataireNom",
ADD COLUMN     "locataireId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "username" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
