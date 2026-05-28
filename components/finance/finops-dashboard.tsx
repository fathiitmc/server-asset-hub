import Link from "next/link";
import type {
  CostBreakdown,
  CostForecastMonth,
  CostInsight,
  FinOpsSummary,
} from "@/src/lib/cost-engine/cost-engine";
import { formatDate, formatMoney } from "@/components/assets-table";

type FinOpsDashboardProps = {
  summary: FinOpsSummary;
};

const insightClasses: Record<CostInsight["severity"], string> = {
  INFO: "bg-sky-50 text-sky-700 ring-sky-200",
  WARNING: "bg-amber-50 text-amber-800 ring-amber-200",
  CRITICAL: "bg-rose-950 text-rose-50 ring-rose-900",
};

export function FinOpsDashboard({ summary }: FinOpsDashboardProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Monthly burn"
          value={formatMoney(summary.monthlyBurn, summary.currency)}
          detail={`${summary.assetCount} assets in cost scope`}
        />
        <MetricCard
          label="Yearly projection"
          value={formatMoney(summary.yearlyProjection, summary.currency)}
          detail="Recurring ownership forecast"
        />
        <MetricCard
          label="Renewals in 60 days"
          value={formatMoney(summary.renewalForecast60d, summary.currency)}
          detail={`${summary.upcomingPayments.length} upcoming payments`}
        />
        <MetricCard
          label="One-time exposure"
          value={formatMoney(summary.oneTimeExposure, summary.currency)}
          detail="Capitalized or setup spend"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="premium-panel rounded-2xl p-5">
          <SectionTitle
            eyebrow="Forecast"
            title="12-month spend projection"
            description="Recurring monthly burn plus renewal pressure by month."
          />
          <ForecastChart
            forecast={summary.forecast}
            currency={summary.currency}
          />
        </div>
        <div className="premium-panel rounded-2xl p-5">
          <SectionTitle
            eyebrow="Attention"
            title="Cost intelligence"
            description="Rule-based FinOps signals requiring operational review."
          />
          <div className="mt-4 space-y-3">
            {summary.insights.length > 0 ? (
              summary.insights.map((insight) => (
                <InsightItem key={insight.id} insight={insight} />
              ))
            ) : (
              <EmptyState
                title="No active cost signals"
                description="Cost anomalies, renewal pressure, and spend concentration will appear here."
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <BreakdownPanel
          title="Provider spending"
          description="Annualized spend concentration by provider."
          items={summary.providerSpend}
          currency={summary.currency}
        />
        <BreakdownPanel
          title="Category analytics"
          description="Spend distribution across infrastructure types."
          items={summary.categorySpend}
          currency={summary.currency}
        />
        <BreakdownPanel
          title="Environment spend"
          description="Production and non-production cost posture."
          items={summary.environmentSpend}
          currency={summary.currency}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="premium-panel rounded-2xl p-5">
          <SectionTitle
            eyebrow="Renewals"
            title="Upcoming payments"
            description="Near-term payments and ownership continuity windows."
          />
          <div className="mt-4 space-y-2">
            {summary.upcomingPayments.length > 0 ? (
              summary.upcomingPayments.slice(0, 8).map((profile) => (
                <Link
                  key={profile.asset.id}
                  href={`/assets/${profile.asset.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/70 bg-white/75 p-3 transition hover:border-zinc-300 hover:bg-white"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-zinc-950">
                      {profile.asset.name}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {formatDate(profile.nextRenewalDate)} /{" "}
                      {profile.daysUntilRenewal} days
                    </span>
                  </span>
                  <span className="text-right text-sm font-semibold text-zinc-950">
                    {formatMoney(profile.yearlyRecurring, profile.currency)}
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState
                title="No renewals in the next 60 days"
                description="Upcoming provider payments will be tracked here."
              />
            )}
          </div>
        </div>
        <div className="premium-panel rounded-2xl p-5">
          <SectionTitle
            eyebrow="Assets"
            title="Top expensive infrastructure"
            description="Highest annualized ownership costs across the asset base."
          />
          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80">
            <table className="min-w-full divide-y divide-zinc-200/80 text-sm">
              <thead className="bg-zinc-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3 text-right">Annualized</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {summary.topExpensiveAssets.map((profile) => (
                  <tr key={profile.asset.id} className="hover:bg-zinc-50/80">
                    <td className="px-4 py-3">
                      <Link
                        href={`/assets/${profile.asset.id}`}
                        className="font-semibold text-zinc-950 hover:text-zinc-700"
                      >
                        {profile.asset.name}
                      </Link>
                      <p className="mt-1 text-xs text-zinc-500">
                        {profile.asset.environment} / {profile.asset.type}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {profile.asset.provider}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {profile.billingCycle.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-950">
                      {formatMoney(profile.annualizedCost, profile.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

function ForecastChart({
  forecast,
  currency,
}: {
  forecast: CostForecastMonth[];
  currency: string;
}) {
  const max = Math.max(...forecast.map((month) => month.projected), 1);

  return (
    <div className="mt-6">
      <div className="flex h-56 items-end gap-2 rounded-2xl border border-zinc-200/80 bg-white/70 p-4">
        {forecast.map((month) => {
          const height = Math.max(8, (month.projected / max) * 100);

          return (
            <div key={month.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="group relative flex flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-zinc-950 transition group-hover:bg-zinc-700"
                  style={{ height: `${height}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-zinc-950 px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
                  {formatMoney(month.projected, currency)}
                </div>
              </div>
              <p className="mt-2 truncate text-center text-[11px] text-zinc-500">
                {month.label}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-zinc-950" />
          Projected monthly spend
        </span>
        <span>Renewals are included in the month they occur.</span>
      </div>
    </div>
  );
}

function BreakdownPanel({
  title,
  description,
  items,
  currency,
}: {
  title: string;
  description: string;
  items: CostBreakdown[];
  currency: string;
}) {
  return (
    <div className="premium-panel rounded-2xl p-5">
      <SectionTitle eyebrow="Analytics" title={title} description={description} />
      <div className="mt-5 space-y-4">
        {items.slice(0, 6).map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-950">
                  {item.name}
                </p>
                <p className="text-xs text-zinc-500">{item.count} assets</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-zinc-950">
                  {formatMoney(item.amount, currency)}
                </p>
                <p className="text-xs text-zinc-500">{item.share}%</p>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-950"
                style={{ width: `${Math.min(item.share, 100)}%` }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <EmptyState
            title="No cost data"
            description="Add recurring costs to assets to populate this analysis."
          />
        ) : null}
      </div>
    </div>
  );
}

function InsightItem({ insight }: { insight: CostInsight }) {
  const content = (
    <div className="rounded-xl border border-zinc-200/80 bg-white/75 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-950">{insight.title}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {insight.description}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${insightClasses[insight.severity]}`}
        >
          {insight.severity}
        </span>
      </div>
      <p className="mt-2 text-xs font-medium text-zinc-500">
        {insight.action}
      </p>
    </div>
  );

  if (!insight.assetId) {
    return content;
  }

  return (
    <Link href={`/assets/${insight.assetId}`} className="block">
      {content}
    </Link>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300/90 bg-white/65 p-5 text-center">
      <p className="text-sm font-semibold text-zinc-950">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </div>
  );
}
