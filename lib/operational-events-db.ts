import "server-only";

import type {
  OperationalEventSeverity,
  OperationalEventSource,
  OperationalEventType,
  Prisma,
} from "@prisma/client";
import type { Asset } from "@/lib/assets";
import type { OperationalEventSummary } from "./operational-events";

export type OperationalEventInput = {
  assetId?: string | null;
  assetName?: string | null;
  eventType: OperationalEventType;
  severity?: OperationalEventSeverity;
  title: string;
  description: string;
  metadata?: Prisma.InputJsonValue;
  actor?: string | null;
  source?: OperationalEventSource;
};

export type OperationalEventFilters = {
  assetId?: string;
  severity?: OperationalEventSeverity;
  source?: OperationalEventSource;
  from?: Date;
  to?: Date;
  take?: number;
};

type OperationalEventRecord = {
  id: string;
  assetId: string | null;
  assetName: string | null;
  eventType: OperationalEventType;
  severity: OperationalEventSeverity;
  title: string;
  description: string;
  metadata: Prisma.JsonValue | null;
  actor: string | null;
  source: OperationalEventSource;
  createdAt: Date;
};

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

function mapEvent(event: OperationalEventRecord): OperationalEventSummary {
  return {
    id: event.id,
    assetId: event.assetId,
    assetName: event.assetName,
    eventType: event.eventType,
    severity: event.severity,
    title: event.title,
    description: event.description,
    metadata:
      event.metadata && typeof event.metadata === "object"
        ? (event.metadata as Record<string, unknown>)
        : null,
    actor: event.actor,
    source: event.source,
    createdAt: event.createdAt.toISOString(),
  };
}

export async function createOperationalEvent(input: OperationalEventInput) {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return null;
    }

    const event = await prisma.operationalEvent.create({
      data: {
        assetId: input.assetId ?? null,
        assetName: input.assetName ?? null,
        eventType: input.eventType,
        severity: input.severity ?? "INFO",
        title: input.title,
        description: input.description,
        metadata: input.metadata,
        actor: input.actor ?? null,
        source: input.source ?? "SYSTEM",
      },
    });

    return mapEvent(event);
  } catch (error) {
    console.error("Operational event write failed.", error);
    return null;
  }
}

export async function createOperationalEventOnce(
  input: OperationalEventInput,
  windowMs = 24 * 60 * 60 * 1000,
) {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return null;
    }

    const recent = await prisma.operationalEvent.findFirst({
      where: {
        assetId: input.assetId ?? null,
        eventType: input.eventType,
        title: input.title,
        source: input.source ?? "SYSTEM",
        createdAt: {
          gte: new Date(Date.now() - windowMs),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      return mapEvent(recent);
    }

    return createOperationalEvent(input);
  } catch (error) {
    console.error("Operational event dedupe failed.", error);
    return null;
  }
}

export async function listOperationalEvents(
  filters: OperationalEventFilters = {},
) {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return [];
    }

    const where: Prisma.OperationalEventWhereInput = {};

    if (filters.assetId) {
      where.assetId = filters.assetId;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    if (filters.from || filters.to) {
      where.createdAt = {
        gte: filters.from,
        lte: filters.to,
      };
    }

    const events = await prisma.operationalEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.take ?? 20,
    });

    return events.map(mapEvent);
  } catch (error) {
    console.error("Operational event read failed.", error);
    return [];
  }
}

export async function listAssetOperationalEvents(assetId: string, take = 10) {
  return listOperationalEvents({ assetId, take });
}

export async function seedOperationalEventsForAssets(assets: Asset[]) {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return;
    }

    const existing = await prisma.operationalEvent.count();

    if (existing > 0 || assets.length === 0) {
      return;
    }

    const examples = assets.slice(0, 8);
    const now = Date.now();

    await prisma.operationalEvent.createMany({
      data: examples.flatMap((asset, index) => {
        const baseCreatedAt = new Date(now - (index + 1) * 43 * 60 * 1000);
        const assetTypeEvent =
          asset.type === "DOMAIN" || asset.type === "SSL"
            ? {
                assetId: asset.id,
                assetName: asset.name,
                eventType: "SSL_EXPIRY_DETECTED" as const,
                severity: "WARNING" as const,
                title: `${asset.name} certificate window reviewed`,
                description:
                  "SSL and renewal metadata were evaluated for operational risk.",
                metadata: { provider: asset.provider, category: asset.type },
                source: "SYSTEM" as const,
                createdAt: new Date(baseCreatedAt.getTime() - 18 * 60 * 1000),
              }
            : {
                assetId: asset.id,
                assetName: asset.name,
                eventType: "HEALTH_CHECK_RUN" as const,
                severity: "INFO" as const,
                title: `${asset.name} baseline health captured`,
                description:
                  "Initial runtime posture was recorded for the operational timeline.",
                metadata: {
                  environment: asset.environment,
                  region: asset.region || "unassigned",
                },
                source: "MONITOR" as const,
                createdAt: new Date(baseCreatedAt.getTime() - 18 * 60 * 1000),
              };

        return [
          {
            assetId: asset.id,
            assetName: asset.name,
            eventType: "ASSET_CREATED" as const,
            severity: "INFO" as const,
            title: `${asset.name} entered inventory`,
            description:
              "Asset metadata is now available for infrastructure intelligence.",
            metadata: {
              provider: asset.provider,
              owner: asset.owner,
              category: asset.type,
            },
            source: "SYSTEM" as const,
            createdAt: baseCreatedAt,
          },
          assetTypeEvent,
        ];
      }),
    });
  } catch (error) {
    console.error("Operational event seed failed.", error);
  }
}
