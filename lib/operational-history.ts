import type { OperationalEventSummary } from "@/lib/operational-events";
import type { LifecycleProfile } from "./lifecycle-intelligence";

export type OperationalHistoryProfile = {
  totalEvents: number;
  criticalEvents: number;
  warningEvents: number;
  runtimeEvents: number;
  alertEvents: number;
  expiryEvents: number;
  attentionEvents: number;
  mostActiveAssets: Array<{
    assetId: string | null;
    assetName: string;
    count: number;
  }>;
};

export function getOperationalHistoryProfile(
  events: OperationalEventSummary[],
): OperationalHistoryProfile {
  const counts = new Map<string, { assetId: string | null; assetName: string; count: number }>();

  for (const event of events) {
    const key = event.assetId ?? event.assetName ?? "system";
    const current = counts.get(key) ?? {
      assetId: event.assetId,
      assetName: event.assetName ?? "System",
      count: 0,
    };
    current.count += 1;
    counts.set(key, current);
  }

  return {
    totalEvents: events.length,
    criticalEvents: events.filter((event) => event.severity === "CRITICAL").length,
    warningEvents: events.filter((event) => event.severity === "WARNING").length,
    runtimeEvents: events.filter((event) =>
      ["HEALTH_CHECK_RUN", "HEALTH_DEGRADED", "RUNTIME_OFFLINE", "RUNTIME_ONLINE"].includes(
        event.eventType,
      ),
    ).length,
    alertEvents: events.filter((event) => event.eventType === "ALERT_TRIGGERED").length,
    expiryEvents: events.filter((event) => event.eventType === "SSL_EXPIRY_DETECTED").length,
    attentionEvents: events.filter(
      (event) => event.metadata?.intelligence === "smart-warning",
    ).length,
    mostActiveAssets: Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

export function getLifecycleMaturityDistribution(profiles: LifecycleProfile[]) {
  return Array.from(new Set(profiles.map((profile) => profile.maturity))).map(
    (maturity) => ({
      label: maturity,
      count: profiles.filter((profile) => profile.maturity === maturity).length,
    }),
  );
}
