"use server";

import { revalidatePath } from "next/cache";
import { createOperationalEvent } from "@/lib/operational-events-db";
import { deleteAttachment, saveAttachment } from "@/src/lib/attachments/attachments";
import { getSession } from "@/src/lib/auth/session";

function fileFromFormData(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Attachment file is required.");
  }

  return file;
}

export async function uploadAttachmentAction(assetId: string, formData: FormData) {
  const attachment = await saveAttachment(assetId, fileFromFormData(formData));
  const session = await getSession();
  await createOperationalEvent({
    assetId,
    eventType: "ATTACHMENT_ADDED",
    severity: "INFO",
    title: `${attachment.originalName} attached`,
    description: "Operational attachment was uploaded to this asset.",
    metadata: {
      filename: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    },
    actor: session?.email ?? "system",
    source: "USER",
  });
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
}

export async function deleteAttachmentAction(
  assetId: string,
  attachmentId: string,
) {
  await deleteAttachment(attachmentId, assetId);
  const session = await getSession();
  await createOperationalEvent({
    assetId,
    eventType: "ATTACHMENT_DELETED",
    severity: "INFO",
    title: "Attachment deleted",
    description: "Operational attachment was removed from this asset.",
    metadata: { attachmentId },
    actor: session?.email ?? "system",
    source: "USER",
  });
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
}
