import type { AssetRuntimeHealthStatus } from "@/src/lib/monitoring/health";

const badgeClasses: Record<AssetRuntimeHealthStatus, string> = {
  ONLINE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DEGRADED: "bg-amber-50 text-amber-800 ring-amber-200",
  OFFLINE: "bg-red-50 text-red-700 ring-red-200",
  UNKNOWN: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

const dotClasses: Record<AssetRuntimeHealthStatus, string> = {
  ONLINE: "bg-emerald-500",
  DEGRADED: "bg-amber-500",
  OFFLINE: "bg-red-500",
  UNKNOWN: "bg-zinc-400",
};

export function HealthBadge({ status }: { status: AssetRuntimeHealthStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${badgeClasses[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[status]}`} />
      {status}
    </span>
  );
}
