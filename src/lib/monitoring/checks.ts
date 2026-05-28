import "server-only";

import { prisma } from "@/lib/prisma";
import type { Asset } from "@/lib/assets";
import type {
  AssetHealthSnapshot,
  AssetRuntimeHealthStatus,
} from "./health";

const CHECK_TIMEOUT_MS = 5000;
const DEGRADED_RESPONSE_MS = 3000;

type HealthCheckRecord = {
  assetId: string;
  status: string;
  responseTime: number | null;
  checkedAt: Date;
};

export type AssetHealthSummary = {
  snapshots: AssetHealthSnapshot[];
  online: number;
  offline: number;
  degraded: number;
  unknown: number;
  averageResponseTime: number | null;
};

function mapHealthSnapshot(check: HealthCheckRecord): AssetHealthSnapshot {
  return {
    assetId: check.assetId,
    status: normalizeHealthStatus(check.status),
    responseTime: check.responseTime,
    checkedAt: check.checkedAt.toISOString(),
  };
}

function normalizeHealthStatus(status: string): AssetRuntimeHealthStatus {
  if (
    status === "ONLINE" ||
    status === "OFFLINE" ||
    status === "DEGRADED" ||
    status === "UNKNOWN"
  ) {
    return status;
  }

  return "UNKNOWN";
}

function getAssetCheckUrl(asset: Pick<Asset, "name">) {
  const value = asset.name.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) {
    return `https://${value}`;
  }

  return null;
}

async function writeHealthCheck({
  assetId,
  status,
  responseTime,
}: {
  assetId: string;
  status: AssetRuntimeHealthStatus;
  responseTime: number | null;
}) {
  const check = await prisma.assetHealthCheck.create({
    data: {
      assetId,
      status,
      responseTime,
    },
  });

  return mapHealthSnapshot(check);
}

export async function runAssetHealthCheck(assetId: string) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, name: true },
  });

  if (!asset) {
    throw new Error("Asset not found.");
  }

  const checkUrl = getAssetCheckUrl(asset);

  if (!checkUrl) {
    return writeHealthCheck({
      assetId,
      status: "UNKNOWN",
      responseTime: null,
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(checkUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    const responseTime = Date.now() - startedAt;
    const status =
      response.ok || (response.status >= 300 && response.status < 400)
        ? responseTime > DEGRADED_RESPONSE_MS
          ? "DEGRADED"
          : "ONLINE"
        : "OFFLINE";

    return writeHealthCheck({
      assetId,
      status,
      responseTime,
    });
  } catch {
    return writeHealthCheck({
      assetId,
      status: "OFFLINE",
      responseTime: Date.now() - startedAt,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getLatestHealthStatus(assetId: string) {
  const check = await prisma.assetHealthCheck.findFirst({
    where: { assetId },
    orderBy: { checkedAt: "desc" },
  });

  return check ? mapHealthSnapshot(check) : null;
}

export async function getRecentHealthChecks(assetId: string, take = 5) {
  const checks = await prisma.assetHealthCheck.findMany({
    where: { assetId },
    orderBy: { checkedAt: "desc" },
    take,
  });

  return checks.map(mapHealthSnapshot);
}

export async function getAssetHealthSummary(
  assetIds: string[],
): Promise<AssetHealthSummary> {
  if (assetIds.length === 0) {
    return {
      snapshots: [],
      online: 0,
      offline: 0,
      degraded: 0,
      unknown: 0,
      averageResponseTime: null,
    };
  }

  const placeholders = assetIds.map((_, index) => `$${index + 1}`).join(", ");
  const latestChecks = (await prisma.$queryRawUnsafe(
    `
    SELECT DISTINCT ON ("assetId")
      "assetId",
      "status",
      "responseTime",
      "checkedAt"
    FROM "AssetHealthCheck"
    WHERE "assetId" IN (${placeholders})
    ORDER BY "assetId", "checkedAt" DESC
    `,
    ...assetIds,
  )) as HealthCheckRecord[];
  const latestByAssetId = new Map(
    latestChecks.map((check) => [check.assetId, mapHealthSnapshot(check)]),
  );
  const snapshots = assetIds.map(
    (assetId) =>
      latestByAssetId.get(assetId) ?? {
        assetId,
        status: "UNKNOWN" as const,
        responseTime: null,
        checkedAt: null,
      },
  );
  const responseTimes = snapshots
    .map((snapshot) => snapshot.responseTime)
    .filter((value): value is number => typeof value === "number");

  return {
    snapshots,
    online: snapshots.filter((snapshot) => snapshot.status === "ONLINE").length,
    offline: snapshots.filter((snapshot) => snapshot.status === "OFFLINE")
      .length,
    degraded: snapshots.filter((snapshot) => snapshot.status === "DEGRADED")
      .length,
    unknown: snapshots.filter((snapshot) => snapshot.status === "UNKNOWN")
      .length,
    averageResponseTime:
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, value) => sum + value, 0) /
              responseTimes.length,
          )
        : null,
  };
}
