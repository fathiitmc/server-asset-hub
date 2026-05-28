import "server-only";

import { prisma } from "@/lib/prisma";
import {
  deleteStoredFile,
  readStoredFile,
  storeUploadedFile,
} from "./storage";

export type AttachmentSummary = {
  id: string;
  assetId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

function mapAttachmentSummary(attachment: {
  id: string;
  assetId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}): AttachmentSummary {
  return {
    id: attachment.id,
    assetId: attachment.assetId,
    filename: attachment.filename,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    createdAt: attachment.createdAt.toISOString(),
  };
}

export async function listAssetAttachments(assetId: string) {
  const attachments = await prisma.assetAttachment.findMany({
    where: { assetId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      assetId: true,
      filename: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  });

  return attachments.map(mapAttachmentSummary);
}

export async function saveAttachment(assetId: string, file: File) {
  const storedFile = await storeUploadedFile(assetId, file);

  const attachment = await prisma.assetAttachment.create({
    data: {
      assetId,
      ...storedFile,
    },
    select: {
      id: true,
      assetId: true,
      filename: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  });

  return mapAttachmentSummary(attachment);
}

export async function deleteAttachment(id: string, assetId: string) {
  const attachment = await prisma.assetAttachment.findFirst({
    where: { id, assetId },
    select: { id: true, path: true },
  });

  if (!attachment) {
    return;
  }

  await prisma.assetAttachment.delete({
    where: { id: attachment.id },
  });
  await deleteStoredFile(attachment.path);
}

export async function getAttachmentFile(id: string, assetId: string) {
  const attachment = await prisma.assetAttachment.findFirst({
    where: { id, assetId },
    select: {
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      path: true,
    },
  });

  if (!attachment) {
    return null;
  }

  return {
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    data: await readStoredFile(attachment.path),
  };
}
