import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  assetStatuses,
  assetTypes,
  type AssetStatus,
  type AssetType,
} from "@/lib/assets";

const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new (options: { adapter: PrismaPg }) => any;
};

const requiredFields = [
  "id",
  "name",
  "type",
  "provider",
  "owner",
  "purchaseDate",
  "renewalDate",
  "purpose",
  "description",
  "estimatedCost",
  "currency",
  "status",
] as const;

type RequiredField = (typeof requiredFields)[number];

type AssetRecord = {
  [key in RequiredField]: unknown;
} & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

type ValidAsset = {
  id: string;
  name: string;
  type: AssetType;
  provider: string;
  owner: string;
  purchaseDate: Date;
  renewalDate: Date;
  purpose: string;
  description: string;
  estimatedCost: number;
  currency: string;
  status: AssetStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to import assets.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const dataFile = path.join(process.cwd(), "data", "assets.json");

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequiredString(
  record: AssetRecord,
  field: RequiredField,
  errors: string[],
) {
  const value = record[field];

  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${field} must be a non-empty string`);
    return "";
  }

  return value.trim();
}

function parseDate(value: unknown, field: RequiredField, errors: string[]) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${field} must be a non-empty date string`);
    return null;
  }

  const date = new Date(`${value.trim()}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    errors.push(`${field} must be a valid date`);
    return null;
  }

  return date;
}

function parseOptionalDate(value: unknown, field: "createdAt" | "updatedAt") {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} must be a valid date when provided`);
  }

  return date;
}

function parseAssetType(value: string, errors: string[]) {
  if (!assetTypes.includes(value as AssetType)) {
    errors.push(`type must be one of: ${assetTypes.join(", ")}`);
    return null;
  }

  return value as AssetType;
}

function parseAssetStatus(value: string, errors: string[]) {
  if (!assetStatuses.includes(value as AssetStatus)) {
    errors.push(`status must be one of: ${assetStatuses.join(", ")}`);
    return null;
  }

  return value as AssetStatus;
}

function validateAsset(value: unknown, index: number) {
  const errors: string[] = [];

  if (!isObject(value)) {
    return {
      asset: null,
      errors: [`record ${index + 1}: expected an object`],
    };
  }

  const record = value as AssetRecord;

  for (const field of requiredFields) {
    if (!(field in record)) {
      errors.push(`${field} is required`);
    }
  }

  const id = parseRequiredString(record, "id", errors);
  const name = parseRequiredString(record, "name", errors);
  const typeValue = parseRequiredString(record, "type", errors);
  const provider = parseRequiredString(record, "provider", errors);
  const owner = parseRequiredString(record, "owner", errors);
  const purchaseDate = parseDate(record.purchaseDate, "purchaseDate", errors);
  const renewalDate = parseDate(record.renewalDate, "renewalDate", errors);
  const purpose = parseRequiredString(record, "purpose", errors);
  const description = parseRequiredString(record, "description", errors);
  const currency = parseRequiredString(record, "currency", errors);
  const statusValue = parseRequiredString(record, "status", errors);
  const type = parseAssetType(typeValue, errors);
  const status = parseAssetStatus(statusValue, errors);
  const estimatedCost = Number(record.estimatedCost);

  if (!Number.isFinite(estimatedCost) || estimatedCost < 0) {
    errors.push("estimatedCost must be a non-negative number");
  }

  let createdAt: Date | undefined;
  let updatedAt: Date | undefined;

  try {
    createdAt = parseOptionalDate(record.createdAt, "createdAt");
    updatedAt = parseOptionalDate(record.updatedAt, "updatedAt");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  if (currency.length > 3) {
    errors.push("currency must be 3 characters or fewer");
  }

  if (errors.length > 0 || !type || !status || !purchaseDate || !renewalDate) {
    return {
      asset: null,
      errors: errors.map((error) => `record ${index + 1} (${id || "no id"}): ${error}`),
    };
  }

  const asset: ValidAsset = {
    id,
    name,
    type,
    provider,
    owner,
    purchaseDate,
    renewalDate,
    purpose,
    description,
    estimatedCost,
    currency: currency.toUpperCase(),
    status,
    createdAt,
    updatedAt,
  };

  return { asset, errors: [] };
}

async function main() {
  const raw = await readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("data/assets.json must contain an array.");
  }

  let importedOrUpdated = 0;
  let skipped = 0;
  const validationErrors: string[] = [];

  for (const [index, value] of parsed.entries()) {
    const result = validateAsset(value, index);

    if (!result.asset) {
      skipped += 1;
      validationErrors.push(...result.errors);
      continue;
    }

    const { createdAt, updatedAt, ...asset } = result.asset;

    await prisma.asset.upsert({
      where: { id: asset.id },
      create: {
        ...asset,
        ...(createdAt ? { createdAt } : {}),
        ...(updatedAt ? { updatedAt } : {}),
      },
      update: asset,
    });

    importedOrUpdated += 1;
  }

  console.log(`Total records found: ${parsed.length}`);
  console.log(`Imported/updated count: ${importedOrUpdated}`);
  console.log(`Skipped count: ${skipped}`);

  if (validationErrors.length > 0) {
    console.log("Validation errors:");
    for (const error of validationErrors) {
      console.log(`- ${error}`);
    }
  } else {
    console.log("Validation errors: none");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
