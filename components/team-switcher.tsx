import type { GovernanceUser } from "@/src/lib/rbac/permissions";
import { roleLabel } from "@/src/lib/rbac/permissions";

const roleClasses = {
  SUPER_ADMIN: "bg-zinc-950 text-white ring-zinc-950",
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
  OPERATOR: "bg-sky-50 text-sky-700 ring-sky-200",
  FINANCE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  VIEWER: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export function TeamSwitcher({ user }: { user: GovernanceUser | null }) {
  const primaryTeam = user?.memberships[0]?.team;

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-zinc-500">
            Workspace
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-zinc-950">
            {primaryTeam?.name ?? "ServerAssetHub"}
          </p>
        </div>
        {user ? (
          <span
            className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${roleClasses[user.role]}`}
          >
            {roleLabel(user.role)}
          </span>
        ) : null}
      </div>
      <p className="mt-2 truncate text-xs text-zinc-500">
        {user?.email ?? "No active session"}
      </p>
    </div>
  );
}
