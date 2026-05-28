import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TeamGovernanceDashboard } from "@/components/teams/team-governance-dashboard";
import { requirePermission } from "@/src/lib/rbac/permissions";
import { listTeams } from "@/src/lib/rbac/teams";

export default async function TeamsPage() {
  const user = await requirePermission("teams:view");
  const teams = await listTeams();

  return (
    <AppShell>
      <PageHeader
        title="Teams"
        description="Role-aware governance, operational ownership, and team boundaries for infrastructure operations."
      />
      <TeamGovernanceDashboard user={user} teams={teams} />
    </AppShell>
  );
}
