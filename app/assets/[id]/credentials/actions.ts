"use server";

import { revalidatePath } from "next/cache";
import { createOperationalEvent } from "@/lib/operational-events-db";
import { getSession } from "@/src/lib/auth/session";
import {
  createCredential,
  deleteCredential,
  revealCredentialSecret,
  updateCredential,
} from "@/src/lib/credentials/credentials";

export type RevealCredentialState = {
  credentialId?: string;
  secret?: string;
  error?: string;
};

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function currentActor() {
  const session = await getSession();
  return session?.email ?? "system";
}

export async function createCredentialAction(assetId: string, formData: FormData) {
  const credential = await createCredential({
    assetId,
    label: textValue(formData, "label"),
    username: textValue(formData, "username"),
    secret: String(formData.get("secret") ?? ""),
    notes: textValue(formData, "notes"),
  });
  await createOperationalEvent({
    assetId,
    eventType: "CREDENTIAL_CREATED",
    severity: "INFO",
    title: `${credential.label} credential created`,
    description: "A vault credential was added to this asset.",
    metadata: { credentialId: credential.id, username: credential.username },
    actor: await currentActor(),
    source: "USER",
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
}

export async function updateCredentialAction(
  assetId: string,
  credentialId: string,
  formData: FormData,
) {
  const credential = await updateCredential({
    id: credentialId,
    assetId,
    label: textValue(formData, "label"),
    username: textValue(formData, "username"),
    secret: String(formData.get("secret") ?? ""),
    notes: textValue(formData, "notes"),
  });
  await createOperationalEvent({
    assetId,
    eventType: "CREDENTIAL_UPDATED",
    severity: "INFO",
    title: `${credential.label} credential updated`,
    description: "A vault credential was updated for this asset.",
    metadata: { credentialId: credential.id, username: credential.username },
    actor: await currentActor(),
    source: "USER",
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
}

export async function deleteCredentialAction(
  assetId: string,
  credentialId: string,
) {
  await deleteCredential(credentialId, assetId);
  await createOperationalEvent({
    assetId,
    eventType: "CREDENTIAL_DELETED",
    severity: "WARNING",
    title: "Credential deleted",
    description: "A vault credential was removed from this asset.",
    metadata: { credentialId },
    actor: await currentActor(),
    source: "USER",
  });
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
}

export async function revealCredentialAction(
  assetId: string,
  _state: RevealCredentialState,
  formData: FormData,
): Promise<RevealCredentialState> {
  const credentialId = textValue(formData, "credentialId");

  try {
    const secret = await revealCredentialSecret(credentialId, assetId);
    return { credentialId, secret };
  } catch {
    return {
      credentialId,
      error: "Unable to reveal this credential.",
    };
  }
}
