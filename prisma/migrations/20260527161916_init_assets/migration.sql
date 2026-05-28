-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('DOMAIN', 'VPS', 'CLOUD', 'HOSTING', 'EMAIL', 'PANEL', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'RENEW_SOON', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "provider" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "purchaseDate" DATE NOT NULL,
    "renewalDate" DATE NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedCost" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "AssetStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_renewalDate_idx" ON "Asset"("renewalDate");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");
