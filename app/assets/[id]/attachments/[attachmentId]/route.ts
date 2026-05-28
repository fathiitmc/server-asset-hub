import { notFound } from "next/navigation";
import { getAttachmentFile } from "@/src/lib/attachments/attachments";

type AttachmentRouteProps = {
  params: Promise<{
    id: string;
    attachmentId: string;
  }>;
};

function contentDisposition(filename: string) {
  const safeFilename = filename.replace(/["\r\n]/g, "_");
  return `inline; filename="${safeFilename}"`;
}

export async function GET(_request: Request, { params }: AttachmentRouteProps) {
  const { id, attachmentId } = await params;
  const attachment = await getAttachmentFile(attachmentId, id);

  if (!attachment) {
    notFound();
  }

  return new Response(attachment.data, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": attachment.sizeBytes.toString(),
      "Content-Disposition": contentDisposition(attachment.originalName),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
