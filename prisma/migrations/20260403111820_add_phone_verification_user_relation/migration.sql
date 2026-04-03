-- CreateIndex
CREATE INDEX "phone_verification_codes_userId_idx" ON "public"."phone_verification_codes"("userId");

-- AddForeignKey
ALTER TABLE "public"."phone_verification_codes" ADD CONSTRAINT "phone_verification_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
