import type {
  AutomationExecutionStatus,
  AutomationSeverity,
} from "@prisma/client";
import type { AutomationRuleStatus } from "@/src/lib/automation/automation-foundation";

export const automationStatusClasses: Record<AutomationRuleStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PAUSED: "bg-amber-50 text-amber-800 ring-amber-200",
  DRAFT: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  FAILED: "bg-rose-950 text-rose-50 ring-rose-900",
  DISABLED: "bg-red-50 text-red-700 ring-red-200",
};

export const automationSeverityClasses: Record<AutomationSeverity, string> = {
  LOW: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  MEDIUM: "bg-amber-50 text-amber-800 ring-amber-200",
  HIGH: "bg-orange-50 text-orange-800 ring-orange-200",
  CRITICAL: "bg-rose-950 text-rose-50 ring-rose-900",
};

export const executionStatusClasses: Record<AutomationExecutionStatus, string> = {
  QUEUED: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  RUNNING: "bg-sky-50 text-sky-700 ring-sky-200",
  SUCCEEDED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FAILED: "bg-red-50 text-red-700 ring-red-200",
  SKIPPED: "bg-amber-50 text-amber-800 ring-amber-200",
  BLOCKED: "bg-rose-950 text-rose-50 ring-rose-900",
};

export function AutomationBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export function formatAutomationLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatAutomationTime(value: string) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
