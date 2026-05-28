import { createOperationalEventOnce } from "@/lib/operational-events-db";
import type { SegmentInsight } from "./environment-insights";
import type { OperationalAnalyticsSummary } from "./operational-analytics";
import type { ProviderInsight } from "./provider-intelligence";

export async function generateAnalyticsInsightEvents({
  summary,
  providers,
  environments,
}: {
  summary: OperationalAnalyticsSummary;
  providers: ProviderInsight[];
  environments: SegmentInsight[];
}) {
  const topProvider = providers[0];

  if (topProvider && topProvider.concentrationRisk === "HIGH") {
    await createOperationalEventOnce({
      eventType: "ALERT_TRIGGERED",
      severity: "WARNING",
      title: `${topProvider.provider} concentration risk detected`,
      description: `${topProvider.percentage}% of tracked infrastructure depends on one provider.`,
      metadata: {
        provider: topProvider.provider,
        percentage: topProvider.percentage,
        intelligence: "analytics",
      },
      source: "SYSTEM",
    });
  }

  if (summary.runtimeCoverage < 50 && summary.totalAssets > 0) {
    await createOperationalEventOnce({
      eventType: "ALERT_TRIGGERED",
      severity: "WARNING",
      title: "Monitoring coverage is below target",
      description: `${summary.runtimeCoverage}% of assets have monitoring history.`,
      metadata: {
        runtimeCoverage: summary.runtimeCoverage,
        intelligence: "analytics",
      },
      source: "SYSTEM",
    });
  }

  if (summary.trend.riskExposure === "RISING_RISK") {
    await createOperationalEventOnce({
      eventType: "ALERT_TRIGGERED",
      severity: "WARNING",
      title: "Infrastructure risk exposure is rising",
      description: `${summary.criticalAssets} assets are currently high or critical risk.`,
      metadata: {
        criticalAssets: summary.criticalAssets,
        intelligence: "analytics",
      },
      source: "SYSTEM",
    });
  }

  const production = environments.find((item) => item.label === "PRODUCTION");

  if (production && production.unhealthyAssets > 0) {
    await createOperationalEventOnce({
      eventType: "ALERT_TRIGGERED",
      severity: "CRITICAL",
      title: "Production runtime exposure detected",
      description: `${production.unhealthyAssets} production assets have unhealthy runtime posture.`,
      metadata: {
        environment: production.label,
        unhealthyAssets: production.unhealthyAssets,
        intelligence: "analytics",
      },
      source: "SYSTEM",
    });
  }

  if (summary.trend.renewalPressure === "RISING_RISK") {
    await createOperationalEventOnce({
      eventType: "SSL_EXPIRY_DETECTED",
      severity: "WARNING",
      title: "Renewal pressure is increasing",
      description: `${summary.expiringInfrastructure} assets are in renewal risk windows.`,
      metadata: {
        expiringInfrastructure: summary.expiringInfrastructure,
        intelligence: "analytics",
      },
      source: "SYSTEM",
    });
  }
}
