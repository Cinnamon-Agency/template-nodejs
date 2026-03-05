-- CreateTable
CREATE TABLE "public"."product_variations" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variation_options" (
    "id" UUID NOT NULL,
    "variationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variation_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variations_sku_key" ON "public"."product_variations"("sku");

-- CreateIndex
CREATE INDEX "product_variations_productId_idx" ON "public"."product_variations"("productId");

-- CreateIndex
CREATE INDEX "product_variations_sku_idx" ON "public"."product_variations"("sku");

-- CreateIndex
CREATE INDEX "product_variations_isActive_idx" ON "public"."product_variations"("isActive");

-- CreateIndex
CREATE INDEX "variation_options_variationId_idx" ON "public"."variation_options"("variationId");

-- AddForeignKey
ALTER TABLE "public"."product_variations" ADD CONSTRAINT "product_variations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variation_options" ADD CONSTRAINT "variation_options_variationId_fkey" FOREIGN KEY ("variationId") REFERENCES "public"."product_variations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
