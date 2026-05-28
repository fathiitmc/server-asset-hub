import type { Asset } from "@/lib/assets";
import { createOperationalEventOnce } from "@/lib/operational-events-db";
import type { AssetRuntimeHealthStatus } from "@/src/lib/monitoring/health";
import { getExpirySignals } from "./expiry-intelligence";
import { getRiskProfiles } from "./operational-risk";

export async function generateRiskIntelligenceEvents(
  assets: Asset[],
  runtimeStatuses: Map<string, AssetRuntimeHealthStatus>,
) {
  const expirySignals = getExpirySignals(assets).filter(
    (signal) => signal.state !== "HEALTHY",
  );
  const riskProfiles = getRiskProfiles(assets, runtimeStatuses).filter(
    (profile) => profile.score === "HIGH" || profile.score === "CRITICAL",
  );

  for (const signal of expirySignals) {
    await createOperationalEventOnce({
      assetId: signal.assetId,
      assetName: signal.assetName,
      eventType: "SSL_EXPIRY_DETECTED",
      severity: signal.state === "EXPIRED" || signal.state === "CRITICAL"
        ? "CRITICAL"
        : "WARNING",
      title:
        signal.state === "EXPIRED"
          ? `${signal.assetName} renewal is overdue`
          : `${signal.assetName} expires in ${signal.daysRemaining} days`,
      description:
        signal.state === "EXPIRED"
          ? `${signal.label} is past due and requires immediate attention.`
          : `${signal.label} has entered an operational risk window.`,
      metadata: {
        category: signal.category,
        daysRemaining: signal.daysRemaining,
        renewalDate: signal.renewalDate,
        intelligence: "expiry",
      },
      source: "ALERT_ENGINE",
    });
  }

  for (const profile of riskProfiles) {
    const primarySignal = profile.signals[0];

    if (!primarySignal) {
      continue;
    }

    await createOperationalEventOnce({
      assetId: profile.asset.id,
      assetName: profile.asset.name,
      eventType: "ALERT_TRIGGERED",
      severity: profile.score === "CRITICAL" ? "CRITICAL" : "WARNING",
      title: `${profile.asset.name} risk score is ${profile.score.toLowerCase()}`,
      description: primarySignal.detail,
      metadata: {
        riskScore: profile.score,
        points: profile.points,
        signal: primarySignal.id,
        intelligence: "operational-risk",
      },
      source: "ALERT_ENGINE",
    });
  }
}
