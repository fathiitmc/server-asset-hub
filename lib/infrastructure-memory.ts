import type { LifecycleProfile } from "./lifecycle-intelligence";
import type { LifecycleRiskSummary } from "./lifecycle-risk";
import type { OperationalHistoryProfile } from "./operational-history";

export type InfrastructureMemorySummary = {
  oldestInfrastructure: LifecycleProfile[];
  mostUnstableAssets: LifecycleProfile[];
  mostDegradedAssets: LifecycleProfile[];
  highestAlertFrequency: LifecycleProfile[];
  chronicOperationalRisk: LifecycleProfile[];
  stageDistribution: Array<{ label: string; count: number }>;
};

export function getInfrastructureMemorySummary({
  profiles,
  risks,
  history,
}: {
  profiles: LifecycleProfile[];
  risks: LifecycleRiskSummary;
  history: OperationalHistoryProfile;
}): InfrastructureMemorySummary {
  const alertCounts = new Map(
    history.mostActiveAssets.map((item) => [item.assetId, item.count]),
  );

  return {
    oldestInfrastructure: [...profiles]
      .sort((a, b) => b.ageDays - a.ageDays)
      .slice(0, 5),
    mostUnstableAssets: [...risks.unstableAssets]
      .sort((a, b) => b.degradationEventCount - a.degradationEventCount)
      .slice(0, 5),
    mostDegradedAssets: profiles
      .filter((profile) => profile.degradationEventCount > 0)
      .sort((a, b) => b.degradationEventCount - a.degradationEventCount)
      .slice(0, 5),
    highestAlertFrequency: [...profiles]
      .sort(
        (a, b) =>
          (alertCounts.get(b.asset.id) ?? b.alertEventCount) -
          (alertCounts.get(a.asset.id) ?? a.alertEventCount),
      )
      .slice(0, 5),
    chronicOperationalRisk: risks.chronicRisk.slice(0, 5),
    stageDistribution: Array.from(
      new Set(profiles.map((profile) => profile.stage)),
    ).map((stage) => ({
      label: stage,
      count: profiles.filter((profile) => profile.stage === stage).length,
    })),
  };
}
