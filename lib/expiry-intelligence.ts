import type { Asset } from "@/lib/assets";
import { getDaysUntilRenewal } from "@/src/lib/assets/intelligence";

export type ExpiryRiskState = "HEALTHY" | "WARNING" | "CRITICAL" | "EXPIRED";

export type ExpirySignal = {
  assetId: string;
  assetName: string;
  category: "SSL" | "DOMAIN" | "CREDENTIAL" | "LICENSE" | "SUBSCRIPTION";
  label: string;
  daysRemaining: number | null;
  state: ExpiryRiskState;
  renewalDate: string;
};

export function classifyExpiryRisk(daysRemaining: number | null): ExpiryRiskState {
  if (daysRemaining === null) return "HEALTHY";
  if (daysRemaining < 0) return "EXPIRED";
  if (daysRemaining <= 7) return "CRITICAL";
  if (daysRemaining <= 30) return "WARNING";
  return "HEALTHY";
}

function expiryCategory(asset: Asset): ExpirySignal["category"] {
  if (asset.type === "SSL") return "SSL";
  if (asset.type === "DOMAIN" || asset.domain) return "DOMAIN";
  if (asset.type === "EMAIL" || asset.type === "CLOUD") return "SUBSCRIPTION";
  return "LICENSE";
}

export function getAssetExpirySignal(asset: Asset): ExpirySignal {
  const daysRemaining = getDaysUntilRenewal(asset);
  const category = expiryCategory(asset);

  return {
    assetId: asset.id,
    assetName: asset.name,
    category,
    label:
      category === "SSL"
        ? "SSL expiry"
        : category === "DOMAIN"
          ? "Domain renewal"
          : category === "SUBSCRIPTION"
            ? "Subscription renewal"
            : "License renewal",
    daysRemaining,
    state: classifyExpiryRisk(daysRemaining),
    renewalDate: asset.renewalDate,
  };
}

export function getExpirySignals(assets: Asset[]) {
  return assets
    .map(getAssetExpirySignal)
    .sort((a, b) => {
      const aDays = a.daysRemaining ?? Number.POSITIVE_INFINITY;
      const bDays = b.daysRemaining ?? Number.POSITIVE_INFINITY;
      return aDays - bDays;
    });
}

export function getCriticalExpirySignals(assets: Asset[]) {
  return getExpirySignals(assets).filter(
    (signal) => signal.state === "CRITICAL" || signal.state === "EXPIRED",
  );
}
