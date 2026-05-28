import type {
  OperationalEventSeverity,
  OperationalEventSource,
  OperationalEventType,
} from "@prisma/client";

export type OperationalEventSummary = {
  id: string;
  assetId: string | null;
  assetName: string | null;
  eventType: OperationalEventType;
  severity: OperationalEventSeverity;
  title: string;
  description: string;
  metadata: Record<string, unknown> | null;
  actor: string | null;
  source: OperationalEventSource;
  createdAt: string;
};

export const operationalEventLabels: Record<OperationalEventType, string> = {
  ASSET_CREATED: "Asset created",
  ASSET_UPDATED: "Asset updated",
  ASSET_DELETED: "Asset deleted",
  ALERT_TRIGGERED: "Alert triggered",
  ALERT_ACKNOWLEDGED: "Alert acknowledged",
  SSL_EXPIRY_DETECTED: "SSL expiry detected",
  HEALTH_CHECK_RUN: "Health check run",
  HEALTH_DEGRADED: "Health degraded",
  RUNTIME_OFFLINE: "Runtime offline",
  RUNTIME_ONLINE: "Runtime online",
  CREDENTIAL_CREATED: "Credential created",
  CREDENTIAL_UPDATED: "Credential updated",
  CREDENTIAL_DELETED: "Credential deleted",
  ATTACHMENT_ADDED: "Attachment added",
  ATTACHMENT_DELETED: "Attachment deleted",
  ASSET_ARCHIVED: "Asset archived",
  ASSET_RESTORED: "Asset restored",
  ASSET_SOFT_DELETED: "Asset soft deleted",
  ASSET_PERMANENT_DELETE_ATTEMPT: "Permanent delete attempted",
  LIFECYCLE_STATE_CHANGED: "Lifecycle changed",
  AUTOMATION_RULE_CREATED: "Automation rule created",
  AUTOMATION_RULE_UPDATED: "Automation rule updated",
  AUTOMATION_RULE_DISABLED: "Automation rule disabled",
  AUTOMATION_RULE_DELETED: "Automation rule deleted",
  AUTOMATION_EXECUTION_RECORDED: "Automation execution recorded",
  SYSTEM_SEEDED: "Timeline seeded",
};

export const eventSeverityClasses: Record<OperationalEventSeverity, string> = {
  INFO: "bg-sky-50 text-sky-700 ring-sky-200",
  WARNING: "bg-amber-50 text-amber-800 ring-amber-200",
  CRITICAL: "bg-red-50 text-red-700 ring-red-200",
};

export const eventSeverityDotClasses: Record<OperationalEventSeverity, string> = {
  INFO: "bg-sky-500",
  WARNING: "bg-amber-500",
  CRITICAL: "bg-red-600",
};

export const eventSourceClasses: Record<OperationalEventSource, string> = {
  SYSTEM: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  USER: "bg-violet-50 text-violet-700 ring-violet-200",
  MONITOR: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ALERT_ENGINE: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getOperationalEventIcon(type: OperationalEventType) {
  if (type.includes("ALERT") || type === "RUNTIME_OFFLINE") return "!";
  if (type.includes("HEALTH") || type === "RUNTIME_ONLINE") return "+";
  if (type.includes("CREDENTIAL")) return "K";
  if (type.includes("ATTACHMENT")) return "F";
  if (type.includes("ARCHIVED")) return "A";
  if (type.includes("RESTORED")) return "R";
  if (type.includes("LIFECYCLE")) return "L";
  if (type.includes("AUTOMATION")) return "W";
  if (type.includes("DELETED")) return "-";
  return "*";
}
