import type { Asset } from "@/lib/assets";
import type { ExpirySignal } from "./expiry-intelligence";
import type { AssetRiskProfile } from "./operational-risk";
import type { RuntimeIntelligenceProfile } from "./runtime-intelligence";

export type AnalyticsTrend =
  | "IMPROVING"
  | "STABLE"
  | "RISING_RISK"
  | "DECLINING"
  | "UNKNOWN";

export type DistributionItem = {
  label: string;
  count: number;
  percentage: number;
};

export type OperationalAnalyticsSummary = {
  totalAssets: number;
  monitoredAssets: number;
  unmanagedAssets: number;
  healthyAssets: number;
  degradedAssets: number;
  criticalAssets: number;
  expiringInfrastructure: number;
  providerConcentration: number;
  runtimeCoverage: number;
  ownershipCoverage: number;
  categoryDistribution: DistributionItem[];
  providerDistribution: DistributionItem[];
  environmentDistribution: DistributionItem[];
  regionDistribution: DistributionItem[];
  trend: {
    uptime: AnalyticsTrend;
    riskExposure: AnalyticsTrend;
    monitoringCoverage: AnalyticsTrend;
    degradation: AnalyticsTrend;
    renewalPressure: AnalyticsTrend;
  };
};

function percentage(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

function distribution(values: string[], total: number): DistributionItem[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const label = value.trim() || "Unassigned";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: percentage(count, total),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function getOperationalAnalyticsSummary({
  assets,
  runtimeProfiles,
  riskProfiles,
  expirySignals,
}: {
  assets: Asset[];
  runtimeProfiles: RuntimeIntelligenceProfile[];
  riskProfiles: AssetRiskProfile[];
  expirySignals: ExpirySignal[];
}): OperationalAnalyticsSummary {
  const totalAssets = assets.length;
  const monitoredAssets = runtimeProfiles.filter(
    (profile) => profile.checkCount > 0,
  ).length;
  const unmanagedAssets = riskProfiles.filter(
    (profile) =>
      profile.signals.some((signal) =>
        ["missing-owner", "missing-tags", "missing-region"].includes(signal.id),
      ),
  ).length;
  const healthyAssets = runtimeProfiles.filter(
    (profile) => profile.healthScore === "HEALTHY",
  ).length;
  const degradedAssets = runtimeProfiles.filter((profile) =>
    ["DEGRADED", "UNSTABLE"].includes(profile.healthScore),
  ).length;
  const criticalAssets = riskProfiles.filter((profile) =>
    ["HIGH", "CRITICAL"].includes(profile.score),
  ).length;
  const expiringInfrastructure = expirySignals.filter((signal) =>
    ["WARNING", "CRITICAL", "EXPIRED"].includes(signal.state),
  ).length;
  const providerDistribution = distribution(
    assets.map((asset) => asset.provider),
    totalAssets,
  );
  const providerConcentration = providerDistribution[0]?.percentage ?? 0;
  const runtimeCoverage = percentage(monitoredAssets, totalAssets);
  const ownershipCoverage = percentage(
    assets.filter((asset) => asset.owner.trim()).length,
    totalAssets,
  );
  const averageUptimeValues = runtimeProfiles
    .map((profile) => profile.uptimePercentage)
    .filter((value): value is number => typeof value === "number");
  const averageUptime =
    averageUptimeValues.length > 0
      ? averageUptimeValues.reduce((sum, value) => sum + value, 0) /
        averageUptimeValues.length
      : null;
  const degradedRatio = percentage(degradedAssets + criticalAssets, totalAssets);
  const expiryPressure = percentage(expiringInfrastructure, totalAssets);

  return {
    totalAssets,
    monitoredAssets,
    unmanagedAssets,
    healthyAssets,
    degradedAssets,
    criticalAssets,
    expiringInfrastructure,
    providerConcentration,
    runtimeCoverage,
    ownershipCoverage,
    categoryDistribution: distribution(
      assets.map((asset) => asset.type),
      totalAssets,
    ),
    providerDistribution,
    environmentDistribution: distribution(
      assets.map((asset) => asset.environment),
      totalAssets,
    ),
    regionDistribution: distribution(
      assets.map((asset) => asset.region || "Unassigned"),
      totalAssets,
    ),
    trend: {
      uptime:
        averageUptime === null
          ? "UNKNOWN"
          : averageUptime >= 95
            ? "STABLE"
            : "DECLINING",
      riskExposure:
        criticalAssets === 0
          ? "STABLE"
          : percentage(criticalAssets, totalAssets) >= 25
            ? "RISING_RISK"
            : "STABLE",
      monitoringCoverage:
        runtimeCoverage >= 80
          ? "IMPROVING"
          : runtimeCoverage >= 50
            ? "STABLE"
            : "DECLINING",
      degradation:
        degradedRatio >= 30
          ? "RISING_RISK"
          : degradedRatio > 0
            ? "STABLE"
            : "IMPROVING",
      renewalPressure:
        expiryPressure >= 30
          ? "RISING_RISK"
          : expiryPressure > 0
            ? "STABLE"
            : "IMPROVING",
    },
  };
}
