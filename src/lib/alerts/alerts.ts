import "server-only";

import { createOperationalEvent } from "@/lib/operational-events-db";
import { prisma } from "@/lib/prisma";

export const alertTypes = [
  "RENEWAL_EXPIRING",
  "RENEWAL_OVERDUE",
  "ASSET_OFFLINE",
  "ASSET_DEGRADED",
] as const;

export const alertSeverities = ["INFO", "WARNING", "CRITICAL"] as const;

export type AlertType = (typeof alertTypes)[number];
export type AlertSeverity = (typeof alertSeverities)[number];

export type ActiveAlert = {
  id: string;
  assetId: string | null;
  assetName: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  createdAt: string;
};

export type AlertInput = {
  assetId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
};

function normalizeType(type: string): AlertType {
  return alertTypes.includes(type as AlertType)
    ? (type as AlertType)
    : "RENEWAL_EXPIRING";
}

function normalizeSeverity(severity: string): AlertSeverity {
  return alertSeverities.includes(severity as AlertSeverity)
    ? (severity as AlertSeverity)
    : "INFO";
}

function mapAlert(alert: {
  id: string;
  assetId: string | null;
  type: string;
  severity: string;
  title: string;
  message: string;
  createdAt: Date;
  asset: { name: string } | null;
}): ActiveAlert {
  return {
    id: alert.id,
    assetId: alert.assetId,
    assetName: alert.asset?.name ?? null,
    type: normalizeType(alert.type),
    severity: normalizeSeverity(alert.severity),
    title: alert.title,
    message: alert.message,
    createdAt: alert.createdAt.toISOString(),
  };
}

export async function upsertActiveAlert(input: AlertInput) {
  const existing = await prisma.assetAlert.findFirst({
    where: {
      assetId: input.assetId,
      type: input.type,
      acknowledged: false,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.assetAlert.update({
      where: { id: existing.id },
      data: {
        severity: input.severity,
        title: input.title,
        message: input.message,
      },
    });
    return;
  }

  const alert = await prisma.assetAlert.create({
    data: {
      assetId: input.assetId,
      type: input.type,
      severity: input.severity,
      title: input.title,
      message: input.message,
    },
    include: {
      asset: {
        select: { name: true },
      },
    },
  });

  await createOperationalEvent({
    assetId: alert.assetId,
    assetName: alert.asset?.name ?? null,
    eventType:
      input.type === "ASSET_OFFLINE"
        ? "RUNTIME_OFFLINE"
        : input.type === "ASSET_DEGRADED"
          ? "HEALTH_DEGRADED"
          : input.type === "RENEWAL_EXPIRING"
            ? "SSL_EXPIRY_DETECTED"
            : "ALERT_TRIGGERED",
    severity: input.severity,
    title: input.title,
    description: input.message,
    metadata: { alertId: alert.id, alertType: input.type },
    source: "ALERT_ENGINE",
  });
}

export async function acknowledgeAlert(id: string) {
  await prisma.assetAlert.update({
    where: { id },
    data: { acknowledged: true },
  });
}

export async function getActiveAlerts(take = 10) {
  const alerts = await prisma.assetAlert.findMany({
    where: { acknowledged: false },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take,
    include: {
      asset: {
        select: { name: true },
      },
    },
  });

  return alerts
    .map(mapAlert)
    .sort(
      (a: ActiveAlert, b: ActiveAlert) =>
        severityRank(b.severity) - severityRank(a.severity),
    );
}

export async function getAlertSummary() {
  const [critical, warning, info, total] = await Promise.all([
    prisma.assetAlert.count({
      where: { acknowledged: false, severity: "CRITICAL" },
    }),
    prisma.assetAlert.count({
      where: { acknowledged: false, severity: "WARNING" },
    }),
    prisma.assetAlert.count({
      where: { acknowledged: false, severity: "INFO" },
    }),
    prisma.assetAlert.count({
      where: { acknowledged: false },
    }),
  ]);

  return { critical, warning, info, total };
}

function severityRank(severity: AlertSeverity) {
  const ranks: Record<AlertSeverity, number> = {
    INFO: 1,
    WARNING: 2,
    CRITICAL: 3,
  };

  return ranks[severity];
}
