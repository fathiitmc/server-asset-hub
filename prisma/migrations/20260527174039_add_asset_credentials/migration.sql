-- CreateTable
CREATE TABLE "AssetCredential" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "username" TEXT,
    "secret" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetCredential_assetId_idx" ON "AssetCredential"("assetId");

-- AddForeignKey
ALTER TABLE "AssetCredential" ADD CONSTRAINT "AssetCredential_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
