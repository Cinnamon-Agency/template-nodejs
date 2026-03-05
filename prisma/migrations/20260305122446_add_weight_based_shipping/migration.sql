-- AlterEnum
ALTER TYPE "public"."ShippingRateType" ADD VALUE 'WEIGHT_BASED';

-- AlterTable
ALTER TABLE "public"."shipping_rates" ADD COLUMN     "maxWeight" DECIMAL(10,2),
ADD COLUMN     "minWeight" DECIMAL(10,2),
ADD COLUMN     "pricePerUnit" DECIMAL(10,2),
ADD COLUMN     "weightUnit" VARCHAR(10);
