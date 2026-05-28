import { createOperationalEventOnce } from "@/lib/operational-events-db";
import type { OperationalSignal } from "./operational-signals";

export async function generateSmartWarningEvents(signals: OperationalSignal[]) {
  for (const signal of signals.filter(
    (item) =>
      item.attentionLevel === "HIGH_ATTENTION" ||
      item.attentionLevel === "CRITICAL_ATTENTION",
  )) {
    await createOperationalEventOnce({
      assetId: signal.assetId,
      assetName: signal.assetName,
      eventType:
        signal.category === "EXPIRY"
          ? "SSL_EXPIRY_DETECTED"
          : signal.category === "RUNTIME"
            ? "HEALTH_DEGRADED"
            : "ALERT_TRIGGERED",
      severity:
        signal.attentionLevel === "CRITICAL_ATTENTION" ? "CRITICAL" : "WARNING",
      title: signal.title,
      description: signal.description,
      metadata: {
        ruleId: signal.ruleId,
        category: signal.category,
        attentionLevel: signal.attentionLevel,
        evidence: signal.evidence,
        intelligence: "smart-warning",
      },
      source: "ALERT_ENGINE",
    });
  }
}
