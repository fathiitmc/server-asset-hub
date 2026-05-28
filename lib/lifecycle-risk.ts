import { createOperationalEventOnce } from "@/lib/operational-events-db";
import type { LifecycleProfile } from "./lifecycle-intelligence";

export type LifecycleRiskSummary = {
  agingInfrastructure: LifecycleProfile[];
  unstableAssets: LifecycleProfile[];
  legacyUnmanaged: LifecycleProfile[];
  chronicRisk: LifecycleProfile[];
  lifecycleStageChanges: LifecycleProfile[];
};

export function getLifecycleRiskSummary(
  profiles: LifecycleProfile[],
): LifecycleRiskSummary {
  return {
    agingInfrastructure: profiles.filter((profile) => profile.ageDays > 365),
    unstableAssets: profiles.filter(
      (profile) =>
        profile.runtimeStability === "UNSTABLE" ||
        profile.runtimeStability === "CHRONIC",
    ),
    legacyUnmanaged: profiles.filter(
      (profile) =>
        profile.stage === "LEGACY" ||
        (profile.ageDays > 365 && profile.maturity !== "MATURE"),
    ),
    chronicRisk: profiles.filter(
      (profile) =>
        profile.stage === "CRITICAL" ||
        profile.lifecycleRisks.some((risk) => risk.includes("Chronic")),
    ),
    lifecycleStageChanges: profiles.filter((profile) =>
      ["DEGRADED", "LEGACY", "CRITICAL"].includes(profile.stage),
    ),
  };
}

export async function generateLifecycleEvents(profiles: LifecycleProfile[]) {
  for (const profile of profiles.filter((item) =>
    ["DEGRADED", "LEGACY", "CRITICAL"].includes(item.stage),
  )) {
    await createOperationalEventOnce({
      assetId: profile.asset.id,
      assetName: profile.asset.name,
      eventType: "ALERT_TRIGGERED",
      severity: profile.stage === "CRITICAL" ? "CRITICAL" : "WARNING",
      title: `${profile.asset.name} lifecycle stage is ${profile.stage.toLowerCase()}`,
      description:
        profile.lifecycleRisks[0] ??
        "Lifecycle intelligence detected an operational continuity signal.",
      metadata: {
        lifecycleStage: profile.stage,
        maturity: profile.maturity,
        ageDays: profile.ageDays,
        runtimeStability: profile.runtimeStability,
        intelligence: "lifecycle",
      },
      source: "SYSTEM",
    });
  }
}
