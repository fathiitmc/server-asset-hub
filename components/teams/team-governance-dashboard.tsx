import type { GovernanceUser } from "@/src/lib/rbac/permissions";
import { getRolePermissions, roleLabel } from "@/src/lib/rbac/permissions";
import type { TeamSummary } from "@/src/lib/rbac/teams";

type TeamGovernanceDashboardProps = {
  user: GovernanceUser;
  teams: TeamSummary[];
};

const roleClasses: Record<GovernanceUser["role"], string> = {
  SUPER_ADMIN: "bg-zinc-950 text-white ring-zinc-950",
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
  OPERATOR: "bg-sky-50 text-sky-700 ring-sky-200",
  FINANCE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  VIEWER: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export function TeamGovernanceDashboard({
  user,
  teams,
}: TeamGovernanceDashboardProps) {
  const permissions = getRolePermissions(user.role);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Active role"
          value={roleLabel(user.role)}
          detail={`${permissions.length} platform permissions`}
        />
        <MetricCard
          label="Teams"
          value={String(teams.length)}
          detail="Operational ownership groups"
        />
        <MetricCard
          label="Memberships"
          value={String(user.memberships.length)}
          detail="Teams assigned to current user"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="premium-panel rounded-2xl p-5">
          <SectionTitle
            eyebrow="Teams"
            title="Operational ownership"
            description="Workspace groups for infrastructure, finance, security, and escalation boundaries."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-2xl border border-zinc-200/80 bg-white/75 p-4 shadow-sm shadow-zinc-950/[0.03]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-zinc-950">
                      {team.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                      {team.description || "No description"}
                    </p>
                  </div>
                  <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200">
                    {team.assetCount} assets
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2">
                  <InfoItem label="Members" value={String(team.memberCount)} />
                  <InfoItem label="Owner" value={team.ownerEmail} />
                </dl>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-panel rounded-2xl p-5">
            <SectionTitle
              eyebrow="Access"
              title="Role permissions"
              description="Effective platform capabilities for the current session."
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${roleClasses[user.role]}`}
              >
                {roleLabel(user.role)}
              </span>
              {permissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>

          <div className="premium-panel rounded-2xl p-5">
            <SectionTitle
              eyebrow="Governance"
              title="Policy boundaries"
              description="Lightweight RBAC controls already enforced by server-side checks."
            />
            <div className="mt-4 space-y-3">
              <PolicyItem
                title="Finance visibility"
                description="Restricted to SUPER_ADMIN, ADMIN, and FINANCE roles."
              />
              <PolicyItem
                title="Deletion"
                description="Restricted to SUPER_ADMIN and ADMIN roles."
              />
              <PolicyItem
                title="Operational edits"
                description="Allowed for SUPER_ADMIN, ADMIN, and OPERATOR roles."
              />
              <PolicyItem
                title="Audit visibility"
                description="Reserved for governance roles with audit permissions."
              />
            </div>
          </div>
        </div>
      </section>
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-zinc-950">
        {value}
      </dd>
    </div>
  );
}

function PolicyItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/75 p-3">
      <p className="text-sm font-semibold text-zinc-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
    </div>
  );
}
