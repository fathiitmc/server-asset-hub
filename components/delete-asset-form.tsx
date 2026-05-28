import {
  deleteAssetAction,
  permanentlyDeleteAssetAction,
} from "@/app/assets/actions";
import { SubmitButton } from "./submit-button";

export function DeleteAssetForm({
  id,
  canDelete = true,
  canPermanentlyDelete = false,
}: {
  id: string;
  canDelete?: boolean;
  canPermanentlyDelete?: boolean;
}) {
  const softDeleteAction = deleteAssetAction.bind(null, id);
  const permanentDeleteAction = permanentlyDeleteAssetAction.bind(null, id);

  if (!canDelete) {
    return (
      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3">
        <p className="text-sm font-semibold text-zinc-950">
          Deletion restricted
        </p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Asset deletion requires an administrator role. Permanent deletion is
          reserved for SUPER_ADMIN.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={softDeleteAction}>
        <SubmitButton variant="danger" pendingLabel="Soft deleting...">
          Soft delete asset
        </SubmitButton>
      </form>
      <div className="rounded-xl border border-red-200 bg-red-50/80 p-3">
        <p className="text-sm font-semibold text-red-950">
          Protected permanent deletion
        </p>
        <p className="mt-1 text-xs leading-5 text-red-800">
          Hard deletion bypasses recovery and is allowed only for SUPER_ADMIN
          after governance review.
        </p>
        {canPermanentlyDelete ? (
          <form action={permanentDeleteAction} className="mt-3">
            <SubmitButton variant="danger" pendingLabel="Permanently deleting...">
              Permanently delete
            </SubmitButton>
          </form>
        ) : (
          <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-red-800 ring-1 ring-inset ring-red-200">
            Current role cannot permanently delete assets.
          </p>
        )}
      </div>
    </div>
  );
}
