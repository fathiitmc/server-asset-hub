import Link from "next/link";
import type {
  AutomationRuleSummary,
  AutomationSection,
} from "@/src/lib/automation/automation-foundation";
import type { SchedulerCandidate } from "@/src/lib/automation/scheduler-foundation";
import {
  AutomationBadge,
  automationSeverityClasses,
  automationStatusClasses,
  formatAutomationLabel,
  formatAutomationTime,
} from "./automation-badges";

type AutomationWorkspaceProps = {
  rules: AutomationRuleSummary[];
  sections: AutomationSection[];
  summary: {
    total: number;
    active: number;
    draft: number;
    paused: number;
    critical: number;
  };
  schedulerCandidates: SchedulerCandidate[];
  canManage: boolean;
};

export function AutomationWorkspace({
  rules,
  sections,
  summary,
  schedulerCandidates,
  canManage,
}: AutomationWorkspaceProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Rules" value={summary.total.toString()} detail="Persistent automation rules" />
        <MetricCard label="Active" value={summary.active.toString()} detail="Eligible for safe execution" />
        <MetricCard label="Draft" value={summary.draft.toString()} detail="Designed, not active" />
        <MetricCard label="Paused" value={summary.paused.toString()} detail="Temporarily stopped" />
        <MetricCard label="Critical" value={summary.critical.toString()} detail="Escalation severity" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="premium-panel rounded-2xl p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle
              eyebrow="Rules"
              title="Automation rules"
              description="Database-backed governance automations for operational visibility and safe execution history."
            />
            <span className="w-fit rounded-lg bg-zinc-950 px-2 py-1 text-xs font-medium text-white">
              {canManage ? "Manage ready" : "View only"}
            </span>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80">
            <table className="min-w-full divide-y divide-zinc-200/80 text-sm">
              <thead className="bg-zinc-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Rule</th>
                  <th className="px-4 py-3">Trigger</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Next run</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rules.map((rule) => (
                  <tr key={rule.id} className="transition hover:bg-zinc-50/80">
                    <td className="px-4 py-4">
                      <Link
                        href={`/automation/${rule.id}`}
                        className="font-semibold text-zinc-950 hover:text-zinc-700"
                      >
                        {rule.name}
                      </Link>
                      <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">
                        {rule.action}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-zinc-700">{rule.trigger}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatAutomationLabel(rule.triggerType)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200">
                        {rule.owner}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <AutomationBadge className={automationStatusClasses[rule.status]}>
                        {formatAutomationLabel(rule.status)}
                      </AutomationBadge>
                    </td>
                    <td className="px-4 py-4 text-zinc-600">
                      {formatAutomationTime(rule.nextRun)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/automation/${rule.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-panel rounded-2xl p-5">
            <SectionTitle
              eyebrow="Scheduler"
              title="Scheduler foundation"
              description="Readiness snapshot only. No worker or external queue is active."
            />
            <div className="mt-4 space-y-3">
              {schedulerCandidates.length > 0 ? (
                schedulerCandidates.slice(0, 5).map((candidate) => (
                  <div
                    key={`${candidate.ruleId}-${candidate.scheduleId}`}
                    className="rounded-xl border border-zinc-200/80 bg-white/75 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">
                          {candidate.ruleName}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {candidate.cadence} / {formatAutomationTime(candidate.nextRunAt)}
                        </p>
                      </div>
                      <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200">
                        {candidate.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyBlock
                  title="No schedules yet"
                  detail="Scheduled triggers will appear here after rules define cadence."
                />
              )}
            </div>
          </div>

          <div className="premium-panel rounded-2xl p-5">
            <SectionTitle
              eyebrow="Safety"
              title="Execution boundary"
              description="Automation executions are informational and governance-oriented only."
            />
            <div className="mt-4 space-y-3">
              <SafetyItem title="No external queue" detail="No Redis, BullMQ, Temporal, n8n, or worker process added." />
              <SafetyItem title="No destructive actions" detail="Rules cannot mutate infrastructure, deploy, or remediate." />
              <SafetyItem title="Audit visible" detail="Every execution writes execution history and an operational event." />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <AutomationSectionCard key={section.title} section={section} />
        ))}
      </section>
    </div>
  );
}

function AutomationSectionCard({ section }: { section: AutomationSection }) {
  return (
    <div className="premium-panel rounded-2xl p-5">
      <SectionTitle
        eyebrow="Category"
        title={section.title}
        description={section.description}
      />
      <div className="mt-4 space-y-3">
        {section.rules.length > 0 ? (
          section.rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-zinc-200/80 bg-white/75 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/automation/${rule.id}`}
                    className="text-sm font-semibold text-zinc-950 hover:text-zinc-700"
                  >
                    {rule.name}
                  </Link>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {rule.trigger}
                  </p>
                </div>
                <AutomationBadge className={automationSeverityClasses[rule.severity]}>
                  {formatAutomationLabel(rule.severity)}
                </AutomationBadge>
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-600">
                {rule.description}
              </p>
            </div>
          ))
        ) : (
          <EmptyBlock title="No rules" detail="Rules in this category will appear here." />
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="premium-panel rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">
        {title}
      </h2>
      <p className="mt-1 text-sm text-zinc-600">{description}</p>
    </div>
  );
}

function SafetyItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/75 p-3">
      <p className="text-sm font-semibold text-zinc-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
    </div>
  );
}

function EmptyBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-4">
      <p className="text-sm font-semibold text-zinc-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
    </div>
  );
}
