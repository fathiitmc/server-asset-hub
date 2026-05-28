import "server-only";

import type { Asset } from "@/lib/assets";
import {
  getAssetHealthStatus,
  getDaysUntilRenewal,
} from "@/src/lib/assets/intelligence";
import type { AssetHealthSnapshot } from "@/src/lib/monitoring/health";
import { upsertActiveAlert } from "./alerts";

const RENEWAL_WARNING_DAYS = 7;

export async function generateRenewalAlerts(assets: Asset[]) {
  for (const asset of assets) {
    const status = getAssetHealthStatus(asset);
    const daysUntilRenewal = getDaysUntilRenewal(asset);

    if (status === "OVERDUE") {
      await upsertActiveAlert({
        assetId: asset.id,
        type: "RENEWAL_OVERDUE",
        severity: "CRITICAL",
        title: `${asset.name} renewal is overdue`,
        message:
          daysUntilRenewal === null
            ? "This asset renewal is overdue."
            : `Renewal passed ${Math.abs(daysUntilRenewal)} days ago.`,
      });
      continue;
    }

    if (
      daysUntilRenewal !== null &&
      daysUntilRenewal >= 0 &&
      daysUntilRenewal <= RENEWAL_WARNING_DAYS
    ) {
      await upsertActiveAlert({
        assetId: asset.id,
        type: "RENEWAL_EXPIRING",
        severity: "WARNING",
        title: `${asset.name} renews soon`,
        message:
          daysUntilRenewal === 0
            ? "Renewal is due today."
            : `Renewal is due in ${daysUntilRenewal} day${
                daysUntilRenewal === 1 ? "" : "s"
              }.`,
      });
    }
  }
}

export async function generateMonitoringAlerts(
  snapshots: AssetHealthSnapshot[],
  assets: Asset[],
) {
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  for (const snapshot of snapshots) {
    const asset = assetsById.get(snapshot.assetId);
    const assetName = asset?.name ?? "Asset";

    if (snapshot.status === "OFFLINE") {
      await upsertActiveAlert({
        assetId: snapshot.assetId,
        type: "ASSET_OFFLINE",
        severity: "CRITICAL",
        title: `${assetName} is offline`,
        message: "The latest manual health check could not reach this asset.",
      });
    }

    if (snapshot.status === "DEGRADED") {
      await upsertActiveAlert({
        assetId: snapshot.assetId,
        type: "ASSET_DEGRADED",
        severity: "WARNING",
        title: `${assetName} is degraded`,
        message:
          snapshot.responseTime === null
            ? "The latest health check reported degraded performance."
            : `The latest health check took ${snapshot.responseTime} ms.`,
      });
    }
  }
}
