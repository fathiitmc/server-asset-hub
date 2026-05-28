import Link from "next/link";
import {
  automationCategories,
  automationSeverities,
  automationStatuses,
  automationTriggerTypes,
  type AutomationRuleSummary,
} from "@/src/lib/automation/automation-foundation";
import type { TeamSummary } from "@/src/lib/rbac/teams";
import { SubmitButton } from "../submit-button";
import { formatAutomationLabel } from "./automation-badges";

type AutomationRuleFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  rule?: AutomationRuleSummary;
  teams: TeamSummary[];
  submitLabel: string;
};

const inputClass =
  "premium-field mt-2 block w-full rounded-xl px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10";

export function AutomationRuleForm({
  action,
  rule,
  teams,
  submitLabel,
}: AutomationRuleFormProps) {
  const trigger = rule?.triggers[0];
  const schedule = rule?.schedules[0];

  return (
    <form action={action} className="premium-panel rounded-2xl p-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Name" name="name" defaultValue={rule?.name} required />
        <Select label="Status" name="status" defaultValue={rule?.status ?? "DRAFT"}>
          {automationStatuses.map((status) => (
            <option key={status} value={status}>
              {formatAutomationLabel(status)}
            </option>
          ))}
        </Select>
        <Select
          label="Operational category"
          name="category"
          defaultValue={rule?.category ?? "SCHEDULED_CHECKS"}
        >
          {automationCategories.map((category) => (
            <option key={category} value={category}>
              {formatAutomationLabel(category)}
            </option>
          ))}
        </Select>
        <Select
          label="Severity"
          name="severity"
          defaultValue={rule?.severity ?? "MEDIUM"}
        >
          {automationSeverities.map((severity) => (
            <option key={severity} value={severity}>
              {formatAutomationLabel(severity)}
            </option>
          ))}
        </Select>
        <Field label="Owner" name="owner" defaultValue={rule?.owner} required />
        <Field
          label="Escalation owner"
          name="escalationOwner"
          defaultValue={rule?.escalationOwner}
        />
        <Select label="Team" name="teamId" defaultValue={rule?.teamId ?? ""}>
          <option value="">Unassigned</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
        <Select
          label="Trigger type"
          name="triggerType"
          defaultValue={trigger?.type ?? rule?.triggerType ?? "MANUAL"}
        >
          {automationTriggerTypes.map((type) => (
            <option key={type} value={type}>
              {formatAutomationLabel(type)}
            </option>
          ))}
        </Select>
        <Field
          label="Trigger"
          name="triggerLabel"
          defaultValue={trigger?.label ?? rule?.trigger}
          required
        />
        <Field
          label="Schedule cadence"
          name="scheduleCadence"
          defaultValue={schedule?.cadence ?? ""}
        />
        <Field
          label="Schedule timezone"
          name="scheduleTimezone"
          defaultValue={schedule?.timezone ?? "UTC"}
        />
        <Field
          label="Next run"
          name="scheduleNextRunAt"
          type="datetime-local"
          defaultValue={datetimeLocal(schedule?.nextRunAt)}
        />
      </div>
      <label className="mt-5 block text-sm font-medium text-zinc-700">
        Description
        <textarea
          name="description"
          rows={3}
          defaultValue={rule?.description}
          required
          className={inputClass}
        />
      </label>
      <label className="mt-5 block text-sm font-medium text-zinc-700">
        Safe action
        <textarea
          name="action"
          rows={3}
          defaultValue={rule?.action}
          required
          className={inputClass}
        />
      </label>
      <div className="mt-5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3">
        <p className="text-sm font-semibold text-zinc-950">
          Execution boundary
        </p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Rules may record history, evaluate schedules, and create audit
          visibility. They cannot mutate infrastructure, deploy, or remediate.
        </p>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={rule ? `/automation/${rule.id}` : "/automation"}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300/80 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className={inputClass}
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <select name={name} defaultValue={defaultValue} className={inputClass}>
        {children}
      </select>
    </label>
  );
}

function datetimeLocal(value: string | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}
