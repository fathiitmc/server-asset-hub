import "server-only";

import type { Asset } from "@/lib/assets";
import { prisma } from "@/lib/prisma";
import {
  formatResponseTime,
  type AssetHealthSnapshot,
  type AssetRuntimeHealthStatus,
} from "@/src/lib/monitoring/health";
import {
  scoreInfrastructureHealth,
  type InfrastructureHealthScore,
} from "./health-scoring";
import { analyzeRuntimeTrend, type RuntimeTrend } from "./runtime-trends";

export type MonitoringConsistency = "GOOD" | "SPARSE" | "MISSING";

export type RuntimeIntelligenceProfile = {
  asset: Asset;
  latestStatus: AssetRuntimeHealthStatus;
  healthScore: InfrastructureHealthScore;
  trend: RuntimeTrend;
  checkCount: number;
  offlineCount: number;
  degradedCount: number;
  averageResponseTime: number | null;
  slowestResponseTime: number | null;
  uptimePercentage: number | null;
  degradationFrequency: number;
  monitoringConsistency: MonitoringConsistency;
  latestCheckedAt: string | null;
  responseTimeSpike: boolean;
  checks: AssetHealthSnapshot[];
};

type HealthCheckRecord = {
  assetId: string;
  status: string;
  responseTime: number | null;
  checkedAt: Date;
};

function normalizeHealthStatus(status: string): AssetRuntimeHealthStatus {
  if (
    status === "ONLINE" ||
    status === "OFFLINE" ||
    status === "DEGRADED" ||
    status === "UNKNOWN"
  ) {
    return status;
  }

  return "UNKNOWN";
}

function mapCheck(check: HealthCheckRecord): AssetHealthSnapshot {
  return {
    assetId: check.assetId,
    status: normalizeHealthStatus(check.status),
    responseTime: check.responseTime,
    checkedAt: check.checkedAt.toISOString(),
  };
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function monitoringConsistency(checkCount: number): MonitoringConsistency {
  if (checkCount === 0) return "MISSING";
  if (checkCount < 3) return "SPARSE";
  return "GOOD";
}

export function analyzeAssetRuntime(
  asset: Asset,
  checks: AssetHealthSnapshot[],
): RuntimeIntelligenceProfile {
  const ordered = [...checks].sort(
    (a, b) =>
      new Date(b.checkedAt ?? 0).getTime() -
      new Date(a.checkedAt ?? 0).getTime(),
  );
  const latest = ordered[0];
  const responseTimes = ordered
    .map((check) => check.responseTime)
    .filter((value): value is number => typeof value === "number");
  const offlineCount = ordered.filter((check) => check.status === "OFFLINE").length;
  const degradedCount = ordered.filter((check) => check.status === "DEGRADED").length;
  const healthyCount = ordered.filter((check) => check.status === "ONLINE").length;
  const averageResponseTime = average(responseTimes);
  const slowestResponseTime =
    responseTimes.length > 0 ? Math.max(...responseTimes) : null;
  const latestResponseTime = latest?.responseTime ?? null;
  const unstableCount = offlineCount + degradedCount;
  const uptimePercentage =
    ordered.length > 0 ? Math.round((healthyCount / ordered.length) * 100) : null;
  const latestStatus = latest?.status ?? "UNKNOWN";

  return {
    asset,
    latestStatus,
    healthScore: scoreInfrastructureHealth({
      latestStatus,
      offlineCount,
      degradedCount,
      checkCount: ordered.length,
      averageResponseTime,
    }),
    trend: analyzeRuntimeTrend(ordered),
    checkCount: ordered.length,
    offlineCount,
    degradedCount,
    averageResponseTime,
    slowestResponseTime,
    uptimePercentage,
    degradationFrequency:
      ordered.length > 0 ? Math.round((unstableCount / ordered.length) * 100) : 0,
    monitoringConsistency: monitoringConsistency(ordered.length),
    latestCheckedAt: latest?.checkedAt ?? null,
    responseTimeSpike:
      latestResponseTime !== null &&
      averageResponseTime !== null &&
      latestResponseTime > Math.max(1000, averageResponseTime * 1.8),
    checks: ordered,
  };
}

export async function getRuntimeIntelligenceProfiles(
  assets: Asset[],
  takePerAsset = 12,
) {
  if (assets.length === 0) {
    return [];
  }

  try {
    const assetIds = assets.map((asset) => asset.id);
    const records = await prisma.assetHealthCheck.findMany({
      where: { assetId: { in: assetIds } },
      orderBy: { checkedAt: "desc" },
      take: Math.max(takePerAsset * assets.length, takePerAsset),
    });
    const checksByAssetId = new Map<string, AssetHealthSnapshot[]>();

    for (const record of records) {
      const current = checksByAssetId.get(record.assetId) ?? [];
      if (current.length < takePerAsset) {
        current.push(mapCheck(record));
        checksByAssetId.set(record.assetId, current);
      }
    }

    return assets
      .map((asset) => analyzeAssetRuntime(asset, checksByAssetId.get(asset.id) ?? []))
      .sort((a, b) => runtimeRank(b.healthScore) - runtimeRank(a.healthScore));
  } catch (error) {
    console.error("Runtime intelligence read failed.", error);
    return assets.map((asset) => analyzeAssetRuntime(asset, []));
  }
}

export function runtimeRank(score: InfrastructureHealthScore) {
  const ranks: Record<InfrastructureHealthScore, number> = {
    HEALTHY: 1,
    DEGRADED: 2,
    UNSTABLE: 3,
    CRITICAL: 4,
    OFFLINE: 5,
  };

  return ranks[score];
}

export function formatRuntimeMetric(value: number | null) {
  return value === null ? "No data" : formatResponseTime(value);
}
