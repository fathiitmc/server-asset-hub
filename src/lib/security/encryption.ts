import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_VERSION = "v1";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function base64UrlEncode(value: Buffer) {
  return value.toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url");
}

function getEncryptionKey() {
  const rawKey = process.env.ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error("ENCRYPTION_KEY is required for credential vault secrets.");
  }

  const trimmedKey = rawKey.trim();
  const candidateKeys = [
    Buffer.from(trimmedKey, "base64"),
    Buffer.from(trimmedKey, "hex"),
    Buffer.from(trimmedKey, "utf8"),
  ];

  const key = candidateKeys.find((candidate) => candidate.length === KEY_LENGTH);

  if (!key) {
    throw new Error("ENCRYPTION_KEY must resolve to exactly 32 bytes.");
  }

  return key;
}

export function encryptSecret(secret: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    base64UrlEncode(iv),
    base64UrlEncode(tag),
    base64UrlEncode(encrypted),
  ].join(":");
}

export function decryptSecret(encryptedSecret: string) {
  const [version, ivValue, tagValue, encryptedValue] = encryptedSecret.split(":");

  if (version !== ENCRYPTION_VERSION || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted secret payload.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    base64UrlDecode(ivValue),
  );
  decipher.setAuthTag(base64UrlDecode(tagValue));

  return Buffer.concat([
    decipher.update(base64UrlDecode(encryptedValue)),
    decipher.final(),
  ]).toString("utf8");
}
