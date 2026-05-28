import type { AssetStatus } from "@/lib/assets";

const statusClasses: Record<AssetStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EXPIRED: "bg-red-50 text-red-700 ring-red-200",
  RENEW_SOON: "bg-amber-50 text-amber-800 ring-amber-200",
  ARCHIVED: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
