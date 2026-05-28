import Link from "next/link";
import { AlertCenter } from "@/components/alert-center";
import { OperationalInsightsCenter } from "@/components/analytics/operational-insights-center";
import { AppShell } from "@/components/app-shell";
import { InfrastructureMemoryCenter } from "@/components/lifecycle/infrastructure-memory-center";
import { OperationalTimeline } from "@/components/operational/operational-timeline";
import {
  DashboardIntelligence,
  RiskCenter,
} from "@/components/intelligence/dashboard-intelligence";
import { RuntimeHealthCenter } from "@/components/runtime/runtime-health-center";
import { SmartWarningCenter } from "@/components/warnings/smart-warning-center";
import {
  AssetsTable,
  formatMoney,
  formatRenewalDistance,
} from "@/components/assets-table";
import { HealthBadge } from "@/components/health-badge";
import { PageHeader } from "@/components/page-header";
import { getAssetsFromDb } from "@/lib/assets-db";
import {
  getAssetHealthStatus,
  getAssetRiskColor,
  getDaysUntilRenewal,
  getExpiringAssets,
  getOverdueAssets,
  type AssetHealthStatus,
} from "@/src/lib/assets/intelligence";
import { getAssetHealthSummary } from "@/src/lib/monitoring/checks";
import {
  formatCheckedAt,
  formatResponseTime,
} from "@/src/lib/monitoring/health";
import { getActiveAlerts, getAlertSummary } from "@/src/lib/alerts/alerts";
import {
  generateMonitoringAlerts,
  generateRenewalAlerts,
} from "@/src/lib/alerts/engine";
import {
  listOperationalEvents,
  seedOperationalEventsForAssets,
} from "@/lib/operational-events-db";
import { getExpirySignals } from "@/lib/expiry-intelligence";
import { getRiskProfiles } from "@/lib/operational-risk";
import { generateRiskIntelligenceEvents } from "@/lib/risk-intelligence";
import { getRuntimeIntelligenceProfiles } from "@/lib/runtime-intelligence";
import { generateRuntimeIntelligenceEvents } from "@/lib/runtime-warnings";
import { getOperationalAnalyticsSummary } from "@/lib/operational-analytics";
import { getProviderInsights } from "@/lib/provider-intelligence";
import {
  getEnvironmentInsights,
  getRegionInsights,
} from "@/lib/environment-insights";
import { generateAnalyticsInsightEvents } from "@/lib/analytics-warnings";
import { getOperationalSignals } from "@/lib/operational-signals";
import { generateSmartWarningEvents } from "@/lib/smart-warnings";
import { getLifecycleProfiles } from "@/lib/lifecycle-intelligence";
import {
  generateLifecycleEvents,
  getLifecycleRiskSummary,
} from "@/lib/lifecycle-risk";
import { getOperationalHistoryProfile } from "@/lib/operational-history";
import { getInfrastructureMemorySummary } from "@/lib/infrastructure-memory";
import { hasPermission, requirePermission } from "@/src/lib/rbac/permissions";

export default async function DashboardPage() {
  const user = await requirePermission("dashboard:view");
  const canViewFinance = hasPermission(user.role, "finance:view");
  const assets = await getAssetsFromDb();
  await seedOperationalEventsForAssets(assets);
  const runtimeHealth = await getAssetHealthSummary(
    assets.map((asset) => asset.id),
  );
  const runtimeStatuses = new Map(
    runtimeHealth.snapshots.map((snapshot) => [
      snapshot.assetId,
      snapshot.status,
    ]),
  );
  await generateRenewalAlerts(assets);
  await generateMonitoringAlerts(runtimeHealth.snapshots, assets);
  await generateRiskIntelligenceEvents(assets, runtimeStatuses);
  const runtimeProfiles = await getRuntimeIntelligenceProfiles(assets);
  await generateRuntimeIntelligenceEvents(runtimeProfiles);
  const expirySignals = getExpirySignals(assets);
  const riskProfiles = getRiskProfiles(assets, runtimeStatuses);
  const analyticsSummary = getOperationalAnalyticsSummary({
    assets,
    runtimeProfiles,
    riskProfiles,
    expirySignals,
  });
  const providerInsights = getProviderInsights({
    assets,
    runtimeProfiles,
    riskProfiles,
  });
  const environmentInsights = getEnvironmentInsights({
    assets,
    runtimeProfiles,
    riskProfiles,
  });
  const regionInsights = getRegionInsights({
    assets,
    runtimeProfiles,
    riskProfiles,
  });
  await generateAnalyticsInsightEvents({
    summary: analyticsSummary,
    providers: providerInsights,
    environments: environmentInsights,
  });
  const operationalSignals = getOperationalSignals({
    assets,
    expirySignals,
    riskProfiles,
    runtimeProfiles,
    providerInsights,
    analyticsSummary,
  });
  await generateSmartWarningEvents(operationalSignals);
  const historyEvents = await listOperationalEvents({ take: 300 });
  const lifecycleProfiles = getLifecycleProfiles({
    assets,
    runtimeProfiles,
    riskProfiles,
    events: historyEvents,
  });
  const lifecycleRisks = getLifecycleRiskSummary(lifecycleProfiles);
  const operationalHistory = getOperationalHistoryProfile(historyEvents);
  const infrastructureMemory = getInfrastructureMemorySummary({
    profiles: lifecycleProfiles,
    risks: lifecycleRisks,
    history: operationalHistory,
  });
  await generateLifecycleEvents(lifecycleProfiles);
  const [activeAlerts, alertSummary] = await Promise.all([
    getActiveAlerts(8),
    getAlertSummary(),
  ]);
  const [recentEvents, criticalEvents] = await Promise.all([
    listOperationalEvents({ take: 8 }),
    listOperationalEvents({ severity: "CRITICAL", take: 4 }),
  ]);
  const totalCost = assets.reduce(
    (sum, asset) => sum + Number(asset.estimatedCost || 0),
    0,
  );
  const expiringSoon = getExpiringAssets(assets);
  const overdue = getOverdueAssets(assets);
  const expired = assets.filter(
    (asset) => getAssetHealthStatus(asset) === "EXPIRED",
  );
  const healthy = assets.filter(
    (asset) => getAssetHealthStatus(asset) === "HEALTHY",
  );
  const nextRenewals = assets
    .filter((asset) => {
      const days = getDaysUntilRenewal(asset);
      return asset.status !== "ARCHIVED" && days !== null && days >= 0;
    })
    .slice(0, 5);
  const attentionCount = expiringSoon.length + overdue.length + expired.length;

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Live operational posture across assets, renewals, runtime health, and active alerts."
        action={{ href: "/assets/new", label: "Create asset" }}
      />

      <div className="mb-6">
        <DashboardIntelligence
          expirySignals={expirySignals}
          riskProfiles={riskProfiles}
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="premium-panel rounded-2xl p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Infra health
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                {runtimeHealth.offline > 0
                  ? `${runtimeHealth.offline} offline assets`
                  : alertSummary.critical > 0
                    ? `${alertSummary.critical} critical alerts`
                    : "Systems operating normally"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                {runtimeHealth.online} online, {runtimeHealth.degraded} degraded,
                and {runtimeHealth.offline} offline across monitored assets.
              </p>
            </div>
            <Link
              href="#monitoring"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white/80 px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-white"
            >
              Monitoring
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Assets" value={assets.length.toString()} />
            <Metric
              label="Active alerts"
              value={alertSummary.total.toString()}
              tone={alertSummary.critical > 0 ? "critical" : "warning"}
            />
            <Metric
              label="Healthy renewals"
              value={healthy.length.toString()}
              tone="healthy"
            />
            <Metric
              label="Needs attention"
              value={attentionCount.toString()}
              tone={
                overdue.length + expired.length > 0
                  ? "danger"
                  : expiringSoon.length > 0
                    ? "warning"
                    : "healthy"
              }
            />
          </div>
        </div>

        <div className="premium-panel rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Quick actions
          </p>
          <div className="mt-4 grid gap-2">
            <QuickAction
              href="/assets/new"
              label="Create Asset"
              detail="Track a new server, domain, or cloud account"
            />
            <QuickAction
              href="/assets"
              label="Search Assets"
              detail="Filter by owner, provider, status, or type"
            />
            <QuickAction
              href="/dashboard#alerts"
              label="View Alerts"
              detail="Triage renewal and runtime warnings"
            />
          </div>
        </div>
      </section>

      <div className="mt-6">
        <SmartWarningCenter signals={operationalSignals} />
      </div>

      <div className="mt-6">
        <OperationalInsightsCenter
          summary={analyticsSummary}
          providers={providerInsights}
          environments={environmentInsights}
          regions={regionInsights}
        />
      </div>

      <div className="mt-6">
        <RuntimeHealthCenter profiles={runtimeProfiles} />
      </div>

      <div className="mt-6">
        <InfrastructureMemoryCenter
          memory={infrastructureMemory}
          risks={lifecycleRisks}
          history={operationalHistory}
        />
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-6">
            <OperationalTimeline
              title="Recent Activity"
              description="Infrastructure event history across assets, alerts, vault activity, monitoring, and attachments."
              events={recentEvents}
            />
          </div>
          <div id="alerts" className="mb-6 scroll-mt-24">
            <AlertCenter alerts={activeAlerts} />
          </div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Recent assets
            </h2>
            <Link
              href="/assets"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
            >
              View all
            </Link>
          </div>
          <AssetsTable
            assets={assets.slice(0, 6)}
            showCost={canViewFinance}
          />
        </div>

        <div className="space-y-6">
          <RiskCenter profiles={riskProfiles} />

          <OperationalTimeline
            title="Critical Events"
            description="High-severity operational signals that need attention."
            events={criticalEvents}
            compact
            emptyTitle="No critical events"
            emptyDescription="Critical operational events will be collected here."
          />

          <div className="premium-panel rounded-2xl p-5">
            <h2 className="text-base font-semibold text-zinc-950">
              Upcoming renewals
            </h2>
            <div className="mt-4 space-y-3">
              {nextRenewals.length > 0 ? (
                nextRenewals.map((asset) => {
                  const healthStatus = getAssetHealthStatus(asset);

                  return (
                    <Link
                      key={asset.id}
                      href={`/assets/${asset.id}`}
                      className="block rounded-xl border border-zinc-200/80 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-zinc-950">
                          {asset.name}
                        </p>
                        <StatusDot status={healthStatus} />
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatRenewalDistance(asset)}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <EmptyLine
                  title="No renewals queued"
                  detail="Assets are clear for the current view."
                />
              )}
            </div>
          </div>

          <div className="premium-panel rounded-2xl p-5">
            <h2 className="text-base font-semibold text-zinc-950">
              Operational snapshot
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              {canViewFinance ? (
                <SnapshotRow
                  label="Tracked annual cost"
                  value={formatMoney(totalCost, "USD")}
                />
              ) : null}
              <SnapshotRow
                label="Assets needing attention"
                value={attentionCount.toString()}
              />
              <SnapshotRow
                label="Provider count"
                value={new Set(assets.map((asset) => asset.provider)).size.toString()}
              />
            </dl>
          </div>

          <div
            id="monitoring"
            className="premium-panel scroll-mt-24 rounded-2xl p-5"
          >
            <h2 className="text-base font-semibold text-zinc-950">
              Runtime health
            </h2>
            <div className="mt-4 space-y-3">
              {runtimeHealth.snapshots.slice(0, 5).map((snapshot) => {
                const asset = assets.find((item) => item.id === snapshot.assetId);

                return (
                  <Link
                    key={snapshot.assetId}
                    href={`/assets/${snapshot.assetId}`}
                    className="block rounded-xl border border-zinc-200/80 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-zinc-950">
                        {asset?.name ?? "Unknown asset"}
                      </p>
                      <HealthBadge status={snapshot.status} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatResponseTime(snapshot.responseTime)} /{" "}
                      {formatCheckedAt(snapshot.checkedAt)}
                    </p>
                  </Link>
                );
              })}
              {runtimeHealth.snapshots.length === 0 ? (
                <EmptyLine
                  title="No checks yet"
                  detail="Run health checks from an asset to populate runtime data."
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "healthy" | "warning" | "danger" | "critical";
}) {
  const toneClasses = {
    default: "text-zinc-950",
    healthy: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-700",
    critical: "text-rose-950",
  };

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/72 p-4 shadow-sm shadow-zinc-950/[0.03] transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p
        className={`mt-1.5 text-2xl font-semibold tracking-tight ${toneClasses[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white/60 px-3 py-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-950">{value}</dd>
    </div>
  );
}

function StatusDot({ status }: { status: AssetHealthStatus }) {
  const riskColor = getAssetRiskColor(status);
  const color = {
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    "dark-red": "bg-rose-950",
  }[riskColor];

  return <span className={`h-2.5 w-2.5 rounded-full ${color}`} />;
}

function QuickAction({
  href,
  label,
  detail,
}: {
  href: string;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-zinc-200/80 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white"
    >
      <p className="text-sm font-semibold text-zinc-950">{label}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
    </Link>
  );
}

function EmptyLine({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-4">
      <p className="text-sm font-medium text-zinc-800">{title}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
    </div>
  );
}
