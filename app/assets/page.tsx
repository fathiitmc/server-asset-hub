import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AssetsTable } from "@/components/assets-table";
import { PageHeader } from "@/components/page-header";
import { getAssetRegistryOptions } from "@/lib/asset-registries";
import {
  assetEnvironments,
  assetLifecycleStates,
  assetRegions,
  assetStatuses,
  assetTypes,
  type AssetEnvironment,
  type AssetLifecycleState,
  type AssetStatus,
  type AssetType,
} from "@/lib/assets";
import { getAssetsFromDb } from "@/lib/assets-db";
import { hasPermission, requirePermission } from "@/src/lib/rbac/permissions";

export const dynamic = "force-dynamic";

type AssetsPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    environment?: string;
    lifecycleState?: string;
    provider?: string;
    owner?: string;
    region?: string;
    tag?: string;
  }>;
};

function isAssetType(value: string | undefined): value is AssetType {
  return assetTypes.includes(value as AssetType);
}

function isAssetStatus(value: string | undefined): value is AssetStatus {
  return assetStatuses.includes(value as AssetStatus);
}

function isAssetEnvironment(
  value: string | undefined,
): value is AssetEnvironment {
  return assetEnvironments.includes(value as AssetEnvironment);
}

function isAssetLifecycleState(
  value: string | undefined,
): value is AssetLifecycleState {
  return assetLifecycleStates.includes(value as AssetLifecycleState);
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const user = await requirePermission("assets:view");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const type = isAssetType(params.type) ? params.type : undefined;
  const status = isAssetStatus(params.status) ? params.status : undefined;
  const environment = isAssetEnvironment(params.environment)
    ? params.environment
    : undefined;
  const lifecycleState = isAssetLifecycleState(params.lifecycleState)
    ? params.lifecycleState
    : undefined;
  const provider = params.provider?.trim() || undefined;
  const owner = params.owner?.trim() || undefined;
  const region = params.region?.trim() || undefined;
  const tag = params.tag?.trim() || undefined;
  const [assets, registries] = await Promise.all([
    getAssetsFromDb({
      q,
      type,
      status,
      environment,
      lifecycleState,
      provider,
      owner,
      region,
      tag,
    }),
    getAssetRegistryOptions(),
  ]);
  const activeFilters = [
    type,
    status,
    environment,
    lifecycleState,
    provider,
    owner,
    region,
    tag,
  ].filter(Boolean);

  return (
    <AppShell>
      <PageHeader
        title="Assets"
        description="Manage domains, servers, hosting, cloud accounts, panels, and other infrastructure assets."
        action={{ href: "/assets/new", label: "Create asset" }}
      />
      <form
        action="/assets"
        className="premium-panel mb-4 rounded-2xl p-4"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_150px_150px_150px_150px]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, provider, owner, tag, domain, IP..."
            className="premium-field h-10 rounded-xl px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
          />
          <FilterSelect name="type" value={type} label="All categories" options={assetTypes} />
          <FilterSelect
            name="environment"
            value={environment}
            label="All environments"
            options={assetEnvironments}
          />
          <FilterSelect name="status" value={status} label="All statuses" options={assetStatuses} />
          <FilterSelect
            name="lifecycleState"
            value={lifecycleState}
            label="All lifecycle"
            options={assetLifecycleStates}
          />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_160px_160px_auto]">
          <RegistryInput
            name="provider"
            value={provider}
            label="All providers"
            options={registries.providers.map((item) => item.name)}
          />
          <RegistryInput
            name="owner"
            value={owner}
            label="All owners"
            options={registries.owners.map((item) => item.name)}
          />
          <RegistryInput
            name="region"
            value={region}
            label="All regions"
            options={assetRegions}
          />
          <RegistryInput
            name="tag"
            value={tag}
            label="Any tag"
            options={registries.tags.map((item) => item.name)}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm shadow-zinc-950/15 transition hover:bg-zinc-800"
            >
              Apply
            </button>
            <Link
              href="/assets"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300/80 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Reset
            </Link>
          </div>
        </div>
        {activeFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="rounded-lg bg-zinc-950 px-2 py-1 text-xs font-medium text-white"
              >
                {filter}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {registries.providers.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              href={`/assets?provider=${encodeURIComponent(item.name)}`}
              className="rounded-lg border border-zinc-200 bg-white/70 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </form>
      <AssetsTable
        assets={assets}
        showCost={hasPermission(user.role, "finance:view")}
        canManage={hasPermission(user.role, "assets:write")}
      />
    </AppShell>
  );
}

function FilterSelect({
  name,
  value,
  label,
  options,
}: {
  name: string;
  value?: string;
  label: string;
  options: readonly string[];
}) {
  return (
    <select
      name={name}
      defaultValue={value ?? ""}
      className="premium-field h-10 rounded-xl px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}

function RegistryInput({
  name,
  value,
  label,
  options,
}: {
  name: string;
  value?: string;
  label: string;
  options: readonly string[];
}) {
  const listId = `${name}-filter-options`;

  return (
    <>
      <input
        name={name}
        defaultValue={value ?? ""}
        placeholder={label}
        list={listId}
        className="premium-field h-10 rounded-xl px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}
