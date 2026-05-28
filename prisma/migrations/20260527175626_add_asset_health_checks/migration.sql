-- CreateTable
CREATE TABLE "AssetHealthCheck" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseTime" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetHealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetHealthCheck_assetId_idx" ON "AssetHealthCheck"("assetId");

-- CreateIndex
CREATE INDEX "AssetHealthCheck_checkedAt_idx" ON "AssetHealthCheck"("checkedAt");

-- AddForeignKey
ALTER TABLE "AssetHealthCheck" ADD CONSTRAINT "AssetHealthCheck_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
