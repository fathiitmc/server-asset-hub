import type { AssetCostProfile } from "@/src/lib/cost-engine/cost-engine";
import { getAssetFinancialIndicators } from "@/src/lib/cost-engine/cost-engine";
import { formatDate, formatMoney } from "@/components/assets-table";

type AssetFinancialPanelProps = {
  profile: AssetCostProfile;
};

const riskClasses: Record<AssetCostProfile["renewalRisk"], string> = {
  HEALTHY: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  UPCOMING: "bg-amber-50 text-amber-800 ring-amber-200",
  URGENT: "bg-orange-50 text-orange-800 ring-orange-200",
  OVERDUE: "bg-rose-950 text-rose-50 ring-rose-900",
};

export function AssetFinancialPanel({ profile }: AssetFinancialPanelProps) {
  const indicators = getAssetFinancialIndicators(profile);

  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Financial intelligence
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">
            Ownership cost and renewal posture
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Billing metadata, forecast contribution, and asset-level FinOps
            signals.
          </p>
        </div>
        <span
          className={`w-fit rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${riskClasses[profile.renewalRisk]}`}
        >
          {profile.renewalRisk.replace("_", " ")}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Monthly burn"
          value={formatMoney(profile.monthlyRecurring, profile.currency)}
        />
        <Metric
          label="Yearly ownership"
          value={formatMoney(profile.yearlyRecurring, profile.currency)}
        />
        <Metric
          label="One-time cost"
          value={formatMoney(profile.oneTimeCost, profile.currency)}
        />
        <Metric label="Billing cycle" value={profile.billingCycle.replace("_", " ")} />
      </dl>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoItem
          label="Renewal date"
          value={formatDate(profile.nextRenewalDate)}
          detail={
            profile.daysUntilRenewal === null
              ? "No renewal window"
              : `${profile.daysUntilRenewal} days`
          }
        />
        <InfoItem
          label="Billing account"
          value={profile.asset.billingAccount || "Not mapped"}
          detail="Provider billing mapping"
        />
        <InfoItem
          label="Cost center"
          value={profile.asset.costCenter || "Unassigned"}
          detail="Operational budget ownership"
        />
      </div>

      {indicators.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
          <p className="text-sm font-semibold text-zinc-950">
            Asset cost signals
          </p>
          <div className="mt-3 space-y-2">
            {indicators.map((indicator) => (
              <div
                key={indicator.id}
                className="rounded-xl border border-zinc-200/80 bg-white/80 p-3"
              >
                <p className="text-sm font-semibold text-zinc-950">
                  {indicator.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-600">
                  {indicator.description}
                </p>
                <p className="mt-2 text-xs font-medium text-zinc-500">
                  {indicator.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {profile.asset.costNotes ? (
        <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Cost notes
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {profile.asset.costNotes}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-zinc-950">
        {value}
      </dd>
    </div>
  );
}

function InfoItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-zinc-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}
