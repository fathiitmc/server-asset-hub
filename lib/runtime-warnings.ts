import { createOperationalEventOnce } from "@/lib/operational-events-db";
import type { RuntimeIntelligenceProfile } from "./runtime-intelligence";

export async function generateRuntimeIntelligenceEvents(
  profiles: RuntimeIntelligenceProfile[],
) {
  for (const profile of profiles) {
    if (profile.healthScore === "OFFLINE") {
      await createOperationalEventOnce({
        assetId: profile.asset.id,
        assetName: profile.asset.name,
        eventType: "RUNTIME_OFFLINE",
        severity: "CRITICAL",
        title: `${profile.asset.name} is offline`,
        description:
          "Runtime intelligence detected an offline state from the latest monitoring history.",
        metadata: {
          healthScore: profile.healthScore,
          offlineCount: profile.offlineCount,
          checkCount: profile.checkCount,
          intelligence: "runtime",
        },
        source: "MONITOR",
      });
      continue;
    }

    if (profile.healthScore === "CRITICAL") {
      await createOperationalEventOnce({
        assetId: profile.asset.id,
        assetName: profile.asset.name,
        eventType: "ALERT_TRIGGERED",
        severity: "CRITICAL",
        title: `${profile.asset.name} runtime is critical`,
        description:
          "Repeated offline states indicate critical runtime instability.",
        metadata: {
          healthScore: profile.healthScore,
          offlineCount: profile.offlineCount,
          degradedCount: profile.degradedCount,
          checkCount: profile.checkCount,
          intelligence: "runtime",
        },
        source: "MONITOR",
      });
    }

    if (profile.healthScore === "UNSTABLE" || profile.trend === "UNSTABLE") {
      await createOperationalEventOnce({
        assetId: profile.asset.id,
        assetName: profile.asset.name,
        eventType: "HEALTH_DEGRADED",
        severity: "WARNING",
        title: `${profile.asset.name} runtime is unstable`,
        description:
          "Recent checks show repeated degradation or inconsistent runtime posture.",
        metadata: {
          trend: profile.trend,
          degradationFrequency: profile.degradationFrequency,
          uptimePercentage: profile.uptimePercentage,
          intelligence: "runtime",
        },
        source: "MONITOR",
      });
    }

    if (profile.responseTimeSpike) {
      await createOperationalEventOnce({
        assetId: profile.asset.id,
        assetName: profile.asset.name,
        eventType: "HEALTH_DEGRADED",
        severity: "WARNING",
        title: `${profile.asset.name} response time spike detected`,
        description:
          "Latest response time is materially higher than the recent average.",
        metadata: {
          averageResponseTime: profile.averageResponseTime,
          slowestResponseTime: profile.slowestResponseTime,
          intelligence: "runtime",
        },
        source: "MONITOR",
      });
    }

    if (profile.monitoringConsistency === "MISSING") {
      await createOperationalEventOnce({
        assetId: profile.asset.id,
        assetName: profile.asset.name,
        eventType: "ALERT_TRIGGERED",
        severity: "WARNING",
        title: `${profile.asset.name} has no monitoring history`,
        description:
          "Runtime intelligence cannot establish health posture without monitoring checks.",
        metadata: {
          monitoringConsistency: profile.monitoringConsistency,
          intelligence: "runtime",
        },
        source: "MONITOR",
      });
    }
  }
}
