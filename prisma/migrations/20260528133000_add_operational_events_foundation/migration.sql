CREATE TYPE "OperationalEventType" AS ENUM (
  'ASSET_CREATED',
  'ASSET_UPDATED',
  'ASSET_DELETED',
  'ALERT_TRIGGERED',
  'ALERT_ACKNOWLEDGED',
  'SSL_EXPIRY_DETECTED',
  'HEALTH_CHECK_RUN',
  'HEALTH_DEGRADED',
  'RUNTIME_OFFLINE',
  'RUNTIME_ONLINE',
  'CREDENTIAL_CREATED',
  'CREDENTIAL_UPDATED',
  'CREDENTIAL_DELETED',
  'ATTACHMENT_ADDED',
  'ATTACHMENT_DELETED',
  'SYSTEM_SEEDED'
);

CREATE TYPE "OperationalEventSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

CREATE TYPE "OperationalEventSource" AS ENUM (
  'SYSTEM',
  'USER',
  'MONITOR',
  'ALERT_ENGINE'
);

CREATE TABLE "OperationalEvent" (
  "id" TEXT NOT NULL,
  "assetId" TEXT,
  "assetName" TEXT,
  "eventType" "OperationalEventType" NOT NULL,
  "severity" "OperationalEventSeverity" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "actor" TEXT,
  "source" "OperationalEventSource" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OperationalEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalEvent_assetId_idx" ON "OperationalEvent"("assetId");
CREATE INDEX "OperationalEvent_eventType_idx" ON "OperationalEvent"("eventType");
CREATE INDEX "OperationalEvent_severity_idx" ON "OperationalEvent"("severity");
CREATE INDEX "OperationalEvent_source_idx" ON "OperationalEvent"("source");
CREATE INDEX "OperationalEvent_createdAt_idx" ON "OperationalEvent"("createdAt");

ALTER TABLE "OperationalEvent" ADD CONSTRAINT "OperationalEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
