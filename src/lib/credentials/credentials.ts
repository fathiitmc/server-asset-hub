import "server-only";

import { prisma } from "@/lib/prisma";
import { openCredentialSecret, sealCredentialSecret } from "./vault";

export type CredentialInput = {
  assetId: string;
  label: string;
  username?: string;
  secret: string;
  notes?: string;
};

export type CredentialUpdateInput = {
  id: string;
  assetId: string;
  label: string;
  username?: string;
  secret?: string;
  notes?: string;
};

export type CredentialSummary = {
  id: string;
  assetId: string;
  label: string;
  username: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function cleanText(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function mapCredentialSummary(credential: {
  id: string;
  assetId: string;
  label: string;
  username: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CredentialSummary {
  return {
    id: credential.id,
    assetId: credential.assetId,
    label: credential.label,
    username: credential.username,
    notes: credential.notes,
    createdAt: credential.createdAt.toISOString(),
    updatedAt: credential.updatedAt.toISOString(),
  };
}

function requireLabel(label: string) {
  const cleanLabel = label.trim();

  if (!cleanLabel) {
    throw new Error("Credential label is required.");
  }

  return cleanLabel;
}

function requireSecret(secret: string) {
  if (!secret) {
    throw new Error("Credential secret is required.");
  }

  return secret;
}

export async function listAssetCredentials(assetId: string) {
  const credentials = await prisma.assetCredential.findMany({
    where: { assetId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      assetId: true,
      label: true,
      username: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return credentials.map(mapCredentialSummary);
}

export async function createCredential(input: CredentialInput) {
  const credential = await prisma.assetCredential.create({
    data: {
      assetId: input.assetId,
      label: requireLabel(input.label),
      username: cleanText(input.username),
      secret: sealCredentialSecret(requireSecret(input.secret)),
      notes: cleanText(input.notes),
    },
    select: {
      id: true,
      assetId: true,
      label: true,
      username: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return mapCredentialSummary(credential);
}

export async function updateCredential(input: CredentialUpdateInput) {
  const data: {
    label: string;
    username?: string | null;
    notes?: string | null;
    secret?: string;
  } = {
    label: requireLabel(input.label),
    username: cleanText(input.username) ?? null,
    notes: cleanText(input.notes) ?? null,
  };

  if (input.secret) {
    data.secret = sealCredentialSecret(input.secret);
  }

  const credential = await prisma.assetCredential.update({
    where: {
      id: input.id,
      assetId: input.assetId,
    },
    data,
    select: {
      id: true,
      assetId: true,
      label: true,
      username: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return mapCredentialSummary(credential);
}

export async function deleteCredential(id: string, assetId: string) {
  await prisma.assetCredential.deleteMany({
    where: { id, assetId },
  });
}

export async function revealCredentialSecret(id: string, assetId: string) {
  const credential = await prisma.assetCredential.findFirst({
    where: { id, assetId },
    select: { secret: true },
  });

  if (!credential) {
    throw new Error("Credential not found.");
  }

  return openCredentialSecret(credential.secret);
}
