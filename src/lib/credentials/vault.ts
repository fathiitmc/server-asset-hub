import "server-only";

import { decryptSecret, encryptSecret } from "@/src/lib/security/encryption";

export function sealCredentialSecret(secret: string) {
  return encryptSecret(secret);
}

export function openCredentialSecret(encryptedSecret: string) {
  return decryptSecret(encryptedSecret);
}
