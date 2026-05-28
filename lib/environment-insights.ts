import type { Asset } from "@/lib/assets";
import type { AssetRiskProfile } from "./operational-risk";
import type { RuntimeIntelligenceProfile } from "./runtime-intelligence";

export type SegmentInsight = {
  label: string;
  assetCount: number;
  monitoredAssets: number;
  monitoringCoverage: number;
  riskyAssets: number;
  unhealthyAssets: number;
};

function pct(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

function buildSegmentInsights({
  assets,
  runtimeProfiles,
  riskProfiles,
  getLabel,
}: {
  assets: Asset[];
  runtimeProfiles: RuntimeIntelligenceProfile[];
  riskProfiles: AssetRiskProfile[];
  getLabel: (asset: Asset) => string;
}) {
  const runtimeByAssetId = new Map(
    runtimeProfiles.map((profile) => [profile.asset.id, profile]),
  );
  const riskByAssetId = new Map(
    riskProfiles.map((profile) => [profile.asset.id, profile]),
  );

  return Array.from(new Set(assets.map(getLabel)))
    .map<SegmentInsight>((label) => {
      const segmentAssets = assets.filter((asset) => getLabel(asset) === label);
      const monitoredAssets = segmentAssets.filter(
        (asset) => (runtimeByAssetId.get(asset.id)?.checkCount ?? 0) > 0,
      ).length;
      const riskyAssets = segmentAssets.filter((asset) =>
        ["HIGH", "CRITICAL"].includes(riskByAssetId.get(asset.id)?.score ?? "LOW"),
      ).length;
      const unhealthyAssets = segmentAssets.filter((asset) =>
        ["OFFLINE", "CRITICAL", "UNSTABLE", "DEGRADED"].includes(
          runtimeByAssetId.get(asset.id)?.healthScore ?? "HEALTHY",
        ),
      ).length;

      return {
        label,
        assetCount: segmentAssets.length,
        monitoredAssets,
        monitoringCoverage: pct(monitoredAssets, segmentAssets.length),
        riskyAssets,
        unhealthyAssets,
      };
    })
    .sort((a, b) => b.assetCount - a.assetCount || a.label.localeCompare(b.label));
}

export function getEnvironmentInsights(input: {
  assets: Asset[];
  runtimeProfiles: RuntimeIntelligenceProfile[];
  riskProfiles: AssetRiskProfile[];
}) {
  return buildSegmentInsights({
    ...input,
    getLabel: (asset) => asset.environment,
  });
}

export function getRegionInsights(input: {
  assets: Asset[];
  runtimeProfiles: RuntimeIntelligenceProfile[];
  riskProfiles: AssetRiskProfile[];
}) {
  return buildSegmentInsights({
    ...input,
    getLabel: (asset) => asset.region || "Unassigned",
  });
}
