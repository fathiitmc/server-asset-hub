import type { Asset } from "@/lib/assets";
import type { AssetRuntimeHealthStatus } from "@/src/lib/monitoring/health";
import {
  getAssetExpirySignal,
  type ExpiryRiskState,
} from "./expiry-intelligence";

export type OperationalRiskScore = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskSignal = {
  id: string;
  label: string;
  detail: string;
  severity: OperationalRiskScore;
};

export type AssetRiskProfile = {
  asset: Asset;
  score: OperationalRiskScore;
  points: number;
  expiryState: ExpiryRiskState;
  runtimeStatus: AssetRuntimeHealthStatus;
  signals: RiskSignal[];
};

type RiskInput = {
  asset: Asset;
  runtimeStatus?: AssetRuntimeHealthStatus;
  hasMonitoring?: boolean;
  credentialCount?: number;
};

function scoreFromPoints(points: number): OperationalRiskScore {
  if (points >= 9) return "CRITICAL";
  if (points >= 6) return "HIGH";
  if (points >= 3) return "MEDIUM";
  return "LOW";
}

function missing(value: string | null | undefined) {
  return !value || value.trim().length === 0;
}

export function getAssetRiskProfile({
  asset,
  runtimeStatus = "UNKNOWN",
  hasMonitoring,
  credentialCount,
}: RiskInput): AssetRiskProfile {
  const expiry = getAssetExpirySignal(asset);
  const signals: RiskSignal[] = [];
  let points = 0;

  if (expiry.state === "EXPIRED") {
    points += 5;
    signals.push({
      id: "expiry-expired",
      label: "Renewal overdue",
      detail: `${expiry.label} is past due.`,
      severity: "CRITICAL",
    });
  } else if (expiry.state === "CRITICAL") {
    points += 4;
    signals.push({
      id: "expiry-critical",
      label: "Critical renewal window",
      detail: `${expiry.label} is due in ${expiry.daysRemaining} days.`,
      severity: "HIGH",
    });
  } else if (expiry.state === "WARNING") {
    points += 2;
    signals.push({
      id: "expiry-warning",
      label: "Expiring soon",
      detail: `${expiry.label} is due within 30 days.`,
      severity: "MEDIUM",
    });
  }

  if (runtimeStatus === "OFFLINE") {
    points += 5;
    signals.push({
      id: "runtime-offline",
      label: "Runtime offline",
      detail: "Latest monitoring signal reports this asset offline.",
      severity: "CRITICAL",
    });
  } else if (runtimeStatus === "DEGRADED") {
    points += 3;
    signals.push({
      id: "runtime-degraded",
      label: "Runtime degraded",
      detail: "Latest monitoring signal reports degraded performance.",
      severity: "HIGH",
    });
  } else if (runtimeStatus === "UNKNOWN" || hasMonitoring === false) {
    points += 2;
    signals.push({
      id: "monitoring-gap",
      label: "Monitoring gap",
      detail: "No reliable runtime monitoring signal is available.",
      severity: "MEDIUM",
    });
  }

  if (missing(asset.owner)) {
    points += 3;
    signals.push({
      id: "missing-owner",
      label: "Missing owner",
      detail: "Operational ownership is not assigned.",
      severity: "HIGH",
    });
  }

  if (missing(asset.region)) {
    points += 1;
    signals.push({
      id: "missing-region",
      label: "Missing region",
      detail: "Region metadata is not set.",
      severity: "LOW",
    });
  }

  if (asset.tags.length === 0) {
    points += 1;
    signals.push({
      id: "missing-tags",
      label: "Missing tags",
      detail: "No governance tags are attached.",
      severity: "LOW",
    });
  }

  if (credentialCount === 0) {
    points += 2;
    signals.push({
      id: "missing-credentials",
      label: "No credentials recorded",
      detail: "Vault has no credential reference for this asset.",
      severity: "MEDIUM",
    });
  }

  if ((asset.type === "DOMAIN" || asset.domain) && missing(asset.owner)) {
    points += 2;
    signals.push({
      id: "orphaned-domain",
      label: "Orphaned domain risk",
      detail: "Domain-like asset has no clear owner.",
      severity: "HIGH",
    });
  }

  return {
    asset,
    score: scoreFromPoints(points),
    points,
    expiryState: expiry.state,
    runtimeStatus,
    signals,
  };
}

export function getRiskProfiles(
  assets: Asset[],
  runtimeStatuses: Map<string, AssetRuntimeHealthStatus>,
) {
  return assets
    .map((asset) =>
      getAssetRiskProfile({
        asset,
        runtimeStatus: runtimeStatuses.get(asset.id) ?? "UNKNOWN",
        hasMonitoring: runtimeStatuses.has(asset.id),
      }),
    )
    .sort((a, b) => b.points - a.points);
}
