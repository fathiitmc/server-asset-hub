import Link from "next/link";
import type { Asset } from "@/lib/assets";
import { LifecycleBadge } from "@/components/asset-governance-panel";
import {
  getAssetHealthStatus,
  getAssetRiskColor,
  getDaysUntilRenewal,
  type AssetHealthStatus,
} from "@/src/lib/assets/intelligence";
import { StatusBadge } from "./status-badge";

const healthBadgeClasses: Record<AssetHealthStatus, string> = {
  HEALTHY: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EXPIRING_SOON: "bg-amber-50 text-amber-800 ring-amber-200",
  EXPIRED: "bg-red-50 text-red-700 ring-red-200",
  OVERDUE: "bg-rose-950 text-rose-50 ring-rose-900",
};

const riskDotClasses = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  "dark-red": "bg-rose-950",
};

export function AssetsTable({
  assets,
  showCost = true,
  canManage = false,
}: {
  assets: Asset[];
  showCost?: boolean;
  canManage?: boolean;
}) {
  if (assets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300/90 bg-white/75 p-10 text-center shadow-sm shadow-zinc-950/[0.03]">
        <h2 className="text-sm font-semibold text-zinc-950">No assets yet</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Add your first infrastructure asset to start tracking renewals.
        </p>
        <Link
          href="/assets/new"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm shadow-zinc-950/15 transition hover:bg-zinc-800"
        >
          Create asset
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm shadow-zinc-950/[0.04]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200/80 text-sm">
          <thead className="bg-zinc-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Renewal</th>
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Lifecycle</th>
              {showCost ? (
                <th className="px-4 py-3 text-right">Cost</th>
              ) : null}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {assets.map((asset) => {
              const healthStatus = getAssetHealthStatus(asset);
              const riskColor = getAssetRiskColor(healthStatus);

              return (
                <tr
                  key={asset.id}
                  className="transition duration-150 hover:bg-zinc-50/85"
                >
                  <td className="px-4 py-4">
                    <Link
                      href={`/assets/${asset.id}`}
                      className="font-semibold text-zinc-950 hover:text-zinc-700"
                    >
                      {asset.name}
                    </Link>
                    <p className="mt-1 max-w-xs truncate text-xs text-zinc-500">
                      {asset.purpose}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-zinc-600">{asset.type}</td>
                  <td className="px-4 py-4">
                    <Badge>{asset.provider}</Badge>
                  </td>
                  <td className="px-4 py-4 text-zinc-600">{asset.owner}</td>
                  <td className="px-4 py-4">
                    <EnvironmentBadge environment={asset.environment} />
                    {asset.region ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        {asset.region}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex max-w-[180px] flex-wrap gap-1">
                      {asset.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                      {asset.tags.length > 3 ? (
                        <Badge>+{asset.tags.length - 3}</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-2 w-2 rounded-full ${riskDotClasses[riskColor]}`}
                      />
                      <div>
                        <p className="text-zinc-700">
                          {formatDate(asset.renewalDate)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {formatRenewalDistance(asset)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <HealthBadge status={healthStatus} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={asset.status} />
                  </td>
                  <td className="px-4 py-4">
                    <LifecycleBadge state={asset.lifecycleState} />
                    {asset.deletedAt ? (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        Soft deleted
                      </p>
                    ) : null}
                  </td>
                  {showCost ? (
                    <td className="px-4 py-4 text-right text-zinc-600">
                      {formatMoney(asset.estimatedCost, asset.currency)}
                    </td>
                  ) : null}
                  <td className="px-4 py-4 text-right">
                    <details className="relative inline-block text-left">
                      <summary className="inline-flex h-9 cursor-pointer list-none items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50">
                        Actions
                      </summary>
                      <div className="absolute right-0 z-10 mt-2 w-44 rounded-xl border border-zinc-200 bg-white p-1 text-left shadow-lg shadow-zinc-950/10">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="block rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          Open details
                        </Link>
                        {canManage ? (
                          <Link
                            href={`/assets/${asset.id}`}
                            className="block rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            Edit and govern
                          </Link>
                        ) : (
                          <span className="block rounded-lg px-3 py-2 text-xs font-medium text-zinc-400">
                            Edit restricted
                          </span>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-[140px] items-center truncate rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200">
      {children}
    </span>
  );
}

function EnvironmentBadge({ environment }: { environment: string }) {
  const classes: Record<string, string> = {
    PRODUCTION: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    STAGING: "bg-sky-50 text-sky-700 ring-sky-200",
    DEVELOPMENT: "bg-violet-50 text-violet-700 ring-violet-200",
    TESTING: "bg-amber-50 text-amber-800 ring-amber-200",
  };

  return (
    <span
      className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${
        classes[environment] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200"
      }`}
    >
      {environment}
    </span>
  );
}

function HealthBadge({ status }: { status: AssetHealthStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${healthBadgeClasses[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function formatRenewalDistance(asset: Pick<Asset, "renewalDate">) {
  const days = getDaysUntilRenewal(asset);

  if (days === null) {
    return "Renewal date unavailable";
  }

  if (days === 0) {
    return "Renews today";
  }

  if (days > 0) {
    return `Renewal in ${days} day${days === 1 ? "" : "s"}`;
  }

  const expiredDays = Math.abs(days);
  return `Expired ${expiredDays} day${expiredDays === 1 ? "" : "s"} ago`;
}

export function formatDate(value: string) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}
