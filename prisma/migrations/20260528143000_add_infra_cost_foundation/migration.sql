CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME');

ALTER TABLE "Asset"
  ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'YEARLY',
  ADD COLUMN "monthlyCost" DECIMAL(12,2),
  ADD COLUMN "yearlyCost" DECIMAL(12,2),
  ADD COLUMN "oneTimeCost" DECIMAL(12,2),
  ADD COLUMN "billingAccount" TEXT,
  ADD COLUMN "costCenter" TEXT,
  ADD COLUMN "costNotes" TEXT;

UPDATE "Asset"
SET
  "yearlyCost" = "estimatedCost",
  "monthlyCost" = ROUND(("estimatedCost" / 12), 2)
WHERE "yearlyCost" IS NULL;
