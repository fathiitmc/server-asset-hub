import type { ExpiryRiskState } from "./expiry-intelligence";
import type { OperationalRiskScore } from "./operational-risk";
import type { RuntimeIntelligenceProfile } from "./runtime-intelligence";

export type OperationalAttentionLevel =
  | "NORMAL"
  | "NEEDS_REVIEW"
  | "HIGH_ATTENTION"
  | "CRITICAL_ATTENTION";

export function classifyAttentionLevel({
  riskScore,
  expiryState,
  runtimeProfile,
  signalCount,
}: {
  riskScore: OperationalRiskScore;
  expiryState: ExpiryRiskState;
  runtimeProfile?: RuntimeIntelligenceProfile;
  signalCount: number;
}): OperationalAttentionLevel {
  if (
    riskScore === "CRITICAL" ||
    expiryState === "EXPIRED" ||
    runtimeProfile?.healthScore === "OFFLINE"
  ) {
    return "CRITICAL_ATTENTION";
  }

  if (
    riskScore === "HIGH" ||
    expiryState === "CRITICAL" ||
    runtimeProfile?.healthScore === "CRITICAL" ||
    runtimeProfile?.healthScore === "UNSTABLE" ||
    signalCount >= 3
  ) {
    return "HIGH_ATTENTION";
  }

  if (
    riskScore === "MEDIUM" ||
    expiryState === "WARNING" ||
    runtimeProfile?.monitoringConsistency === "SPARSE" ||
    signalCount > 0
  ) {
    return "NEEDS_REVIEW";
  }

  return "NORMAL";
}

export function attentionRank(level: OperationalAttentionLevel) {
  const ranks: Record<OperationalAttentionLevel, number> = {
    NORMAL: 1,
    NEEDS_REVIEW: 2,
    HIGH_ATTENTION: 3,
    CRITICAL_ATTENTION: 4,
  };

  return ranks[level];
}
