-- CreateEnum
CREATE TYPE "public"."ShippingRateType" AS ENUM ('FLAT_RATE', 'WEIGHT_BASED', 'PRICE_BASED', 'FREE_SHIPPING');

-- CreateTable
CREATE TABLE "public"."shipping_zones" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shipping_zone_countries" (
    "id" UUID NOT NULL,
    "shippingZoneId" UUID NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_zone_countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shipping_rates" (
    "id" UUID NOT NULL,
    "shippingZoneId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rateType" "public"."ShippingRateType" NOT NULL DEFAULT 'FLAT_RATE',
    "baseRate" DECIMAL(10,2) NOT NULL,
    "minOrderValue" DECIMAL(10,2),
    "maxOrderValue" DECIMAL(10,2),
    "minWeight" DECIMAL(10,2),
    "maxWeight" DECIMAL(10,2),
    "freeShippingMin" DECIMAL(10,2),
    "estimatedDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipping_zones_name_key" ON "public"."shipping_zones"("name");

-- CreateIndex
CREATE INDEX "shipping_zones_isActive_idx" ON "public"."shipping_zones"("isActive");

-- CreateIndex
CREATE INDEX "shipping_zone_countries_shippingZoneId_idx" ON "public"."shipping_zone_countries"("shippingZoneId");

-- CreateIndex
CREATE INDEX "shipping_zone_countries_countryCode_idx" ON "public"."shipping_zone_countries"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_zone_countries_shippingZoneId_countryCode_key" ON "public"."shipping_zone_countries"("shippingZoneId", "countryCode");

-- CreateIndex
CREATE INDEX "shipping_rates_shippingZoneId_idx" ON "public"."shipping_rates"("shippingZoneId");

-- CreateIndex
CREATE INDEX "shipping_rates_isActive_idx" ON "public"."shipping_rates"("isActive");

-- CreateIndex
CREATE INDEX "shipping_rates_priority_idx" ON "public"."shipping_rates"("priority");

-- AddForeignKey
ALTER TABLE "public"."shipping_zone_countries" ADD CONSTRAINT "shipping_zone_countries_shippingZoneId_fkey" FOREIGN KEY ("shippingZoneId") REFERENCES "public"."shipping_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_rates" ADD CONSTRAINT "shipping_rates_shippingZoneId_fkey" FOREIGN KEY ("shippingZoneId") REFERENCES "public"."shipping_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
