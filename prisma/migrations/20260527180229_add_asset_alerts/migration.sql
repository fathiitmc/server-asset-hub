-- CreateTable
CREATE TABLE "AssetAlert" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetAlert_assetId_idx" ON "AssetAlert"("assetId");

-- CreateIndex
CREATE INDEX "AssetAlert_severity_idx" ON "AssetAlert"("severity");

-- CreateIndex
CREATE INDEX "AssetAlert_createdAt_idx" ON "AssetAlert"("createdAt");

-- AddForeignKey
ALTER TABLE "AssetAlert" ADD CONSTRAINT "AssetAlert_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
