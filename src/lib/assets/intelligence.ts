import type { Asset } from "@/lib/assets";

export const assetHealthStatuses = [
  "HEALTHY",
  "EXPIRING_SOON",
  "OVERDUE",
  "EXPIRED",
] as const;

export type AssetHealthStatus = (typeof assetHealthStatuses)[number];
export type AssetRiskColor = "green" | "amber" | "red" | "dark-red";

const EXPIRING_SOON_DAYS = 14;
const OVERDUE_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function renewalUtcDay(renewalDate: string) {
  const date = new Date(`${renewalDate}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return startOfUtcDay(date);
}

export function getDaysUntilRenewal(
  asset: Pick<Asset, "renewalDate">,
  now = new Date(),
) {
  const renewalDay = renewalUtcDay(asset.renewalDate);

  if (renewalDay === null) {
    return null;
  }

  return Math.ceil((renewalDay - startOfUtcDay(now)) / DAY_IN_MS);
}

export function getAssetHealthStatus(
  asset: Pick<Asset, "renewalDate">,
  now = new Date(),
): AssetHealthStatus {
  const daysUntilRenewal = getDaysUntilRenewal(asset, now);

  if (daysUntilRenewal === null) {
    return "HEALTHY";
  }

  if (daysUntilRenewal < -OVERDUE_DAYS) {
    return "OVERDUE";
  }

  if (daysUntilRenewal < 0) {
    return "EXPIRED";
  }

  if (daysUntilRenewal <= EXPIRING_SOON_DAYS) {
    return "EXPIRING_SOON";
  }

  return "HEALTHY";
}

export function getExpiringAssets(assets: Asset[], now = new Date()) {
  return assets.filter(
    (asset) => getAssetHealthStatus(asset, now) === "EXPIRING_SOON",
  );
}

export function getOverdueAssets(assets: Asset[], now = new Date()) {
  return assets.filter((asset) => getAssetHealthStatus(asset, now) === "OVERDUE");
}

export function getAssetRiskColor(status: AssetHealthStatus): AssetRiskColor {
  const colors: Record<AssetHealthStatus, AssetRiskColor> = {
    HEALTHY: "green",
    EXPIRING_SOON: "amber",
    EXPIRED: "red",
    OVERDUE: "dark-red",
  };

  return colors[status];
}
