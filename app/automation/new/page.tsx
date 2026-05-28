import { createAutomationRuleAction } from "@/app/automation/actions";
import { AppShell } from "@/components/app-shell";
import { AutomationRuleForm } from "@/components/automation/automation-rule-form";
import { PageHeader } from "@/components/page-header";
import { requirePermission } from "@/src/lib/rbac/permissions";
import { listTeams } from "@/src/lib/rbac/teams";

export default async function NewAutomationRulePage() {
  await requirePermission("automation:manage");
  const teams = await listTeams();

  return (
    <AppShell>
      <PageHeader
        title="Create automation rule"
        description="Create a governance-safe automation rule. Execution remains informational and audit-first."
      />
      <AutomationRuleForm
        action={createAutomationRuleAction}
        teams={teams}
        submitLabel="Create rule"
      />
    </AppShell>
  );
}
