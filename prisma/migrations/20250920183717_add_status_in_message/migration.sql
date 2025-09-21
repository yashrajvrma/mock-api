-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('PENDING', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "status" "public"."Status" NOT NULL DEFAULT 'PENDING';
