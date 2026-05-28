import type { SegmentInsight } from "@/lib/environment-insights";
import type {
  AnalyticsTrend,
  DistributionItem,
  OperationalAnalyticsSummary,
} from "@/lib/operational-analytics";
import type { ProviderInsight } from "@/lib/provider-intelligence";

export function OperationalInsightsCenter({
  summary,
  providers,
  environments,
  regions,
}: {
  summary: OperationalAnalyticsSummary;
  providers: ProviderInsight[];
  environments: SegmentInsight[];
  regions: SegmentInsight[];
}) {
  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Operational Insights Center
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
            {summary.runtimeCoverage}% runtime coverage / {summary.ownershipCoverage}% ownership coverage
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Infrastructure distribution, provider dependency, environment
            posture, and operational coverage analytics.
          </p>
        </div>
        <TrendBadge trend={summary.trend.riskExposure} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Infrastructure assets" value={summary.totalAssets.toString()} />
        <SummaryCard label="Monitored assets" value={`${summary.monitoredAssets} / ${summary.runtimeCoverage}%`} />
        <SummaryCard label="Unmanaged assets" value={summary.unmanagedAssets.toString()} tone="warning" />
        <SummaryCard label="Critical assets" value={summary.criticalAssets.toString()} tone="critical" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <DistributionPanel
          title="Provider Distribution"
          items={summary.providerDistribution.slice(0, 5)}
        />
        <DistributionPanel
          title="Infrastructure Categories"
          items={summary.categoryDistribution.slice(0, 5)}
        />
        <DistributionPanel
          title="Regional Visibility"
          items={summary.regionDistribution.slice(0, 5)}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ProviderPanel providers={providers.slice(0, 5)} />
        <SegmentPanel
          title="Environment Insights"
          segments={environments.slice(0, 5)}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <TrendCard label="Uptime" trend={summary.trend.uptime} />
        <TrendCard label="Risk exposure" trend={summary.trend.riskExposure} />
        <TrendCard label="Monitoring coverage" trend={summary.trend.monitoringCoverage} />
        <TrendCard label="Degradation" trend={summary.trend.degradation} />
        <TrendCard label="Renewal pressure" trend={summary.trend.renewalPressure} />
      </div>

      {regions.length > 0 ? (
        <div className="mt-5">
          <SegmentPanel title="Region Health" segments={regions.slice(0, 6)} />
        </div>
      ) : null}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "critical";
}) {
  const classes = {
    default: "text-zinc-950",
    warning: "text-amber-700",
    critical: "text-red-700",
  };

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-zinc-400">
        {label}
      </p>
      <p className={`mt-2 text-xl font-semibold ${classes[tone]}`}>{value}</p>
    </div>
  );
}

function DistributionPanel({
  title,
  items,
}: {
  title: string;
  items: DistributionItem[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => <DistributionRow key={item.label} item={item} />)
        ) : (
          <p className="text-sm text-zinc-500">No distribution data.</p>
        )}
      </div>
    </div>
  );
}

function DistributionRow({ item }: { item: DistributionItem }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="truncate font-medium text-zinc-700">{item.label}</span>
        <span className="text-zinc-500">
          {item.count} / {item.percentage}%
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200/80">
        <div
          className="h-full rounded-full bg-zinc-950"
          style={{ width: `${Math.max(item.percentage, 4)}%` }}
        />
      </div>
    </div>
  );
}

function ProviderPanel({ providers }: { providers: ProviderInsight[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
      <h3 className="text-sm font-semibold text-zinc-950">
        Provider Intelligence
      </h3>
      <div className="mt-3 space-y-2">
        {providers.map((provider) => (
          <div
            key={provider.provider}
            className="rounded-xl border border-zinc-200/80 bg-white/80 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-zinc-950">
                {provider.provider}
              </p>
              <span className="text-xs font-medium text-zinc-500">
                {provider.concentrationRisk}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {provider.assetCount} assets / {provider.monitoringCoverage}%
              monitored / {provider.riskyAssets} risky
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentPanel({
  title,
  segments,
}: {
  title: string;
  segments: SegmentInsight[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="rounded-xl border border-zinc-200/80 bg-white/80 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-zinc-950">
                {segment.label}
              </p>
              <span className="text-xs text-zinc-500">{segment.assetCount}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {segment.monitoringCoverage}% monitored / {segment.unhealthyAssets}
              unhealthy / {segment.riskyAssets} risky
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendCard({ label, trend }: { label: string; trend: AnalyticsTrend }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="mt-2">
        <TrendBadge trend={trend} />
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: AnalyticsTrend }) {
  const classes: Record<AnalyticsTrend, string> = {
    IMPROVING: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    STABLE: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    RISING_RISK: "bg-amber-50 text-amber-800 ring-amber-200",
    DECLINING: "bg-red-50 text-red-700 ring-red-200",
    UNKNOWN: "bg-zinc-100 text-zinc-500 ring-zinc-200",
  };

  return (
    <span
      className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${classes[trend]}`}
    >
      {trend.replace("_", " ")}
    </span>
  );
}
