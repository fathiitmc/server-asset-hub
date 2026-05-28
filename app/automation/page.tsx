import { AppShell } from "@/components/app-shell";
import { AutomationWorkspace } from "@/components/automation/automation-workspace";
import { PageHeader } from "@/components/page-header";
import {
  getAutomationSections,
  getAutomationSummary,
  listAutomationRules,
} from "@/src/lib/automation/automation-foundation";
import { getSchedulerCandidates } from "@/src/lib/automation/scheduler-foundation";
import { hasPermission, requirePermission } from "@/src/lib/rbac/permissions";

export default async function AutomationPage() {
  const user = await requirePermission("automation:view");
  const rules = await listAutomationRules();
  const canManage = hasPermission(user.role, "automation:manage");

  return (
    <AppShell>
      <PageHeader
        title="Automation"
        description="Infrastructure automation foundations for scheduled checks, renewal reminders, escalation workflows, and operational reviews."
        action={canManage ? { href: "/automation/new", label: "Create rule" } : undefined}
      />
      <AutomationWorkspace
        rules={rules}
        sections={getAutomationSections(rules)}
        summary={getAutomationSummary(rules)}
        schedulerCandidates={getSchedulerCandidates(rules)}
        canManage={canManage}
      />
    </AppShell>
  );
}
