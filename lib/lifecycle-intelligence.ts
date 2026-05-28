import type { Asset } from "@/lib/assets";
import type { OperationalEventSummary } from "@/lib/operational-events";
import type { AssetRiskProfile } from "@/lib/operational-risk";
import type { RuntimeIntelligenceProfile } from "@/lib/runtime-intelligence";

export type InfrastructureLifecycleStage =
  | "NEW"
  | "ACTIVE"
  | "STABLE"
  | "DEGRADED"
  | "LEGACY"
  | "CRITICAL";

export type OperationalMaturity =
  | "UNOBSERVED"
  | "EMERGING"
  | "MANAGED"
  | "MATURE";

export type LifecycleProfile = {
  asset: Asset;
  stage: InfrastructureLifecycleStage;
  maturity: OperationalMaturity;
  ageDays: number;
  daysSinceUpdate: number;
  firstSeenAt: string;
  lastUpdatedAt: string;
  eventCount: number;
  alertEventCount: number;
  degradationEventCount: number;
  runtimeStability: "UNKNOWN" | "STABLE" | "UNSTABLE" | "CHRONIC";
  monitoringMaturity: "MISSING" | "SPARSE" | "CONSISTENT";
  lifecycleRisks: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(value: string, now = new Date()) {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));
}

function eventMatches(asset: Asset, event: OperationalEventSummary) {
  return event.assetId === asset.id || event.assetName === asset.name;
}

function runtimeStability(
  runtimeProfile: RuntimeIntelligenceProfile | undefined,
  degradationEventCount: number,
): LifecycleProfile["runtimeStability"] {
  if (!runtimeProfile || runtimeProfile.checkCount === 0) return "UNKNOWN";
  if (
    runtimeProfile.healthScore === "OFFLINE" ||
    runtimeProfile.healthScore === "CRITICAL" ||
    degradationEventCount >= 4
  ) {
    return "CHRONIC";
  }
  if (
    runtimeProfile.healthScore === "UNSTABLE" ||
    runtimeProfile.healthScore === "DEGRADED" ||
    runtimeProfile.trend === "UNSTABLE"
  ) {
    return "UNSTABLE";
  }
  return "STABLE";
}

function monitoringMaturity(
  runtimeProfile: RuntimeIntelligenceProfile | undefined,
): LifecycleProfile["monitoringMaturity"] {
  if (!runtimeProfile || runtimeProfile.checkCount === 0) return "MISSING";
  if (runtimeProfile.checkCount < 5) return "SPARSE";
  return "CONSISTENT";
}

function operationalMaturity({
  monitoring,
  eventCount,
  hasOwner,
  hasRegion,
  hasTags,
}: {
  monitoring: LifecycleProfile["monitoringMaturity"];
  eventCount: number;
  hasOwner: boolean;
  hasRegion: boolean;
  hasTags: boolean;
}): OperationalMaturity {
  if (monitoring === "MISSING") return "UNOBSERVED";
  if (monitoring === "SPARSE" || !hasOwner) return "EMERGING";
  if (eventCount >= 5 && hasRegion && hasTags) return "MATURE";
  return "MANAGED";
}

export function getLifecycleProfile({
  asset,
  runtimeProfile,
  riskProfile,
  events,
  now = new Date(),
}: {
  asset: Asset;
  runtimeProfile?: RuntimeIntelligenceProfile;
  riskProfile?: AssetRiskProfile;
  events: OperationalEventSummary[];
  now?: Date;
}): LifecycleProfile {
  const assetEvents = events.filter((event) => eventMatches(asset, event));
  const alertEventCount = assetEvents.filter(
    (event) =>
      event.eventType === "ALERT_TRIGGERED" ||
      event.severity === "CRITICAL" ||
      event.severity === "WARNING",
  ).length;
  const degradationEventCount = assetEvents.filter(
    (event) =>
      event.eventType === "HEALTH_DEGRADED" ||
      event.eventType === "RUNTIME_OFFLINE",
  ).length;
  const ageDays = daysBetween(asset.createdAt, now);
  const daysSinceUpdate = daysBetween(asset.updatedAt, now);
  const stability = runtimeStability(runtimeProfile, degradationEventCount);
  const monitoring = monitoringMaturity(runtimeProfile);
  const maturity = operationalMaturity({
    monitoring,
    eventCount: assetEvents.length,
    hasOwner: Boolean(asset.owner.trim()),
    hasRegion: Boolean(asset.region.trim()),
    hasTags: asset.tags.length > 0,
  });
  const lifecycleRisks: string[] = [];

  if (ageDays > 365 && maturity !== "MATURE") {
    lifecycleRisks.push("Aging infrastructure with incomplete maturity");
  }
  if (stability === "CHRONIC") {
    lifecycleRisks.push("Chronic runtime instability");
  }
  if (monitoring === "MISSING") {
    lifecycleRisks.push("Long-term monitoring gap");
  }
  if ((riskProfile?.score === "HIGH" || riskProfile?.score === "CRITICAL") && ageDays > 180) {
    lifecycleRisks.push("Chronic operational risk exposure");
  }
  if (daysSinceUpdate > 180) {
    lifecycleRisks.push("Operational metadata has not changed recently");
  }

  const stage: InfrastructureLifecycleStage =
    riskProfile?.score === "CRITICAL" || stability === "CHRONIC"
      ? "CRITICAL"
      : stability === "UNSTABLE"
        ? "DEGRADED"
        : ageDays > 365 && maturity !== "MATURE"
          ? "LEGACY"
          : ageDays <= 30
            ? "NEW"
            : stability === "STABLE" && maturity === "MATURE"
              ? "STABLE"
              : "ACTIVE";

  return {
    asset,
    stage,
    maturity,
    ageDays,
    daysSinceUpdate,
    firstSeenAt: asset.createdAt,
    lastUpdatedAt: asset.updatedAt,
    eventCount: assetEvents.length,
    alertEventCount,
    degradationEventCount,
    runtimeStability: stability,
    monitoringMaturity: monitoring,
    lifecycleRisks,
  };
}

export function getLifecycleProfiles({
  assets,
  runtimeProfiles,
  riskProfiles,
  events,
}: {
  assets: Asset[];
  runtimeProfiles: RuntimeIntelligenceProfile[];
  riskProfiles: AssetRiskProfile[];
  events: OperationalEventSummary[];
}) {
  const runtimeByAssetId = new Map(
    runtimeProfiles.map((profile) => [profile.asset.id, profile]),
  );
  const riskByAssetId = new Map(
    riskProfiles.map((profile) => [profile.asset.id, profile]),
  );

  return assets
    .map((asset) =>
      getLifecycleProfile({
        asset,
        runtimeProfile: runtimeByAssetId.get(asset.id),
        riskProfile: riskByAssetId.get(asset.id),
        events,
      }),
    )
    .sort((a, b) => lifecycleRank(b.stage) - lifecycleRank(a.stage));
}

export function lifecycleRank(stage: InfrastructureLifecycleStage) {
  const ranks: Record<InfrastructureLifecycleStage, number> = {
    NEW: 1,
    ACTIVE: 2,
    STABLE: 3,
    DEGRADED: 4,
    LEGACY: 5,
    CRITICAL: 6,
  };

  return ranks[stage];
}
