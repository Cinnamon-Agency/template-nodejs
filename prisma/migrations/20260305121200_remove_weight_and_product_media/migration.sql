/*
  Warnings:

  - The values [WEIGHT_BASED] on the enum `ShippingRateType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `productId` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `maxWeight` on the `shipping_rates` table. All the data in the column will be lost.
  - You are about to drop the column `minWeight` on the `shipping_rates` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ShippingRateType_new" AS ENUM ('FLAT_RATE', 'PRICE_BASED', 'FREE_SHIPPING');
ALTER TABLE "public"."shipping_rates" ALTER COLUMN "rateType" DROP DEFAULT;
ALTER TABLE "public"."shipping_rates" ALTER COLUMN "rateType" TYPE "public"."ShippingRateType_new" USING ("rateType"::text::"public"."ShippingRateType_new");
ALTER TYPE "public"."ShippingRateType" RENAME TO "ShippingRateType_old";
ALTER TYPE "public"."ShippingRateType_new" RENAME TO "ShippingRateType";
DROP TYPE "public"."ShippingRateType_old";
ALTER TABLE "public"."shipping_rates" ALTER COLUMN "rateType" SET DEFAULT 'FLAT_RATE';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Media" DROP CONSTRAINT "Media_productId_fkey";

-- DropIndex
DROP INDEX "public"."Media_productId_idx";

-- AlterTable
ALTER TABLE "public"."Media" DROP COLUMN "productId";

-- AlterTable
ALTER TABLE "public"."shipping_rates" DROP COLUMN "maxWeight",
DROP COLUMN "minWeight";
