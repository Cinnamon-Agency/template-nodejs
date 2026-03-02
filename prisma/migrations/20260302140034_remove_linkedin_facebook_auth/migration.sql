/*
  Warnings:

  - The values [LINKED_IN,FACEBOOK] on the enum `AuthType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."AuthType_new" AS ENUM ('GOOGLE', 'APPLE', 'USER_PASSWORD');
ALTER TABLE "public"."users" ALTER COLUMN "authType" TYPE "public"."AuthType_new" USING ("authType"::text::"public"."AuthType_new");
ALTER TYPE "public"."AuthType" RENAME TO "AuthType_old";
ALTER TYPE "public"."AuthType_new" RENAME TO "AuthType";
DROP TYPE "public"."AuthType_old";
COMMIT;
