import Link from "next/link";
import { Suspense } from "react";
import { logoutAction } from "@/app/login/actions";
import { getAssetsFromDb } from "@/lib/assets-db";
import { getCurrentUser, hasPermission } from "@/src/lib/rbac/permissions";
import { CommandHint, CommandPalette } from "./command-palette";
import { SidebarNav, type NavItem } from "./sidebar-nav";
import { TeamSwitcher } from "./team-switcher";

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", shortcut: "G O", group: "Overview" },
  { href: "/assets?type=SERVER", label: "Servers", shortcut: "G S", group: "Infrastructure" },
  { href: "/assets?type=CLOUD", label: "Cloud", shortcut: "G C", group: "Infrastructure" },
  { href: "/assets?type=CONTAINER", label: "Containers", shortcut: "G N", group: "Infrastructure" },
  { href: "/assets?type=DOMAIN", label: "Domains", shortcut: "G D", group: "Domains" },
  { href: "/assets?type=DNS", label: "DNS", shortcut: "G N", group: "Domains" },
  { href: "/assets?type=SSL", label: "SSL", shortcut: "G L", group: "Domains" },
  { href: "/assets?focus=vault", label: "Vault", shortcut: "G V", group: "Security" },
  { href: "/assets?focus=credentials", label: "Credentials", shortcut: "G K", group: "Security" },
  { href: "/dashboard#monitoring", label: "Monitoring", shortcut: "G M", group: "Operations" },
  { href: "/dashboard#alerts", label: "Alerts", shortcut: "G A", group: "Operations" },
  { href: "/automation", label: "Automation", shortcut: "G W", group: "Operations" },
  { href: "/finance", label: "FinOps", shortcut: "G F", group: "Operations" },
  { href: "/teams", label: "Teams", shortcut: "G T", group: "Governance" },
  { href: "/assets/new", label: "Create asset", shortcut: "C A", group: "Actions" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  async function readActiveAlerts() {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    try {
      const { getActiveAlerts } = await import("@/src/lib/alerts/alerts");
      return getActiveAlerts(8);
    } catch {
      return [];
    }
  }

  const [assets, alerts, user] = await Promise.all([
    getAssetsFromDb().catch(() => []),
    readActiveAlerts(),
    getCurrentUser().catch(() => null),
  ]);
  const canViewFinance = hasPermission(user?.role, "finance:view");
  const canViewAutomation = hasPermission(user?.role, "automation:view");
  const visibleNavItems = navItems.filter(
    (item) =>
      (item.href !== "/finance" || canViewFinance) &&
      (item.href !== "/automation" || canViewAutomation),
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),transparent_34%),linear-gradient(180deg,#f7f7f8,#f1f2f4)] text-zinc-950">
      <CommandPalette
        canViewFinance={canViewFinance}
        canViewAutomation={canViewAutomation}
        assets={assets.map((asset) => ({
          id: asset.id,
          name: asset.name,
          provider: asset.provider,
          type: asset.type,
          status: asset.status,
          environment: asset.environment,
          owner: asset.owner,
          region: asset.region,
          domain: asset.domain,
          ipAddress: asset.ipAddress,
          tags: asset.tags,
        }))}
        alerts={alerts.map((alert) => ({
          id: alert.id,
          assetId: alert.assetId,
          assetName: alert.assetName,
          severity: alert.severity,
          title: alert.title,
          type: alert.type,
        }))}
      />
      <aside className="border-b border-zinc-200/80 bg-white/82 backdrop-blur-xl md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r">
        <div className="flex h-16 items-center border-b border-zinc-200/70 px-5">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 font-semibold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-950 text-xs font-bold text-white shadow-sm shadow-zinc-950/15">
              SA
            </span>
            <span>
              <span className="block text-sm text-zinc-950">
                ServerAssetHub
              </span>
              <span className="block text-[11px] font-medium text-zinc-500">
                Operations control
              </span>
            </span>
          </Link>
        </div>
        <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-between">
          <Suspense fallback={null}>
            <SidebarNav items={visibleNavItems} />
          </Suspense>
          <div className="hidden space-y-3 border-t border-zinc-200/70 p-4 md:block">
            <TeamSwitcher user={user} />
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3">
              <p className="text-xs font-medium text-zinc-500">Shortcut</p>
              <p className="mt-1 text-sm font-semibold text-zinc-950">
                Press Ctrl K
              </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
                Jump to assets, alerts, vault, monitoring, automation, and FinOps.
              </p>
            </div>
          </div>
        </div>
      </aside>
      <main className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-zinc-50/78 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                Infrastructure workspace
              </p>
              <p className="truncate text-sm font-medium text-zinc-700">
                {assets.length} assets / {alerts.length} active alerts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CommandHint />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/75 px-3 text-sm font-medium text-zinc-600 shadow-sm shadow-zinc-950/[0.03] transition hover:border-zinc-300 hover:bg-white hover:text-zinc-950"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <div className="fixed bottom-4 right-4 z-40 md:hidden">
        <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-600 shadow-lg shadow-zinc-950/10 backdrop-blur"
            >
              Logout
            </button>
          </form>
      </div>
    </div>
  );
}
