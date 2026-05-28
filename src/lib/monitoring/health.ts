import "server-only";

export const assetRuntimeHealthStates = [
  "ONLINE",
  "OFFLINE",
  "DEGRADED",
  "UNKNOWN",
] as const;

export type AssetRuntimeHealthStatus =
  (typeof assetRuntimeHealthStates)[number];

export type AssetHealthSnapshot = {
  assetId: string;
  status: AssetRuntimeHealthStatus;
  responseTime: number | null;
  checkedAt: string | null;
};

export function getHealthTone(status: AssetRuntimeHealthStatus) {
  const tones: Record<AssetRuntimeHealthStatus, string> = {
    ONLINE: "emerald",
    DEGRADED: "amber",
    OFFLINE: "red",
    UNKNOWN: "zinc",
  };

  return tones[status];
}

export function formatResponseTime(responseTime: number | null) {
  return responseTime === null ? "No response" : `${responseTime} ms`;
}

export function formatCheckedAt(checkedAt: string | null) {
  if (!checkedAt) {
    return "Never checked";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(checkedAt));
}
