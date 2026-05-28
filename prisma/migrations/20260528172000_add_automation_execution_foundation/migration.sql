CREATE TYPE "AutomationRuleStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT', 'FAILED', 'DISABLED');
CREATE TYPE "AutomationTriggerType" AS ENUM ('SCHEDULE', 'ALERT', 'RENEWAL', 'COST_THRESHOLD', 'LIFECYCLE_CHANGE', 'MANUAL');
CREATE TYPE "AutomationExecutionStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'BLOCKED');
CREATE TYPE "AutomationExecutionSource" AS ENUM ('MANUAL', 'SCHEDULER', 'SYSTEM', 'PREVIEW');
CREATE TYPE "AutomationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "AutomationCategory" AS ENUM (
  'SCHEDULED_CHECKS',
  'RENEWAL_REMINDERS',
  'ALERT_ESCALATIONS',
  'COST_GOVERNANCE',
  'OWNERSHIP_FOLLOW_UPS',
  'OPERATIONAL_REVIEWS',
  'LIFECYCLE_GOVERNANCE'
);

ALTER TYPE "OperationalEventType" ADD VALUE IF NOT EXISTS 'AUTOMATION_RULE_CREATED';
ALTER TYPE "OperationalEventType" ADD VALUE IF NOT EXISTS 'AUTOMATION_RULE_UPDATED';
ALTER TYPE "OperationalEventType" ADD VALUE IF NOT EXISTS 'AUTOMATION_RULE_DISABLED';
ALTER TYPE "OperationalEventType" ADD VALUE IF NOT EXISTS 'AUTOMATION_RULE_DELETED';
ALTER TYPE "OperationalEventType" ADD VALUE IF NOT EXISTS 'AUTOMATION_EXECUTION_RECORDED';

CREATE TABLE "AutomationRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" "AutomationRuleStatus" NOT NULL DEFAULT 'DRAFT',
  "severity" "AutomationSeverity" NOT NULL DEFAULT 'MEDIUM',
  "category" "AutomationCategory" NOT NULL,
  "owner" TEXT NOT NULL,
  "teamId" TEXT,
  "escalationOwner" TEXT,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationTrigger" (
  "id" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "type" "AutomationTriggerType" NOT NULL,
  "label" TEXT NOT NULL,
  "config" JSONB,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationTrigger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationSchedule" (
  "id" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "cadence" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "nextRunAt" TIMESTAMP(3),
  "lastRunAt" TIMESTAMP(3),
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationExecution" (
  "id" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "status" "AutomationExecutionStatus" NOT NULL DEFAULT 'QUEUED',
  "result" TEXT,
  "logs" JSONB,
  "triggeredBy" TEXT,
  "source" "AutomationExecutionSource" NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "durationMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationExecution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AutomationRule_status_idx" ON "AutomationRule"("status");
CREATE INDEX "AutomationRule_category_idx" ON "AutomationRule"("category");
CREATE INDEX "AutomationRule_severity_idx" ON "AutomationRule"("severity");
CREATE INDEX "AutomationRule_teamId_idx" ON "AutomationRule"("teamId");
CREATE INDEX "AutomationRule_deletedAt_idx" ON "AutomationRule"("deletedAt");
CREATE INDEX "AutomationTrigger_ruleId_idx" ON "AutomationTrigger"("ruleId");
CREATE INDEX "AutomationTrigger_type_idx" ON "AutomationTrigger"("type");
CREATE INDEX "AutomationTrigger_enabled_idx" ON "AutomationTrigger"("enabled");
CREATE INDEX "AutomationSchedule_ruleId_idx" ON "AutomationSchedule"("ruleId");
CREATE INDEX "AutomationSchedule_enabled_idx" ON "AutomationSchedule"("enabled");
CREATE INDEX "AutomationSchedule_nextRunAt_idx" ON "AutomationSchedule"("nextRunAt");
CREATE INDEX "AutomationExecution_ruleId_idx" ON "AutomationExecution"("ruleId");
CREATE INDEX "AutomationExecution_status_idx" ON "AutomationExecution"("status");
CREATE INDEX "AutomationExecution_source_idx" ON "AutomationExecution"("source");
CREATE INDEX "AutomationExecution_createdAt_idx" ON "AutomationExecution"("createdAt");

ALTER TABLE "AutomationRule"
  ADD CONSTRAINT "AutomationRule_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AutomationTrigger"
  ADD CONSTRAINT "AutomationTrigger_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutomationSchedule"
  ADD CONSTRAINT "AutomationSchedule_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutomationExecution"
  ADD CONSTRAINT "AutomationExecution_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
