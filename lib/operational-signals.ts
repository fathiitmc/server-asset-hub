import type { Asset } from "@/lib/assets";
import type { ExpirySignal } from "./expiry-intelligence";
import { classifyAttentionLevel, type OperationalAttentionLevel } from "./attention-engine";
import type { OperationalAnalyticsSummary } from "./operational-analytics";
import type { AssetRiskProfile } from "./operational-risk";
import type { ProviderInsight } from "./provider-intelligence";
import type { RuntimeIntelligenceProfile } from "./runtime-intelligence";

export type OperationalSignalCategory =
  | "RUNTIME"
  | "EXPIRY"
  | "MONITORING"
  | "OWNERSHIP"
  | "PROVIDER"
  | "GOVERNANCE"
  | "ANOMALY";

export type OperationalSignal = {
  id: string;
  ruleId: string;
  assetId: string | null;
  assetName: string | null;
  category: OperationalSignalCategory;
  attentionLevel: OperationalAttentionLevel;
  title: string;
  description: string;
  evidence: string;
};

type SignalContext = {
  assets: Asset[];
  expirySignals: ExpirySignal[];
  riskProfiles: AssetRiskProfile[];
  runtimeProfiles: RuntimeIntelligenceProfile[];
  providerInsights: ProviderInsight[];
  analyticsSummary?: OperationalAnalyticsSummary;
};

export function getOperationalSignals({
  assets,
  expirySignals,
  riskProfiles,
  runtimeProfiles,
  providerInsights,
  analyticsSummary,
}: SignalContext): OperationalSignal[] {
  const signals: OperationalSignal[] = [];
  const expiryByAssetId = new Map(expirySignals.map((signal) => [signal.assetId, signal]));
  const runtimeByAssetId = new Map(
    runtimeProfiles.map((profile) => [profile.asset.id, profile]),
  );

  for (const riskProfile of riskProfiles) {
    const asset = riskProfile.asset;
    const expiry = expiryByAssetId.get(asset.id);
    const runtime = runtimeByAssetId.get(asset.id);
    const attentionLevel = classifyAttentionLevel({
      riskScore: riskProfile.score,
      expiryState: riskProfile.expiryState,
      runtimeProfile: runtime,
      signalCount: riskProfile.signals.length,
    });

    if (attentionLevel !== "NORMAL") {
      signals.push({
        id: `asset-attention-${asset.id}`,
        ruleId: "asset-attention",
        assetId: asset.id,
        assetName: asset.name,
        category: "GOVERNANCE",
        attentionLevel,
        title: `${asset.name} requires ${attentionLevel.toLowerCase().replace("_", " ")}`,
        description:
          riskProfile.signals[0]?.detail ??
          "Operational intelligence found multiple review signals.",
        evidence: `${riskProfile.score} risk / ${riskProfile.points} points / ${
          riskProfile.signals.length
        } warnings`,
      });
    }

    if (expiry && (expiry.state === "CRITICAL" || expiry.state === "EXPIRED")) {
      signals.push({
        id: `expiry-${asset.id}`,
        ruleId: "critical-expiry",
        assetId: asset.id,
        assetName: asset.name,
        category: "EXPIRY",
        attentionLevel:
          expiry.state === "EXPIRED" ? "CRITICAL_ATTENTION" : "HIGH_ATTENTION",
        title:
          expiry.state === "EXPIRED"
            ? `${asset.name} renewal is overdue`
            : `${asset.name} is inside a critical renewal window`,
        description: `${expiry.label} needs review before operational exposure increases.`,
        evidence:
          expiry.daysRemaining === null
            ? "Renewal date unavailable"
            : `${expiry.daysRemaining} days remaining`,
      });
    }
  }

  for (const runtime of runtimeProfiles) {
    if (
      runtime.healthScore === "OFFLINE" ||
      runtime.healthScore === "CRITICAL" ||
      runtime.healthScore === "UNSTABLE" ||
      runtime.trend === "UNSTABLE"
    ) {
      signals.push({
        id: `runtime-${runtime.asset.id}`,
        ruleId: "runtime-instability",
        assetId: runtime.asset.id,
        assetName: runtime.asset.name,
        category: "RUNTIME",
        attentionLevel:
          runtime.healthScore === "OFFLINE" || runtime.healthScore === "CRITICAL"
            ? "CRITICAL_ATTENTION"
            : "HIGH_ATTENTION",
        title: `${runtime.asset.name} runtime instability detected`,
        description:
          "Recent monitoring history shows offline, degraded, or unstable runtime behavior.",
        evidence: `${runtime.healthScore} / ${runtime.trend} / ${runtime.degradationFrequency}% degraded frequency`,
      });
    }

    if (runtime.monitoringConsistency === "MISSING") {
      signals.push({
        id: `monitoring-missing-${runtime.asset.id}`,
        ruleId: "monitoring-inactivity",
        assetId: runtime.asset.id,
        assetName: runtime.asset.name,
        category: "MONITORING",
        attentionLevel: "NEEDS_REVIEW",
        title: `${runtime.asset.name} has no monitoring history`,
        description:
          "The platform cannot establish runtime posture without recent health checks.",
        evidence: "0 checks analyzed",
      });
    }
  }

  for (const provider of providerInsights) {
    if (provider.concentrationRisk === "HIGH") {
      signals.push({
        id: `provider-concentration-${provider.provider}`,
        ruleId: "provider-concentration",
        assetId: null,
        assetName: null,
        category: "PROVIDER",
        attentionLevel: "HIGH_ATTENTION",
        title: `${provider.provider} concentration risk`,
        description:
          "A large share of tracked infrastructure depends on one provider.",
        evidence: `${provider.percentage}% of assets / ${provider.riskyAssets} risky assets`,
      });
    }
  }

  if (analyticsSummary && analyticsSummary.runtimeCoverage < 50 && assets.length > 0) {
    signals.push({
      id: "monitoring-coverage-low",
      ruleId: "monitoring-coverage-low",
      assetId: null,
      assetName: null,
      category: "MONITORING",
      attentionLevel: "HIGH_ATTENTION",
      title: "Monitoring coverage below target",
      description:
        "Too much infrastructure lacks runtime visibility for confident operations.",
      evidence: `${analyticsSummary.runtimeCoverage}% coverage`,
    });
  }

  return dedupeSignals(signals).sort((a, b) => attentionWeight(b) - attentionWeight(a));
}

export function getAssetOperationalSignals(
  assetId: string,
  signals: OperationalSignal[],
) {
  return signals.filter((signal) => signal.assetId === assetId);
}

function attentionWeight(signal: OperationalSignal) {
  const weights: Record<OperationalAttentionLevel, number> = {
    NORMAL: 1,
    NEEDS_REVIEW: 2,
    HIGH_ATTENTION: 3,
    CRITICAL_ATTENTION: 4,
  };

  return weights[signal.attentionLevel];
}

function dedupeSignals(signals: OperationalSignal[]) {
  return Array.from(new Map(signals.map((signal) => [signal.id, signal])).values());
}
