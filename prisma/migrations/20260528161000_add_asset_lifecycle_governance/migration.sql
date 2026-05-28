CREATE TYPE "AssetLifecycleState" AS ENUM (
  'ACTIVE',
  'MONITORING',
  'EXPIRING',
  'ARCHIVED',
  'RETIRED',
  'SUSPENDED'
);

ALTER TYPE "OperationalEventType" ADD VALUE IF NOT EXISTS 'ASSET_ARCHIVED';
ALTER TYPE "OperationalEventType" ADD VALUE IF NOT EXISTS 'ASSET_RESTORED';
ALTER TYPE "OperationalEventType" ADD VALUE IF NOT EXISTS 'ASSET_SOFT_DELETED';
ALTER TYPE "OperationalEventType" ADD VALUE IF NOT EXISTS 'ASSET_PERMANENT_DELETE_ATTEMPT';
ALTER TYPE "OperationalEventType" ADD VALUE IF NOT EXISTS 'LIFECYCLE_STATE_CHANGED';

ALTER TABLE "Asset"
  ADD COLUMN "lifecycleState" "AssetLifecycleState" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "archivedBy" TEXT,
  ADD COLUMN "archiveReason" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedBy" TEXT,
  ADD COLUMN "lifecycleUpdatedAt" TIMESTAMP(3);

UPDATE "Asset"
SET
  "lifecycleState" = CASE
    WHEN "status" = 'ARCHIVED' THEN 'ARCHIVED'::"AssetLifecycleState"
    WHEN "status" = 'RENEW_SOON' THEN 'EXPIRING'::"AssetLifecycleState"
    ELSE 'ACTIVE'::"AssetLifecycleState"
  END,
  "lifecycleUpdatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);

CREATE INDEX "Asset_lifecycleState_idx" ON "Asset"("lifecycleState");
CREATE INDEX "Asset_deletedAt_idx" ON "Asset"("deletedAt");
