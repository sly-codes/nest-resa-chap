-- CreateEnum
CREATE TYPE "public"."PriceUnit" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');

-- AlterTable
ALTER TABLE "public"."Resource" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "mainImage" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "priceUnit" "public"."PriceUnit" NOT NULL DEFAULT 'HOUR';
