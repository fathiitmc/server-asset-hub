import { notFound } from "next/navigation";
import {
  deleteAutomationRuleAction,
  disableAutomationRuleAction,
  pauseAutomationRuleAction,
  resumeAutomationRuleAction,
  runAutomationRuleAction,
  updateAutomationRuleAction,
} from "@/app/automation/actions";
import { AppShell } from "@/components/app-shell";
import {
  AutomationBadge,
  automationSeverityClasses,
  automationStatusClasses,
  formatAutomationLabel,
  formatAutomationTime,
} from "@/components/automation/automation-badges";
import {
  AutomationExecutionTable,
  AutomationExecutionTimeline,
} from "@/components/automation/automation-execution-table";
import { AutomationRuleForm } from "@/components/automation/automation-rule-form";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { getAutomationRuleById } from "@/src/lib/automation/automation-foundation";
import { describeSchedulerBoundary } from "@/src/lib/automation/scheduler-foundation";
import { hasPermission, requirePermission } from "@/src/lib/rbac/permissions";
import { listTeams } from "@/src/lib/rbac/teams";

type AutomationRulePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AutomationRulePage({
  params,
}: AutomationRulePageProps) {
  const user = await requirePermission("automation:view");
  const { id } = await params;
  const rule = await getAutomationRuleById(id);

  if (!rule) {
    notFound();
  }

  const canManage = hasPermission(user.role, "automation:manage");
  const teams = canManage ? await listTeams() : [];
  const updateAction = updateAutomationRuleAction.bind(null, rule.id);
  const runAction = runAutomationRuleAction.bind(null, rule.id);
  const pauseAction = pauseAutomationRuleAction.bind(null, rule.id);
  const resumeAction = resumeAutomationRuleAction.bind(null, rule.id);
  const disableAction = disableAutomationRuleAction.bind(null, rule.id);
  const deleteAction = deleteAutomationRuleAction.bind(null, rule.id);
  const schedulerBoundary = describeSchedulerBoundary();

  return (
    <AppShell>
      <PageHeader
        title={rule.name}
        description="Automation rule detail, lifecycle controls, execution history, and scheduler foundation."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="premium-panel rounded-2xl p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Automation rule
                </p>
                <h2 className="mt-2 text-lg font-semibold text-zinc-950">
                  {formatAutomationLabel(rule.category)}
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {rule.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AutomationBadge className={automationStatusClasses[rule.status]}>
                  {formatAutomationLabel(rule.status)}
                </AutomationBadge>
                <AutomationBadge className={automationSeverityClasses[rule.severity]}>
                  {formatAutomationLabel(rule.severity)}
                </AutomationBadge>
              </div>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Meta label="Owner" value={rule.owner} />
              <Meta label="Team" value={rule.teamName} />
              <Meta
                label="Escalation"
                value={rule.escalationOwner || "Unassigned"}
              />
              <Meta label="Trigger" value={formatAutomationLabel(rule.triggerType)} />
              <Meta label="Last run" value={formatAutomationTime(rule.lastRun)} />
              <Meta label="Next run" value={formatAutomationTime(rule.nextRun)} />
              <Meta label="Created by" value={rule.createdBy} />
              <Meta label="Updated by" value={rule.updatedBy} />
            </dl>
            <div className="mt-5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3">
              <p className="text-sm font-semibold text-zinc-950">Safe action</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                {rule.action}
              </p>
            </div>
          </section>

          {canManage ? (
            <AutomationRuleForm
              action={updateAction}
              rule={rule}
              teams={teams}
              submitLabel="Save rule"
            />
          ) : (
            <section className="premium-panel rounded-2xl p-5">
              <h2 className="text-base font-semibold text-zinc-950">
                Management restricted
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Your role can view automation state and execution history, but
                rule management requires automation management permission.
              </p>
            </section>
          )}

          <section className="premium-panel rounded-2xl p-5">
            <SectionTitle
              title="Execution history"
              description="Persistent execution records with result, logs, source, actor, and duration."
            />
            <div className="mt-4">
              <AutomationExecutionTable executions={rule.executions} />
            </div>
          </section>

          <section className="premium-panel rounded-2xl p-5">
            <SectionTitle
              title="Execution timeline"
              description="Operational timeline foundation for this automation rule."
            />
            <div className="mt-4">
              {rule.executions.length > 0 ? (
                <AutomationExecutionTimeline executions={rule.executions} />
              ) : (
                <p className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-4 text-sm text-zinc-500">
                  Execution records will appear after a manual run or future
                  scheduler record.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="premium-panel rounded-2xl p-5">
            <SectionTitle
              title="Lifecycle controls"
              description="State changes are audited and do not execute infrastructure actions."
            />
            {canManage ? (
              <div className="mt-4 space-y-3">
                <form action={runAction}>
                  <SubmitButton pendingLabel="Recording run...">
                    Run safe preview
                  </SubmitButton>
                </form>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <form action={rule.status === "ACTIVE" ? pauseAction : resumeAction}>
                    <SubmitButton pendingLabel="Updating...">
                      {rule.status === "ACTIVE" ? "Pause" : "Resume"}
                    </SubmitButton>
                  </form>
                  <form action={disableAction}>
                    <SubmitButton variant="danger" pendingLabel="Disabling...">
                      Disable
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 text-sm text-zinc-500">
                Lifecycle controls require automation management permission.
              </p>
            )}
          </section>

          <section className="premium-panel rounded-2xl p-5">
            <SectionTitle
              title="Scheduler boundary"
              description="Lightweight scheduler abstraction only."
            />
            <div className="mt-4 space-y-2">
              <Meta label="Mode" value={schedulerBoundary.mode} />
              <Meta label="Queue" value={schedulerBoundary.queue} />
              <Meta label="Workers" value={schedulerBoundary.workers} />
            </div>
          </section>

          <section className="rounded-2xl border border-red-200 bg-red-50/80 p-5">
            <h2 className="text-sm font-semibold text-red-950">
              Protected delete
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              Delete is safe-delete only: the rule is disabled, hidden from
              active views, and audited.
            </p>
            {canManage ? (
              <form action={deleteAction} className="mt-4">
                <SubmitButton variant="danger" pendingLabel="Deleting...">
                  Safe delete rule
                </SubmitButton>
              </form>
            ) : null}
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-zinc-950">
        {value || "Not set"}
      </dd>
    </div>
  );
}
