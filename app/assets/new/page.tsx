import { createAssetAction } from "@/app/assets/actions";
import { AppShell } from "@/components/app-shell";
import { AssetForm } from "@/components/asset-form";
import { PageHeader } from "@/components/page-header";
import { getAssetRegistryOptions } from "@/lib/asset-registries";
import { hasPermission, requirePermission } from "@/src/lib/rbac/permissions";
import { listTeams } from "@/src/lib/rbac/teams";

export default async function NewAssetPage() {
  const user = await requirePermission("assets:write");
  const [registries, teams] = await Promise.all([
    getAssetRegistryOptions(),
    listTeams(),
  ]);

  return (
    <AppShell>
      <PageHeader
        title="Create asset"
        description="Add an infrastructure asset and its renewal details."
      />
      <AssetForm
        action={createAssetAction}
        submitLabel="Create asset"
        canViewFinance={hasPermission(user.role, "finance:view")}
        registries={{ ...registries, teams }}
      />
    </AppShell>
  );
}
