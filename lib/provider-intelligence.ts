import type { Asset } from "@/lib/assets";
import type { AssetRiskProfile } from "./operational-risk";
import type { RuntimeIntelligenceProfile } from "./runtime-intelligence";

export type ProviderInsight = {
  provider: string;
  assetCount: number;
  percentage: number;
  monitoredAssets: number;
  monitoringCoverage: number;
  riskyAssets: number;
  offlineAssets: number;
  degradedAssets: number;
  concentrationRisk: "LOW" | "MEDIUM" | "HIGH";
};

function pct(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

export function getProviderInsights({
  assets,
  runtimeProfiles,
  riskProfiles,
}: {
  assets: Asset[];
  runtimeProfiles: RuntimeIntelligenceProfile[];
  riskProfiles: AssetRiskProfile[];
}) {
  const runtimeByAssetId = new Map(
    runtimeProfiles.map((profile) => [profile.asset.id, profile]),
  );
  const riskByAssetId = new Map(
    riskProfiles.map((profile) => [profile.asset.id, profile]),
  );
  const providers = Array.from(
    new Set(assets.map((asset) => asset.provider || "Unassigned")),
  );

  return providers
    .map<ProviderInsight>((provider) => {
      const providerAssets = assets.filter(
        (asset) => (asset.provider || "Unassigned") === provider,
      );
      const monitoredAssets = providerAssets.filter(
        (asset) => (runtimeByAssetId.get(asset.id)?.checkCount ?? 0) > 0,
      ).length;
      const riskyAssets = providerAssets.filter((asset) =>
        ["HIGH", "CRITICAL"].includes(riskByAssetId.get(asset.id)?.score ?? "LOW"),
      ).length;
      const offlineAssets = providerAssets.filter(
        (asset) => runtimeByAssetId.get(asset.id)?.healthScore === "OFFLINE",
      ).length;
      const degradedAssets = providerAssets.filter((asset) =>
        ["DEGRADED", "UNSTABLE", "CRITICAL"].includes(
          runtimeByAssetId.get(asset.id)?.healthScore ?? "HEALTHY",
        ),
      ).length;
      const percentage = pct(providerAssets.length, assets.length);

      return {
        provider,
        assetCount: providerAssets.length,
        percentage,
        monitoredAssets,
        monitoringCoverage: pct(monitoredAssets, providerAssets.length),
        riskyAssets,
        offlineAssets,
        degradedAssets,
        concentrationRisk:
          percentage >= 50 ? "HIGH" : percentage >= 30 ? "MEDIUM" : "LOW",
      };
    })
    .sort((a, b) => b.assetCount - a.assetCount || a.provider.localeCompare(b.provider));
}
