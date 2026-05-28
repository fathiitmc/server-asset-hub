import type { AssetHealthSnapshot } from "@/src/lib/monitoring/health";

export type RuntimeTrend = "IMPROVING" | "STABLE" | "UNSTABLE" | "DECLINING" | "UNKNOWN";

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function analyzeRuntimeTrend(checks: AssetHealthSnapshot[]): RuntimeTrend {
  const ordered = [...checks]
    .filter((check) => check.checkedAt)
    .sort(
      (a, b) =>
        new Date(a.checkedAt ?? 0).getTime() -
        new Date(b.checkedAt ?? 0).getTime(),
    );

  if (ordered.length < 3) return "UNKNOWN";

  const unstableCount = ordered.filter(
    (check) => check.status === "OFFLINE" || check.status === "DEGRADED",
  ).length;

  if (unstableCount >= Math.ceil(ordered.length * 0.4)) return "UNSTABLE";

  const midpoint = Math.floor(ordered.length / 2);
  const firstHalf = ordered
    .slice(0, midpoint)
    .map((check) => check.responseTime)
    .filter((value): value is number => typeof value === "number");
  const secondHalf = ordered
    .slice(midpoint)
    .map((check) => check.responseTime)
    .filter((value): value is number => typeof value === "number");
  const firstAverage = average(firstHalf);
  const secondAverage = average(secondHalf);

  if (firstAverage === null || secondAverage === null) return "STABLE";
  if (secondAverage > firstAverage * 1.35) return "DECLINING";
  if (secondAverage < firstAverage * 0.75) return "IMPROVING";
  return "STABLE";
}
