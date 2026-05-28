import { AppShell } from "@/components/app-shell";
import { FinOpsDashboard } from "@/components/finance/finops-dashboard";
import { PageHeader } from "@/components/page-header";
import { getAssetsFromDb } from "@/lib/assets-db";
import { getFinOpsSummary } from "@/src/lib/cost-engine/cost-engine";
import { requirePermission } from "@/src/lib/rbac/permissions";

export default async function FinancePage() {
  await requirePermission("finance:view");
  const assets = await getAssetsFromDb();
  const summary = getFinOpsSummary(assets);

  return (
    <AppShell>
      <PageHeader
        title="FinOps"
        description="Infrastructure cost intelligence, renewal forecasting, and provider spend observability."
        action={{ href: "/assets/new", label: "Add asset" }}
      />
      <FinOpsDashboard summary={summary} />
    </AppShell>
  );
}
