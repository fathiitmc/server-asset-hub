CREATE TYPE "AssetEnvironment" AS ENUM ('PRODUCTION', 'STAGING', 'DEVELOPMENT', 'TESTING');

ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'SERVER';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'DNS';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'SSL';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'CONTAINER';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'DATABASE';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'VPN';

CREATE TABLE "AssetProvider" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AssetProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetOwner" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AssetOwner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetTag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AssetTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_AssetToAssetTag" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

ALTER TABLE "Asset"
  ADD COLUMN "environment" "AssetEnvironment" NOT NULL DEFAULT 'PRODUCTION',
  ADD COLUMN "providerId" TEXT,
  ADD COLUMN "ownerId" TEXT,
  ADD COLUMN "region" TEXT,
  ADD COLUMN "domain" TEXT,
  ADD COLUMN "ipAddress" TEXT;

CREATE UNIQUE INDEX "AssetProvider_name_key" ON "AssetProvider"("name");
CREATE UNIQUE INDEX "AssetProvider_slug_key" ON "AssetProvider"("slug");
CREATE UNIQUE INDEX "AssetOwner_name_key" ON "AssetOwner"("name");
CREATE UNIQUE INDEX "AssetOwner_slug_key" ON "AssetOwner"("slug");
CREATE UNIQUE INDEX "AssetTag_name_key" ON "AssetTag"("name");
CREATE UNIQUE INDEX "AssetTag_slug_key" ON "AssetTag"("slug");
CREATE UNIQUE INDEX "_AssetToAssetTag_AB_unique" ON "_AssetToAssetTag"("A", "B");
CREATE INDEX "_AssetToAssetTag_B_index" ON "_AssetToAssetTag"("B");
CREATE INDEX "Asset_type_idx" ON "Asset"("type");
CREATE INDEX "Asset_environment_idx" ON "Asset"("environment");
CREATE INDEX "Asset_providerId_idx" ON "Asset"("providerId");
CREATE INDEX "Asset_ownerId_idx" ON "Asset"("ownerId");
CREATE INDEX "Asset_region_idx" ON "Asset"("region");

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AssetProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AssetOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_AssetToAssetTag" ADD CONSTRAINT "_AssetToAssetTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_AssetToAssetTag" ADD CONSTRAINT "_AssetToAssetTag_B_fkey" FOREIGN KEY ("B") REFERENCES "AssetTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AssetProvider" ("id", "name", "slug", "updatedAt")
VALUES
  ('provider_aws', 'AWS', 'aws', CURRENT_TIMESTAMP),
  ('provider_hetzner', 'Hetzner', 'hetzner', CURRENT_TIMESTAMP),
  ('provider_cloudflare', 'Cloudflare', 'cloudflare', CURRENT_TIMESTAMP),
  ('provider_namecheap', 'Namecheap', 'namecheap', CURRENT_TIMESTAMP),
  ('provider_zoho', 'Zoho', 'zoho', CURRENT_TIMESTAMP),
  ('provider_digitalocean', 'DigitalOcean', 'digitalocean', CURRENT_TIMESTAMP),
  ('provider_google_cloud', 'Google Cloud', 'google-cloud', CURRENT_TIMESTAMP),
  ('provider_azure', 'Azure', 'azure', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "AssetOwner" ("id", "name", "slug", "updatedAt")
VALUES
  ('owner_personal', 'Personal', 'personal', CURRENT_TIMESTAMP),
  ('owner_internal', 'Internal', 'internal', CURRENT_TIMESTAMP),
  ('owner_operations', 'Operations', 'operations', CURRENT_TIMESTAMP),
  ('owner_finance', 'Finance', 'finance', CURRENT_TIMESTAMP),
  ('owner_client', 'Client', 'client', CURRENT_TIMESTAMP),
  ('owner_infrastructure', 'Infrastructure', 'infrastructure', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "AssetTag" ("id", "name", "slug", "updatedAt")
VALUES
  ('tag_critical', 'critical', 'critical', CURRENT_TIMESTAMP),
  ('tag_production', 'production', 'production', CURRENT_TIMESTAMP),
  ('tag_finance', 'finance', 'finance', CURRENT_TIMESTAMP),
  ('tag_ai', 'ai', 'ai', CURRENT_TIMESTAMP),
  ('tag_temporary', 'temporary', 'temporary', CURRENT_TIMESTAMP),
  ('tag_client', 'client', 'client', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "AssetProvider" ("id", "name", "slug", "updatedAt")
SELECT 'provider_' || substr(md5("provider"), 1, 16), "provider", lower(regexp_replace("provider", '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5("provider"), 1, 6), CURRENT_TIMESTAMP
FROM "Asset"
WHERE NULLIF(trim("provider"), '') IS NOT NULL
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "AssetOwner" ("id", "name", "slug", "updatedAt")
SELECT 'owner_' || substr(md5("owner"), 1, 16), "owner", lower(regexp_replace("owner", '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5("owner"), 1, 6), CURRENT_TIMESTAMP
FROM "Asset"
WHERE NULLIF(trim("owner"), '') IS NOT NULL
ON CONFLICT ("name") DO NOTHING;

UPDATE "Asset" SET "providerId" = "AssetProvider"."id"
FROM "AssetProvider"
WHERE "Asset"."provider" = "AssetProvider"."name";

UPDATE "Asset" SET "ownerId" = "AssetOwner"."id"
FROM "AssetOwner"
WHERE "Asset"."owner" = "AssetOwner"."name";
