import type { AssetRuntimeHealthStatus } from "@/src/lib/monitoring/health";

export type InfrastructureHealthScore =
  | "HEALTHY"
  | "DEGRADED"
  | "UNSTABLE"
  | "CRITICAL"
  | "OFFLINE";

export function scoreInfrastructureHealth({
  latestStatus,
  offlineCount,
  degradedCount,
  checkCount,
  averageResponseTime,
}: {
  latestStatus: AssetRuntimeHealthStatus;
  offlineCount: number;
  degradedCount: number;
  checkCount: number;
  averageResponseTime: number | null;
}): InfrastructureHealthScore {
  if (latestStatus === "OFFLINE") return "OFFLINE";
  if (offlineCount >= 3) return "CRITICAL";
  if (latestStatus === "DEGRADED") return "DEGRADED";
  if (checkCount === 0) return "UNSTABLE";
  if (degradedCount + offlineCount >= Math.max(2, Math.ceil(checkCount * 0.35))) {
    return "UNSTABLE";
  }
  if (averageResponseTime !== null && averageResponseTime >= 3000) {
    return "DEGRADED";
  }
  return "HEALTHY";
}
