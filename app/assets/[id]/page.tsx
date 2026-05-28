import { notFound } from "next/navigation";
import { updateAssetAction } from "@/app/assets/actions";
import { AppShell } from "@/components/app-shell";
import { AssetAttachments } from "@/components/asset-attachments";
import { AssetForm } from "@/components/asset-form";
import {
  AssetGovernancePanel,
  LifecycleBadge,
} from "@/components/asset-governance-panel";
import { AssetMonitoring } from "@/components/asset-monitoring";
import { CredentialVault } from "@/components/credential-vault";
import { DeleteAssetForm } from "@/components/delete-asset-form";
import { AssetFinancialPanel } from "@/components/finance/asset-financial-panel";
import { AssetRiskPanel } from "@/components/intelligence/asset-risk-panel";
import { AssetLifecyclePanel } from "@/components/lifecycle/asset-lifecycle-panel";
import { OperationalTimeline } from "@/components/operational/operational-timeline";
import { AssetRuntimePanel } from "@/components/runtime/asset-runtime-panel";
import { AssetAttentionPanel } from "@/components/warnings/asset-attention-panel";
import { PageHeader } from "@/components/page-header";
import { getAssetRegistryOptions } from "@/lib/asset-registries";
import { getAssetByIdFromDb } from "@/lib/assets-db";
import { listAssetOperationalEvents } from "@/lib/operational-events-db";
import { getAssetRiskProfile } from "@/lib/operational-risk";
import { analyzeAssetRuntime } from "@/lib/runtime-intelligence";
import { getAssetExpirySignal } from "@/lib/expiry-intelligence";
import { getLifecycleProfile } from "@/lib/lifecycle-intelligence";
import { getOperationalSignals, getAssetOperationalSignals } from "@/lib/operational-signals";
import { getAssetCostProfile } from "@/src/lib/cost-engine/cost-engine";
import { hasPermission, requirePermission } from "@/src/lib/rbac/permissions";
import { listTeams } from "@/src/lib/rbac/teams";
import { listAssetAttachments } from "@/src/lib/attachments/attachments";
import { listAssetCredentials } from "@/src/lib/credentials/credentials";
import {
  getLatestHealthStatus,
  getRecentHealthChecks,
} from "@/src/lib/monitoring/checks";

type AssetPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssetPage({ params }: AssetPageProps) {
  const user = await requirePermission("assets:view");
  const { id } = await params;
  const asset = await getAssetByIdFromDb(id);

  if (!asset) {
    notFound();
  }

  const credentials = await listAssetCredentials(asset.id);
  const attachments = await listAssetAttachments(asset.id);
  const [registries, teams] = await Promise.all([
    getAssetRegistryOptions(),
    listTeams(),
  ]);
  const latestHealthStatus = await getLatestHealthStatus(asset.id);
  const recentHealthChecks = await getRecentHealthChecks(asset.id, 20);
  const operationalEvents = await listAssetOperationalEvents(asset.id, 12);
  const runtimeProfile = analyzeAssetRuntime(asset, recentHealthChecks);
  const riskProfile = getAssetRiskProfile({
    asset,
    runtimeStatus: latestHealthStatus?.status ?? "UNKNOWN",
    hasMonitoring: Boolean(latestHealthStatus),
    credentialCount: credentials.length,
  });
  const allAssetSignals = getOperationalSignals({
    assets: [asset],
    expirySignals: [getAssetExpirySignal(asset)],
    riskProfiles: [riskProfile],
    runtimeProfiles: [runtimeProfile],
    providerInsights: [],
  });
  const assetSignals = getAssetOperationalSignals(asset.id, allAssetSignals);
  const canViewFinance = hasPermission(user.role, "finance:view");
  const canManageAsset = hasPermission(user.role, "assets:write");
  const canDeleteAsset = hasPermission(user.role, "assets:delete");
  const canPermanentlyDeleteAsset = user.role === "SUPER_ADMIN";
  const lifecycleProfile = getLifecycleProfile({
    asset,
    runtimeProfile,
    riskProfile,
    events: operationalEvents,
  });
  const costProfile = getAssetCostProfile(asset);
  const updateAction = updateAssetAction.bind(null, asset.id);

  return (
    <AppShell>
      <PageHeader
        title={`Edit ${asset.name}`}
        description="Update ownership, cost, status, and renewal details for this asset."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <section className="premium-panel rounded-2xl p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Asset intelligence
                </p>
                <h2 className="mt-2 text-lg font-semibold text-zinc-950">
                  {asset.provider} / {asset.type}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {asset.environment} asset owned by {asset.owner}
                  {asset.region ? ` in ${asset.region}` : ""}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <IntelligenceBadge>{asset.environment}</IntelligenceBadge>
                <LifecycleBadge state={asset.lifecycleState} />
                <IntelligenceBadge>{asset.provider}</IntelligenceBadge>
                {asset.region ? (
                  <IntelligenceBadge>{asset.region}</IntelligenceBadge>
                ) : null}
              </div>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetaItem label="Owner" value={asset.owner} />
              <MetaItem label="Team" value={asset.teamName || "Unassigned"} />
              <MetaItem label="Domain" value={asset.domain || "Not set"} />
              <MetaItem label="IP address" value={asset.ipAddress || "Not set"} />
              <MetaItem label="Region" value={asset.region || "Not set"} />
              <MetaItem
                label="Operations"
                value={asset.operationalOwner || "Unassigned"}
              />
              <MetaItem
                label="Finance"
                value={canViewFinance ? asset.financeOwner || "Unassigned" : "Restricted"}
              />
              <MetaItem
                label="Escalation"
                value={asset.escalationOwner || "Unassigned"}
              />
              <MetaItem label="Lifecycle" value={asset.lifecycleState} />
              <MetaItem
                label="Archived"
                value={asset.archivedAt ? "Yes" : "No"}
              />
              <MetaItem
                label="Deleted"
                value={asset.deletedAt ? "Soft deleted" : "No"}
              />
            </dl>
            {asset.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {asset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
          {canManageAsset ? (
            <AssetForm
              action={updateAction}
              asset={asset}
              submitLabel="Save changes"
              canViewFinance={canViewFinance}
              registries={{ ...registries, teams }}
            />
          ) : (
            <section className="premium-panel rounded-2xl p-5">
              <h2 className="text-base font-semibold text-zinc-950">
                Edit restricted
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Your role can inspect this asset and its governance history,
                but asset metadata updates require an asset writer role.
              </p>
            </section>
          )}
          <AssetGovernancePanel asset={asset} canManage={canManageAsset} />
          <AssetMonitoring
            assetId={asset.id}
            latestStatus={latestHealthStatus}
            recentChecks={recentHealthChecks}
          />
          <AssetRuntimePanel profile={runtimeProfile} />
          {canViewFinance ? <AssetFinancialPanel profile={costProfile} /> : null}
          <AssetAttentionPanel
            signals={assetSignals}
            riskProfile={riskProfile}
            runtimeProfile={runtimeProfile}
          />
          <AssetLifecyclePanel profile={lifecycleProfile} />
          <AssetRiskPanel profile={riskProfile} />
          <OperationalTimeline
            title="Activity history"
            description="Operational event stream for this asset."
            events={operationalEvents}
            emptyTitle="No asset activity yet"
            emptyDescription="Updates, health checks, credentials, alerts, and attachments will appear here."
          />
          <CredentialVault assetId={asset.id} credentials={credentials} />
          <AssetAttachments assetId={asset.id} attachments={attachments} />
        </div>
        <aside className="premium-panel h-fit rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-950">
            Protected actions
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Delete defaults to soft delete and remains auditable. Permanent
            deletion is visually separated and restricted to SUPER_ADMIN.
          </p>
          <div className="mt-4">
          <DeleteAssetForm
            id={asset.id}
            canDelete={canDeleteAsset}
            canPermanentlyDelete={canPermanentlyDeleteAsset}
          />
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-zinc-950">{value}</dd>
    </div>
  );
}

function IntelligenceBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-zinc-950 px-2 py-1 text-xs font-medium text-white">
      {children}
    </span>
  );
}
