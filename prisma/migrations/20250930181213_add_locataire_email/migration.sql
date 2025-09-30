/*
  Warnings:

  - Added the required column `locataireEmail` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "locataireEmail" TEXT NOT NULL;
