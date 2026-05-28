CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'FINANCE', 'VIEWER');
CREATE TYPE "TeamMemberRole" AS ENUM ('OWNER', 'MEMBER', 'VIEWER');

ALTER TABLE "User"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'VIEWER';

ALTER TABLE "Asset"
  ADD COLUMN "teamId" TEXT,
  ADD COLUMN "operationalOwner" TEXT,
  ADD COLUMN "financeOwner" TEXT,
  ADD COLUMN "renewalOwner" TEXT,
  ADD COLUMN "escalationOwner" TEXT;

CREATE TABLE "Team" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamMembership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");
CREATE INDEX "Team_ownerId_idx" ON "Team"("ownerId");
CREATE UNIQUE INDEX "TeamMembership_userId_teamId_key" ON "TeamMembership"("userId", "teamId");
CREATE INDEX "TeamMembership_teamId_idx" ON "TeamMembership"("teamId");
CREATE INDEX "Asset_teamId_idx" ON "Asset"("teamId");

ALTER TABLE "Team"
  ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TeamMembership"
  ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Asset"
  ADD CONSTRAINT "Asset_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "User"
SET "role" = 'SUPER_ADMIN'
WHERE "email" = 'admin@serverassethub.local';

INSERT INTO "Team" ("id", "name", "slug", "description", "ownerId", "updatedAt")
SELECT 'team_infrastructure', 'Infrastructure', 'infrastructure', 'Core server, cloud, and platform ownership.', "id", CURRENT_TIMESTAMP
FROM "User"
WHERE "email" = 'admin@serverassethub.local'
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Team" ("id", "name", "slug", "description", "ownerId", "updatedAt")
SELECT 'team_devops', 'DevOps', 'devops', 'Runtime, deployment, and monitoring operations.', "id", CURRENT_TIMESTAMP
FROM "User"
WHERE "email" = 'admin@serverassethub.local'
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Team" ("id", "name", "slug", "description", "ownerId", "updatedAt")
SELECT 'team_security', 'Security', 'security', 'Credentials, access review, and security posture.', "id", CURRENT_TIMESTAMP
FROM "User"
WHERE "email" = 'admin@serverassethub.local'
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Team" ("id", "name", "slug", "description", "ownerId", "updatedAt")
SELECT 'team_finance', 'Finance', 'finance', 'FinOps, renewals, provider billing, and budgets.', "id", CURRENT_TIMESTAMP
FROM "User"
WHERE "email" = 'admin@serverassethub.local'
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Team" ("id", "name", "slug", "description", "ownerId", "updatedAt")
SELECT 'team_operations', 'Operations', 'operations', 'Incident response, escalation, and continuity.', "id", CURRENT_TIMESTAMP
FROM "User"
WHERE "email" = 'admin@serverassethub.local'
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "TeamMembership" ("id", "userId", "teamId", "role")
SELECT 'membership_admin_' || "Team"."slug", "User"."id", "Team"."id", 'OWNER'
FROM "User"
CROSS JOIN "Team"
WHERE "User"."email" = 'admin@serverassethub.local'
ON CONFLICT ("userId", "teamId") DO NOTHING;
