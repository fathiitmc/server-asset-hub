import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const allowedTypes = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "text/plain": ".txt",
} as const;

const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg", ".txt"]);

export type StoredAttachment = {
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
};

function sanitizeAssetId(assetId: string) {
  return assetId.replace(/[^a-zA-Z0-9_-]/g, "");
}

function sanitizeOriginalName(filename: string) {
  const basename = path.basename(filename).replace(/[^\w.\- ]/g, "_").trim();
  return basename || "attachment";
}

function getExtension(filename: string, mimeType: string) {
  const extension = path.extname(filename).toLowerCase();

  if (allowedExtensions.has(extension)) {
    return extension === ".jpeg" ? ".jpg" : extension;
  }

  return allowedTypes[mimeType as keyof typeof allowedTypes];
}

function getAssetUploadDir(assetId: string) {
  const safeAssetId = sanitizeAssetId(assetId);

  if (!safeAssetId) {
    throw new Error("Invalid asset id for attachment storage.");
  }

  return path.join(UPLOAD_ROOT, "assets", safeAssetId);
}

function getAbsoluteStoragePath(relativePath: string) {
  const uploadRoot = path.resolve(UPLOAD_ROOT);
  const normalizedPath = relativePath.replace(/\\/g, "/");

  if (!normalizedPath.startsWith("uploads/assets/")) {
    throw new Error("Invalid attachment storage path.");
  }

  const pathParts = normalizedPath.split("/").slice(1);
  const absolutePath = path.resolve(UPLOAD_ROOT, ...pathParts);

  if (!absolutePath.startsWith(uploadRoot + path.sep)) {
    throw new Error("Invalid attachment storage path.");
  }

  return absolutePath;
}

export async function storeUploadedFile(assetId: string, file: File) {
  if (file.size <= 0) {
    throw new Error("Attachment file is empty.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Attachment file exceeds the 10MB limit.");
  }

  if (!(file.type in allowedTypes)) {
    throw new Error("Unsupported attachment type.");
  }

  const originalName = sanitizeOriginalName(file.name);
  const extension = getExtension(originalName, file.type);

  if (!extension) {
    throw new Error("Unsupported attachment extension.");
  }

  const uploadDir = getAssetUploadDir(assetId);
  const filename = `${randomUUID()}${extension}`;
  const absolutePath = path.join(uploadDir, filename);
  const relativePath = ["uploads", "assets", sanitizeAssetId(assetId), filename].join(
    "/",
  );

  await mkdir(uploadDir, { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()), {
    flag: "wx",
  });

  return {
    filename,
    originalName,
    mimeType: file.type,
    sizeBytes: file.size,
    path: relativePath,
  } satisfies StoredAttachment;
}

export async function readStoredFile(relativePath: string) {
  return readFile(getAbsoluteStoragePath(relativePath));
}

export async function deleteStoredFile(relativePath: string) {
  await rm(getAbsoluteStoragePath(relativePath), {
    force: true,
  });
}
