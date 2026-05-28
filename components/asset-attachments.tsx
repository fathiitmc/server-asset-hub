import Link from "next/link";
import {
  deleteAttachmentAction,
  uploadAttachmentAction,
} from "@/app/assets/[id]/attachments/actions";
import type { AttachmentSummary } from "@/src/lib/attachments/attachments";
import { SubmitButton } from "./submit-button";

type AssetAttachmentsProps = {
  assetId: string;
  attachments: AttachmentSummary[];
};

export function AssetAttachments({
  assetId,
  attachments,
}: AssetAttachmentsProps) {
  const uploadAction = uploadAttachmentAction.bind(null, assetId);

  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Attachments
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Store operational files, invoices, contracts, screenshots, and
            notes for this asset.
          </p>
        </div>
        <span className="mt-2 inline-flex w-fit rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 sm:mt-0">
          Local storage
        </span>
      </div>

      <form
        action={uploadAction}
        className="mt-5 rounded-2xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-4"
      >
        <label className="block text-sm font-medium text-zinc-700">
          Upload file
          <input
            name="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain"
            required
            className="mt-2 block w-full text-sm text-zinc-600 file:mr-4 file:h-10 file:rounded-xl file:border-0 file:bg-zinc-950 file:px-4 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
          />
        </label>
        <p className="mt-2 text-xs text-zinc-500">
          PDF, PNG, JPG, JPEG, or TXT. Maximum size 10MB.
        </p>
        <div className="mt-4">
          <SubmitButton pendingLabel="Uploading...">Upload file</SubmitButton>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {attachments.length > 0 ? (
          attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              assetId={assetId}
              attachment={attachment}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-5 text-sm text-zinc-600">
            No attachments stored for this asset yet.
          </div>
        )}
      </div>
    </section>
  );
}

function AttachmentCard({
  assetId,
  attachment,
}: {
  assetId: string;
  attachment: AttachmentSummary;
}) {
  const deleteAction = deleteAttachmentAction.bind(
    null,
    assetId,
    attachment.id,
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/80 bg-white/75 p-4 shadow-sm shadow-zinc-950/[0.03] transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <FileTypeBadge mimeType={attachment.mimeType} />
          <Link
            href={`/assets/${assetId}/attachments/${attachment.id}`}
            target="_blank"
            className="truncate text-sm font-semibold text-zinc-950 hover:underline"
          >
            {attachment.originalName}
          </Link>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {formatFileSize(attachment.sizeBytes)} / Uploaded{" "}
          {new Date(attachment.createdAt).toLocaleString("en")}
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          href={`/assets/${assetId}/attachments/${attachment.id}`}
          target="_blank"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-300/80 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Open
        </Link>
        <form action={deleteAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-3 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

function FileTypeBadge({ mimeType }: { mimeType: string }) {
  const label =
    mimeType === "application/pdf"
      ? "PDF"
      : mimeType === "text/plain"
        ? "TXT"
        : mimeType === "image/png"
          ? "PNG"
          : "JPG";

  return (
    <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
      {label}
    </span>
  );
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
