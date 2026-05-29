import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const assetTypes = [
  "DOMAIN",
  "SERVER",
  "CLOUD",
  "DNS",
  "SSL",
  "EMAIL",
  "CONTAINER",
  "DATABASE",
  "VPN",
  "VPS",
  "OTHER",
] as const;

export const assetStatuses = [
  "ACTIVE",
  "EXPIRED",
  "RENEW_SOON",
  "ARCHIVED",
] as const;

export const assetLifecycleStates = [
  "ACTIVE",
  "MONITORING",
  "EXPIRING",
  "ARCHIVED",
  "RETIRED",
  "SUSPENDED",
] as const;

export type AssetType = (typeof assetTypes)[number];
export type AssetStatus = (typeof assetStatuses)[number];
export type AssetLifecycleState = (typeof assetLifecycleStates)[number];

export const assetEnvironments = [
  "PRODUCTION",
  "STAGING",
  "DEVELOPMENT",
  "TESTING",
] as const;

export const assetRegions = [
  "UAE",
  "Germany",
  "Finland",
  "Singapore",
  "Bahrain",
  "eu-central-1",
  "me-central-1",
] as const;

export type AssetEnvironment = (typeof assetEnvironments)[number];

export const billingCycles = [
  "MONTHLY",
  "QUARTERLY",
  "SEMIANNUAL",
  "YEARLY",
  "ONE_TIME",
] as const;

export type BillingCycle = (typeof billingCycles)[number];

export function normalizeAssetType(type: string): AssetType {
  const legacyMap: Record<string, AssetType> = {
    HOSTING: "SERVER",
    PANEL: "OTHER",
  };

  return (legacyMap[type] ?? type) as AssetType;
}

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  environment: AssetEnvironment;
  provider: string;
  providerId?: string | null;
  owner: string;
  ownerId?: string | null;
  teamId?: string | null;
  teamName: string;
  operationalOwner: string;
  financeOwner: string;
  renewalOwner: string;
  escalationOwner: string;
  region: string;
  domain: string;
  ipAddress: string;
  tags: string[];
  purchaseDate: string;
  renewalDate: string;
  purpose: string;
  description: string;
  estimatedCost: number;
  currency: string;
  billingCycle: BillingCycle;
  monthlyCost: number;
  yearlyCost: number;
  oneTimeCost: number;
  billingAccount: string;
  costCenter: string;
  costNotes: string;
  lifecycleState: AssetLifecycleState;
  archivedAt: string;
  archivedBy: string;
  archiveReason: string;
  deletedAt: string;
  deletedBy: string;
  lifecycleUpdatedAt: string;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
};

export type AssetInput = Omit<Asset, "id" | "createdAt" | "updatedAt">;

const dataFile = path.join(process.cwd(), "data", "assets.json");

async function ensureDataFile() {
  await mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, "[]\n", "utf8");
  }
}

function isAssetType(value: FormDataEntryValue | null): value is AssetType {
  return typeof value === "string" && assetTypes.includes(value as AssetType);
}

function isAssetStatus(value: FormDataEntryValue | null): value is AssetStatus {
  return (
    typeof value === "string" &&
    assetStatuses.includes(value as AssetStatus)
  );
}

function isAssetLifecycleState(
  value: FormDataEntryValue | null,
): value is AssetLifecycleState {
  return (
    typeof value === "string" &&
    assetLifecycleStates.includes(value as AssetLifecycleState)
  );
}

function isAssetEnvironment(
  value: FormDataEntryValue | null,
): value is AssetEnvironment {
  return (
    typeof value === "string" &&
    assetEnvironments.includes(value as AssetEnvironment)
  );
}

function isBillingCycle(value: FormDataEntryValue | null): value is BillingCycle {
  return (
    typeof value === "string" && billingCycles.includes(value as BillingCycle)
  );
}

function textValue(formData: FormData, key: keyof AssetInput) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function tagValues(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("tags")
        .filter((value): value is string => typeof value === "string")
        .flatMap((value) => value.split(","))
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function normalizeAsset(asset: Asset): Asset {
  const estimatedCost = Number(asset.estimatedCost || 0);
  const yearlyCost = Number(asset.yearlyCost ?? estimatedCost);
  const monthlyCost = Number(asset.monthlyCost ?? yearlyCost / 12);

  return {
    ...asset,
    type: normalizeAssetType(asset.type),
    environment: asset.environment ?? "PRODUCTION",
    teamId: asset.teamId ?? null,
    teamName: asset.teamName ?? "",
    operationalOwner: asset.operationalOwner ?? "",
    financeOwner: asset.financeOwner ?? "",
    renewalOwner: asset.renewalOwner ?? "",
    escalationOwner: asset.escalationOwner ?? "",
    region: asset.region ?? "",
    domain: asset.domain ?? "",
    ipAddress: asset.ipAddress ?? "",
    tags: asset.tags ?? [],
    estimatedCost,
    currency: (asset.currency || "USD").toUpperCase(),
    billingCycle: asset.billingCycle ?? "YEARLY",
    monthlyCost: Number.isFinite(monthlyCost) ? monthlyCost : 0,
    yearlyCost: Number.isFinite(yearlyCost) ? yearlyCost : 0,
    oneTimeCost: Number(asset.oneTimeCost ?? 0),
    billingAccount: asset.billingAccount ?? "",
    costCenter: asset.costCenter ?? "",
    costNotes: asset.costNotes ?? "",
    lifecycleState: asset.lifecycleState ?? "ACTIVE",
    archivedAt: asset.archivedAt ?? "",
    archivedBy: asset.archivedBy ?? "",
    archiveReason: asset.archiveReason ?? "",
    deletedAt: asset.deletedAt ?? "",
    deletedBy: asset.deletedBy ?? "",
    lifecycleUpdatedAt: asset.lifecycleUpdatedAt ?? "",
  };
}

function dateOrDefault(formData: FormData, key: keyof AssetInput, fallback: Date) {
  return textValue(formData, key) || fallback.toISOString().slice(0, 10);
}

export function assetInputFromFormData(formData: FormData): AssetInput {
  const type = formData.get("type");
  const status = formData.get("status");
  const lifecycleState = formData.get("lifecycleState");
  const environment = formData.get("environment") ?? "PRODUCTION";
  const billingCycle = formData.get("billingCycle");
  const cost = Number.parseFloat(textValue(formData, "estimatedCost"));
  const monthlyCost = Number.parseFloat(textValue(formData, "monthlyCost"));
  const yearlyCost = Number.parseFloat(textValue(formData, "yearlyCost"));
  const oneTimeCost = Number.parseFloat(textValue(formData, "oneTimeCost"));

  if (!isAssetType(type)) {
    throw new Error("Invalid asset type.");
  }

  if (!isAssetStatus(status)) {
    throw new Error("Invalid asset status.");
  }

  if (lifecycleState !== null && !isAssetLifecycleState(lifecycleState)) {
    throw new Error("Invalid asset lifecycle state.");
  }

  if (!isAssetEnvironment(environment)) {
    throw new Error("Invalid asset environment.");
  }

  if (!isBillingCycle(billingCycle)) {
    throw new Error("Invalid billing cycle.");
  }

  const normalizedCost = Number.isFinite(cost) ? cost : 0;
  const normalizedYearlyCost = Number.isFinite(yearlyCost)
    ? yearlyCost
    : normalizedCost;
  const normalizedMonthlyCost = Number.isFinite(monthlyCost)
    ? monthlyCost
    : normalizedYearlyCost / 12;
  const now = new Date();
  const defaultRenewalDate = new Date(now);
  defaultRenewalDate.setUTCFullYear(defaultRenewalDate.getUTCFullYear() + 1);
  const purpose =
    textValue(formData, "purpose") || "Asset registered from quick create";

  return {
    name: textValue(formData, "name"),
    type,
    environment,
    provider: textValue(formData, "provider"),
    providerId: null,
    owner: textValue(formData, "owner"),
    ownerId: null,
    teamId: textValue(formData, "teamId") || null,
    teamName: textValue(formData, "teamName"),
    operationalOwner: textValue(formData, "operationalOwner"),
    financeOwner: textValue(formData, "financeOwner"),
    renewalOwner: textValue(formData, "renewalOwner"),
    escalationOwner: textValue(formData, "escalationOwner"),
    region: textValue(formData, "region"),
    domain: textValue(formData, "domain"),
    ipAddress: textValue(formData, "ipAddress"),
    tags: tagValues(formData),
    purchaseDate: dateOrDefault(formData, "purchaseDate", now),
    renewalDate: dateOrDefault(formData, "renewalDate", defaultRenewalDate),
    purpose,
    description: textValue(formData, "description"),
    estimatedCost: normalizedCost,
    currency: textValue(formData, "currency") || "USD",
    billingCycle,
    monthlyCost: normalizedMonthlyCost,
    yearlyCost: normalizedYearlyCost,
    oneTimeCost: Number.isFinite(oneTimeCost) ? oneTimeCost : 0,
    billingAccount: textValue(formData, "billingAccount"),
    costCenter: textValue(formData, "costCenter"),
    costNotes: textValue(formData, "costNotes"),
    lifecycleState: lifecycleState ?? "ACTIVE",
    archivedAt: "",
    archivedBy: "",
    archiveReason: "",
    deletedAt: "",
    deletedBy: "",
    lifecycleUpdatedAt: "",
    status,
  };
}

export async function getAssets(): Promise<Asset[]> {
  await ensureDataFile();
  const raw = await readFile(dataFile, "utf8");
  const assets = JSON.parse(raw) as Asset[];

  return assets
    .map(normalizeAsset)
    .sort((a, b) => a.renewalDate.localeCompare(b.renewalDate));
}

export async function getAsset(id: string) {
  const assets = await getAssets();
  return assets.find((asset) => asset.id === id) ?? null;
}

export async function createAsset(input: AssetInput) {
  const assets = await getAssets();
  const now = new Date().toISOString();
  const asset: Asset = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  await saveAssets([...assets, asset]);
  return asset;
}

export async function updateAsset(id: string, input: AssetInput) {
  const assets = await getAssets();
  const now = new Date().toISOString();
  const nextAssets = assets.map((asset) =>
    asset.id === id ? { ...asset, ...input, updatedAt: now } : asset,
  );

  await saveAssets(nextAssets);
}

export async function deleteAsset(id: string) {
  const assets = await getAssets();
  await saveAssets(assets.filter((asset) => asset.id !== id));
}

async function saveAssets(assets: Asset[]) {
  await ensureDataFile();
  await writeFile(dataFile, `${JSON.stringify(assets, null, 2)}\n`, "utf8");
}
