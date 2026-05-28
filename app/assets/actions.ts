"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assetInputFromFormData } from "@/lib/assets";
import {
  archiveAssetInDb,
  createAssetInDb,
  getAssetByIdFromDb,
  permanentlyDeleteAssetInDb,
  restoreAssetInDb,
  softDeleteAssetInDb,
  updateAssetLifecycleStateInDb,
  updateAssetInDb,
} from "@/lib/assets-db";
import { createOperationalEvent } from "@/lib/operational-events-db";
import { getSession } from "@/src/lib/auth/session";
import { requirePermission } from "@/src/lib/rbac/permissions";

async function currentActor() {
  const session = await getSession();
  return session?.email ?? "system";
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createAssetAction(formData: FormData) {
  await requirePermission("assets:write");
  const asset = await createAssetInDb(assetInputFromFormData(formData));
  await createOperationalEvent({
    assetId: asset.id,
    assetName: asset.name,
    eventType: "ASSET_CREATED",
    severity: "INFO",
    title: `${asset.name} created`,
    description: "Asset was added to the infrastructure inventory.",
    metadata: {
      provider: asset.provider,
      owner: asset.owner,
      category: asset.type,
      environment: asset.environment,
    },
    actor: await currentActor(),
    source: "USER",
  });

  revalidatePath("/dashboard");
  revalidatePath("/assets");
  redirect("/assets");
}

export async function updateAssetAction(id: string, formData: FormData) {
  await requirePermission("assets:write");
  const before = await getAssetByIdFromDb(id);
  const input = assetInputFromFormData(formData);
  await updateAssetInDb(id, input);
  const ownershipChanged =
    before &&
    (before.owner !== input.owner ||
      before.teamId !== input.teamId ||
      before.operationalOwner !== input.operationalOwner ||
      before.financeOwner !== input.financeOwner ||
      before.renewalOwner !== input.renewalOwner ||
      before.escalationOwner !== input.escalationOwner);

  await createOperationalEvent({
    assetId: id,
    assetName: input.name,
    eventType: "ASSET_UPDATED",
    severity: "INFO",
    title: `${input.name} updated`,
    description: "Asset metadata was updated.",
    metadata: {
      provider: input.provider,
      owner: input.owner,
      category: input.type,
      environment: input.environment,
      tags: input.tags,
      previousOwner: before?.owner,
    },
    actor: await currentActor(),
    source: "USER",
  });
  if (ownershipChanged) {
    await createOperationalEvent({
      assetId: id,
      assetName: input.name,
      eventType: "ASSET_UPDATED",
      severity: "INFO",
      title: `${input.name} ownership changed`,
      description: "Asset ownership or accountability metadata was updated.",
      metadata: {
        owner: { from: before.owner, to: input.owner },
        teamId: { from: before.teamId, to: input.teamId },
        operationalOwner: {
          from: before.operationalOwner,
          to: input.operationalOwner,
        },
        financeOwner: { from: before.financeOwner, to: input.financeOwner },
        renewalOwner: { from: before.renewalOwner, to: input.renewalOwner },
        escalationOwner: {
          from: before.escalationOwner,
          to: input.escalationOwner,
        },
      },
      actor: await currentActor(),
      source: "USER",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  redirect("/assets");
}

export async function deleteAssetAction(id: string) {
  await requirePermission("assets:delete");
  const asset = await getAssetByIdFromDb(id);
  const actor = await currentActor();
  const deleted = await softDeleteAssetInDb(id, actor);
  await createOperationalEvent({
    assetId: id,
    assetName: asset?.name ?? deleted?.name ?? "Deleted asset",
    eventType: "ASSET_SOFT_DELETED",
    severity: "WARNING",
    title: `${asset?.name ?? deleted?.name ?? "Asset"} soft deleted`,
    description:
      "Asset was removed from active inventory using the reversible governance delete flow.",
    metadata: asset
      ? {
          provider: asset.provider,
          owner: asset.owner,
          category: asset.type,
          environment: asset.environment,
          deletedAt: deleted?.deletedAt,
        }
      : undefined,
    actor,
    source: "USER",
  });

  revalidatePath("/dashboard");
  revalidatePath("/assets");
  redirect("/assets");
}

export async function archiveAssetAction(id: string, formData: FormData) {
  await requirePermission("assets:write");
  const reason = textValue(formData, "archiveReason");

  if (reason.length < 6) {
    throw new Error("Archive reason must be at least 6 characters.");
  }

  const actor = await currentActor();
  const asset = await archiveAssetInDb(id, actor, reason);

  if (asset) {
    await createOperationalEvent({
      assetId: id,
      assetName: asset.name,
      eventType: "ASSET_ARCHIVED",
      severity: "WARNING",
      title: `${asset.name} archived`,
      description: "Asset was moved into the archived lifecycle state.",
      metadata: {
        reason,
        archivedAt: asset.archivedAt,
        previousState: "ACTIVE",
        nextState: "ARCHIVED",
      },
      actor,
      source: "USER",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
}

export async function restoreAssetAction(id: string) {
  await requirePermission("assets:write");
  const actor = await currentActor();
  const asset = await restoreAssetInDb(id);

  if (asset) {
    await createOperationalEvent({
      assetId: id,
      assetName: asset.name,
      eventType: "ASSET_RESTORED",
      severity: "INFO",
      title: `${asset.name} restored`,
      description: "Archived asset was restored to active lifecycle state.",
      metadata: {
        restoredAt: new Date().toISOString(),
        nextState: asset.lifecycleState,
      },
      actor,
      source: "USER",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
}

export async function updateAssetLifecycleAction(id: string, formData: FormData) {
  await requirePermission("assets:write");
  const lifecycleState = textValue(formData, "lifecycleState");
  const assetBefore = await getAssetByIdFromDb(id);
  const allowedStates = [
    "ACTIVE",
    "MONITORING",
    "EXPIRING",
    "ARCHIVED",
    "RETIRED",
    "SUSPENDED",
  ] as const;

  if (!allowedStates.includes(lifecycleState as (typeof allowedStates)[number])) {
    throw new Error("Invalid lifecycle state.");
  }

  if (lifecycleState === "ARCHIVED") {
    throw new Error("Use the archive action so a reason and archive actor are recorded.");
  }

  const asset = await updateAssetLifecycleStateInDb(
    id,
    lifecycleState as (typeof allowedStates)[number],
  );
  const actor = await currentActor();

  if (asset) {
    await createOperationalEvent({
      assetId: id,
      assetName: asset.name,
      eventType: "LIFECYCLE_STATE_CHANGED",
      severity:
        lifecycleState === "SUSPENDED" || lifecycleState === "RETIRED"
          ? "WARNING"
          : "INFO",
      title: `${asset.name} lifecycle changed`,
      description: `Lifecycle state changed from ${
        assetBefore?.lifecycleState ?? "UNKNOWN"
      } to ${asset.lifecycleState}.`,
      metadata: {
        previousState: assetBefore?.lifecycleState,
        nextState: asset.lifecycleState,
      },
      actor,
      source: "USER",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
}

export async function permanentlyDeleteAssetAction(id: string) {
  const user = await requirePermission("assets:delete");
  const asset = await getAssetByIdFromDb(id);
  const actor = await currentActor();

  if (user.role !== "SUPER_ADMIN") {
    await createOperationalEvent({
      assetId: id,
      assetName: asset?.name ?? "Protected asset",
      eventType: "ASSET_PERMANENT_DELETE_ATTEMPT",
      severity: "CRITICAL",
      title: `${asset?.name ?? "Asset"} permanent delete blocked`,
      description:
        "A permanent delete attempt was blocked because the actor was not SUPER_ADMIN.",
      metadata: { role: user.role },
      actor,
      source: "USER",
    });
    redirect(`/assets/${id}?restricted=1`);
  }

  await createOperationalEvent({
    assetId: id,
    assetName: asset?.name ?? "Deleted asset",
    eventType: "ASSET_DELETED",
    severity: "CRITICAL",
    title: `${asset?.name ?? "Asset"} permanently deleted`,
    description:
      "SUPER_ADMIN permanently removed the asset after governance review.",
    metadata: asset
      ? {
          provider: asset.provider,
          owner: asset.owner,
          category: asset.type,
          deletedAt: new Date().toISOString(),
        }
      : undefined,
    actor,
    source: "USER",
  });
  await permanentlyDeleteAssetInDb(id);

  revalidatePath("/dashboard");
  revalidatePath("/assets");
  redirect("/assets");
}
