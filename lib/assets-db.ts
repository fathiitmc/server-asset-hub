import "server-only";

import type { Prisma } from "@prisma/client";
import { ensureOwner, ensureProvider, ensureTags } from "@/lib/asset-registries";
import {
  assetEnvironments,
  assetStatuses,
  assetLifecycleStates,
  assetTypes,
  createAsset as createAssetInJson,
  deleteAsset as deleteAssetFromJson,
  getAsset as getAssetFromJson,
  getAssets as getAssetsFromJson,
  updateAsset as updateAssetInJson,
  normalizeAsset,
  normalizeAssetType,
  type Asset,
  type AssetEnvironment,
  type AssetInput,
  type AssetLifecycleState,
  type AssetStatus,
  type AssetType,
} from "@/lib/assets";

export type AssetFilters = {
  q?: string;
  type?: AssetType;
  status?: AssetStatus;
  environment?: AssetEnvironment;
  provider?: string;
  owner?: string;
  region?: string;
  tag?: string;
  lifecycleState?: AssetLifecycleState;
  includeDeleted?: boolean;
};

type DbAssetWithIntelligence = Prisma.AssetGetPayload<{
  include: {
    providerRegistry: true;
    ownerRegistry: true;
    team: true;
    tags: true;
  };
}>;

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function mapAssetType(type: string): AssetType {
  return normalizeAssetType(type);
}

function mapAssetEnvironment(environment: string | null): AssetEnvironment {
  return (environment ?? "PRODUCTION") as AssetEnvironment;
}

function mapAssetFromDb(asset: DbAssetWithIntelligence): Asset {
  return normalizeAsset({
    id: asset.id,
    name: asset.name,
    type: mapAssetType(asset.type),
    environment: mapAssetEnvironment(asset.environment),
    provider: asset.providerRegistry?.name ?? asset.provider,
    providerId: asset.providerId,
    owner: asset.ownerRegistry?.name ?? asset.owner,
    ownerId: asset.ownerId,
    teamId: asset.teamId,
    teamName: asset.team?.name ?? "",
    operationalOwner: asset.operationalOwner ?? "",
    financeOwner: asset.financeOwner ?? "",
    renewalOwner: asset.renewalOwner ?? "",
    escalationOwner: asset.escalationOwner ?? "",
    region: asset.region ?? "",
    domain: asset.domain ?? "",
    ipAddress: asset.ipAddress ?? "",
    tags: asset.tags.map((tag) => tag.name),
    purchaseDate: dateOnly(asset.purchaseDate),
    renewalDate: dateOnly(asset.renewalDate),
    purpose: asset.purpose,
    description: asset.description,
    estimatedCost: Number(asset.estimatedCost),
    currency: asset.currency,
    billingCycle: asset.billingCycle,
    monthlyCost: Number(asset.monthlyCost ?? 0),
    yearlyCost: Number(asset.yearlyCost ?? asset.estimatedCost),
    oneTimeCost: Number(asset.oneTimeCost ?? 0),
    billingAccount: asset.billingAccount ?? "",
    costCenter: asset.costCenter ?? "",
    costNotes: asset.costNotes ?? "",
    lifecycleState: asset.lifecycleState ?? "ACTIVE",
    archivedAt: asset.archivedAt?.toISOString() ?? "",
    archivedBy: asset.archivedBy ?? "",
    archiveReason: asset.archiveReason ?? "",
    deletedAt: asset.deletedAt?.toISOString() ?? "",
    deletedBy: asset.deletedBy ?? "",
    lifecycleUpdatedAt: asset.lifecycleUpdatedAt?.toISOString() ?? "",
    status: asset.status,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  });
}

function dateFromInput(value: string, field: "purchaseDate" | "renewalDate") {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} must be a valid date for database writes.`);
  }

  return date;
}

async function inputToDbData(input: AssetInput, mode: "create" | "update") {
  const [provider, owner, tags] = await Promise.all([
    ensureProvider(input.provider),
    ensureOwner(input.owner),
    ensureTags(input.tags),
  ]);

  return {
    name: input.name,
    type: input.type,
    environment: input.environment,
    provider: input.provider,
    providerRegistry: provider ? { connect: { id: provider.id } } : undefined,
    owner: input.owner,
    ownerRegistry: owner ? { connect: { id: owner.id } } : undefined,
    team: input.teamId
      ? { connect: { id: input.teamId } }
      : mode === "update"
        ? { disconnect: true }
        : undefined,
    operationalOwner: input.operationalOwner || null,
    financeOwner: input.financeOwner || null,
    renewalOwner: input.renewalOwner || null,
    escalationOwner: input.escalationOwner || null,
    region: input.region || null,
    domain: input.domain || null,
    ipAddress: input.ipAddress || null,
    purchaseDate: dateFromInput(input.purchaseDate, "purchaseDate"),
    renewalDate: dateFromInput(input.renewalDate, "renewalDate"),
    purpose: input.purpose,
    description: input.description,
    estimatedCost: input.estimatedCost,
    currency: input.currency.toUpperCase(),
    billingCycle: input.billingCycle,
    monthlyCost: input.monthlyCost > 0 ? input.monthlyCost : null,
    yearlyCost: input.yearlyCost > 0 ? input.yearlyCost : input.estimatedCost,
    oneTimeCost: input.oneTimeCost > 0 ? input.oneTimeCost : null,
    billingAccount: input.billingAccount || null,
    costCenter: input.costCenter || null,
    costNotes: input.costNotes || null,
    status: input.status,
    tags:
      mode === "create"
        ? { connect: tags.map((tag) => ({ id: tag.id })) }
        : { set: tags.map((tag) => ({ id: tag.id })) },
  };
}

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

function filterAssetsFromJson(assets: Asset[], filters: AssetFilters) {
  const query = filters.q?.trim().toLowerCase();

  return assets.filter((asset) => {
    if (filters.type && asset.type !== filters.type) {
      return false;
    }

    if (filters.status && asset.status !== filters.status) {
      return false;
    }

    if (filters.lifecycleState && asset.lifecycleState !== filters.lifecycleState) {
      return false;
    }

    if (!filters.includeDeleted && asset.deletedAt) {
      return false;
    }

    if (filters.environment && asset.environment !== filters.environment) {
      return false;
    }

    if (filters.provider && asset.provider !== filters.provider) {
      return false;
    }

    if (filters.owner && asset.owner !== filters.owner) {
      return false;
    }

    if (filters.region && asset.region !== filters.region) {
      return false;
    }

    if (filters.tag && !asset.tags.includes(filters.tag)) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      asset.name,
      asset.provider,
      asset.owner,
      asset.environment,
      asset.status,
      asset.region,
      asset.domain,
      asset.ipAddress,
      asset.purpose,
      asset.description,
      ...asset.tags,
    ].some((value) => value.toLowerCase().includes(query));
  });
}

function buildAssetWhere(filters: AssetFilters): Prisma.AssetWhereInput {
  const where: Prisma.AssetWhereInput = {};
  const and: Prisma.AssetWhereInput[] = [];
  const query = filters.q?.trim();

  if (!filters.includeDeleted) {
    where.deletedAt = null;
  }

  if (filters.type === "SERVER") {
    and.push({ type: { in: ["SERVER", "VPS", "HOSTING"] as AssetType[] } });
  } else if (filters.type === "OTHER") {
    and.push({ type: { in: ["OTHER", "PANEL"] as AssetType[] } });
  } else if (filters.type) {
    where.type = filters.type;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.lifecycleState) {
    where.lifecycleState = filters.lifecycleState;
  }

  if (filters.environment) {
    where.environment = filters.environment;
  }

  if (filters.provider) {
    and.push({
      OR: [
        { provider: { equals: filters.provider, mode: "insensitive" } },
        {
          providerRegistry: {
            is: { name: { equals: filters.provider, mode: "insensitive" } },
          },
        },
      ],
    });
  }

  if (filters.owner) {
    and.push({
      OR: [
        { owner: { equals: filters.owner, mode: "insensitive" } },
        {
          ownerRegistry: {
            is: { name: { equals: filters.owner, mode: "insensitive" } },
          },
        },
      ],
    });
  }

  if (filters.region) {
    where.region = { equals: filters.region, mode: "insensitive" };
  }

  if (filters.tag) {
    where.tags = {
      some: { name: { equals: filters.tag, mode: "insensitive" } },
    };
  }

  if (query) {
    const upperQuery = query.toUpperCase().replace(/[\s-]+/g, "_");
    and.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { provider: { contains: query, mode: "insensitive" } },
        { owner: { contains: query, mode: "insensitive" } },
        { domain: { contains: query, mode: "insensitive" } },
        { ipAddress: { contains: query, mode: "insensitive" } },
        { region: { contains: query, mode: "insensitive" } },
        { purpose: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        {
          providerRegistry: {
            is: { name: { contains: query, mode: "insensitive" } },
          },
        },
        {
          ownerRegistry: {
            is: { name: { contains: query, mode: "insensitive" } },
          },
        },
        { tags: { some: { name: { contains: query, mode: "insensitive" } } } },
        ...(assetStatuses.includes(upperQuery as AssetStatus)
          ? [{ status: upperQuery as AssetStatus }]
          : []),
        ...(assetLifecycleStates.includes(upperQuery as AssetLifecycleState)
          ? [{ lifecycleState: upperQuery as AssetLifecycleState }]
          : []),
        ...(assetEnvironments.includes(upperQuery as AssetEnvironment)
          ? [{ environment: upperQuery as AssetEnvironment }]
          : []),
        ...(assetTypes.includes(upperQuery as AssetType)
          ? [{ type: upperQuery as AssetType }]
          : []),
      ],
    });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

export async function getAssetsFromDb(
  filters: AssetFilters = {},
): Promise<Asset[]> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return filterAssetsFromJson(await getAssetsFromJson(), filters);
    }

    const assets = await prisma.asset.findMany({
      where: buildAssetWhere(filters),
      orderBy: { renewalDate: "asc" },
      include: {
        providerRegistry: true,
        ownerRegistry: true,
        team: true,
        tags: true,
      },
    });

    return assets.map(mapAssetFromDb);
  } catch (error) {
    console.error("Database asset read failed; falling back to JSON.", error);
    return filterAssetsFromJson(await getAssetsFromJson(), filters);
  }
}

export async function getAssetByIdFromDb(id: string): Promise<Asset | null> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return getAssetFromJson(id);
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        providerRegistry: true,
        ownerRegistry: true,
        team: true,
        tags: true,
      },
    });

    return asset ? mapAssetFromDb(asset) : null;
  } catch (error) {
    console.error("Database asset read failed; falling back to JSON.", error);
    return getAssetFromJson(id);
  }
}

// Runtime writes now prefer PostgreSQL. JSON remains a legacy fallback only.
export async function createAssetInDb(input: AssetInput): Promise<Asset> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return createAssetInJson(input);
    }

    const asset = await prisma.asset.create({
      data: await inputToDbData(input, "create"),
      include: {
        providerRegistry: true,
        ownerRegistry: true,
        team: true,
        tags: true,
      },
    });

    return mapAssetFromDb(asset);
  } catch (error) {
    console.error("Database asset create failed; falling back to JSON.", error);
    return createAssetInJson(input);
  }
}

// Runtime writes now prefer PostgreSQL. JSON remains a legacy fallback only.
export async function updateAssetInDb(
  id: string,
  input: AssetInput,
): Promise<void> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      await updateAssetInJson(id, input);
      return;
    }

    await prisma.asset.update({
      where: { id },
      data: {
        ...(await inputToDbData(input, "update")),
        lifecycleState: input.lifecycleState,
        lifecycleUpdatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Database asset update failed; falling back to JSON.", error);
    await updateAssetInJson(id, input);
  }
}

// Runtime writes now prefer PostgreSQL. JSON remains a legacy fallback only.
export async function deleteAssetInDb(id: string): Promise<void> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      await deleteAssetFromJson(id);
      return;
    }

    await prisma.asset.deleteMany({
      where: { id },
    });
  } catch (error) {
    console.error("Database asset delete failed; falling back to JSON.", error);
    await deleteAssetFromJson(id);
  }
}

export async function archiveAssetInDb(
  id: string,
  actor: string,
  reason: string,
): Promise<Asset | null> {
  try {
    const prisma = await getPrismaClient();
    const now = new Date();

    if (!prisma) {
      const asset = await getAssetFromJson(id);
      if (!asset) return null;
      const next = normalizeAsset({
        ...asset,
        status: "ARCHIVED",
        lifecycleState: "ARCHIVED",
        archivedAt: now.toISOString(),
        archivedBy: actor,
        archiveReason: reason,
        lifecycleUpdatedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      await updateAssetInJson(id, next);
      return next;
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        lifecycleState: "ARCHIVED",
        archivedAt: now,
        archivedBy: actor,
        archiveReason: reason,
        lifecycleUpdatedAt: now,
      },
      include: {
        providerRegistry: true,
        ownerRegistry: true,
        team: true,
        tags: true,
      },
    });

    return mapAssetFromDb(asset);
  } catch (error) {
    console.error("Database asset archive failed.", error);
    return null;
  }
}

export async function restoreAssetInDb(id: string): Promise<Asset | null> {
  try {
    const prisma = await getPrismaClient();
    const now = new Date();

    if (!prisma) {
      const asset = await getAssetFromJson(id);
      if (!asset) return null;
      const next = normalizeAsset({
        ...asset,
        status: "ACTIVE",
        lifecycleState: "ACTIVE",
        archivedAt: "",
        archivedBy: "",
        archiveReason: "",
        lifecycleUpdatedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      await updateAssetInJson(id, next);
      return next;
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        status: "ACTIVE",
        lifecycleState: "ACTIVE",
        archivedAt: null,
        archivedBy: null,
        archiveReason: null,
        lifecycleUpdatedAt: now,
      },
      include: {
        providerRegistry: true,
        ownerRegistry: true,
        team: true,
        tags: true,
      },
    });

    return mapAssetFromDb(asset);
  } catch (error) {
    console.error("Database asset restore failed.", error);
    return null;
  }
}

export async function updateAssetLifecycleStateInDb(
  id: string,
  lifecycleState: AssetLifecycleState,
): Promise<Asset | null> {
  try {
    const prisma = await getPrismaClient();
    const now = new Date();
    const status = lifecycleState === "ARCHIVED" ? "ARCHIVED" : undefined;

    if (!prisma) {
      const asset = await getAssetFromJson(id);
      if (!asset) return null;
      const next = normalizeAsset({
        ...asset,
        ...(status ? { status } : {}),
        lifecycleState,
        lifecycleUpdatedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      await updateAssetInJson(id, next);
      return next;
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        lifecycleState,
        lifecycleUpdatedAt: now,
      },
      include: {
        providerRegistry: true,
        ownerRegistry: true,
        team: true,
        tags: true,
      },
    });

    return mapAssetFromDb(asset);
  } catch (error) {
    console.error("Database lifecycle update failed.", error);
    return null;
  }
}

export async function softDeleteAssetInDb(
  id: string,
  actor: string,
): Promise<Asset | null> {
  try {
    const prisma = await getPrismaClient();
    const now = new Date();

    if (!prisma) {
      const asset = await getAssetFromJson(id);
      if (!asset) return null;
      const next = normalizeAsset({
        ...asset,
        deletedAt: now.toISOString(),
        deletedBy: actor,
        lifecycleUpdatedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      await updateAssetInJson(id, next);
      return next;
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        deletedAt: now,
        deletedBy: actor,
        lifecycleUpdatedAt: now,
      },
      include: {
        providerRegistry: true,
        ownerRegistry: true,
        team: true,
        tags: true,
      },
    });

    return mapAssetFromDb(asset);
  } catch (error) {
    console.error("Database asset soft delete failed.", error);
    return null;
  }
}

export async function permanentlyDeleteAssetInDb(id: string): Promise<void> {
  await deleteAssetInDb(id);
}
